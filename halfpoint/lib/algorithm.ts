import { Candidate, PersonJourney, Person, LatLng, AlgorithmMode, Result, Venue } from './types'
import { CANDIDATE_STATIONS, CandidateStation } from './candidates'

interface JourneyTimeResult {
  durationMinutes: number
  route: string
}

interface GeocodedPerson extends Person {
  fromLatLng: LatLng
  homeLatLng?: LatLng
  isLondon: boolean
}

// Haversine distance in km
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Estimate journey time from straight-line distance (fallback)
function estimateMinutes(from: LatLng, to: LatLng, mode: string): number {
  const km = haversineKm(from, to)
  switch (mode) {
    case 'walk': return Math.round((km / 5) * 60)
    case 'bus': return Math.round((km / 15) * 60) + 5
    case 'cab': return Math.round((km / 25) * 60) + 5
    case 'tube':
    default: return Math.round((km / 30) * 60) + 8
  }
}

// Query TfL Journey Planner
async function queryTfL(fromLatLng: LatLng, toLatLng: LatLng, mode: string): Promise<JourneyTimeResult | null> {
  try {
    const tflMode = mode === 'cab' ? 'taxi' : mode === 'tube' ? 'tube,dlr,overground,elizabeth-line' : mode
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

// Get journey time with TfL fallback to estimate
async function getJourneyTime(from: LatLng, to: LatLng, mode: string): Promise<JourneyTimeResult> {
  const tflResult = await queryTfL(from, to, mode)
  if (tflResult) return tflResult

  return {
    durationMinutes: estimateMinutes(from, to, mode),
    route: `Estimated ${mode} journey`,
  }
}

// Pre-filter candidates to the most relevant ones to reduce API calls
function filterCandidates(people: GeocodedPerson[], maxCandidates: number = 20): CandidateStation[] {
  // Calculate the centroid of all origin points
  const centroid: LatLng = {
    lat: people.reduce((sum, p) => sum + p.fromLatLng.lat, 0) / people.length,
    lng: people.reduce((sum, p) => sum + p.fromLatLng.lng, 0) / people.length,
  }

  // Sort by distance to centroid and take the closest ones
  return [...CANDIDATE_STATIONS]
    .sort((a, b) => haversineKm(a.latLng, centroid) - haversineKm(b.latLng, centroid))
    .slice(0, maxCandidates)
}

// Score a single candidate for all people
async function scoreCandidate(
  station: CandidateStation,
  people: GeocodedPerson[]
): Promise<Candidate> {
  const journeys: PersonJourney[] = await Promise.all(
    people.map(async (person) => {
      const toVenue = await getJourneyTime(person.fromLatLng, station.latLng, person.travelMode)

      let journeyHome = 0
      let lastTrainWarning: string | undefined
      let homeRoute = ''

      if (person.homeLatLng) {
        if (person.londonTerminal) {
          // Non-London: journey from venue to terminal
          const toTerminal = await getJourneyTime(
            station.latLng,
            person.londonTerminal.latLng,
            person.travelMode
          )
          // Add approximate train time (from terminal to home)
          const trainTime = estimateMinutes(person.londonTerminal.latLng, person.homeLatLng, 'tube')
          journeyHome = toTerminal.durationMinutes + trainTime
          homeRoute = `${toTerminal.route} → Train from ${person.londonTerminal.name}`

          // Last train warning
          if (person.londonTerminal.lastTrains.length > 0) {
            const lastTrain = person.londonTerminal.lastTrains[0]
            lastTrainWarning = `Must leave by ${calculateLeaveBy(lastTrain.departureTime, toTerminal.durationMinutes)} to catch ${lastTrain.departureTime} from ${person.londonTerminal.name}`
          }
        } else {
          // London home: direct journey
          const homeResult = await getJourneyTime(station.latLng, person.homeLatLng, person.travelMode)
          journeyHome = homeResult.durationMinutes
          homeRoute = homeResult.route
        }
      }

      return {
        personId: person.id,
        personName: person.name,
        journeyToVenue: toVenue.durationMinutes,
        journeyHome,
        totalEvening: toVenue.durationMinutes + journeyHome,
        route: toVenue.route,
        lastTrainWarning,
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

function calculateLeaveBy(trainTime: string, travelMinutes: number): string {
  const [hours, mins] = trainTime.split(':').map(Number)
  const trainDate = new Date(2000, 0, 1, hours, mins)
  trainDate.setMinutes(trainDate.getMinutes() - travelMinutes - 5) // 5 min buffer
  return `${String(trainDate.getHours()).padStart(2, '0')}:${String(trainDate.getMinutes()).padStart(2, '0')}`
}

function generateDiffSentence(
  shortestWinner: Candidate,
  fairestWinner: Candidate,
  fullJourneyWinner: Candidate
): string {
  // All agree
  if (
    shortestWinner.stationName === fairestWinner.stationName &&
    fairestWinner.stationName === fullJourneyWinner.stationName
  ) {
    return `All three modes agree: ${shortestWinner.stationName}. That's a good sign.`
  }

  const shortestJourneys = shortestWinner.journeys
  const worstInShortest = shortestJourneys.reduce((a, b) =>
    a.journeyToVenue > b.journeyToVenue ? a : b
  )
  const bestInShortest = shortestJourneys.reduce((a, b) =>
    a.journeyToVenue < b.journeyToVenue ? a : b
  )

  const totalSaved = fairestWinner.scores.shortestTotal - shortestWinner.scores.shortestTotal
  const gapInShortest = worstInShortest.journeyToVenue - bestInShortest.journeyToVenue

  const fairestJourneys = fairestWinner.journeys
  const worstInFairest = fairestJourneys.reduce((a, b) =>
    a.journeyToVenue > b.journeyToVenue ? a : b
  )
  const bestInFairest = fairestJourneys.reduce((a, b) =>
    a.journeyToVenue < b.journeyToVenue ? a : b
  )
  const gapInFairest = worstInFairest.journeyToVenue - bestInFairest.journeyToVenue

  const avgExtraPerPerson = Math.round(totalSaved / shortestJourneys.length)

  return `${shortestWinner.stationName} saves ${Math.abs(totalSaved)} mins overall, but ${worstInShortest.personName} gets ${worstInShortest.journeyToVenue} mins vs ${bestInShortest.personName}'s ${bestInShortest.journeyToVenue}. Fair mode at ${fairestWinner.stationName} costs everyone ~${avgExtraPerPerson} mins more — and closes that gap to ${gapInFairest} minutes.`
}

export async function runOptimisation(
  people: GeocodedPerson[]
): Promise<Omit<Result, 'venues'>> {
  const candidates = filterCandidates(people)

  // Score all candidates in parallel (batched to avoid rate limits)
  const batchSize = 5
  const scored: Candidate[] = []
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    const results = await Promise.all(batch.map((s) => scoreCandidate(s, people)))
    scored.push(...results)
  }

  // Rank by each mode
  const byShortestTotal = [...scored].sort((a, b) => a.scores.shortestTotal - b.scores.shortestTotal)
  const byFairest = [...scored].sort((a, b) => a.scores.fairest - b.scores.fairest)
  const byFullJourney = [...scored].sort((a, b) => a.scores.fullJourneyFairness - b.scores.fullJourneyFairness)

  const shortestTotalWinner = byShortestTotal[0]
  const fairestWinner = byFairest[0]
  const fullJourneyWinner = byFullJourney[0]

  const diffSentence = generateDiffSentence(shortestTotalWinner, fairestWinner, fullJourneyWinner)

  return {
    shortestTotalWinner,
    fairestWinner,
    fullJourneyWinner,
    diffSentence,
  }
}

export type { GeocodedPerson }
