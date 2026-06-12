'use client'

import { useState } from 'react'

interface ShareButtonProps {
  getShareUrl: () => string
  placeName?: string
}

export default function ShareButton({ getShareUrl, placeName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShare = async () => {
    const url = getShareUrl()
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: placeName ? `Meet at ${placeName}` : 'HALF·POINT',
          url,
        })
        return
      } catch (err) {
        // User dismissed the sheet — do nothing. Anything else: copy instead.
        if ((err as Error)?.name === 'AbortError') return
      }
    }
    await copy(url)
  }

  return (
    <button
      onClick={handleShare}
      className={`btn-lift w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-sm ${
        copied ? 'bg-success text-white' : 'bg-accent text-white hover:bg-accent/90'
      }`}
    >
      {copied ? 'Copied. Their problem now.' : 'Send it to the group chat'}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  )
}
