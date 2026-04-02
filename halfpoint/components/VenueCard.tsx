'use client'

import { Venue } from '@/lib/types'

interface VenueCardProps {
  venue: Venue
  index: number
}

export default function VenueCard({ venue, index }: VenueCardProps) {
  const typeLabel = venue.type === 'pub' ? 'Pub' : venue.type === 'bar' ? 'Bar' : 'Restaurant'

  return (
    <div
      className="animate-fade-up bg-surface border border-border p-4"
      style={{ animationDelay: `${600 + index * 200}ms` }}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-medium text-text-primary">{venue.name}</h3>
        {venue.rating > 0 && (
          <span className="text-xs text-accent font-medium ml-2 shrink-0">
            {venue.rating.toFixed(1)} ★
          </span>
        )}
      </div>

      <div className="flex gap-2 text-xs text-text-secondary">
        <span>{typeLabel}</span>
        <span>·</span>
        <span>{venue.walkingMinutes} min walk</span>
      </div>

      {venue.address && (
        <p className="text-xs text-text-secondary mt-1">{venue.address}</p>
      )}

      <a
        href={`https://www.google.com/maps/place/?q=place_id:${venue.googlePlacesId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-xs text-accent hover:underline"
      >
        View on Google Maps ↗
      </a>
    </div>
  )
}
