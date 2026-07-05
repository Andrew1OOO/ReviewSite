import Image from 'next/image'
import Link from 'next/link'
import { WrapScore } from '@/lib/types'
import ScoreBadge from './ScoreBadge'

function tierColorVar(tier: WrapScore['tier']): string {
  switch (tier) {
    case 'Drew Approved': return 'var(--tier-approved)'
    case 'Solid':         return 'var(--tier-solid)'
    case 'Mid':           return 'var(--tier-mid)'
    case 'Wall of Shame': return 'var(--tier-shame)'
    default:              return 'var(--gold)'
  }
}

interface WrapCardProps {
  wrap: WrapScore
  rank?: number
}

export default function WrapCard({ wrap, rank }: WrapCardProps) {
  const score = wrap.avg_composite !== null ? wrap.avg_composite.toFixed(1) : null
  const scoreColor = tierColorVar(wrap.tier)

  return (
    <Link
      href={`/wraps/${wrap.id}`}
      className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-border-strong hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-page relative overflow-hidden">
        {wrap.photo_url ? (
          <Image
            src={wrap.photo_url}
            alt={wrap.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 300px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted/40 text-xs tracking-widest uppercase">
            No photo
          </div>
        )}

        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-0.5">
            <span className="font-serif text-xs text-white/70 tabular-nums">#{rank}</span>
          </div>
        )}

        {/* Score overlay */}
        {score && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-xl px-2.5 py-1">
            <span
              className="font-serif text-2xl tabular-nums"
              style={{ color: scoreColor, lineHeight: 1, fontFeatureSettings: '"tnum"' }}
            >
              {score}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-text text-sm leading-snug line-clamp-2 mb-1">
          {wrap.name}
        </h3>
        <p className="text-xs text-text-muted mb-3 truncate">
          {wrap.location_name} · {wrap.location_city}
        </p>
        <div className="flex items-center justify-between">
          {wrap.tier ? (
            <ScoreBadge tier={wrap.tier} size="sm" />
          ) : (
            <span className="text-xs text-text-muted italic">Unscored</span>
          )}
          <span className="text-xs text-text-muted">
            {wrap.review_count} {wrap.review_count === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
    </Link>
  )
}
