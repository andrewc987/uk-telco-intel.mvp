export interface LatLng {
  lat: number
  lng: number
}

export interface Person {
  id: string
  name: string
  fromLocation: string
  fromLatLng: LatLng | null
  homeLocation: string
  homeLatLng: LatLng | null
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

export type PersonLeg =
  | { personId: string; personName: string; ok: true; minutes: number; route: string }
  | { personId: string; personName: string; ok: false }

export interface ScoredCandidate {
  name: string
  postcode: string
  latLng: LatLng
  maxMinutes: number
  spread: number
  totalMinutes: number
  legs: PersonLeg[]
}

export interface OptimiseResponse {
  fairest: ScoredCandidate
  quickest: ScoredCandidate
  agree: boolean
  diff: string
  ranked: ScoredCandidate[]
  origins: { personId: string; name: string; latLng: LatLng }[]
  failures: { candidate: string; personName: string }[]
}

export interface Venue {
  name: string
  type: string
  walkingMinutes: number
}
