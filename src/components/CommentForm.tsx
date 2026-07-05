'use client'

import { useState } from 'react'
import { addComment } from '@/lib/actions/comments'

export default function CommentForm({ locationId }: { locationId: string }) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const fd = new FormData()
    fd.set('locationId', locationId)
    fd.set('body', body)
    const result = await addComment(fd)
    setSubmitting(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setBody('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Leave a comment…"
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !body.trim()}
        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  )
}
