import { JourneyProvider, JourneyResult, LatLng } from './types'

const TIMEOUT_MS = 8000

// Cache journey lookups: rounded coords + hour bucket. Never re-query something we have.
const cache = new Map<string, JourneyResult>()

function cacheKey(origin: LatLng, dest: LatLng, departureTime: Date): string {
  const r = (n: number) => n.toFixed(3)
  const hourBucket = Math.floor(departureTime.getTime() / 3_600_000)
  return `${r(origin.lat)},${r(origin.lng)}|${r(dest.lat)},${r(dest.lng)}|${hourBucket}`
}

interface TfLLeg {
  duration?: number
  mode?: { name?: string }
  routeOptions?: { name?: string }[]
  instruction?: { summary?: string }
}

interface TfLJourney {
  duration?: number
  legs?: TfLLeg[]
}

const MODE_LABELS: Record<string, string> = {
  tube: 'Tube',
  bus: 'Bus',
  dlr: 'DLR',
  overground: 'Overground',
  'elizabeth-line': 'Elizabeth line',
  'national-rail': 'Train',
}

function describeLeg(leg: TfLLeg): string | null {
  const mode = leg.mode?.name || ''
  if (mode === 'walking') {
    const mins = leg.duration || 0
    if (mins < 2) return null
    return `${mins}-min walk`
  }
  const line = leg.routeOptions?.[0]?.name
  if (mode === 'tube' && line) return `${line} line`
  if (line && (mode === 'bus')) return `${line} bus`
  if (line && mode === 'national-rail') return `${line}`
  return MODE_LABELS[mode] || (line ?? null)
}

function summariseRoute(legs: TfLLeg[]): string {
  const parts = legs
    .map(describeLeg)
    .filter((p): p is string => Boolean(p))
    .filter((p, i, arr) => i === 0 || p !== arr[i - 1])
  if (parts.length === 0) return 'Short walk'
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} then ${parts[parts.length - 1]}`
}

export const tflJourneys: JourneyProvider = {
  async journeyTime(origin: LatLng, dest: LatLng, departureTime: Date): Promise<JourneyResult> {
    const key = cacheKey(origin, dest, departureTime)
    const hit = cache.get(key)
    if (hit) return hit

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    const result = apiKey
      ? await queryGoogleRoutes(origin, dest, departureTime, apiKey)
      : await queryTfL(origin, dest, departureTime)

    cache.set(key, result)
    return result
  },
}

async function queryGoogleRoutes(
  origin: LatLng,
  dest: LatLng,
  departureTime: Date,
  apiKey: string
): Promise<JourneyResult> {
  try {
    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
      travelMode: 'TRANSIT',
      departureTime: departureTime.toISOString(),
      computeAlternativeRoutes: false,
      transitPreferences: { routingPreference: 'LESS_WALKING' },
    }
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.legs.steps.transitDetails,routes.legs.steps.travelMode,routes.legs.steps.staticDuration,routes.legs.steps.localizedValues',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    const routes = data.routes || []
    if (routes.length === 0) return { ok: false }
    const route = routes[0]
    const durationSecs = parseInt(route.duration?.replace('s', '') || '0', 10)
    if (!durationSecs) return { ok: false }
    const minutes = Math.round(durationSecs / 60)
    const route_summary = summariseGoogleRoute(route.legs?.[0]?.steps || [])
    return { ok: true, minutes, route: route_summary }
  } catch {
    return { ok: false }
  }
}

interface GoogleStep {
  travelMode?: string
  staticDuration?: string
  transitDetails?: {
    transitLine?: { name?: string; nameShort?: string; vehicle?: { type?: string } }
    stopCount?: number
  }
}

// Maps Google vehicle types to human labels
const VEHICLE_LABELS: Record<string, string> = {
  SUBWAY: 'Tube',
  HEAVY_RAIL: 'Train',
  COMMUTER_TRAIN: 'Train',
  HIGH_SPEED_TRAIN: 'Train',
  LIGHT_RAIL: 'Light rail',
  TRAM: 'Tram',
  MONORAIL: 'Monorail',
  BUS: 'Bus',
  INTERCITY_BUS: 'Bus',
  TROLLEYBUS: 'Bus',
  SHARE_TAXI: 'Taxi',
  FERRY: 'Ferry',
  CABLE_CAR: 'Cable car',
  GONDOLA_LIFT: 'Cable car',
  FUNICULAR: 'Funicular',
  OTHER: '',
}

function cleanTransitName(name: string | undefined, nameShort: string | undefined, vehicleType: string | undefined): string | null {
  // Prefer short name (e.g. "Northern" over "Northern line"), then full name
  const raw = nameShort || name
  if (!raw) return VEHICLE_LABELS[vehicleType || ''] || null
  // "London Buses Route 24" → "24 bus"
  const busRoute = raw.match(/(?:London Buses? Route |Bus Route )(\w+)/i)
  if (busRoute) return `${busRoute[1]} bus`
  // "24" with vehicleType BUS → "24 bus"
  if ((vehicleType === 'BUS' || vehicleType === 'INTERCITY_BUS') && /^\w{1,4}$/.test(raw)) return `${raw} bus`
  // Strip trailing " line" if present — keep "Northern", not "Northern line"
  return raw.replace(/ line$/i, '')
}

function summariseGoogleRoute(steps: GoogleStep[]): string {
  const parts: string[] = []
  for (const step of steps) {
    if (step.travelMode === 'WALK') {
      const secs = parseInt(step.staticDuration?.replace('s', '') || '0', 10)
      const mins = Math.round(secs / 60)
      if (mins >= 2) parts.push(`${mins}-min walk`)
    } else if (step.travelMode === 'TRANSIT') {
      const tl = step.transitDetails?.transitLine
      const label = cleanTransitName(tl?.name, tl?.nameShort, tl?.vehicle?.type)
      if (label) parts.push(label)
    }
  }
  const deduped = parts.filter((p, i, a) => i === 0 || p !== a[i - 1])
  if (deduped.length === 0) return 'Short walk'
  if (deduped.length === 1) return deduped[0]
  return `${deduped.slice(0, -1).join(', ')} then ${deduped[deduped.length - 1]}`
}

async function queryTfL(origin: LatLng, dest: LatLng, departureTime: Date): Promise<JourneyResult> {
  try {
    const from = `${origin.lat},${origin.lng}`
    const to = `${dest.lat},${dest.lng}`
    const pad = (n: number) => String(n).padStart(2, '0')
    const date = `${departureTime.getFullYear()}${pad(departureTime.getMonth() + 1)}${pad(departureTime.getDate())}`
    const time = `${pad(departureTime.getHours())}${pad(departureTime.getMinutes())}`
    let url =
      `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}` +
      `?mode=tube,overground,dlr,elizabeth-line,national-rail,bus` +
      `&date=${date}&time=${time}&timeIs=Departing&journeyPreference=LeastTime`
    const appKey = process.env.TFL_APP_KEY
    if (appKey) url += `&app_key=${appKey}`

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return { ok: false }

    const data = await res.json()
    const journeys: TfLJourney[] = data.journeys || []
    const valid = journeys.filter((j) => typeof j.duration === 'number' && j.duration! > 0)
    if (valid.length === 0) return { ok: false }

    const fastest = valid.reduce((a, b) => (a.duration! <= b.duration! ? a : b))
    return {
      ok: true,
      minutes: fastest.duration!,
      route: summariseRoute(fastest.legs || []),
    }
  } catch {
    return { ok: false }
  }
}
