import { LatLng, OptimiseResponse, PersonLeg, ScoredCandidate } from './types'
import { CANDIDATE_STATIONS, CandidateStation } from './candidates'
import { tflJourneys } from './providers/tfl'

export interface EnginePerson {
  id: string
  name: string
  origin: LatLng
  homeLatLng?: LatLng
}

const SHORTLIST_SIZE = 13
const CONCURRENCY = 6

function distSq(a: LatLng, b: LatLng): number {
  // Good enough for shortlisting at London scale; lng compressed for latitude.
  const dLat = a.lat - b.lat
  const dLng = (a.lng - b.lng) * 0.62
  return dLat * dLat + dLng * dLng
}

function shortlist(people: EnginePerson[]): CandidateStation[] {
  const centroid: LatLng = {
    lat: people.reduce((s, p) => s + p.origin.lat, 0) / people.length,
    lng: people.reduce((s, p) => s + p.origin.lng, 0) / people.length,
  }
  const byCentroid = [...CANDIDATE_STATIONS].sort(
    (a, b) => distSq(a.latLng, centroid) - distSq(b.latLng, centroid)
  )
  const picked = byCentroid.slice(0, SHORTLIST_SIZE)

  // Coverage: make sure each person's nearest candidate is in the shortlist,
  // so a far-flung origin isn't scored only against central picks.
  for (const person of people) {
    const nearest = CANDIDATE_STATIONS.reduce((a, b) =>
      distSq(a.latLng, person.origin) <= distSq(b.latLng, person.origin) ? a : b
    )
    if (!picked.some((c) => c.name === nearest.name)) picked.push(nearest)
  }
  return picked
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

function diffSentence(fairest: ScoredCandidate, quickest: ScoredCandidate): { agree: boolean; diff: string } {
  if (fairest.name === quickest.name) {
    return { agree: true, diff: `Both modes agree: ${fairest.name}.` }
  }
  const saved = fairest.totalMinutes - quickest.totalMinutes
  const worstLeg = quickest.legs.reduce((a, b) => {
    if (!a.ok) return b
    if (!b.ok) return a
    return a.minutes >= b.minutes ? a : b
  })
  const worstName = worstLeg.personName
  const worstMinutes = worstLeg.ok ? worstLeg.minutes : quickest.maxMinutes
  return {
    agree: false,
    diff: `Quickest would save the group ${saved} minutes overall — but ${worstName}'s trip jumps to ${worstMinutes} minutes. Fairest keeps everyone within ${fairest.maxMinutes}.`,
  }
}

export async function optimise(
  people: EnginePerson[],
  departureTime: Date = new Date()
): Promise<{ ok: true; result: OptimiseResponse } | { ok: false; error: string }> {
  if (people.length < 2) return { ok: false, error: 'At least two people needed.' }

  const candidates = shortlist(people)

  // people × shortlist journey lookups, bounded concurrency, every result cached by the provider.
  const pairs = candidates.flatMap((candidate) => people.map((person) => ({ candidate, person })))
  const legs = await mapWithConcurrency(pairs, CONCURRENCY, async ({ candidate, person }) => {
    const journey = await tflJourneys.journeyTime(person.origin, candidate.latLng, departureTime)
    return { candidate, person, journey }
  })

  const scored: ScoredCandidate[] = []
  const failures: { candidate: string; personName: string }[] = []

  for (const candidate of candidates) {
    const candidateLegs: PersonLeg[] = people.map((person) => {
      const found = legs.find((l) => l.candidate.name === candidate.name && l.person.id === person.id)!
      if (found.journey.ok) {
        return {
          personId: person.id,
          personName: person.name,
          ok: true,
          minutes: found.journey.minutes,
          route: found.journey.route,
        }
      }
      failures.push({ candidate: candidate.name, personName: person.name })
      return { personId: person.id, personName: person.name, ok: false }
    })

    if (candidateLegs.every((l) => l.ok)) {
      const minutes = candidateLegs.map((l) => (l.ok ? l.minutes : 0))
      const max = Math.max(...minutes)
      const min = Math.min(...minutes)
      scored.push({
        name: candidate.name,
        postcode: candidate.postcode,
        latLng: candidate.latLng,
        maxMinutes: max,
        spread: max - min,
        totalMinutes: minutes.reduce((a, b) => a + b, 0),
        legs: candidateLegs,
      })
    }
  }

  if (scored.length < 3) {
    return {
      ok: false,
      error: "TfL isn't answering for most of these routes right now. Give it a minute, then run it again.",
    }
  }

  const byFairest = [...scored].sort(
    (a, b) => a.maxMinutes - b.maxMinutes || a.spread - b.spread || a.totalMinutes - b.totalMinutes
  )
  const byQuickest = [...scored].sort((a, b) => a.totalMinutes - b.totalMinutes || a.maxMinutes - b.maxMinutes)

  const fairest = byFairest[0]
  const quickest = byQuickest[0]
  const { agree, diff } = diffSentence(fairest, quickest)

  return {
    ok: true,
    result: {
      fairest,
      quickest,
      agree,
      diff,
      ranked: byFairest.slice(0, 5),
      origins: people.map((p) => ({ personId: p.id, name: p.name, latLng: p.origin })),
      failures,
    },
  }
}
