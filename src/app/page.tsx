import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/Container'
import ScoreBadge from '@/components/ScoreBadge'
import Pagination from '@/components/Pagination'
import RelativeTime from '@/components/RelativeTime'
import type { LocationScore, Review, Profile } from '@/lib/types'

export const revalidate = 60

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const supabase = await createClient()

  // Count total reviews for pagination
  const [{ count }, { data: reviewsData }, { data: { user } }] = await Promise.all([
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('reviews')
      .select('id, location_id, user_id, composite, created_at')
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    supabase.auth.getUser(),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {reviews.map((review) => {
                const location = locationById[review.location_id] as LocationScore | undefined
                const profile = profileById[review.user_id]
                if (!location) return null
                return (
                  <Link
                    key={review.id}
                    href={`/locations/${review.location_id}`}
                    className="feed-item card-hover flex flex-col justify-between aspect-square p-4 bg-card border border-border rounded-xl hover:border-border-strong group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      {location.tier
                        ? <ScoreBadge tier={location.tier} size="sm" />
                        : <span />
                      }
                      <span className="score-display text-2xl leading-none shrink-0">
                        {review.composite !== null ? review.composite.toFixed(1) : '—'}
                      </span>
                    </div>

                    <div className="min-w-0 mt-auto">
                      <p className="font-medium text-text text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {location.location_name}
                      </p>
                      {profile?.display_name ? (
                        <Link
                          href={`/profile/${review.user_id}`}
                          className="text-xs text-text-muted mt-1 truncate block hover:text-accent transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {profile.display_name}
                        </Link>
                      ) : (
                        <p className="text-xs text-text-muted mt-1 truncate">{location.location_city}</p>
                      )}
                      <RelativeTime date={review.created_at} className="text-xs text-text-muted/70" />
                    </div>
                  </Link>
                )
              })}
            </div>

            <Pagination page={page} totalPages={totalPages} basePath="/" />
          </>
        )}
      </Container>
    </main>
  )
}
