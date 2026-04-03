'use client'

import { useState, useRef, useEffect } from 'react'
import { Person, Terminal } from '@/lib/types'

interface Prediction {
  description: string
  placeId?: string
  latLng?: { lat: number; lng: number }
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
  const debounceRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFrom(false)
      if (homeRef.current && !homeRef.current.contains(e.target as Node)) setShowHome(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchPredictions = async (query: string, setter: (p: Prediction[]) => void, showSetter: (v: boolean) => void) => {
    if (query.length < 2) { setter([]); showSetter(false); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`)
        if (!res.ok) return
        const data = await res.json()
        setter(data.predictions || [])
        showSetter((data.predictions || []).length > 0)
      } catch { /* ignore */ }
    }, 250)
  }

  const selectPrediction = async (field: 'from' | 'home', pred: Prediction) => {
    const label = pred.description

    if (pred.placeId) {
      // Google Places — resolve to lat/lng
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

    if (pred.latLng) {
      // Postcodes.io fallback — already has lat/lng
      if (field === 'from') {
        setFromQuery(label)
        setShowFrom(false)
        onUpdate({ ...person, fromLocation: label, fromLatLng: pred.latLng })
      } else {
        setHomeQuery(label)
        setShowHome(false)
        // Resolve terminal for home
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
        {/* Name */}
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
              setFromQuery(e.target.value)
              onUpdate({ ...person, fromLocation: e.target.value, fromLatLng: null })
              fetchPredictions(e.target.value, setFromPredictions, setShowFrom)
            }}
          />
          {person.fromLatLng && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</span>
          )}
          {showFrom && fromPredictions.length > 0 && (
            <div className="autocomplete-dropdown">
              {fromPredictions.map((p, i) => (
                <div key={i} className="autocomplete-item" onClick={() => selectPrediction('from', p)}>
                  {p.description}
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
              setHomeQuery(e.target.value)
              onUpdate({ ...person, homeLocation: e.target.value, homeLatLng: null, londonTerminal: undefined })
              fetchPredictions(e.target.value, setHomePredictions, setShowHome)
            }}
          />
          {person.homeLatLng && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-sm">✓</span>
          )}
          {showHome && homePredictions.length > 0 && (
            <div className="autocomplete-dropdown">
              {homePredictions.map((p, i) => (
                <div key={i} className="autocomplete-item" onClick={() => selectPrediction('home', p)}>
                  {p.description}
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
