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
  const [active, setActive] = useState(-1)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const query = (q: string) => {
    if (debounce.current) clearTimeout(debounce.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      close()
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
        setActive(-1)
      } catch {
        /* leave previous suggestions */
      }
    }, 250)
  }

  return { suggestions, open, setOpen, active, setActive, close, query }
}

type Suggestions = ReturnType<typeof useSuggestions>

// One forgiving autocomplete field: combobox input + listbox of options,
// arrow keys/Enter/Escape all work, mouse still wins.
function PlaceField({
  id,
  label,
  placeholder,
  value,
  resolved,
  state,
  onChange,
  onPick,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  resolved: boolean
  state: Suggestions
  onChange: (v: string) => void
  onPick: (s: PlaceSuggestion) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) state.close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pick = (s: PlaceSuggestion) => {
    state.close()
    onPick(s)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!state.open || state.suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      state.setActive((state.active + 1) % state.suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      state.setActive(state.active <= 0 ? state.suggestions.length - 1 : state.active - 1)
    } else if (e.key === 'Enter') {
      if (state.active >= 0) {
        e.preventDefault()
        pick(state.suggestions[state.active])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      state.close()
    }
  }

  const listboxId = `${id}-listbox`

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        id={id}
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-expanded={state.open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={state.active >= 0 ? `${id}-option-${state.active}` : undefined}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          state.query(e.target.value)
        }}
        onKeyDown={onKeyDown}
      />
      {resolved && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success text-base" aria-hidden>
          ✓
        </span>
      )}
      {state.open && (
        <div className="autocomplete-dropdown" role="listbox" id={listboxId} aria-label={`${label} suggestions`}>
          {state.suggestions.map((s, i) => (
            <div
              key={i}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === state.active}
              className="autocomplete-item"
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => state.setActive(i)}
            >
              <span className="text-text-primary">{s.label}</span>
              {s.sublabel && <span className="text-text-secondary ml-2 text-xs">{s.sublabel}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PersonRow({ person, index, onUpdate, onRemove, canRemove }: PersonRowProps) {
  const [showHome, setShowHome] = useState(Boolean(person.homeLocation))
  const from = useSuggestions()
  const home = useSuggestions()

  return (
    <div className="bg-surface rounded-2xl shadow-card p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <input
          type="text"
          placeholder={`Person ${index + 1}`}
          aria-label={`Person ${index + 1} name`}
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

      <PlaceField
        id={`${person.id}-from`}
        label={`Person ${index + 1} starting from`}
        placeholder="Postcode or place"
        value={person.fromLocation}
        resolved={Boolean(person.fromLatLng)}
        state={from}
        onChange={(v) => onUpdate({ ...person, fromLocation: v, fromLatLng: null })}
        onPick={(s) => onUpdate({ ...person, fromLocation: s.label, fromLatLng: s.latLng })}
      />

      {!showHome ? (
        <button
          onClick={() => setShowHome(true)}
          className="mt-2.5 text-sm text-text-secondary hover:text-accent transition-colors"
        >
          + heading home to somewhere else
        </button>
      ) : (
        <div className="mt-2.5">
          <PlaceField
            id={`${person.id}-home`}
            label={`Person ${index + 1} heading home to`}
            placeholder="Home postcode or station"
            value={person.homeLocation}
            resolved={Boolean(person.homeLatLng)}
            state={home}
            onChange={(v) => onUpdate({ ...person, homeLocation: v, homeLatLng: null })}
            onPick={(s) => onUpdate({ ...person, homeLocation: s.label, homeLatLng: s.latLng })}
          />
        </div>
      )}
    </div>
  )
}
