'use client'

import { Result, AlgorithmMode, Candidate } from '@/lib/types'

interface ResultCardProps {
  result: Result
  algorithmMode: AlgorithmMode
}

export default function ResultCard({ result, algorithmMode }: ResultCardProps) {
  const winner: Candidate =
    algorithmMode === 'shortest-total'
      ? result.shortestTotalWinner
      : algorithmMode === 'fairest'
        ? result.fairestWinner
        : result.fullJourneyWinner

  return (
    <div className="animate-fade-up reveal-1">
      <p className="font-display text-2xl sm:text-3xl md:text-4xl leading-tight text-text-primary mb-6">
        {result.diffSentence}
      </p>

      <div className="bg-surface rounded-2xl border-2 border-accent/20 p-6 shadow-card">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2">
          Best match
        </p>
        <p className="font-display text-2xl sm:text-3xl text-accent font-bold">
          {winner.stationName}
        </p>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-text-secondary">
          <span className="bg-bg rounded-full px-3 py-1">
            Total: <span className="text-text-primary font-medium">{winner.scores.shortestTotal} min</span>
          </span>
          <span className="bg-bg rounded-full px-3 py-1">
            Worst: <span className="text-text-primary font-medium">{winner.scores.fairest} min</span>
          </span>
          {winner.scores.fullJourneyFairness > 0 && (
            <span className="bg-bg rounded-full px-3 py-1">
              Worst evening: <span className="text-text-primary font-medium">{winner.scores.fullJourneyFairness} min</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
