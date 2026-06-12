'use client'

import { useState, useEffect, useRef } from 'react'
import { OptimiseResponse, ScoredCandidate, Venue } from '@/lib/types'
import MiniMap from './MiniMap'

type Mode = 'fairest' | 'quickest'

interface ResultViewProps {
  result: OptimiseResponse
}

function JourneyLeg({ leg, index }: { leg: ScoredCandidate['legs'][number]; index: number }) {
  return (
    <div
      className="animate-fade-up bg-surface rounded-2xl shadow-card p-4 sm:p-5 flex items-start justify-between gap-3"
      style={{ animationDelay: `${100 + index * 90}ms` }}
    >
      <div className="min-w-0">
        <p className="font-semibold text-text-primary mb-0.5">{leg.personName}</p>
        {leg.ok ? (
          <>
            <p className="text-sm text-text-secondary leading-relaxed">{leg.route}</p>
            {leg.lastTrain && (
              <p className="text-sm text-accent font-medium mt-1.5">
                Makes the {leg.lastTrain.trainTime} to {leg.lastTrain.destination} from {leg.lastTrain.terminal} —
                leave by {leg.lastTrain.leaveBy}.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-warning">TfL couldn&apos;t plan {leg.personName}&apos;s leg. Not our doing.</p>
        )}
      </div>
      {leg.ok && (
        <span className="shrink-0 bg-accent text-white text-sm font-semibold px-3 py-1 rounded-full">
          {leg.minutes} min
        </span>
      )}
    </div>
  )
}

function VenueList({ latLng, placeName }: { latLng: { lat: number; lng: number }; placeName: string }) {
  const [venues, setVenues] = useState<Venue[]>([])
  const cache = useRef<Map<string, Venue[]>>(new Map())

  useEffect(() => {
    const key = `${latLng.lat},${latLng.lng}`
    const cached = cache.current.get(key)
    if (cached) {
      setVenues(cached)
      return
    }
    let cancelled = false
    setVenues([])
    fetch(`/api/venues?lat=${latLng.lat}&lng=${latLng.lng}`)
      .then((res) => (res.ok ? res.json() : { venues: [] }))
      .then((data) => {
        const list: Venue[] = Array.isArray(data?.venues) ? data.venues : []
        cache.current.set(key, list)
        if (!cancelled) setVenues(list)
      })
      .catch(() => {
        if (!cancelled) setVenues([])
      })
    return () => {
      cancelled = true
    }
  }, [latLng.lat, latLng.lng])

  if (venues.length === 0) return null

  return (
    <section className="animate-fade-up">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary text-center mb-3">
        Where to go in {placeName}
      </p>
      <div className="space-y-2.5">
        {venues.slice(0, 3).map((v, i) => (
          <div
            key={v.name}
            className="animate-fade-up bg-surface rounded-2xl shadow-card px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3"
            style={{ animationDelay: `${80 + i * 90}ms` }}
          >
            <div className="min-w-0">
              <p className="font-semibold text-text-primary truncate">{v.name}</p>
              <p className="text-sm text-text-secondary">{v.type}</p>
            </div>
            <span className="shrink-0 text-sm text-text-secondary font-medium">
              {v.walkingMinutes} min walk
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ResultView({ result }: ResultViewProps) {
  const [mode, setMode] = useState<Mode>('fairest')
  const winner = mode === 'fairest' ? result.fairest : result.quickest

  return (
    <div className="space-y-6">
      {/* Headline */}
      <section className="animate-fade-up text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-2">
          {mode === 'fairest' ? 'Fairest for everyone' : 'Quickest for the group'}
        </p>
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-4">
          {winner.name}
        </h2>
        <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-md mx-auto">
          {result.diff}
        </p>
      </section>

      {/* Mode toggle — both precomputed, switching is instant */}
      {!result.agree && (
        <section className="animate-fade-up flex justify-center">
          <div className="inline-flex bg-surface rounded-full shadow-card p-1" role="tablist" aria-label="Mode">
            {(['fairest', 'quickest'] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  mode === m ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m === 'fairest' ? 'Fairest' : 'Quickest'}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Map */}
      <section className="animate-fade-up">
        <MiniMap
          origins={result.origins.map((o) => ({ name: o.name, latLng: o.latLng }))}
          destination={{ name: winner.name, latLng: winner.latLng }}
        />
      </section>

      {/* Per-person journeys */}
      <section>
        <div className="space-y-2.5">
          {winner.legs.map((leg, i) => (
            <JourneyLeg key={`${mode}-${leg.personId}`} leg={leg} index={i} />
          ))}
        </div>
      </section>

      {/* Venues — only rendered when the venue source answered */}
      <VenueList latLng={winner.latLng} placeName={winner.name} />
    </div>
  )
}
