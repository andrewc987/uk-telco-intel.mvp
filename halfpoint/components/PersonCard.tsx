'use client'

import { useState, useRef, useEffect } from 'react'
import { Person, TravelMode, Terminal } from '@/lib/types'

const TRAVEL_MODES: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'tube', label: 'Transit', icon: '🚇' },
  { value: 'walk', label: 'Walking', icon: '🚶' },
]

interface AutocompleteResult {
  display: string
  postcode: string
}

interface PersonCardProps {
  person: Person
  index: number
  showHomePostcode: boolean
  onUpdate: (person: Person) => void
  onRemove: () => void
  canRemove: boolean
}

export default function PersonCard({
  person,
  index,
  showHomePostcode,
  onUpdate,
  onRemove,
  canRemove,
}: PersonCardProps) {
  const [fromSuggestions, setFromSuggestions] = useState<AutocompleteResult[]>([])
  const [homeSuggestions, setHomeSuggestions] = useState<AutocompleteResult[]>([])
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showHomeDropdown, setShowHomeDropdown] = useState(false)
  const fromRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setShowFromDropdown(false)
      if (homeRef.current && !homeRef.current.contains(e.target as Node)) setShowHomeDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchLocation = async (query: string, setter: (r: AutocompleteResult[]) => void, showSetter: (v: boolean) => void) => {
    if (query.length < 2) {
      setter([])
      showSetter(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        // Try postcode autocomplete first
        const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(query)}/autocomplete`)
        if (pcRes.ok) {
          const pcData = await pcRes.json()
          if (pcData.result && pcData.result.length > 0) {
            setter(pcData.result.slice(0, 5).map((pc: string) => ({ display: pc, postcode: pc })))
            showSetter(true)
            return
          }
        }

        // Fall back to place search
        const placeRes = await fetch(`https://api.postcodes.io/places?q=${encodeURIComponent(query)}&limit=5`)
        if (placeRes.ok) {
          const placeData = await placeRes.json()
          if (placeData.result && placeData.result.length > 0) {
            const results = await Promise.all(
              placeData.result.slice(0, 5).map(async (place: { name_1: string; county_unitary?: string; latitude: number; longitude: number }) => {
                // Reverse geocode to get nearest postcode
                try {
                  const revRes = await fetch(`https://api.postcodes.io/postcodes?lon=${place.longitude}&lat=${place.latitude}&limit=1`)
                  if (revRes.ok) {
                    const revData = await revRes.json()
                    const postcode = revData.result?.[0]?.postcode || ''
                    return {
                      display: `${place.name_1}${place.county_unitary ? `, ${place.county_unitary}` : ''}`,
                      postcode,
                    }
                  }
                } catch { /* ignore */ }
                return { display: place.name_1, postcode: '' }
              })
            )
            setter(results.filter((r: AutocompleteResult) => r.postcode))
            showSetter(true)
            return
          }
        }

        setter([])
        showSetter(false)
      } catch {
        setter([])
        showSetter(false)
      }
    }, 300)
  }

  const selectLocation = async (field: 'from' | 'home', result: AutocompleteResult) => {
    if (field === 'from') {
      onUpdate({ ...person, fromLocation: result.display, fromPostcode: result.postcode })
      setShowFromDropdown(false)
    } else {
      // Check if non-London for terminal resolution
      try {
        const res = await fetch(`/api/geocode?postcode=${encodeURIComponent(result.postcode)}`)
        if (res.ok) {
          const data = await res.json()
          onUpdate({
            ...person,
            homeLocation: result.display,
            homePostcode: result.postcode,
            londonTerminal: data.terminal as Terminal | undefined,
          })
        } else {
          onUpdate({ ...person, homeLocation: result.display, homePostcode: result.postcode })
        }
      } catch {
        onUpdate({ ...person, homeLocation: result.display, homePostcode: result.postcode })
      }
      setShowHomeDropdown(false)
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
          placeholder="Name"
          value={person.name}
          onChange={(e) => onUpdate({ ...person, name: e.target.value })}
          maxLength={20}
        />

        <div className="relative" ref={fromRef}>
          <input
            type="text"
            placeholder="Coming from (town or postcode)"
            value={person.fromLocation}
            onChange={(e) => {
              onUpdate({ ...person, fromLocation: e.target.value, fromPostcode: '' })
              searchLocation(e.target.value, setFromSuggestions, setShowFromDropdown)
            }}
          />
          {showFromDropdown && fromSuggestions.length > 0 && (
            <div className="autocomplete-dropdown">
              {fromSuggestions.map((s, i) => (
                <div key={i} className="autocomplete-item" onClick={() => selectLocation('from', s)}>
                  <span className="text-text-primary">{s.display}</span>
                  {s.postcode !== s.display && (
                    <span className="text-text-secondary ml-2 text-xs">{s.postcode}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {showHomePostcode && (
          <div className="relative" ref={homeRef}>
            <input
              type="text"
              placeholder="Going home to (town or postcode)"
              value={person.homeLocation}
              onChange={(e) => {
                onUpdate({ ...person, homeLocation: e.target.value, homePostcode: '', londonTerminal: undefined })
                searchLocation(e.target.value, setHomeSuggestions, setShowHomeDropdown)
              }}
            />
            {showHomeDropdown && homeSuggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {homeSuggestions.map((s, i) => (
                  <div key={i} className="autocomplete-item" onClick={() => selectLocation('home', s)}>
                    <span className="text-text-primary">{s.display}</span>
                    {s.postcode !== s.display && (
                      <span className="text-text-secondary ml-2 text-xs">{s.postcode}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {person.londonTerminal && (
              <p className="text-xs text-accent mt-2 font-medium">
                Routing via {person.londonTerminal.name} ↗
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {TRAVEL_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onUpdate({ ...person, travelMode: mode.value })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                person.travelMode === mode.value
                  ? 'bg-accent text-white font-medium shadow-sm'
                  : 'bg-bg border border-border text-text-secondary hover:text-text-primary hover:border-accent/30'
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
