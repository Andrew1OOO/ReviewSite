import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/Container'
import ScoreBadge from '@/components/ScoreBadge'
import type { LocationScore, Review, Profile } from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  // Recent reviews with reviewer info for the feed
  const [{ data: reviewsData }, { data: { user } }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, location_id, user_id, composite, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.auth.getUser(),
  ])

  const reviews = (reviewsData ?? []) as Pick<Review, 'id' | 'location_id' | 'user_id' | 'composite' | 'created_at'>[]

  const locationIds = [...new Set(reviews.map((r) => r.location_id))]
  const userIds = [...new Set(reviews.map((r) => r.user_id))]

  const [{ data: locationsData }, { data: profilesData }] = await Promise.all([
    locationIds.length > 0
      ? supabase.from('location_scores').select('*').in('id', locationIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from('profiles').select('id, display_name, food_category').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ])

  const locationById = Object.fromEntries(
    (locationsData ?? []).map((l: LocationScore) => [l.id, l])
  )
  const profileById = Object.fromEntries(
    (profilesData ?? []).map((p: Pick<Profile, 'id' | 'display_name' | 'food_category'>) => [p.id, p])
  )

  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl text-text mb-2">Feed</h1>
            <p className="text-text-muted text-sm">What your group has been eating.</p>
          </div>
          {user && (
            <Link href="/submit" className="btn px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition">
              + Review
            </Link>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <p className="text-lg font-medium text-text mb-2">Nothing here yet.</p>
            <p className="text-sm">Be the first to post a review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const location = locationById[review.location_id] as LocationScore | undefined
              const profile = profileById[review.user_id]
              if (!location) return null
              return (
                <Link
                  key={review.id}
                  href={`/locations/${review.location_id}`}
                  className="feed-item card-hover flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border-strong group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text text-sm truncate group-hover:text-accent transition-colors">
                      {location.location_name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {location.location_city}
                      {profile?.food_category && <span> · {profile.food_category}</span>}
                      {profile?.display_name && <span> · {profile.display_name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {location.tier && <ScoreBadge tier={location.tier} size="sm" />}
                    <span className="score-display text-2xl">
                      {review.composite !== null ? review.composite.toFixed(1) : '—'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Container>
    </main>
  )
}
