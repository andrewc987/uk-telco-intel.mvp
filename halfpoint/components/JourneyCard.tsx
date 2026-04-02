'use client'

import { PersonJourney } from '@/lib/types'

interface JourneyCardProps {
  journey: PersonJourney
  index: number
}

export default function JourneyCard({ journey, index }: JourneyCardProps) {
  return (
    <div
      className="animate-fade-up bg-surface rounded-2xl shadow-card p-5"
      style={{ animationDelay: `${200 + index * 150}ms` }}
    >
      {/* Narrative first */}
      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {journey.narrative}
      </p>

      {/* Time pill */}
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-accent-light text-accent font-semibold text-sm px-3 py-1 rounded-full">
          {journey.journeyToVenue} min to venue
        </span>
        {journey.journeyHome > 0 && (
          <span className="bg-bg text-text-secondary text-sm px-3 py-1 rounded-full">
            {journey.journeyHome} min home
          </span>
        )}
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
