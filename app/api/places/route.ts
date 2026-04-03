import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    // Fallback to postcodes.io for place search
    return fallbackSearch(query)
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:gb&types=geocode|establishment&key=${apiKey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return fallbackSearch(query)

    const data = await res.json()
    const predictions = (data.predictions || []).slice(0, 5).map((p: { description: string; place_id: string }) => ({
      description: p.description,
      placeId: p.place_id,
    }))

    return NextResponse.json({ predictions })
  } catch {
    return fallbackSearch(query)
  }
}

async function fallbackSearch(query: string) {
  try {
    // Try postcodes.io place search
    const res = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(query)}&limit=5`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ predictions: [] })

    const data = await res.json()
    if (!data.result) return NextResponse.json({ predictions: [] })

    const predictions = await Promise.all(
      data.result.slice(0, 5).map(async (place: { name_1: string; county_unitary?: string; latitude: number; longitude: number }) => {
        return {
          description: `${place.name_1}${place.county_unitary ? `, ${place.county_unitary}` : ''}`,
          latLng: { lat: place.latitude, lng: place.longitude },
        }
      })
    )

    return NextResponse.json({ predictions })
  } catch {
    return NextResponse.json({ predictions: [] })
  }
}
