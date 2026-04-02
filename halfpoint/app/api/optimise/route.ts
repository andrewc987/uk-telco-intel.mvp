import { NextRequest, NextResponse } from 'next/server'
import { runOptimisation, GeocodedPerson } from '@/lib/algorithm'
import { Person, LatLng, Venue } from '@/lib/types'
import { isLondonBorough, lookupTerminal, getPostcodeOutward } from '@/lib/terminals'

async function geocodePostcode(postcode: string): Promise<{
  latLng: LatLng
  isLondon: boolean
  adminDistrict: string
} | null> {
  try {
    const clean = postcode.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const result = data.result
    if (!result) return null
    return {
      latLng: { lat: result.latitude, lng: result.longitude },
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

    // Geocode all postcodes in parallel
    const geocoded: GeocodedPerson[] = await Promise.all(
      people.map(async (person) => {
        const fromGeo = await geocodePostcode(person.fromPostcode)
        const homeGeo = person.homePostcode ? await geocodePostcode(person.homePostcode) : null

        if (!fromGeo) {
          throw new Error(`Could not geocode postcode: ${person.fromPostcode}`)
        }

        let terminal = person.londonTerminal
        if (homeGeo && !homeGeo.isLondon) {
          const outward = getPostcodeOutward(person.homePostcode)
          terminal = lookupTerminal(outward) || undefined
        }

        return {
          ...person,
          fromLatLng: fromGeo.latLng,
          homeLatLng: homeGeo?.latLng,
          isLondon: homeGeo ? homeGeo.isLondon : true,
          londonTerminal: terminal,
        }
      })
    )

    // Run the optimisation
    const result = await runOptimisation(geocoded)

    // Fetch venues for the fairest winner
    const venues = await fetchVenues(
      result.fairestWinner.latLng.lat,
      result.fairestWinner.latLng.lng
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
