import { LocationScore } from '@/lib/types'
import React from 'react'

type Tier = LocationScore['tier']

const tierConfig: Record<NonNullable<Tier>, { label: string; style: React.CSSProperties }> = {
  'Must Try': {
    label: 'Must Try',
    style: {
      background: 'color-mix(in srgb, var(--tier-approved) 12%, transparent)',
      color: 'var(--tier-approved)',
      borderColor: 'color-mix(in srgb, var(--tier-approved) 25%, transparent)',
    },
  },
  Solid: {
    label: 'Solid',
    style: {
      background: 'color-mix(in srgb, var(--tier-solid) 12%, transparent)',
      color: 'var(--tier-solid)',
      borderColor: 'color-mix(in srgb, var(--tier-solid) 25%, transparent)',
    },
  },
  Mid: {
    label: 'Mid',
    style: {
      background: 'color-mix(in srgb, var(--tier-mid) 12%, transparent)',
      color: 'var(--tier-mid)',
      borderColor: 'color-mix(in srgb, var(--tier-mid) 25%, transparent)',
    },
  },
  'Skip It': {
    label: 'Skip It',
    style: {
      background: 'color-mix(in srgb, var(--tier-shame) 12%, transparent)',
      color: 'var(--tier-shame)',
      borderColor: 'color-mix(in srgb, var(--tier-shame) 25%, transparent)',
    },
  },
}

interface ScoreBadgeProps {
  tier: Tier
  size?: 'sm' | 'md'
}

export default function ScoreBadge({ tier, size = 'md' }: ScoreBadgeProps) {
  if (!tier) return null
  const config = tierConfig[tier]
  if (!config) return null
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 tracking-wide'
    : 'text-sm px-3 py-1 tracking-wide'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium uppercase ${sizeClasses}`}
      style={config.style}
    >
      {config.label}
    </span>
  )
}
