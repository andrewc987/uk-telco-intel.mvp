'use client'

import { PersonJourney } from '@/lib/types'

interface JourneyCardProps {
  journey: PersonJourney
  index: number
}

export default function JourneyCard({ journey, index }: JourneyCardProps) {
  return (
    <div
      className="animate-fade-up bg-surface border border-border p-4"
      style={{ animationDelay: `${200 + index * 200}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">
          {journey.personName}
        </span>
        <span className="text-sm text-accent font-medium">
          {journey.journeyToVenue} min
        </span>
      </div>

      <p className="text-xs text-text-secondary mb-2">
        {journey.route}
      </p>

      {journey.journeyHome > 0 && (
        <p className="text-xs text-text-secondary">
          Journey home: <span className="text-text-primary">{journey.journeyHome} min</span>
          {' · '}Total evening: <span className="text-text-primary">{journey.totalEvening} min</span>
        </p>
      )}

      {journey.lastTrainWarning && (
        <div className="mt-2 px-2 py-1.5 bg-warning/10 border border-warning/20">
          <p className="text-xs text-warning font-medium">
            {journey.lastTrainWarning}
          </p>
        </div>
      )}
    </div>
  )
}
