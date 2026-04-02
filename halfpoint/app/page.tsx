'use client'

import { useState, useEffect, useCallback } from 'react'
import { Person, AppMode, AlgorithmMode, Result, Candidate } from '@/lib/types'
import PersonCard from '@/components/PersonCard'
import AddPersonButton from '@/components/AddPersonButton'
import ModeToggle from '@/components/ModeToggle'
import AlgorithmToggle from '@/components/AlgorithmToggle'
import ResultCard from '@/components/ResultCard'
import JourneyCard from '@/components/JourneyCard'
import VenueCard from '@/components/VenueCard'
import ShareButton from '@/components/ShareButton'

function createPerson(index: number): Person {
  return {
    id: `person-${Date.now()}-${index}`,
    name: '',
    fromPostcode: '',
    homePostcode: '',
    travelMode: 'tube',
  }
}

interface AppState {
  people: Person[]
  appMode: AppMode
  algorithmMode: AlgorithmMode
}

function encodeState(state: AppState): string {
  try {
    return btoa(JSON.stringify(state))
  } catch {
    return ''
  }
}

function decodeState(encoded: string): AppState | null {
  try {
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

export default function HomePage() {
  const [people, setPeople] = useState<Person[]>([createPerson(0), createPerson(1)])
  const [appMode, setAppMode] = useState<AppMode>('where-to-meet')
  const [algorithmMode, setAlgorithmMode] = useState<AlgorithmMode>('fairest')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Decode URL state on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('s')
    if (s) {
      const decoded = decodeState(s)
      if (decoded) {
        setPeople(decoded.people)
        setAppMode(decoded.appMode)
        setAlgorithmMode(decoded.algorithmMode)
      }
    }
  }, [])

  const getShareUrl = useCallback(() => {
    const state: AppState = { people, appMode, algorithmMode }
    const encoded = encodeState(state)
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}?s=${encoded}`
  }, [people, appMode, algorithmMode])

  const addPerson = () => {
    if (people.length < 8) {
      setPeople([...people, createPerson(people.length)])
    }
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
    setResult(null)
    setLoading(true)

    try {
      const validPeople = people.filter((p) => p.fromPostcode.trim())
      if (validPeople.length < 2) {
        setError('Need at least 2 people with postcodes.')
        return
      }

      const res = await fetch('/api/optimise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: validPeople }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong.')
        return
      }

      const data: Result = await res.json()
      setResult(data)
    } catch {
      setError("Couldn't find a fair spot. Try adjusting postcodes.")
    } finally {
      setLoading(false)
    }
  }

  const activeWinner: Candidate | null = result
    ? algorithmMode === 'shortest-total'
      ? result.shortestTotalWinner
      : algorithmMode === 'fairest'
        ? result.fairestWinner
        : result.fullJourneyWinner
    : null

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Hero */}
      <header className="animate-fade-up stagger-1 mb-12 sm:mb-16">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-wide mb-3">
          HALF<span className="text-accent">·</span>POINT
        </h1>
        <p className="font-display text-lg sm:text-xl text-text-secondary">
          The fairest place to meet in London.
        </p>
        <p className="text-xs text-text-secondary mt-2 tracking-wider">
          Multi-person. Multi-modal. Last-train-aware.
        </p>
      </header>

      {/* Mode Toggle */}
      <section className="animate-fade-up stagger-2 mb-6">
        <ModeToggle mode={appMode} onChange={setAppMode} />
      </section>

      {/* People Input */}
      <section className="animate-fade-up stagger-3 space-y-3 mb-6">
        {people.map((person, i) => (
          <PersonCard
            key={person.id}
            person={person}
            index={i}
            showHomePostcode={appMode === 'how-long-can-we-stay'}
            onUpdate={(updated) => updatePerson(i, updated)}
            onRemove={() => removePerson(i)}
            canRemove={people.length > 2}
          />
        ))}
        <AddPersonButton onClick={addPerson} disabled={people.length >= 8} />
      </section>

      {/* Algorithm Selector */}
      <section className="animate-fade-up stagger-4 mb-8">
        <AlgorithmToggle mode={algorithmMode} onChange={setAlgorithmMode} />
      </section>

      {/* CTA */}
      <section className="animate-fade-up stagger-5 mb-12">
        <button
          onClick={handleOptimise}
          disabled={loading}
          className="btn-lift w-full bg-accent text-bg py-3.5 text-sm font-medium tracking-wider uppercase transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Finding somewhere fair...' : 'Find somewhere fair'}
        </button>
      </section>

      {/* Error */}
      {error && (
        <section className="animate-fade-up mb-8">
          <p className="text-sm text-warning text-center">{error}</p>
        </section>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Diff Sentence & Winner */}
          <section>
            <ResultCard result={result} algorithmMode={algorithmMode} />
          </section>

          {/* Journey Cards */}
          <section>
            <h2 className="text-xs text-text-secondary tracking-widest uppercase mb-3 animate-fade-up reveal-2">
              Journey breakdown
            </h2>
            <div className="space-y-2">
              {activeWinner?.journeys.map((journey, i) => (
                <JourneyCard key={journey.personId} journey={journey} index={i} />
              ))}
            </div>
          </section>

          {/* Venue Suggestions */}
          {result.venues.length > 0 && (
            <section className="animate-fade-up reveal-4">
              <h2 className="text-xs text-text-secondary tracking-widest uppercase mb-3">
                Nearby
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.venues.slice(0, 5).map((venue, i) => (
                  <VenueCard key={venue.googlePlacesId} venue={venue} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Share */}
          <section className="animate-fade-up reveal-5 flex justify-center pt-4 pb-8">
            <ShareButton getShareUrl={getShareUrl} />
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-text-secondary/50 py-8 border-t border-border mt-12">
        HALF·POINT — London, {new Date().getFullYear()}
      </footer>
    </main>
  )
}
