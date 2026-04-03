'use client'

import { PersonJourney } from '@/lib/types'

interface JourneyCardProps {
  journey: PersonJourney
  index: number
}

export default function JourneyCard({ journey, index }: JourneyCardProps) {
  const routeLines = journey.narrative.split('\n')

  return (
    <div
      className="animate-fade-up bg-surface rounded-2xl shadow-card p-4 sm:p-5"
      style={{ animationDelay: `${150 + index * 120}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-text-primary">
          {journey.personName}
        </span>
        <span className="bg-accent text-white text-sm font-semibold px-3 py-0.5 rounded-full">
          {journey.journeyToVenue} min
        </span>
      </div>

      {/* Route narrative */}
      <div className="space-y-1">
        {routeLines.map((line, i) => (
          <p key={i} className={`text-sm leading-relaxed ${i === 0 ? 'text-text-secondary' : 'text-text-secondary/80'}`}>
            {line}
          </p>
        ))}
      </div>

      {/* Last train warning */}
      {journey.lastTrainWarning && (
        <div className="mt-3 px-3 py-2 bg-warning/8 border border-warning/20 rounded-xl">
          <p className="text-sm text-warning font-medium">
            {journey.lastTrainWarning}
          </p>
        </div>
      )}
    </div>
  )
}
