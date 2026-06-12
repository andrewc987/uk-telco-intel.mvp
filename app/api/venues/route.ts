import { NextRequest, NextResponse } from 'next/server'
import { Venue } from '@/lib/types'

// Venue layer. Two sources behind one shape:
// - Google Places when GOOGLE_MAPS_API_KEY exists (not in this env yet)
// - Overpass (OpenStreetMap) as the live keyless path
// On any failure: empty list. The meet-point recommendation never depends on this.

const WALK_KMH = 5

export async function GET(request: NextRequest) {
  const lat = parseFloat(request.nextUrl.searchParams.get('lat') || '')
  const lng = parseFloat(request.nextUrl.searchParams.get('lng') || '')

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (apiKey) {
    const venues = await googleVenues(lat, lng, apiKey)
    if (venues.length > 0) return NextResponse.json({ venues })
    // fall through to Overpass if Google gave nothing
  }

  const venues = await overpassVenues(lat, lng)
  return NextResponse.json({ venues })
}

// Evening bias: pubs and bars first, then restaurants, then cafés.
const TYPE_RANK: Record<string, number> = { pub: 0, bar: 1, restaurant: 2, cafe: 3 }
const TYPE_LABEL: Record<string, string> = { pub: 'Pub', bar: 'Bar', restaurant: 'Restaurant', cafe: 'Café' }

async function overpassVenues(lat: number, lng: number): Promise<Venue[]> {
  const query = `[out:json][timeout:8];(node["amenity"~"^(pub|bar|cafe|restaurant)$"]["name"](around:400,${lat},${lng});way["amenity"~"^(pub|bar|cafe|restaurant)$"]["name"](around:400,${lat},${lng}););out center 60;`

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'HALFPOINT/1.0 (meet-point app)',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = await res.json()
    const elements: Array<{
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }> = data.elements || []

    const seen = new Set<string>()
    const venues: Venue[] = []
    for (const el of elements) {
      const tags = el.tags
      const name = tags?.name
      const type = tags?.amenity
      const vLat = el.lat ?? el.center?.lat
      const vLng = el.lon ?? el.center?.lon
      if (!name || !type || vLat === undefined || vLng === undefined) continue
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      venues.push({
        name,
        type,
        walkingMinutes: Math.max(
          1,
          Math.round((haversineKm({ lat, lng }, { lat: vLat, lng: vLng }) / WALK_KMH) * 60)
        ),
      })
    }

    venues.sort(
      (a, b) => (TYPE_RANK[a.type] ?? 9) - (TYPE_RANK[b.type] ?? 9) || a.walkingMinutes - b.walkingMinutes
    )
    return venues.slice(0, 5).map((v) => ({ ...v, type: TYPE_LABEL[v.type] || v.type }))
  } catch {
    return []
  }
}

async function googleVenues(lat: number, lng: number, apiKey: string): Promise<Venue[]> {
  try {
    const types = ['bar', 'restaurant', 'pub']
    const collected: Array<Venue & { rating: number }> = []

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=400&type=${type}&key=${apiKey}`
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) continue
      const data = await res.json()
      for (const place of (data.results || []).slice(0, 3)) {
        collected.push({
          name: place.name,
          type: TYPE_LABEL[type] || type,
          rating: place.rating || 0,
          walkingMinutes: Math.max(
            1,
            Math.round(
              (haversineKm(
                { lat, lng },
                { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
              ) / WALK_KMH) * 60
            )
          ),
        })
      }
    }

    const seen = new Set<string>()
    const unique = collected.filter((v) => {
      const key = v.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    unique.sort((a, b) => b.rating - a.rating)
    return unique.slice(0, 5).map(({ rating: _r, ...v }) => v)
  } catch {
    return []
  }
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
