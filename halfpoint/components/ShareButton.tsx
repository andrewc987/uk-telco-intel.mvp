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
      className={`btn-lift px-6 py-3 rounded-full text-sm font-medium transition-all ${
        copied
          ? 'bg-success text-white'
          : 'bg-accent text-white hover:bg-accent/90'
      }`}
    >
      {copied ? 'Copied. Send it in the group chat.' : 'Copy link'}
    </button>
  )
}
