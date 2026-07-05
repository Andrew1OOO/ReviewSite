'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ScoreBadge from '@/components/ScoreBadge'
import type { LocationScore } from '@/lib/types'

interface RankingsFilterProps {
  locations: LocationScore[]
  rankOffset: number
}

export default function RankingsFilter({ locations, rankOffset }: RankingsFilterProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return locations
    return locations.filter(
      (l) =>
        l.location_name.toLowerCase().includes(q) ||
        l.location_city.toLowerCase().includes(q)
    )
  }, [query, locations])

  return (
    <>
      <div className="mb-5">
        <input
          type="search"
          placeholder="Filter by name or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted py-8 text-center">No spots match &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((loc) => {
            // When filtering, use original rank from the full list
            const globalIndex = locations.indexOf(loc)
            const rank = query ? null : rankOffset + globalIndex + 1
            return (
              <Link
                key={loc.id}
                href={`/locations/${loc.id}`}
                className="feed-item card-hover flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border-strong group"
              >
                <span className="font-serif text-lg text-text-muted w-7 text-center shrink-0 tabular-nums">
                  {rank ?? '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text text-sm truncate group-hover:text-accent transition-colors">
                    {loc.location_name}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {loc.location_city}
                    {loc.is_chain && ' · Chain'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {loc.tier && <ScoreBadge tier={loc.tier} size="sm" />}
                  <div className="text-right">
                    <span className="score-display text-2xl">
                      {loc.avg_composite !== null ? loc.avg_composite.toFixed(1) : '—'}
                    </span>
                    <p className="text-xs text-text-muted">
                      {loc.review_count} {loc.review_count === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
