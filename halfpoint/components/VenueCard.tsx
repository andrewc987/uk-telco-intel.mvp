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
      className="animate-fade-up bg-surface rounded-2xl shadow-card p-4 hover:shadow-card-hover transition-shadow"
      style={{ animationDelay: `${600 + index * 150}ms` }}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="text-sm font-semibold text-text-primary">{venue.name}</h3>
        {venue.rating > 0 && (
          <span className="text-xs bg-accent-light text-accent font-semibold ml-2 shrink-0 px-2 py-0.5 rounded-full">
            {venue.rating.toFixed(1)} ★
          </span>
        )}
      </div>

      <div className="flex gap-2 text-xs text-text-secondary">
        <span className="bg-bg rounded-full px-2 py-0.5">{typeLabel}</span>
        <span className="bg-bg rounded-full px-2 py-0.5">{venue.walkingMinutes} min walk</span>
      </div>

      {venue.address && (
        <p className="text-xs text-text-secondary mt-2">{venue.address}</p>
      )}

      <a
        href={`https://www.google.com/maps/place/?q=place_id:${venue.googlePlacesId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2.5 text-sm text-accent font-medium hover:underline"
      >
        View on Google Maps ↗
      </a>
    </div>
  )
}
