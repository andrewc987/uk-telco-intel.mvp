import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const fromLat = request.nextUrl.searchParams.get('fromLat')
  const fromLng = request.nextUrl.searchParams.get('fromLng')
  const toLat = request.nextUrl.searchParams.get('toLat')
  const toLng = request.nextUrl.searchParams.get('toLng')
  const mode = request.nextUrl.searchParams.get('mode') || 'tube'

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  try {
    const tflMode = mode === 'cab' ? 'taxi' : mode === 'tube' ? 'tube,dlr,overground,elizabeth-line' : mode
    const from = `${fromLat},${fromLng}`
    const to = `${toLat},${toLng}`
    let url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?mode=${tflMode}&journeyPreference=LeastTime`

    const appKey = process.env.TFL_APP_KEY
    if (appKey) url += `&app_key=${appKey}`

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (!res.ok) {
      return NextResponse.json({ error: 'TfL API error', status: res.status }, { status: 502 })
    }

    const data = await res.json()
    const journey = data.journeys?.[0]

    if (!journey) {
      return NextResponse.json({ error: 'No journey found' }, { status: 404 })
    }

    const legs = journey.legs || []
    const routeParts = legs.map((leg: { instruction?: { summary?: string }; mode?: { name?: string } }) => {
      return leg.instruction?.summary || leg.mode?.name || ''
    }).filter(Boolean)

    return NextResponse.json({
      duration: journey.duration || 0,
      route: routeParts.join(' → ') || 'Direct',
      legs: legs.length,
    })
  } catch (err) {
    console.error('Journey error:', err)
    return NextResponse.json({ error: 'Journey lookup failed' }, { status: 500 })
  }
}
