'use client'

import { useState } from 'react'
import type { RubricAxis } from '@/lib/types'
import { computeComposite, defaultScores, emptyNotes, type AxisScores, type AxisNotes } from '@/lib/reviewAxes'
import { appendReviewBody, type EditorPhoto } from '@/lib/reviewBody'
import AxisSlider from '@/components/AxisSlider'
import BlockEditor from '@/components/BlockEditor'

interface ReviewFormProps {
  wrapId: string
  wrapName: string
  axes: RubricAxis[]
  action: (formData: FormData) => Promise<{ error?: string } | void>
  initialValues?: {
    reviewId?: string
    scores: AxisScores
    notes: AxisNotes
    bodyText: string
    photos: EditorPhoto[]
  }
  submitLabel?: string
}

export default function ReviewForm({
  wrapId,
  wrapName,
  axes,
  action,
  initialValues,
  submitLabel = 'Submit review',
}: ReviewFormProps) {
  const [scores, setScores] = useState<AxisScores>(initialValues?.scores ?? defaultScores(axes))
  const [notes, setNotes] = useState<AxisNotes>(initialValues?.notes ?? emptyNotes(axes))
  const [bodyText, setBodyText] = useState(initialValues?.bodyText ?? '')
  const [photos, setPhotos] = useState<EditorPhoto[]>(initialValues?.photos ?? [])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const composite = computeComposite(axes, scores).toFixed(1)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const fd = new FormData()
    fd.set('locationId', wrapId)
    if (initialValues?.reviewId) fd.set('reviewId', initialValues.reviewId)

    // Per-axis scores and notes
    for (const axis of axes) {
      fd.set(`score_${axis.id}`, (scores[axis.id] ?? 5).toString())
      fd.set(`note_${axis.id}`, notes[axis.id] ?? '')
    }

    appendReviewBody(fd, { bodyText, photos })

    const result = await action(fd)
    if (result && 'error' in result && result.error) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="bg-card border border-border rounded-xl p-4 text-sm text-text-muted">
        Reviewing: <span className="font-medium text-text">{wrapName}</span>
      </div>

      {/* Scores */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl">Rating</h2>
          <div className="text-right">
            <span className="text-xs text-text-muted block mb-0.5">Composite</span>
            <span className="score-display text-4xl">{composite}</span>
          </div>
        </div>
        <div className="space-y-6">
          {axes.map((axis) => (
            <AxisSlider
              key={axis.id}
              name={axis.id}
              label={axis.label}
              description={axis.description ?? undefined}
              value={scores[axis.id] ?? 5}
              onChange={(v) => setScores((prev) => ({ ...prev, [axis.id]: v }))}
              note={notes[axis.id] ?? ''}
              onNoteChange={(n) => setNotes((prev) => ({ ...prev, [axis.id]: n }))}
            />
          ))}
        </div>
      </section>

      {/* Body */}
      <section>
        <h2 className="font-serif text-xl mb-2">Review</h2>
        <p className="text-sm text-text-muted mb-4">
          Add photos in the panel on the right, then reference them in your text with{' '}
          <code className="text-xs bg-border/60 px-1 py-0.5 rounded font-mono">[photo:1]</code>.
        </p>
        <BlockEditor
          bodyText={bodyText}
          photos={photos}
          onBodyTextChange={setBodyText}
          onPhotosChange={setPhotos}
        />
      </section>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 px-6 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
