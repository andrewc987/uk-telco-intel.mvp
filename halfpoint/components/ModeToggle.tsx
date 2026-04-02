'use client'

import { AppMode } from '@/lib/types'

interface ModeToggleProps {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

const modes: { value: AppMode; label: string }[] = [
  { value: 'where-to-meet', label: 'Where should we meet?' },
  { value: 'how-long-can-we-stay', label: 'How long can we stay?' },
]

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex border border-border">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex-1 py-2.5 px-3 text-xs sm:text-sm transition-colors ${
            mode === m.value
              ? 'bg-accent text-bg font-medium'
              : 'bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
