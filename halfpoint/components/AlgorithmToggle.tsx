'use client'

import { AlgorithmMode } from '@/lib/types'

interface AlgorithmToggleProps {
  mode: AlgorithmMode
  onChange: (mode: AlgorithmMode) => void
}

const algorithms: { value: AlgorithmMode; label: string; sub: string }[] = [
  { value: 'shortest-total', label: 'Shortest total', sub: 'Most efficient for the group' },
  { value: 'fairest', label: 'Fairest for everyone', sub: 'No one gets screwed' },
  { value: 'full-journey-fairness', label: 'Full journey fairness', sub: 'Including the trip home' },
]

export default function AlgorithmToggle({ mode, onChange }: AlgorithmToggleProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {algorithms.map((algo) => (
        <button
          key={algo.value}
          onClick={() => onChange(algo.value)}
          className={`p-3.5 text-left rounded-xl border-2 transition-all ${
            mode === algo.value
              ? 'border-accent bg-accent-light shadow-sm'
              : 'border-border bg-surface hover:border-accent/30 hover:shadow-card'
          }`}
        >
          <div className={`text-sm font-semibold ${mode === algo.value ? 'text-accent' : 'text-text-primary'}`}>
            {algo.label}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">
            {algo.sub}
          </div>
        </button>
      ))}
    </div>
  )
}
