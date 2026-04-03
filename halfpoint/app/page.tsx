'use client'

import { useState, useEffect, useCallback } from 'react'
import { Person, Result } from '@/lib/types'
import PersonCard from '@/components/PersonCard'
import AddPersonButton from '@/components/AddPersonButton'
import ResultCard from '@/components/ResultCard'
import JourneyCard from '@/components/JourneyCard'
import WhyHere from '@/components/WhyHere'
import VenueCard from '@/components/VenueCard'
import ShareButton from '@/components/ShareButton'

function createPerson(index: number): Person {
  return {
    id: `person-${Date.now()}-${index}`,
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
  const [people, setPeople] = useState<Person[]>([createPerson(0), createPerson(1)])
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const s = params.get('s')
    if (s) {
      const decoded = decodeState(s)
      if (decoded) setPeople(decoded.people)
    }
  }, [])

  const getShareUrl = useCallback(() => {
    const encoded = encodeState({ people })
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}?s=${encoded}`
  }, [people])

  const addPerson = () => {
    if (people.length < 8) setPeople([...people, createPerson(people.length)])
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
      const validPeople = people.filter((p) => p.fromLatLng)
      if (validPeople.length < 2) {
        setError('Pick a location from the dropdown for at least 2 people.')
        setLoading(false)
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
      setError("Couldn't find a fair spot. Try different locations.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero */}
      <header className="animate-fade-up stagger-1 mb-10 sm:mb-12 text-center">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-3 text-text-primary">
          HALF<span className="text-accent">·</span>POINT
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary">
          The fairest place to meet in London.
        </p>
      </header>

      {/* People Input */}
      <section className="animate-fade-up stagger-2 space-y-3 mb-6">
        {people.map((person, i) => (
          <PersonCard
            key={person.id}
            person={person}
            index={i}
            onUpdate={(updated) => updatePerson(i, updated)}
            onRemove={() => removePerson(i)}
            canRemove={people.length > 2}
          />
        ))}
        <AddPersonButton onClick={addPerson} disabled={people.length >= 8} />
      </section>

      {/* CTA */}
      <section className="animate-fade-up stagger-3 mb-12">
        <button
          onClick={handleOptimise}
          disabled={loading}
          className="btn-lift w-full bg-accent text-white py-4 rounded-2xl text-base font-semibold transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Finding somewhere fair...' : 'Find somewhere fair'}
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

      {/* Results — the briefing */}
      {result && (
        <div className="space-y-5">
          {/* Headline + summary */}
          <section>
            <ResultCard result={result} />
          </section>

          {/* Journey breakdown */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 animate-fade-up reveal-2">
              The journey for everyone
            </h3>
            <div className="space-y-2.5">
              {result.recommended.journeys.map((journey, i) => (
                <JourneyCard key={journey.personId} journey={journey} index={i} />
              ))}
            </div>
          </section>

          {/* Why here */}
          <section>
            <WhyHere lines={result.whyHere} />
          </section>

          {/* Venues */}
          {result.venues.length > 0 && (
            <section className="animate-fade-up reveal-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Nearby
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.venues.slice(0, 3).map((venue, i) => (
                  <VenueCard key={venue.googlePlacesId} venue={venue} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Share */}
          <section className="animate-fade-up reveal-5 flex justify-center pt-4 pb-6">
            <ShareButton getShareUrl={getShareUrl} />
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-text-secondary/50 py-6 border-t border-border mt-10">
        HALF·POINT — London, {new Date().getFullYear()}
      </footer>
    </main>
  )
}
