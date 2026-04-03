import { NextRequest, NextResponse } from 'next/server'
import { runOptimisation, GeocodedPerson } from '@/lib/algorithm'
import { Person, Venue } from '@/lib/types'
import { isLondonBorough, lookupTerminal, getPostcodeOutward } from '@/lib/terminals'

async function reverseGeocode(lat: number, lng: number): Promise<{
  postcode: string
  isLondon: boolean
  adminDistrict: string
} | null> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data.result?.[0]
    if (!result) return null
    return {
      postcode: result.postcode,
      isLondon: isLondonBorough(result.admin_district || ''),
      adminDistrict: result.admin_district || '',
    }
  } catch {
    return null
  }
}

async function fetchVenues(lat: number, lng: number): Promise<Venue[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/venues?lat=${lat}&lng=${lng}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.venues || []
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const people: Person[] = body.people

    if (!people || people.length < 2) {
      return NextResponse.json({ error: 'At least 2 people required' }, { status: 400 })
    }

    if (people.length > 8) {
      return NextResponse.json({ error: 'Maximum 8 people' }, { status: 400 })
    }

    // Build geocoded people — lat/lng comes from client, we just need to resolve terminals
    const geocoded: GeocodedPerson[] = await Promise.all(
      people.map(async (person) => {
        if (!person.fromLatLng) {
          throw new Error(`No location for ${person.name || 'a person'}. Select from the dropdown.`)
        }

        let isLondon = true
        let terminal = person.londonTerminal

        // If home location provided, check if non-London
        if (person.homeLatLng && !terminal) {
          const homeGeo = await reverseGeocode(person.homeLatLng.lat, person.homeLatLng.lng)
          if (homeGeo) {
            isLondon = homeGeo.isLondon
            if (!isLondon) {
              const outward = getPostcodeOutward(homeGeo.postcode)
              terminal = lookupTerminal(outward) || undefined
            }
          }
        }

        return {
          ...person,
          isLondon,
          londonTerminal: terminal,
        }
      })
    )

    const result = await runOptimisation(geocoded)

    // Fetch venues for the recommended winner
    const venues = await fetchVenues(
      result.recommended.latLng.lat,
      result.recommended.latLng.lng
    )

    return NextResponse.json({
      ...result,
      venues,
    })
  } catch (err) {
    console.error('Optimise error:', err)
    const message = err instanceof Error ? err.message : 'Optimisation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
