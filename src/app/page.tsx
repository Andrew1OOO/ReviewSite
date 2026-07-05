import Link from 'next/link'
import Image from 'next/image'
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

  const [{ count }, { data: reviewsData }, { data: { user } }] = await Promise.all([
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
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

  const reviewIds = reviews.map((r) => r.id)
  const locationIds = [...new Set(reviews.map((r) => r.location_id))]
  const userIds = [...new Set(reviews.map((r) => r.user_id))]

  const [{ data: locationsData }, { data: profilesData }, { data: bodiesData }] = await Promise.all([
    locationIds.length > 0
      ? supabase.from('location_scores').select('*').in('id', locationIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from('profiles').select('id, display_name, food_category').in('id', userIds)
      : Promise.resolve({ data: [] }),
    // Fetch body JSONB to extract the first photo URL from each review
    reviewIds.length > 0
      ? supabase.from('reviews').select('id, body').in('id', reviewIds)
      : Promise.resolve({ data: [] }),
  ])

  const locationById = Object.fromEntries(
    (locationsData ?? []).map((l: LocationScore) => [l.id, l])
  )
  const profileById = Object.fromEntries(
    (profilesData ?? []).map((p: Pick<Profile, 'id' | 'display_name' | 'food_category'>) => [p.id, p])
  )
  // Extract first photo URL from each review's body blocks
  const photoByReview = Object.fromEntries(
    (bodiesData ?? [])
      .map((r: { id: string; body: unknown }) => {
        const blocks = Array.isArray(r.body) ? r.body as Array<Record<string, unknown>> : []
        const first = blocks.find((b) => b.type === 'photo' && typeof b.url === 'string')
        return [r.id, first ? (first.url as string) : null]
      })
      .filter(([, url]) => url !== null)
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
                const photoUrl = photoByReview[review.id] ?? null
                if (!location) return null
                return (
                  <div
                    key={review.id}
                    className="feed-item card-hover relative flex flex-col justify-between aspect-square rounded-xl overflow-hidden border border-border hover:border-border-strong group"
                  >
                    {/* Background photo */}
                    {photoUrl ? (
                      <>
                        <Image
                          src={photoUrl}
                          alt={location.location_name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {/* Dark gradient so text is always legible */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-card" />
                    )}

                    {/* Full-card link */}
                    <Link href={`/locations/${review.location_id}`} className="absolute inset-0 rounded-xl z-10" aria-label={location.location_name} />

                    {/* Top row: tier badge + score */}
                    <div className={`relative z-20 flex items-start justify-between gap-1 p-4 pointer-events-none ${photoUrl ? 'text-white' : ''}`}>
                      {location.tier ? <ScoreBadge tier={location.tier} size="sm" /> : <span />}
                      <span className={`score-display text-2xl leading-none shrink-0 ${photoUrl ? '!text-white' : ''}`}>
                        {review.composite !== null ? review.composite.toFixed(1) : '—'}
                      </span>
                    </div>

                    {/* Bottom row: name + reviewer + time */}
                    <div className="relative z-20 min-w-0 p-4 pt-0">
                      <p className={`font-medium text-sm leading-snug line-clamp-2 pointer-events-none ${photoUrl ? 'text-white' : 'text-text group-hover:text-accent transition-colors'}`}>
                        {location.location_name}
                      </p>
                      {profile?.display_name ? (
                        <Link
                          href={`/profile/${review.user_id}`}
                          className={`relative text-xs mt-1 truncate block transition-colors z-30 ${photoUrl ? 'text-white/70 hover:text-white' : 'text-text-muted hover:text-accent'}`}
                        >
                          {profile.display_name}
                        </Link>
                      ) : (
                        <p className={`text-xs mt-1 truncate pointer-events-none ${photoUrl ? 'text-white/70' : 'text-text-muted'}`}>
                          {location.location_city}
                        </p>
                      )}
                      <RelativeTime date={review.created_at} className={`text-xs pointer-events-none ${photoUrl ? 'text-white/50' : 'text-text-muted/70'}`} />
                    </div>
                  </div>
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
