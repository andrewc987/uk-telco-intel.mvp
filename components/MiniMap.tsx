'use client'

import { LatLng } from '@/lib/types'

interface MiniMapProps {
  origins: { name: string; latLng: LatLng }[]
  destination: { name: string; latLng: LatLng }
}

const W = 320
const H = 180
const PAD = 28

export default function MiniMap({ origins, destination }: MiniMapProps) {
  const points = [...origins.map((o) => o.latLng), destination.latLng]
  const minLat = Math.min(...points.map((p) => p.lat))
  const maxLat = Math.max(...points.map((p) => p.lat))
  const minLng = Math.min(...points.map((p) => p.lng))
  const maxLng = Math.max(...points.map((p) => p.lng))
  const latRange = Math.max(maxLat - minLat, 0.01)
  const lngRange = Math.max(maxLng - minLng, 0.01)

  const x = (p: LatLng) => PAD + ((p.lng - minLng) / lngRange) * (W - PAD * 2)
  const y = (p: LatLng) => PAD + ((maxLat - p.lat) / latRange) * (H - PAD * 2)

  const dx = x(destination.latLng)
  const dy = y(destination.latLng)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Map: everyone converging on ${destination.name}`}
      className="w-full h-auto rounded-2xl bg-surface shadow-card"
    >
      {origins.map((o, i) => (
        <line
          key={`l-${i}`}
          x1={x(o.latLng)}
          y1={y(o.latLng)}
          x2={dx}
          y2={dy}
          stroke="#E5E5E5"
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
      ))}
      {origins.map((o, i) => (
        <g key={`o-${i}`}>
          <circle cx={x(o.latLng)} cy={y(o.latLng)} r={4.5} fill="#86868B" />
          <text
            x={x(o.latLng)}
            y={y(o.latLng) - 8}
            textAnchor="middle"
            fontSize={9.5}
            fill="#86868B"
            fontFamily="-apple-system, system-ui, sans-serif"
          >
            {o.name}
          </text>
        </g>
      ))}
      <circle cx={dx} cy={dy} r={10} fill="#007AFF" opacity={0.15} />
      <circle cx={dx} cy={dy} r={5.5} fill="#007AFF" />
      <text
        x={dx}
        y={dy + 18}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight={600}
        fill="#1D1D1F"
        fontFamily="-apple-system, system-ui, sans-serif"
      >
        {destination.name}
      </text>
    </svg>
  )
}
