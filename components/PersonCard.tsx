'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Person, Terminal } from '@/lib/types'

interface Prediction {
  description: string
  placeId?: string
  latLng?: { lat: number; lng: number }
  type?: string
}

interface PersonCardProps {
  person: Person
  index: number
  onUpdate: (person: Person) => void
  onRemove: () => void
  canRemove: boolean
}

export default function PersonCard({
  person,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: PersonCardProps) {
  const [fromQuery, setFromQuery] = useState(person.fromLocation)
  const [homeQuery, setHomeQuery] = useState(person.homeLocation)
  const [fromPredictions, setFromPredictions] = useState<Prediction[]>([])
  const [homePredictions, setHomePredictions] = useState<Prediction[]>([])
  const [showFrom, setShowFrom] = useState(false)
  const [showHome, setShowHome] = useState(false)
  const fromRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const fromDebounce = useRef<NodeJS.Timeout>(null)
  const homeDebounce = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFrom(false)
      if (homeRef.current && !homeRef.current.contains(e.target as Node)) setShowHome(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchFrom = useCallback((query: string) => {
    if (query.length < 2) { setFromPredictions([]); setShowFrom(false); return }
    if (fromDebounce.current) clearTimeout(fromDebounce.current)
    fromDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`)
        if (!res.ok) return
        const data = await res.json()
        const preds = data.predictions || []
        setFromPredictions(preds)
        setShowFrom(preds.length > 0)
      } catch { /* ignore */ }
    }, 200)
  }, [])

  const searchHome = useCallback((query: string) => {
    if (query.length < 2) { setHomePredictions([]); setShowHome(false); return }
    if (homeDebounce.current) clearTimeout(homeDebounce.current)
    homeDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`)
        if (!res.ok) return
        const data = await res.json()
        const preds = data.predictions || []
        setHomePredictions(preds)
        setShowHome(preds.length > 0)
      } catch { /* ignore */ }
    }, 200)
  }, [])

  const selectPrediction = async (field: 'from' | 'home', pred: Prediction) => {
    const label = pred.description

    // If prediction already has lat/lng (local dataset or postcode), use it directly
    if (pred.latLng) {
      if (field === 'from') {
        setFromQuery(label)
        setShowFrom(false)
        onUpdate({ ...person, fromLocation: label, fromLatLng: pred.latLng })
      } else {
        setHomeQuery(label)
        setShowHome(false)
        // Resolve terminal info for home locations
        try {
          const res = await fetch(`/api/place-details?lat=${pred.latLng.lat}&lng=${pred.latLng.lng}`)
          if (res.ok) {
            const data = await res.json()
            onUpdate({
              ...person,
              homeLocation: label,
              homeLatLng: pred.latLng,
              homePostcode: data.postcode || '',
              londonTerminal: data.terminal as Terminal | undefined,
            })
            return
          }
        } catch { /* ignore */ }
        onUpdate({ ...person, homeLocation: label, homeLatLng: pred.latLng })
      }
      return
    }

    // If prediction has a placeId (Google Places), resolve it
    if (pred.placeId) {
      try {
        const res = await fetch(`/api/place-details?placeId=${pred.placeId}`)
        if (res.ok) {
          const data = await res.json()
          if (field === 'from') {
            setFromQuery(label)
            setShowFrom(false)
            onUpdate({ ...person, fromLocation: label, fromLatLng: data.latLng })
          } else {
            setHomeQuery(label)
            setShowHome(false)
            onUpdate({
              ...person,
              homeLocation: label,
              homeLatLng: data.latLng,
              homePostcode: data.postcode || '',
              londonTerminal: data.terminal as Terminal | undefined,
            })
          }
          return
        }
      } catch { /* fall through */ }
    }
  }

  return (
    <div
      className="animate-slide-in bg-surface rounded-2xl shadow-card p-5 sm:p-6 transition-shadow hover:shadow-card-hover"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-text-secondary text-sm font-medium">
          Person {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-text-secondary hover:text-warning text-sm transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="First name"
          value={person.name}
          onChange={(e) => onUpdate({ ...person, name: e.target.value })}
          maxLength={20}
        />

        {/* Coming from */}
        <div className="relative" ref={fromRef}>
          <input
            type="text"
            placeholder="Office or area"
            value={fromQuery}
            onChange={(e) => {
              const val = e.target.value
              setFromQuery(val)
              onUpdate({ ...person, fromLocation: val, fromLatLng: null })
              searchFrom(val)
            }}
          />
          {person.fromLatLng && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</span>
          )}
          {showFrom && fromPredictions.length > 0 && (
            <div className="autocomplete-dropdown">
              {fromPredictions.map((p, i) => (
                <div key={i} className="autocomplete-item" onClick={() => selectPrediction('from', p)}>
                  <span className="text-text-primary">{p.description}</span>
                  {p.type && (
                    <span className="text-text-secondary text-xs ml-2 capitalize">{p.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Going home to */}
        <div className="relative" ref={homeRef}>
          <input
            type="text"
            placeholder="Home area or station"
            value={homeQuery}
            onChange={(e) => {
              const val = e.target.value
              setHomeQuery(val)
              onUpdate({ ...person, homeLocation: val, homeLatLng: null, londonTerminal: undefined })
              searchHome(val)
            }}
          />
          {person.homeLatLng && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</span>
          )}
          {showHome && homePredictions.length > 0 && (
            <div className="autocomplete-dropdown">
              {homePredictions.map((p, i) => (
                <div key={i} className="autocomplete-item" onClick={() => selectPrediction('home', p)}>
                  <span className="text-text-primary">{p.description}</span>
                  {p.type && (
                    <span className="text-text-secondary text-xs ml-2 capitalize">{p.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {person.londonTerminal && (
            <p className="text-xs text-accent mt-2 font-medium">
              Via {person.londonTerminal.name} ↗
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
