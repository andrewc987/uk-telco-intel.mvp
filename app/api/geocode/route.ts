import { NextRequest, NextResponse } from 'next/server'
import { isLondonBorough, lookupTerminal, getPostcodeOutward } from '@/lib/terminals'

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get('postcode')

  if (!postcode) {
    return NextResponse.json({ error: 'Missing postcode parameter' }, { status: 400 })
  }

  try {
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase()
    const res = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid postcode' }, { status: 400 })
    }

    const data = await res.json()
    const result = data.result

    if (!result) {
      return NextResponse.json({ error: 'Postcode not found' }, { status: 404 })
    }

    const adminDistrict = result.admin_district || ''
    const isLondon = isLondonBorough(adminDistrict)
    const outwardCode = getPostcodeOutward(cleanPostcode)
    const terminal = !isLondon ? lookupTerminal(outwardCode) : undefined

    return NextResponse.json({
      postcode: result.postcode,
      latLng: {
        lat: result.latitude,
        lng: result.longitude,
      },
      isLondon,
      adminDistrict,
      terminal: terminal || null,
    })
  } catch (err) {
    console.error('Geocode error:', err)
    return NextResponse.json({ error: 'Failed to geocode postcode' }, { status: 500 })
  }
}
