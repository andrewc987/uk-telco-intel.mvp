'use client'

import { Result } from '@/lib/types'

interface ResultCardProps {
  result: Result
}

export default function ResultCard({ result }: ResultCardProps) {
  return (
    <div className="animate-fade-up reveal-1 text-center mb-2">
      {/* Headline — the area name */}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-3">
        {result.headline}
      </h2>

      {/* Summary sentence */}
      <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-md mx-auto">
        {result.summary}
      </p>
    </div>
  )
}
