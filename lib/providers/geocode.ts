import { GeocodeProvider, GeocodeResult, PlaceSearchProvider, PlaceSuggestion } from './types'

const TIMEOUT_MS = 5000

export const postcodesGeocode: GeocodeProvider = {
  async geocodePostcode(postcode: string): Promise<GeocodeResult> {
    try {
      const clean = postcode.replace(/\s+/g, '').toUpperCase()
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) return { ok: false }
      const data = await res.json()
      if (!data.result) return { ok: false }
      return {
        ok: true,
        latLng: { lat: data.result.latitude, lng: data.result.longitude },
        postcode: data.result.postcode,
      }
    } catch {
      return { ok: false }
    }
  },
}

// A query that looks like a UK postcode (full or partial), e.g. "SE15", "N1 9AP", "sw4 7"
const POSTCODE_LIKE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d{0,2}[A-Za-z]{0,2}$/

interface TfLStopMatch {
  name: string
  lat?: number
  lon?: number
  modes?: string[]
  zone?: string
}

async function searchStops(query: string): Promise<PlaceSuggestion[]> {
  try {
    const url = `https://api.tfl.gov.uk/StopPoint/Search/${encodeURIComponent(query)}?modes=tube,dlr,overground,elizabeth-line,national-rail`
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) return []
    const data = await res.json()
    const matches: TfLStopMatch[] = data.matches || []
    return matches
      .filter((m) => typeof m.lat === 'number' && typeof m.lon === 'number')
      .slice(0, 5)
      .map((m) => ({
        label: m.name
          .replace(/ Underground Station$/, '')
          .replace(/ Rail Station$/, '')
          .replace(/ DLR Station$/, ''),
        sublabel: 'Station',
        latLng: { lat: m.lat as number, lng: m.lon as number },
      }))
  } catch {
    return []
  }
}

async function searchPostcodes(query: string): Promise<PlaceSuggestion[]> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete?limit=4`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    )
    if (!res.ok) return []
    const data = await res.json()
    const codes: string[] = data.result || []
    if (codes.length === 0) return []
    const bulk = await fetch('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: codes }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!bulk.ok) return []
    const bulkData = await bulk.json()
    const results: { result: { postcode: string; latitude: number; longitude: number; admin_district?: string } | null }[] =
      bulkData.result || []
    return results
      .filter((r) => r.result)
      .map((r) => ({
        label: r.result!.postcode,
        sublabel: r.result!.admin_district || undefined,
        latLng: { lat: r.result!.latitude, lng: r.result!.longitude },
      }))
  } catch {
    return []
  }
}

export const placeSearch: PlaceSearchProvider = {
  async search(query: string): Promise<PlaceSuggestion[]> {
    const trimmed = query.trim()
    if (trimmed.length < 2) return []

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (apiKey) return googlePlaceSearch(trimmed, apiKey)

    const postcodeFirst = POSTCODE_LIKE.test(trimmed)
    const [postcodes, stops] = await Promise.all([
      postcodeFirst ? searchPostcodes(trimmed) : Promise.resolve([] as PlaceSuggestion[]),
      searchStops(trimmed),
    ])

    const merged = postcodeFirst ? [...postcodes, ...stops] : [...stops, ...postcodes]
    const seen = new Set<string>()
    const out: PlaceSuggestion[] = []
    for (const s of merged) {
      const key = s.label.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
      if (out.length >= 6) break
    }
    return out
  },
}

async function googlePlaceSearch(query: string, apiKey: string): Promise<PlaceSuggestion[]> {
  try {
    // New Places Autocomplete (v1) — London-biased, transit-friendly.
    const body = {
      input: query,
      locationBias: { circle: { center: { latitude: 51.5074, longitude: -0.1278 }, radius: 50000 } },
      languageCode: 'en-GB',
    }
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error('[google-places] autocomplete error', res.status, await res.text().catch(() => ''))
      return []
    }
    const data = await res.json()
    const suggestions = (data.suggestions || []) as Array<{
      placePrediction?: { text?: { text?: string }; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } }; placeId?: string }
    }>
    // Resolve placeId → lat/lng in parallel (max 4 to stay cheap)
    const top = suggestions.slice(0, 4)
    const resolved = await Promise.all(
      top.map(async (s) => {
        const placeId = s.placePrediction?.placeId
        const mainText = s.placePrediction?.structuredFormat?.mainText?.text || s.placePrediction?.text?.text || ''
        const secondaryText = s.placePrediction?.structuredFormat?.secondaryText?.text || ''
        if (!placeId || !mainText) return null
        try {
          const detail = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}?fields=location`,
            { headers: { 'X-Goog-Api-Key': apiKey }, signal: AbortSignal.timeout(TIMEOUT_MS) }
          )
          if (!detail.ok) return null
          const d = await detail.json()
          if (!d.location) return null
          return {
            label: mainText,
            sublabel: secondaryText || undefined,
            latLng: { lat: d.location.latitude as number, lng: d.location.longitude as number },
          } satisfies PlaceSuggestion
        } catch { return null }
      })
    )
    return resolved.filter((r): r is NonNullable<typeof r> => r !== null)
  } catch (e) {
    console.error('[google-places] exception', e)
    return []
  }
}
