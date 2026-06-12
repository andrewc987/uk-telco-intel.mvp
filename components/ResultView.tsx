'use client'

import { useState } from 'react'
import { OptimiseResponse, ScoredCandidate } from '@/lib/types'
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
          <p className="text-sm text-text-secondary leading-relaxed">{leg.route}</p>
        ) : (
          <p className="text-sm text-warning">Couldn&apos;t plan this leg — journey data didn&apos;t answer.</p>
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
    </div>
  )
}
