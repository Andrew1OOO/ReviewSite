import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScoreBadge from '@/components/ScoreBadge'
import ReviewCard from '@/components/ReviewCard'
import CommentForm from '@/components/CommentForm'
import Container from '@/components/Container'
import type { LocationScore, Review, ReviewPhoto, ReviewScore, RubricAxis, Comment, Profile } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LocationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: locationData },
    { data: reviewsData },
    { data: commentsData },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('location_scores').select('*').eq('id', id).single(),
    supabase.from('reviews').select('*').eq('location_id', id).order('created_at', { ascending: false }),
    supabase.from('comments').select('*').eq('location_id', id).order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  if (!locationData) notFound()

  const location = locationData as LocationScore
  const reviews = (reviewsData ?? []) as Review[]
  const comments = (commentsData ?? []) as Comment[]

  const reviewIds = reviews.map((r) => r.id)
  const reviewerIds = [...new Set(reviews.map((r) => r.user_id))]

  const [{ data: photosData }, { data: profilesData }, { data: scoresData }, { data: axesData }] =
    await Promise.all([
      reviewIds.length > 0
        ? supabase.from('review_photos').select('*').in('review_id', reviewIds).order('order')
        : Promise.resolve({ data: [] }),
      reviewerIds.length > 0
        ? supabase.from('profiles').select('id, display_name, food_category').in('id', reviewerIds)
        : Promise.resolve({ data: [] }),
      reviewIds.length > 0
        ? supabase.from('review_scores').select('*').in('review_id', reviewIds)
        : Promise.resolve({ data: [] }),
      reviewerIds.length > 0
        ? supabase.from('rubric_axes').select('*').in('user_id', reviewerIds).order('position')
        : Promise.resolve({ data: [] }),
    ])

  const photos = (photosData ?? []) as ReviewPhoto[]
  const profiles = (profilesData ?? []) as Pick<Profile, 'id' | 'display_name' | 'food_category'>[]
  const allScores = (scoresData ?? []) as ReviewScore[]
  const allAxes = (axesData ?? []) as RubricAxis[]

  const photosByReview = photos.reduce<Record<string, ReviewPhoto[]>>((acc, p) => {
    if (!acc[p.review_id]) acc[p.review_id] = []
    acc[p.review_id].push(p)
    return acc
  }, {})

  const scoresByReview = allScores.reduce<Record<string, ReviewScore[]>>((acc, s) => {
    if (!acc[s.review_id]) acc[s.review_id] = []
    acc[s.review_id].push(s)
    return acc
  }, {})

  const axesByUser = allAxes.reduce<Record<string, RubricAxis[]>>((acc, a) => {
    if (!acc[a.user_id]) acc[a.user_id] = []
    acc[a.user_id].push(a)
    return acc
  }, {})

  const profileById = Object.fromEntries(profiles.map((p) => [p.id, p]))
  const score = location.avg_composite !== null ? location.avg_composite.toFixed(1) : null

  return (
    <main className="flex-1">
      <Container size="reading" className="py-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl sm:text-4xl">{location.location_name}</h1>
            <p className="text-text-muted text-sm mt-1">
              {location.location_city}
              {location.address && ` · ${location.address}`}
              {location.is_chain && ' · Chain'}
            </p>
          </div>
          {score && (
            <div className="text-right shrink-0">
              <span className="score-display text-6xl">{score}</span>
              <p className="text-xs text-text-muted mt-1">
                {location.review_count} {location.review_count === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          )}
        </div>

        {location.tier && <div className="mb-8"><ScoreBadge tier={location.tier} /></div>}

        {user && (
          <div className="mb-8">
            <Link href={`/submit?locationId=${id}`}
              className="btn px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition">
              Review this spot
            </Link>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl mb-5">
              {reviews.length === 1 ? '1 Review' : `${reviews.length} Reviews`}
            </h2>
            <div className="space-y-6">
              {reviews.map((review) => {
                const profile = profileById[review.user_id]
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    reviewPhotos={photosByReview[review.id] ?? []}
                    scores={scoresByReview[review.id] ?? []}
                    axes={axesByUser[review.user_id] ?? []}
                    isOwner={user?.id === review.user_id}
                    dishId={id}
                    reviewerName={profile?.display_name ?? 'Anonymous'}
                    foodCategory={profile?.food_category ?? null}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Comments */}
        <section>
          <h2 className="font-serif text-xl mb-5">Comments</h2>
          {comments.length > 0 && (
            <div className="space-y-3 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="card-hover bg-card border border-border rounded-lg p-4">
                  <p className="text-sm text-text leading-relaxed">{comment.body}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
          {user ? (
            <CommentForm locationId={id} />
          ) : (
            <p className="text-sm text-text-muted">
              <Link href="/signin" className="text-accent hover:underline">Sign in</Link> to leave a comment.
            </p>
          )}
        </section>
      </Container>
    </main>
  )
}
