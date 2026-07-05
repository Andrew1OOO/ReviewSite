'use client'

import { useState } from 'react'
import ReviewBody from '@/components/ReviewBody'
import AxisBreakdown from '@/components/AxisBreakdown'
import Lightbox from '@/components/Lightbox'
import Link from 'next/link'
import Image from 'next/image'
import type { Review, ReviewPhoto, ReviewBlock, ReviewScore, RubricAxis } from '@/lib/types'

interface ReviewCardProps {
  review: Review
  reviewPhotos: ReviewPhoto[]
  scores: ReviewScore[]
  axes: RubricAxis[]
  isOwner: boolean
  dishId: string
  reviewerName: string
  reviewerUserId: string
  reviewerAvatarUrl: string | null
  foodCategory: string | null
}

export default function ReviewCard({
  review,
  reviewPhotos,
  scores,
  axes,
  isOwner,
  dishId,
  reviewerName,
  reviewerUserId,
  reviewerAvatarUrl,
  foodCategory,
}: ReviewCardProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  const scoreByAxis = Object.fromEntries(scores.map((s) => [s.axis_id, s]))
  const axisNotes = axes
    .map((a) => ({ label: a.label, note: scoreByAxis[a.id]?.note }))
    .filter((a) => a.note && a.note.trim())

  return (
    <div className="card-hover bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <Link href={`/profile/${reviewerUserId}`} className="flex items-center gap-3 group/reviewer min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-accent-soft border border-border shrink-0 flex items-center justify-center">
            {reviewerAvatarUrl ? (
              <Image
                src={reviewerAvatarUrl}
                alt={reviewerName}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-xs font-medium text-accent select-none">
                {reviewerName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-text group-hover/reviewer:text-accent transition-colors truncate">
              {reviewerName}
            </p>
            {foodCategory && <p className="text-xs text-text-muted truncate">{foodCategory}</p>}
          </div>
        </Link>
        <div className="text-xs text-text-muted text-right">
          <p>{new Date(review.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          {isOwner && (
            <Link
              href={`/locations/${dishId}/review/edit?reviewId=${review.id}`}
              className="text-accent hover:underline mt-0.5 inline-block"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Axis breakdown */}
      {axes.length > 0 && scores.length > 0 && (
        <div className="mb-4">
          <AxisBreakdown axes={axes} scores={scores} />
        </div>
      )}

      {/* Per-axis notes */}
      {axisNotes.length > 0 && (
        <dl className="space-y-1 mb-4">
          {axisNotes.map(({ label, note }) => (
            <div key={label} className="text-sm">
              <dt className="inline font-medium text-text">{label}: </dt>
              <dd className="inline text-text-muted">{note}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Body */}
      {review.body && review.body.length > 0 ? (
        <ClickableReviewBody
          blocks={review.body as ReviewBlock[]}
          onPhotoClick={(src, alt) => setLightbox({ src, alt })}
        />
      ) : (
        <>
          {review.notes && (
            <p className="text-sm text-text leading-relaxed mb-4 whitespace-pre-wrap">{review.notes}</p>
          )}
          {reviewPhotos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {reviewPhotos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightbox({ src: photo.photo_url, alt: 'Review photo' })}
                  className="aspect-square relative rounded-lg overflow-hidden bg-page hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Image src={photo.photo_url} alt="Review photo" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}

function ClickableReviewBody({
  blocks,
  onPhotoClick,
}: {
  blocks: ReviewBlock[]
  onPhotoClick: (src: string, alt: string) => void
}) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = (e.target as Element).closest('img')
    if (!img) return
    const src = img.getAttribute('src')
    const alt = img.getAttribute('alt') ?? 'Review photo'
    if (src) { e.preventDefault(); onPhotoClick(src, alt) }
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div onClick={handleClick} className="cursor-zoom-in">
      <ReviewBody blocks={blocks} />
    </div>
  )
}
