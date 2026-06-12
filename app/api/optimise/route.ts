import { NextRequest, NextResponse } from 'next/server'
import { optimise, EnginePerson } from '@/lib/engine'
import { Person } from '@/lib/types'

export async function POST(request: NextRequest) {
  let body: { people?: Person[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const people = body.people || []
  if (people.length < 2) {
    return NextResponse.json({ error: 'At least 2 people required' }, { status: 400 })
  }
  if (people.length > 8) {
    return NextResponse.json({ error: 'Maximum 8 people' }, { status: 400 })
  }

  const enginePeople: EnginePerson[] = []
  for (let i = 0; i < people.length; i++) {
    const p = people[i]
    if (!p.fromLatLng || typeof p.fromLatLng.lat !== 'number' || typeof p.fromLatLng.lng !== 'number') {
      return NextResponse.json(
        { error: `${p.name || `Person ${i + 1}`} needs a starting point picked from the suggestions.` },
        { status: 400 }
      )
    }
    enginePeople.push({
      id: p.id || `person-${i}`,
      name: p.name?.trim() || `Person ${i + 1}`,
      origin: p.fromLatLng,
      homeLatLng: p.homeLatLng || undefined,
    })
  }

  const outcome = await optimise(enginePeople)
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 502 })
  }
  return NextResponse.json(outcome.result)
}
