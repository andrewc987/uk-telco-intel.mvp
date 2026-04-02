import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    // Return mock venues when no API key is configured
    return NextResponse.json({
      venues: getMockVenues(parseFloat(lat), parseFloat(lng)),
    })
  }

  try {
    const types = ['bar', 'restaurant', 'pub']
    const allVenues: Array<{
      name: string
      type: string
      rating: number
      address: string
      walkingMinutes: number
      googlePlacesId: string
    }> = []

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=400&type=${type}&key=${apiKey}`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })

      if (res.ok) {
        const data = await res.json()
        const results = data.results || []

        for (const place of results.slice(0, 3)) {
          allVenues.push({
            name: place.name,
            type,
            rating: place.rating || 0,
            address: place.vicinity || '',
            walkingMinutes: Math.round(
              (haversineKm(
                { lat: parseFloat(lat), lng: parseFloat(lng) },
                { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
              ) / 5) * 60
            ),
            googlePlacesId: place.place_id,
          })
        }
      }
    }

    // Dedupe by name
    const seen = new Set<string>()
    const unique = allVenues.filter((v) => {
      if (seen.has(v.name)) return false
      seen.add(v.name)
      return true
    })

    // Sort by rating, take top 5
    unique.sort((a, b) => b.rating - a.rating)

    return NextResponse.json({ venues: unique.slice(0, 5) })
  } catch (err) {
    console.error('Venues error:', err)
    return NextResponse.json({ venues: getMockVenues(parseFloat(lat), parseFloat(lng)) })
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function getMockVenues(_lat: number, _lng: number) {
  return [
    { name: 'The Ten Bells', type: 'pub', rating: 4.4, address: 'Near station', walkingMinutes: 2, googlePlacesId: 'mock-1' },
    { name: 'Dishoom', type: 'restaurant', rating: 4.5, address: 'Near station', walkingMinutes: 3, googlePlacesId: 'mock-2' },
    { name: 'Bar Elba', type: 'bar', rating: 4.2, address: 'Near station', walkingMinutes: 4, googlePlacesId: 'mock-3' },
    { name: 'The Anchor', type: 'pub', rating: 4.3, address: 'Near station', walkingMinutes: 2, googlePlacesId: 'mock-4' },
    { name: 'Flat Iron', type: 'restaurant', rating: 4.4, address: 'Near station', walkingMinutes: 5, googlePlacesId: 'mock-5' },
  ]
}
