import { Candidate, PersonJourney, Person, LatLng, Result } from './types'
import { CANDIDATE_STATIONS, CandidateStation } from './candidates'

interface JourneyTimeResult {
  durationMinutes: number
  route: string
}

interface GeocodedPerson extends Person {
  isLondon: boolean
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function estimateMinutes(from: LatLng, to: LatLng): number {
  const km = haversineKm(from, to)
  return Math.round((km / 30) * 60) + 8
}

async function queryTfL(fromLatLng: LatLng, toLatLng: LatLng): Promise<JourneyTimeResult | null> {
  try {
    const tflMode = 'tube,dlr,overground,elizabeth-line,bus,walking'
    const from = `${fromLatLng.lat},${fromLatLng.lng}`
    const to = `${toLatLng.lat},${toLatLng.lng}`
    const url = `https://api.tfl.gov.uk/Journey/JourneyResults/${from}/to/${to}?mode=${tflMode}&journeyPreference=LeastTime`

    const appKey = process.env.TFL_APP_KEY
    const fullUrl = appKey ? `${url}&app_key=${appKey}` : url

    const res = await fetch(fullUrl, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const data = await res.json()
    const journey = data.journeys?.[0]
    if (!journey) return null

    const legs = journey.legs || []
    const routeParts = legs.map((leg: { instruction?: { summary?: string }; mode?: { name?: string } }) => {
      return leg.instruction?.summary || leg.mode?.name || ''
    }).filter(Boolean)

    return {
      durationMinutes: journey.duration || 0,
      route: routeParts.join(' → ') || 'Direct',
    }
  } catch {
    return null
  }
}

async function getJourneyTime(from: LatLng, to: LatLng): Promise<JourneyTimeResult> {
  const tflResult = await queryTfL(from, to)
  if (tflResult) return tflResult

  return {
    durationMinutes: estimateMinutes(from, to),
    route: 'Public transport (estimated)',
  }
}

function filterCandidates(people: GeocodedPerson[], maxCandidates: number = 20): CandidateStation[] {
  const origins = people.filter(p => p.fromLatLng).map(p => p.fromLatLng!)
  const centroid: LatLng = {
    lat: origins.reduce((sum, p) => sum + p.lat, 0) / origins.length,
    lng: origins.reduce((sum, p) => sum + p.lng, 0) / origins.length,
  }

  return [...CANDIDATE_STATIONS]
    .sort((a, b) => haversineKm(a.latLng, centroid) - haversineKm(b.latLng, centroid))
    .slice(0, maxCandidates)
}

function calculateLeaveBy(trainTime: string, travelMinutes: number): string {
  const [hours, mins] = trainTime.split(':').map(Number)
  const trainDate = new Date(2000, 0, 1, hours, mins)
  trainDate.setMinutes(trainDate.getMinutes() - travelMinutes - 5)
  return `${String(trainDate.getHours()).padStart(2, '0')}:${String(trainDate.getMinutes()).padStart(2, '0')}`
}

async function scoreCandidate(
  station: CandidateStation,
  people: GeocodedPerson[]
): Promise<Candidate> {
  const journeys: PersonJourney[] = await Promise.all(
    people.map(async (person) => {
      if (!person.fromLatLng) {
        return {
          personId: person.id,
          personName: person.name || 'Someone',
          journeyToVenue: 0,
          journeyHome: 0,
          totalEvening: 0,
          route: 'Unknown origin',
          homeRoute: '',
          narrative: `${person.name || 'Someone'} — unknown origin`,
        }
      }

      const toVenue = await getJourneyTime(person.fromLatLng, station.latLng)

      let journeyHome = 0
      let lastTrainWarning: string | undefined
      let leaveByTime: string | undefined
      let homeRoute = ''

      if (person.homeLatLng) {
        if (person.londonTerminal) {
          // Non-London: transit to terminal, then train
          const toTerminal = await getJourneyTime(station.latLng, person.londonTerminal.latLng)
          const trainTime = estimateMinutes(person.londonTerminal.latLng, person.homeLatLng)
          journeyHome = toTerminal.durationMinutes + trainTime
          homeRoute = `${toTerminal.route} → Train from ${person.londonTerminal.name}`

          if (person.londonTerminal.lastTrains.length > 0) {
            const lastTrain = person.londonTerminal.lastTrains[0]
            leaveByTime = calculateLeaveBy(lastTrain.departureTime, toTerminal.durationMinutes)
            lastTrainWarning = `Leave by ${leaveByTime} or you're not catching the ${lastTrain.departureTime} from ${person.londonTerminal.name}`
          }
        } else {
          const homeResult = await getJourneyTime(station.latLng, person.homeLatLng)
          journeyHome = homeResult.durationMinutes
          homeRoute = homeResult.route
        }
      }

      // Build the narrative
      const name = person.name || 'Someone'
      let narrative = `${toVenue.route} — ${toVenue.durationMinutes} mins`
      if (homeRoute && journeyHome > 0) {
        if (person.londonTerminal) {
          const lastTrain = person.londonTerminal.lastTrains[0]
          narrative += `\nThen the ${lastTrain?.departureTime || 'last train'} from ${person.londonTerminal.name} to ${person.homeLocation || 'home'}`
          if (leaveByTime) {
            narrative += ` — leave the venue by ${leaveByTime}`
          }
        } else {
          narrative += `\nHome via ${homeRoute} — ${journeyHome} mins`
        }
      }

      return {
        personId: person.id,
        personName: name,
        journeyToVenue: toVenue.durationMinutes,
        journeyHome,
        totalEvening: toVenue.durationMinutes + journeyHome,
        route: toVenue.route,
        homeRoute,
        narrative,
        lastTrainWarning,
        leaveByTime,
      }
    })
  )

  const shortestTotal = journeys.reduce((sum, j) => sum + j.journeyToVenue, 0)
  const fairest = Math.max(...journeys.map((j) => j.journeyToVenue))
  const fullJourneyFairness = Math.max(...journeys.map((j) => j.totalEvening))

  return {
    stationName: station.name,
    postcode: station.postcode,
    latLng: station.latLng,
    scores: { shortestTotal, fairest, fullJourneyFairness },
    journeys,
  }
}

const SUMMARY_LINES_AGREE = [
  "Three different ways of measuring fair. All point here.",
  "The algorithm ran three versions of fair. They all agree.",
  "However you slice it, this is the spot.",
]

const SUMMARY_LINES_DISAGREE = [
  "Not everyone travels the same distance. This is as even as London gets.",
  "Someone always draws the short straw. This minimises how short.",
  "It's not perfect for everyone. But it's the fairest call.",
]

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateWhyHere(
  shortest: Candidate,
  fairest: Candidate,
  fullJourney: Candidate
): string[] {
  const lines: string[] = []

  const shortestGap = Math.max(...shortest.journeys.map(j => j.journeyToVenue)) - Math.min(...shortest.journeys.map(j => j.journeyToVenue))
  lines.push(`Shortest total: ${shortest.stationName} (saves ${shortest.scores.shortestTotal} mins combined, but ${shortestGap} min gap between best and worst)`)

  const fairestGap = Math.max(...fairest.journeys.map(j => j.journeyToVenue)) - Math.min(...fairest.journeys.map(j => j.journeyToVenue))
  lines.push(`Fairest for everyone: ${fairest.stationName} (closes the gap to ${fairestGap} mins)`)

  const isRecommended = fullJourney.stationName === fairest.stationName
  lines.push(`Full journey fairness: ${fullJourney.stationName}${isRecommended ? ' ✓' : ''} (accounts for trains home)`)

  return lines
}

export async function runOptimisation(
  people: GeocodedPerson[]
): Promise<Omit<Result, 'venues'>> {
  const candidates = filterCandidates(people)

  const batchSize = 5
  const scored: Candidate[] = []
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    const results = await Promise.all(batch.map((s) => scoreCandidate(s, people)))
    scored.push(...results)
  }

  const byShortestTotal = [...scored].sort((a, b) => a.scores.shortestTotal - b.scores.shortestTotal)
  const byFairest = [...scored].sort((a, b) => a.scores.fairest - b.scores.fairest)
  const byFullJourney = [...scored].sort((a, b) => a.scores.fullJourneyFairness - b.scores.fullJourneyFairness)

  const shortestTotalWinner = byShortestTotal[0]
  const fairestWinner = byFairest[0]
  const fullJourneyWinner = byFullJourney[0]

  // Auto-pick: if fairest and full-journey agree, use that. Otherwise use full-journey as tiebreaker.
  const recommended = fairestWinner.stationName === fullJourneyWinner.stationName
    ? fairestWinner
    : fullJourneyWinner

  const allAgree = shortestTotalWinner.stationName === fairestWinner.stationName &&
    fairestWinner.stationName === fullJourneyWinner.stationName

  const headline = recommended.stationName
  const summary = allAgree ? pickRandom(SUMMARY_LINES_AGREE) : pickRandom(SUMMARY_LINES_DISAGREE)
  const whyHere = generateWhyHere(shortestTotalWinner, fairestWinner, fullJourneyWinner)

  return {
    recommended,
    shortestTotalWinner,
    fairestWinner,
    fullJourneyWinner,
    headline,
    summary,
    whyHere,
  }
}

export type { GeocodedPerson }
