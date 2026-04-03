'use client'

interface WhyHereProps {
  lines: string[]
}

export default function WhyHere({ lines }: WhyHereProps) {
  return (
    <div className="animate-fade-up reveal-3 bg-surface rounded-2xl shadow-card p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Why here?</h3>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-text-secondary leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
