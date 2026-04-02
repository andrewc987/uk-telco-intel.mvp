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

      <div className="bg-surface border border-accent/30 p-5">
        <p className="text-xs text-text-secondary tracking-widest uppercase mb-2">
          Best match
        </p>
        <p className="font-display text-xl sm:text-2xl text-accent">
          {winner.stationName}
        </p>
        <div className="flex gap-4 mt-3 text-xs text-text-secondary">
          <span>
            Total: <span className="text-text-primary">{winner.scores.shortestTotal} min</span>
          </span>
          <span>
            Worst individual: <span className="text-text-primary">{winner.scores.fairest} min</span>
          </span>
          {winner.scores.fullJourneyFairness > 0 && (
            <span>
              Worst evening: <span className="text-text-primary">{winner.scores.fullJourneyFairness} min</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
