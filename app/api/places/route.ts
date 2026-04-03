import { NextRequest, NextResponse } from 'next/server'
import { searchPlaces, isPostcode } from '@/lib/places'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  // 1. If it looks like a postcode, resolve it directly
  if (isPostcode(query)) {
    const postcodeResults = await resolvePostcode(query)
    if (postcodeResults.length > 0) {
      return NextResponse.json({ predictions: postcodeResults })
    }
  }

  // 2. Search local dataset (stations, areas, cities, landmarks)
  const localResults = searchPlaces(query)

  // 3. If we have a Google API key, also search Google Places and merge
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:gb&key=${apiKey}`
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        const data = await res.json()
        const googleResults = (data.predictions || []).slice(0, 4).map((p: { description: string; place_id: string }) => ({
          description: p.description,
          placeId: p.place_id,
        }))

        // Local results first, then Google results (deduped)
        const localNames = new Set(localResults.map(r => r.name.toLowerCase()))
        const merged = [
          ...localResults.map(r => ({
            description: r.name,
            latLng: r.latLng,
            type: r.type,
          })),
          ...googleResults.filter((g: { description: string }) =>
            !localNames.has(g.description.split(',')[0].toLowerCase().trim())
          ),
        ]

        return NextResponse.json({ predictions: merged.slice(0, 6) })
      }
    } catch { /* fall through to local-only */ }
  }

  // 4. If no local results and no Google, try postcode autocomplete
  if (localResults.length === 0) {
    const postcodeResults = await autocompletePostcode(query)
    if (postcodeResults.length > 0) {
      return NextResponse.json({ predictions: postcodeResults })
    }
  }

  // 5. Return local results
  return NextResponse.json({
    predictions: localResults.map(r => ({
      description: r.name,
      latLng: r.latLng,
      type: r.type,
    })),
  })
}

async function resolvePostcode(postcode: string) {
  try {
    const clean = postcode.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.result) return []
    return [{
      description: data.result.postcode,
      latLng: { lat: data.result.latitude, lng: data.result.longitude },
      type: 'postcode',
    }]
  } catch {
    return []
  }
}

async function autocompletePostcode(query: string) {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!data.result || data.result.length === 0) return []

    // Resolve the first few matches
    const results = await Promise.all(
      data.result.slice(0, 3).map(async (pc: string) => {
        try {
          const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`, {
            signal: AbortSignal.timeout(3000),
          })
          if (!pcRes.ok) return null
          const pcData = await pcRes.json()
          if (!pcData.result) return null
          return {
            description: pcData.result.postcode,
            latLng: { lat: pcData.result.latitude, lng: pcData.result.longitude },
            type: 'postcode',
          }
        } catch { return null }
      })
    )

    return results.filter(Boolean)
  } catch {
    return []
  }
}
