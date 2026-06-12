'use client'

import { useEffect, useRef, useState } from 'react'
import { Person } from '@/lib/types'
import { PlaceSuggestion } from '@/lib/providers/types'

interface PersonRowProps {
  person: Person
  index: number
  onUpdate: (person: Person) => void
  onRemove: () => void
  canRemove: boolean
}

function useSuggestions() {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = (q: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        const list: PlaceSuggestion[] = data.suggestions || []
        setSuggestions(list)
        setOpen(list.length > 0)
      } catch {
        /* leave previous suggestions */
      }
    }, 250)
  }

  return { suggestions, open, setOpen, query }
}

export default function PersonRow({ person, index, onUpdate, onRemove, canRemove }: PersonRowProps) {
  const [showHome, setShowHome] = useState(Boolean(person.homeLocation))
  const from = useSuggestions()
  const home = useSuggestions()
  const fromRef = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) from.setOpen(false)
      if (homeRef.current && !homeRef.current.contains(e.target as Node)) home.setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pickFrom = (s: PlaceSuggestion) => {
    from.setOpen(false)
    onUpdate({ ...person, fromLocation: s.label, fromLatLng: s.latLng })
  }

  const pickHome = (s: PlaceSuggestion) => {
    home.setOpen(false)
    onUpdate({ ...person, homeLocation: s.label, homeLatLng: s.latLng })
  }

  return (
    <div className="bg-surface rounded-2xl shadow-card p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          placeholder={`Person ${index + 1}`}
          aria-label="Name"
          value={person.name}
          maxLength={20}
          onChange={(e) => onUpdate({ ...person, name: e.target.value })}
          className="!w-36 sm:!w-44 font-medium"
          style={{ width: '11rem' }}
        />
        <div className="flex-1" />
        {canRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${person.name || `Person ${index + 1}`}`}
            className="text-text-secondary hover:text-warning text-xl leading-none px-2 py-1 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <div className="relative" ref={fromRef}>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="Postcode or place"
          aria-label="Starting from"
          value={person.fromLocation}
          onChange={(e) => {
            onUpdate({ ...person, fromLocation: e.target.value, fromLatLng: null })
            from.query(e.target.value)
          }}
        />
        {person.fromLatLng && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success text-base" aria-hidden>
            ✓
          </span>
        )}
        {from.open && (
          <div className="autocomplete-dropdown">
            {from.suggestions.map((s, i) => (
              <div key={i} className="autocomplete-item" onClick={() => pickFrom(s)}>
                <span className="text-text-primary">{s.label}</span>
                {s.sublabel && <span className="text-text-secondary ml-2 text-xs">{s.sublabel}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {!showHome ? (
        <button
          onClick={() => setShowHome(true)}
          className="mt-2.5 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          + heading home to somewhere else
        </button>
      ) : (
        <div className="relative mt-2.5" ref={homeRef}>
          <input
            type="text"
            autoComplete="off"
            placeholder="Home postcode or station"
            aria-label="Heading home to"
            value={person.homeLocation}
            onChange={(e) => {
              onUpdate({ ...person, homeLocation: e.target.value, homeLatLng: null })
              home.query(e.target.value)
            }}
          />
          {person.homeLatLng && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success text-base" aria-hidden>
              ✓
            </span>
          )}
          {home.open && (
            <div className="autocomplete-dropdown">
              {home.suggestions.map((s, i) => (
                <div key={i} className="autocomplete-item" onClick={() => pickHome(s)}>
                  <span className="text-text-primary">{s.label}</span>
                  {s.sublabel && <span className="text-text-secondary ml-2 text-xs">{s.sublabel}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
