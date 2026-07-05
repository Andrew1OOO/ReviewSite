import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateReview, deleteReview } from '@/lib/actions/reviews'
import ReviewForm from '@/components/ReviewForm'
import Container from '@/components/Container'
import { editorStateFromBody } from '@/lib/reviewBody'
import type { RubricAxis, ReviewScore } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reviewId?: string }>
}

export default async function EditReviewPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { reviewId: reviewIdParam } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: locationData }, { data: axesData }] = await Promise.all([
    supabase.from('locations').select('id, name').eq('id', id).single(),
    supabase.from('rubric_axes').select('*').eq('user_id', user.id).order('position'),
  ])

  if (!locationData) notFound()
  const axes = (axesData ?? []) as RubricAxis[]
  if (axes.length === 0) redirect('/profile/rubric')

  const reviewQuery = supabase.from('reviews').select('*').eq('user_id', user.id)
  const { data: review } = reviewIdParam
    ? await reviewQuery.eq('id', reviewIdParam).single()
    : await reviewQuery.eq('location_id', id).order('created_at', { ascending: false }).limit(1).single()

  if (!review) redirect('/submit')

  const { data: scoresData } = await supabase.from('review_scores').select('*').eq('review_id', review.id)
  const existingScores = (scoresData ?? []) as ReviewScore[]

  const { bodyText, photos } = editorStateFromBody(review.body)

  const initialScores = Object.fromEntries(
    axes.map((a) => [a.id, existingScores.find((s) => s.axis_id === a.id)?.score ?? 5])
  )
  const initialNotes = Object.fromEntries(
    axes.map((a) => [a.id, existingScores.find((s) => s.axis_id === a.id)?.note ?? ''])
  )

  const locationId = id

  async function deleteThisReview() {
    'use server'
    await deleteReview(review!.id, locationId)
  }

  return (
    <main className="flex-1">
      <Container size="form" className="py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-2">Edit review</h1>
          <p className="text-sm text-text-muted">{locationData.name}</p>
        </div>

        <ReviewForm
          wrapId={id}
          wrapName={locationData.name}
          axes={axes}
          action={updateReview}
          initialValues={{ reviewId: review.id, scores: initialScores, notes: initialNotes, bodyText, photos }}
          submitLabel="Save changes"
        />

        <div className="mt-8 pt-8 border-t border-border">
          <form action={deleteThisReview}>
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-tier-shame text-tier-shame hover:bg-tier-shame/10 transition"
              onClick={(e) => { if (!confirm('Delete this review? This cannot be undone.')) e.preventDefault() }}>
              Delete review
            </button>
          </form>
        </div>
      </Container>
    </main>
  )
}
