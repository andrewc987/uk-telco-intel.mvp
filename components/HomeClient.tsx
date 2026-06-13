'use client'

import { useState, useEffect, useCallback } from 'react'
import { Person, OptimiseResponse } from '@/lib/types'
import PersonRow from '@/components/PersonRow'
import ResultView from '@/components/ResultView'
import ShareButton from '@/components/ShareButton'

const LOADING_STAGES = [
  'Pulling real journey times across London',
  'Scoring every contender, both ways',
  'Making sure nobody gets shafted',
]

function LoadingState() {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1)), 2600)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="animate-fade-up text-center py-8 min-h-[148px]">
      <div className="progress-hairline mb-6" aria-hidden />
      <ul className="inline-flex flex-col items-start gap-1.5 text-left" aria-live="polite">
        {LOADING_STAGES.map((line, i) => (
          <li
            key={line}
            className={`text-sm flex items-center gap-2 transition-opacity duration-500 ${
              i < stage
                ? 'text-text-secondary'
                : i === stage
                  ? 'text-text-secondary'
                  : 'text-text-secondary/0 select-none'
            }`}
          >
            <span className={`text-success text-xs w-3 transition-opacity duration-500 ${i < stage ? 'opacity-100' : 'opacity-0'}`} aria-hidden>
              ✓
            </span>
            {line}
            {i === stage ? '…' : ''}
          </li>
        ))}
      </ul>
    </section>
  )
}

function createPerson(): Person {
  return {
    id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    fromLocation: '',
    fromLatLng: null,
    homeLocation: '',
    homeLatLng: null,
    homePostcode: '',
  }
}

interface ShareState {
  people: Person[]
  // Compact result summary so a shared URL can emit a real OG card
  // without re-running the engine server-side.
  r?: { place: string; legs: { n: string; m: number }[]; diff: string }
}

function encodeState(state: ShareState): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(state)))) } catch { return '' }
}

function decodeState(encoded: string): ShareState | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))) } catch { return null }
}

export default function HomeClient() {
  const [people, setPeople] = useState<Person[]>([createPerson(), createPerson()])
  const [result, setResult] = useState<OptimiseResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('s')
    if (s) {
      const decoded = decodeState(s)
      if (decoded && Array.isArray(decoded.people) && decoded.people.length >= 2) {
        setPeople(decoded.people)
        // A shared link reproduces the result, not just the inputs.
        runOptimise(decoded.people)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getShareUrl = useCallback(() => {
    const state: ShareState = { people }
    if (result) {
      state.r = {
        place: result.fairest.name,
        legs: result.fairest.legs
          .filter((l): l is Extract<typeof l, { ok: true }> => l.ok)
          .map((l) => ({ n: l.personName, m: l.minutes })),
        diff: result.diff,
      }
    }
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/?s=${encodeURIComponent(encodeState(state))}`
  }, [people, result])

  const addPerson = () => {
    if (people.length < 8) setPeople([...people, createPerson()])
  }

  const removePerson = (index: number) => {
    setPeople(people.filter((_, i) => i !== index))
  }

  const updatePerson = (index: number, updated: Person) => {
    const next = [...people]
    next[index] = updated
    setPeople(next)
  }

  const handleOptimise = () => runOptimise(people)

  const runOptimise = async (group: Person[]) => {
    setError(null)

    const unresolved = group.filter((p) => p.fromLocation.trim() && !p.fromLatLng)
    if (unresolved.length > 0) {
      const names = unresolved.map((p) => p.name || `Person ${group.indexOf(p) + 1}`)
      setError(`${names.join(' and ')} ${names.length === 1 ? 'hasn\'t' : 'haven\'t'} confirmed a location — pick from the suggestions.`)
      return
    }

    const resolved = group.filter((p) => p.fromLatLng)
    if (resolved.length < 2) {
      setError('Two starting points minimum — pick them from the suggestions.')
      return
    }

    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: resolved }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error || "The engine didn't answer. Run it again.")
        return
      }

      const data: OptimiseResponse = await res.json()
      setResult(data)
    } catch {
      setError("Couldn't reach the journey planner. Try again in a minute.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero */}
      <header className="animate-fade-up stagger-1 mb-10 sm:mb-12 text-center">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-text-primary">
          HALF<span className="text-accent">·</span>POINT
        </h1>
        <p className="text-lg sm:text-xl text-text-primary font-medium mb-1.5">
          The app that stops one person always winning.
        </p>
        <p className="text-sm sm:text-base text-text-secondary">
          Multi-person. Multi-modal. Last-train-aware.
        </p>
      </header>

      {/* People */}
      <section className="animate-fade-up stagger-2 space-y-3 mb-5">
        {people.map((person, i) => (
          <PersonRow
            key={person.id}
            person={person}
            index={i}
            onUpdate={(updated) => updatePerson(i, updated)}
            onRemove={() => removePerson(i)}
            canRemove={people.length > 2}
          />
        ))}
        {people.length < 8 && (
          <button
            onClick={addPerson}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-border text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm font-medium"
          >
            + Add another person
          </button>
        )}
      </section>

      {/* CTA */}
      <section className="animate-fade-up stagger-3 mb-10">
        <button
          onClick={handleOptimise}
          disabled={loading}
          className="btn-lift w-full bg-accent text-white py-4 rounded-2xl text-base font-semibold transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Working it out…' : 'Find somewhere fair.'}
        </button>
      </section>

      {/* Error */}
      {error && (
        <section className="animate-fade-up mb-8">
          <div className="bg-warning/8 border border-warning/20 rounded-xl px-4 py-3 text-center" role="alert">
            <p className="text-sm text-warning font-medium">{error}</p>
          </div>
        </section>
      )}

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Results */}
      {result && !loading && (
        <ResultView result={result}>
          <section className="flex justify-center pt-2 pb-4 px-2">
            <ShareButton getShareUrl={getShareUrl} placeName={result.fairest.name} />
          </section>
        </ResultView>
      )}

      <footer className="text-center text-sm text-text-secondary py-6 border-t border-border mt-10">
        HALF·POINT — London, {new Date().getFullYear()}
      </footer>
    </main>
  )
}
