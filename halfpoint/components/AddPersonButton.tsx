'use client'

interface AddPersonButtonProps {
  onClick: () => void
  disabled: boolean
}

export default function AddPersonButton({ onClick, disabled }: AddPersonButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full border-2 border-dashed rounded-2xl py-3.5 text-sm font-medium transition-all ${
        disabled
          ? 'border-border/50 text-text-secondary/40 cursor-not-allowed'
          : 'border-border text-text-secondary hover:text-accent hover:border-accent hover:bg-accent-light/50'
      }`}
    >
      + Add another person
    </button>
  )
}
