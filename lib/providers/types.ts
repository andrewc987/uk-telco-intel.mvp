export interface LatLng {
  lat: number
  lng: number
}

export type JourneyResult =
  | { ok: true; minutes: number; route: string }
  | { ok: false }

export interface JourneyProvider {
  journeyTime(origin: LatLng, dest: LatLng, departureTime: Date): Promise<JourneyResult>
}

export type GeocodeResult =
  | { ok: true; latLng: LatLng; postcode: string }
  | { ok: false }

export interface GeocodeProvider {
  geocodePostcode(postcode: string): Promise<GeocodeResult>
}

export interface PlaceSuggestion {
  label: string
  sublabel?: string
  latLng: LatLng
}

export interface PlaceSearchProvider {
  search(query: string): Promise<PlaceSuggestion[]>
}
