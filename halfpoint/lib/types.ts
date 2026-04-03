export interface Person {
  id: string
  name: string
  fromLocation: string
  fromLatLng: { lat: number; lng: number } | null
  homeLocation: string
  homeLatLng: { lat: number; lng: number } | null
  homePostcode: string
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
  leaveByTime?: string
}

export interface Result {
  recommended: Candidate
  shortestTotalWinner: Candidate
  fairestWinner: Candidate
  fullJourneyWinner: Candidate
  headline: string
  summary: string
  whyHere: string[]
  venues: Venue[]
}

export interface Venue {
  name: string
  type: string
  rating: number
  address: string
  walkingMinutes: number
  googlePlacesId: string
}

export interface LatLng {
  lat: number
  lng: number
}
