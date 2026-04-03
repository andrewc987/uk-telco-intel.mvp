'use client'

import { PersonJourney } from '@/lib/types'

interface JourneyCardProps {
  journey: PersonJourney
  index: number
}

function formatBadge(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function JourneyCard({ journey, index }: JourneyCardProps) {
  const lines = journey.narrative.split('\n')
  // First line is "Starts at X", middle lines are steps, one line contains "Time:"
  const startsLine = lines[0]
  const timeLine = lines.find(l => l.startsWith('Time:'))
  const steps = lines.filter(l => l !== startsLine && !l.startsWith('Time:'))
  // Separate home info from travel steps
  const homeLines = steps.filter(l => l.startsWith('Home:') || l.startsWith('Then ') || l.startsWith('Leave the venue'))
  const travelSteps = steps.filter(l => !homeLines.includes(l))

  return (
    <div
      className="animate-fade-up bg-surface rounded-2xl shadow-card p-4 sm:p-5"
      style={{ animationDelay: `${150 + index * 120}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-text-primary">
          {journey.personName}
        </span>
        <span className="bg-accent text-white text-sm font-semibold px-3 py-0.5 rounded-full">
          {formatBadge(journey.journeyToVenue)}
        </span>
      </div>

      {/* Journey steps */}
      <div className="space-y-1.5 text-sm">
        {startsLine && (
          <p className="text-text-primary font-medium">{startsLine}</p>
        )}
        {travelSteps.map((step, i) => (
          <p key={i} className="text-text-secondary pl-3 border-l-2 border-accent/20">
            {step}
          </p>
        ))}
        {timeLine && (
          <p className="text-text-primary font-medium pt-1">{timeLine}</p>
        )}
      </div>

      {/* Home journey info */}
      {homeLines.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
          {homeLines.map((line, i) => (
            <p key={i} className="text-sm text-text-secondary">{line}</p>
          ))}
        </div>
      )}

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
