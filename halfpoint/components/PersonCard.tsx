'use client'

import { Person, TravelMode, Terminal } from '@/lib/types'

const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: 'tube', label: 'Tube' },
  { value: 'bus', label: 'Bus' },
  { value: 'walk', label: 'Walk' },
  { value: 'cab', label: 'Cab' },
]

interface PersonCardProps {
  person: Person
  index: number
  showHomePostcode: boolean
  onUpdate: (person: Person) => void
  onRemove: () => void
  canRemove: boolean
}

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export default function PersonCard({
  person,
  index,
  showHomePostcode,
  onUpdate,
  onRemove,
  canRemove,
}: PersonCardProps) {
  const handlePostcodeBlur = async (field: 'fromPostcode' | 'homePostcode', value: string) => {
    if (!value || !UK_POSTCODE_REGEX.test(value)) return

    if (field === 'homePostcode') {
      try {
        const res = await fetch(`/api/geocode?postcode=${encodeURIComponent(value)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.terminal) {
            onUpdate({
              ...person,
              [field]: value,
              londonTerminal: data.terminal as Terminal,
            })
            return
          } else {
            onUpdate({
              ...person,
              [field]: value,
              londonTerminal: undefined,
            })
            return
          }
        }
      } catch {
        // Silently fail geocode lookup
      }
    }
  }

  return (
    <div
      className="animate-slide-in bg-surface border border-border p-4 sm:p-5"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-text-secondary text-xs tracking-widest uppercase">
          Person {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-text-secondary hover:text-text-primary text-xs transition-colors"
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
          className="text-sm"
          maxLength={20}
        />

        <div>
          <input
            type="text"
            placeholder="Coming from (postcode)"
            value={person.fromPostcode}
            onChange={(e) => onUpdate({ ...person, fromPostcode: e.target.value.toUpperCase() })}
            onBlur={(e) => handlePostcodeBlur('fromPostcode', e.target.value)}
            className="text-sm"
          />
        </div>

        {showHomePostcode && (
          <div>
            <input
              type="text"
              placeholder="Going home to (postcode)"
              value={person.homePostcode}
              onChange={(e) => onUpdate({ ...person, homePostcode: e.target.value.toUpperCase() })}
              onBlur={(e) => handlePostcodeBlur('homePostcode', e.target.value)}
              className="text-sm"
            />
            {person.londonTerminal && (
              <p className="text-xs text-accent mt-1.5 font-medium">
                Routing via {person.londonTerminal.name} ↗
              </p>
            )}
          </div>
        )}

        <div className="flex gap-1.5">
          {TRAVEL_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onUpdate({ ...person, travelMode: mode.value })}
              className={`px-2.5 py-1 text-xs transition-colors ${
                person.travelMode === mode.value
                  ? 'bg-accent text-bg font-medium'
                  : 'bg-bg border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
