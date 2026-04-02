'use client'

import { useState } from 'react'

interface ShareButtonProps {
  getShareUrl: () => string
}

export default function ShareButton({ getShareUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="btn-lift bg-surface border border-border px-4 py-2.5 text-sm text-text-primary hover:border-accent transition-colors"
    >
      {copied ? 'Copied. Send it in the group chat.' : 'Copy link'}
    </button>
  )
}
