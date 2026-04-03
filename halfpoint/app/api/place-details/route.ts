import { NextRequest, NextResponse } from 'next/server'
import { isLondonBorough, lookupTerminal, getPostcodeOutward } from '@/lib/terminals'

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId')
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  // If lat/lng provided directly (fallback mode), reverse geocode for postcode
  if (lat && lng) {
    return resolveFromLatLng(parseFloat(lat), parseFloat(lng))
  }

  if (!placeId) {
    return NextResponse.json({ error: 'Missing placeId or lat/lng' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components&key=${apiKey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) {
      return NextResponse.json({ error: 'Place details failed' }, { status: 502 })
    }

    const data = await res.json()
    const result = data.result
    if (!result?.geometry?.location) {
      return NextResponse.json({ error: 'No location found' }, { status: 404 })
    }

    const placeLat = result.geometry.location.lat
    const placeLng = result.geometry.location.lng

    // Find postcode in address components
    const postcodeComponent = result.address_components?.find(
      (c: { types: string[] }) => c.types.includes('postal_code')
    )
    const postcode = postcodeComponent?.long_name || ''

    // Check if London
    let isLondon = true
    let terminal = null

    if (postcode) {
      try {
        const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
          signal: AbortSignal.timeout(3000),
        })
        if (pcRes.ok) {
          const pcData = await pcRes.json()
          const adminDistrict = pcData.result?.admin_district || ''
          isLondon = isLondonBorough(adminDistrict)
          if (!isLondon) {
            const outward = getPostcodeOutward(postcode)
            terminal = lookupTerminal(outward) || null
          }
        }
      } catch { /* ignore */ }
    } else {
      // No postcode from Google — reverse geocode
      try {
        const revRes = await fetch(`https://api.postcodes.io/postcodes?lon=${placeLng}&lat=${placeLat}&limit=1`, {
          signal: AbortSignal.timeout(3000),
        })
        if (revRes.ok) {
          const revData = await revRes.json()
          const nearest = revData.result?.[0]
          if (nearest) {
            const adminDistrict = nearest.admin_district || ''
            isLondon = isLondonBorough(adminDistrict)
            if (!isLondon) {
              const outward = getPostcodeOutward(nearest.postcode)
              terminal = lookupTerminal(outward) || null
            }
          }
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      latLng: { lat: placeLat, lng: placeLng },
      postcode,
      isLondon,
      terminal,
    })
  } catch (err) {
    console.error('Place details error:', err)
    return NextResponse.json({ error: 'Place details failed' }, { status: 500 })
  }
}

async function resolveFromLatLng(lat: number, lng: number) {
  try {
    const revRes = await fetch(`https://api.postcodes.io/postcodes?lon=${lng}&lat=${lat}&limit=1`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!revRes.ok) {
      return NextResponse.json({ latLng: { lat, lng }, postcode: '', isLondon: true, terminal: null })
    }
    const revData = await revRes.json()
    const nearest = revData.result?.[0]
    if (!nearest) {
      return NextResponse.json({ latLng: { lat, lng }, postcode: '', isLondon: true, terminal: null })
    }

    const adminDistrict = nearest.admin_district || ''
    const isLondon = isLondonBorough(adminDistrict)
    let terminal = null
    if (!isLondon) {
      const outward = getPostcodeOutward(nearest.postcode)
      terminal = lookupTerminal(outward) || null
    }

    return NextResponse.json({
      latLng: { lat, lng },
      postcode: nearest.postcode,
      isLondon,
      terminal,
    })
  } catch {
    return NextResponse.json({ latLng: { lat, lng }, postcode: '', isLondon: true, terminal: null })
  }
}
