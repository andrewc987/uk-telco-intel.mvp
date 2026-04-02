export type AlgorithmMode = 'shortest-total' | 'fairest' | 'full-journey-fairness'
export type AppMode = 'where-to-meet' | 'how-long-can-we-stay'
export type TravelMode = 'tube' | 'walk'

export interface Person {
  id: string
  name: string
  fromLocation: string
  fromPostcode: string
  homeLocation: string
  homePostcode: string
  travelMode: TravelMode
  londonTerminal?: Terminal
}

export interface Terminal {
  name: string
  postcode: string
  latLng: LatLng
  lastTrains: LastTrain[]
}

export interface LastTrain {
  destination: string
  departureTime: string
  daysOfWeek: string[]
}

export interface Candidate {
  stationName: string
  postcode: string
  latLng: LatLng
  scores: {
    shortestTotal: number
    fairest: number
    fullJourneyFairness: number
  }
  journeys: PersonJourney[]
}

export interface PersonJourney {
  personId: string
  personName: string
  journeyToVenue: number
  journeyHome: number
  totalEvening: number
  route: string
  homeRoute: string
  narrative: string
  lastTrainWarning?: string
}

export interface Result {
  shortestTotalWinner: Candidate
  fairestWinner: Candidate
  fullJourneyWinner: Candidate
  diffSentence: string
  venues: Venue[]
}

export interface Venue {
  name: string
  type: string
  rating: number
  address: string
  walkingMinutes: number
  googlePlacesId: string
  bookingUrl?: string
}

export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodedPostcode {
  postcode: string
  latLng: LatLng
  isLondon: boolean
  adminDistrict: string
}
