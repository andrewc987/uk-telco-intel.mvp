import type { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'

// Server wrapper: the app itself is a client component, but a shared result
// URL (?s=...) must emit per-result OG tags, which only a server component can do.

interface SharedResult {
  place: string
  legs: { n: string; m: number }[]
  diff: string
}

function decodeSharedResult(encoded: string): SharedResult | null {
  try {
    const state = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
    const r = state?.r
    if (
      r &&
      typeof r.place === 'string' &&
      typeof r.diff === 'string' &&
      Array.isArray(r.legs)
    ) {
      return r as SharedResult
    }
  } catch {
    // malformed share state — fall back to default metadata
  }
  return null
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { s?: string }
}): Promise<Metadata> {
  const shared = searchParams.s ? decodeSharedResult(searchParams.s) : null
  if (!shared) return {}

  const og = new URLSearchParams()
  og.set('place', shared.place)
  for (const leg of shared.legs.slice(0, 8)) {
    og.append('p', `${leg.n}|${leg.m}`)
  }
  og.set('diff', shared.diff)

  const title = `Meet at ${shared.place}`
  const description = shared.diff

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og?${og.toString()}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/api/og?${og.toString()}`],
    },
  }
}

export default function HomePage() {
  return <HomeClient />
}
