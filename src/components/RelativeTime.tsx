'use client'

import { useEffect, useState } from 'react'

function relative(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years  = Math.floor(days / 365)

  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  if (weeks <  5) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`
  return `${years}y ago`
}

export default function RelativeTime({ date, className }: { date: string; className?: string }) {
  // Start with the absolute date so server and client HTML match (no hydration mismatch)
  const [label, setLabel] = useState(
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  )

  useEffect(() => {
    setLabel(relative(date))
    // Refresh every minute so "just now" → "1m ago" etc.
    const id = setInterval(() => setLabel(relative(date)), 60_000)
    return () => clearInterval(id)
  }, [date])

  return (
    <time dateTime={date} title={new Date(date).toLocaleString()} className={className}>
      {label}
    </time>
  )
}
