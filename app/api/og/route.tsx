import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Dynamic OG card for a shared result. Matches the app's light Apple-style
// palette (globals.css / tailwind.config): #FAFAFA bg, #1D1D1F text,
// #86868B secondary, #007AFF accent, system sans.

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const place = params.get('place') || 'Somewhere fair'
  const diff = params.get('diff') || ''
  const people = params
    .getAll('p')
    .map((pair) => {
      const i = pair.lastIndexOf('|')
      if (i < 1) return null
      const minutes = parseInt(pair.slice(i + 1), 10)
      const name = pair.slice(0, i).trim()
      if (!name || !Number.isFinite(minutes)) return null
      return { name, minutes }
    })
    .filter((p): p is { name: string; minutes: number } => p !== null)
    .slice(0, 8)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAFAFA',
          padding: '64px 72px',
          fontFamily:
            '-apple-system, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            color: '#1D1D1F',
          }}
        >
          HALF<span style={{ color: '#007AFF', margin: '0 2px' }}>·</span>POINT
        </div>

        {/* Place */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: '#86868B',
              marginBottom: 14,
            }}
          >
            Meet at
          </div>
          <div
            style={{
              fontSize: place.length > 16 ? 76 : 96,
              fontWeight: 700,
              letterSpacing: -2,
              color: '#1D1D1F',
              lineHeight: 1.05,
            }}
          >
            {place}
          </div>

          {/* Per-person times */}
          {people.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 36,
              }}
            >
              {people.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E5E5',
                    borderRadius: 999,
                    padding: '10px 22px',
                    fontSize: 26,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#1D1D1F' }}>{p.name}</span>
                  <span style={{ color: '#007AFF', fontWeight: 700, marginLeft: 12 }}>
                    {p.minutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diff sentence */}
        {diff && (
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#86868B',
              lineHeight: 1.4,
            }}
          >
            {diff.length > 140 ? `${diff.slice(0, 137)}…` : diff}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
