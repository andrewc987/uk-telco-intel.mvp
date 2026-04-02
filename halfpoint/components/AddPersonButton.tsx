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
      className={`w-full border border-dashed border-border py-3 text-sm transition-colors ${
        disabled
          ? 'text-text-secondary/50 cursor-not-allowed'
          : 'text-text-secondary hover:text-accent hover:border-accent'
      }`}
    >
      + Add another person
    </button>
  )
}
