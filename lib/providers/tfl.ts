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

    const result = await queryTfL(origin, dest, departureTime)
    cache.set(key, result)
    return result
  },
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
