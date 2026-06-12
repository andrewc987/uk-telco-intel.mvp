'use client'

import { useState, useEffect, useCallback } from 'react'
import { Person, OptimiseResponse } from '@/lib/types'
import PersonRow from '@/components/PersonRow'
import ShareButton from '@/components/ShareButton'

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
}

function encodeState(state: ShareState): string {
  try { return btoa(JSON.stringify(state)) } catch { return '' }
}

function decodeState(encoded: string): ShareState | null {
  try { return JSON.parse(atob(encoded)) } catch { return null }
}

export default function HomePage() {
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
      }
    }
  }, [])

  const getShareUrl = useCallback(() => {
    const encoded = encodeState({ people })
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}?s=${encoded}`
  }, [people])

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

  const handleOptimise = async () => {
    setError(null)

    const resolved = people.filter((p) => p.fromLatLng)
    if (resolved.length < 2) {
      setError('Pick a starting point from the suggestions for at least two people.')
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
        setError(data?.error || 'Something went wrong.')
        return
      }

      const data: OptimiseResponse = await res.json()
      setResult(data)
    } catch {
      setError("Couldn't find a fair spot. Try different locations.")
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
            + Add a person
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
          {loading ? 'Working it out…' : 'Find somewhere fair'}
        </button>
      </section>

      {/* Error */}
      {error && (
        <section className="animate-fade-up mb-8">
          <div className="bg-warning/8 border border-warning/20 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-warning font-medium">{error}</p>
          </div>
        </section>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5">
          <section className="text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-3">
              {result.fairest.name}
            </h2>
            <p className="text-base text-text-secondary max-w-md mx-auto">{result.diff}</p>
          </section>

          <section className="space-y-2.5">
            {result.fairest.legs.map((leg) => (
              <div key={leg.personId} className="bg-surface rounded-2xl shadow-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">{leg.personName}</p>
                  <p className="text-sm text-text-secondary">{leg.ok ? leg.route : "Couldn't plan this leg"}</p>
                </div>
                {leg.ok && (
                  <span className="bg-accent text-white text-sm font-semibold px-3 py-0.5 rounded-full">
                    {leg.minutes} min
                  </span>
                )}
              </div>
            ))}
          </section>

          <section className="flex justify-center pt-4 pb-6">
            <ShareButton getShareUrl={getShareUrl} />
          </section>
        </div>
      )}

      <footer className="text-center text-sm text-text-secondary/50 py-6 border-t border-border mt-10">
        HALF·POINT — London, {new Date().getFullYear()}
      </footer>
    </main>
  )
}
