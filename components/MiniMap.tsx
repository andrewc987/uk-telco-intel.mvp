'use client'

import { LatLng } from '@/lib/types'

interface MiniMapProps {
  origins: { name: string; latLng: LatLng }[]
  destination: { name: string; latLng: LatLng }
}

const W = 320
const H = 190
const PAD_X = 34
const PAD_Y = 30

export default function MiniMap({ origins, destination }: MiniMapProps) {
  const points = [...origins.map((o) => o.latLng), destination.latLng]
  const minLat = Math.min(...points.map((p) => p.lat))
  const maxLat = Math.max(...points.map((p) => p.lat))
  const minLng = Math.min(...points.map((p) => p.lng))
  const maxLng = Math.max(...points.map((p) => p.lng))

  // Uniform scale with a cos(lat) correction so geometry isn't squashed,
  // and a minimum span so a tight two-person group doesn't zoom to nothing.
  const midLat = (minLat + maxLat) / 2
  const lngFactor = Math.cos((midLat * Math.PI) / 180)
  const latSpan = Math.max(maxLat - minLat, 0.02)
  const lngSpan = Math.max((maxLng - minLng) * lngFactor, 0.02)
  const scale = Math.min((W - PAD_X * 2) / lngSpan, (H - PAD_Y * 2) / latSpan)

  const cx = (minLng + maxLng) / 2
  const cy = midLat
  const x = (p: LatLng) => W / 2 + (p.lng - cx) * lngFactor * scale
  const y = (p: LatLng) => H / 2 + (cy - p.lat) * scale

  const dx = x(destination.latLng)
  const dy = y(destination.latLng)

  // Label placement with collision basics: labels default above the dot,
  // flip below when they'd sit on top of an earlier label or the winner's.
  const clampX = (v: number) => Math.min(Math.max(v, 26), W - 26)
  const placed: { x: number; y: number }[] = [{ x: clampX(dx), y: dy + 18 }]
  const originLabels = origins.map((o) => {
    const ox = x(o.latLng)
    const oy = y(o.latLng)
    let lx = clampX(ox)
    let ly = oy - 8
    const collides = (px: number, py: number) =>
      placed.some((p) => Math.abs(p.x - px) < 52 && Math.abs(p.y - py) < 12)
    if (collides(lx, ly) || ly < 10) ly = oy + 14
    if (collides(lx, ly)) ly = oy + 26
    placed.push({ x: lx, y: ly })
    return { ox, oy, lx, ly, name: o.name }
  })

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Map: everyone converging on ${destination.name}`}
      className="w-full h-auto rounded-2xl bg-surface shadow-card"
    >
      {originLabels.map((o, i) => (
        <line
          key={`l-${i}`}
          className="map-fade"
          style={{ animationDelay: `${250 + i * 110}ms` }}
          x1={o.ox}
          y1={o.oy}
          x2={dx}
          y2={dy}
          stroke="#DBDBDE"
          strokeWidth={1.5}
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      ))}
      {originLabels.map((o, i) => (
        <g key={`o-${i}`} className="map-fade" style={{ animationDelay: `${120 + i * 110}ms` }}>
          <circle cx={o.ox} cy={o.oy} r={4.5} fill="#6E6E73" />
          <circle cx={o.ox} cy={o.oy} r={4.5} fill="none" stroke="#FFFFFF" strokeWidth={1.25} />
          <text
            x={o.lx}
            y={o.ly}
            textAnchor="middle"
            fontSize={9.5}
            fill="#6E6E73"
            fontFamily="-apple-system, system-ui, sans-serif"
          >
            {o.name}
          </text>
        </g>
      ))}
      <g className="map-winner" style={{ animationDelay: `${360 + origins.length * 110}ms` }}>
        <circle cx={dx} cy={dy} r={11} fill="#0066CC" opacity={0.12} />
        <circle cx={dx} cy={dy} r={7} fill="#0066CC" opacity={0.18} />
        <circle cx={dx} cy={dy} r={5.5} fill="#0066CC" stroke="#FFFFFF" strokeWidth={1.5} />
        <text
          x={clampX(dx)}
          y={dy + 19}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={600}
          fill="#1D1D1F"
          fontFamily="-apple-system, system-ui, sans-serif"
        >
          {destination.name}
        </text>
      </g>
    </svg>
  )
}
