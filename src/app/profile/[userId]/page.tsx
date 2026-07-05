import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/Container'
import ScoreBadge from '@/components/ScoreBadge'
import ReviewMap from '@/components/ReviewMap'
import RelativeTime from '@/components/RelativeTime'
import type { ReviewMapPin } from '@/components/ReviewMap'
import type { Profile, Review, RubricAxis, LocationScore } from '@/lib/types'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params
  const supabase = await createClient()

  const [{ data: profileData }, { data: reviewsData }, { data: axesData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('reviews').select('id, location_id, composite, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('rubric_axes').select('*').eq('user_id', userId).order('position'),
  ])

  if (!profileData) notFound()

  const profile = profileData as Profile
  const reviews = (reviewsData ?? []) as Pick<Review, 'id' | 'location_id' | 'composite' | 'created_at'>[]
  const axes = (axesData ?? []) as RubricAxis[]

  const locationIds = [...new Set(reviews.map((r) => r.location_id))]
  const { data: locationsData } = locationIds.length > 0
    ? await supabase.from('locations').select('id, name, lat, lng').in('id', locationIds)
    : { data: [] }

  type LocationRow = { id: string; name: string; lat: number | null; lng: number | null }
  const locations = (locationsData ?? []) as LocationRow[]
  const locationById = Object.fromEntries(locations.map((l) => [l.id, l]))

  // Fetch location scores for tier badges
  const { data: locationScoresData } = locationIds.length > 0
    ? await supabase.from('location_scores').select('id, location_name, avg_composite, tier').in('id', locationIds)
    : { data: [] }
  const locationScoreById = Object.fromEntries(
    (locationScoresData ?? []).map((l: Pick<LocationScore, 'id' | 'location_name' | 'avg_composite' | 'tier'>) => [l.id, l])
  )

  const mapPins: ReviewMapPin[] = reviews
    .map((r) => {
      const loc = locationById[r.location_id]
      if (!loc || loc.lat === null || loc.lng === null) return null
      return { locationId: r.location_id, name: loc.name, lat: loc.lat, lng: loc.lng, composite: r.composite ?? null }
    })
    .filter((p): p is ReviewMapPin => p !== null)
    .filter((p, i, arr) => arr.findIndex((q) => q.locationId === p.locationId) === i)

  const initials = profile.display_name
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  const totalWeight = axes.reduce((s, a) => s + a.weight, 0)

  return (
    <main className="flex-1">
      <Container size="form" className="py-8 space-y-10">

        {/* Header */}
        <section className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-accent-soft border border-border shrink-0 flex items-center justify-center">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-serif text-xl text-accent select-none">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl">{profile.display_name}</h1>
            {profile.food_category && (
              <p className="text-sm text-text-muted mt-0.5">{profile.food_category} reviewer</p>
            )}
          </div>
        </section>

        {/* Rubric */}
        {axes.length > 0 && (
          <section>
            <h2 className="font-serif text-xl mb-4">Rubric</h2>
            <div className="bg-card border border-border rounded-xl p-5 space-y-2">
              {axes.map((axis) => {
                const pct = totalWeight > 0 ? Math.round((axis.weight / totalWeight) * 100) : 0
                return (
                  <div key={axis.id} className="flex items-center gap-3">
                    <span className="text-sm text-text w-32 shrink-0">{axis.label}</span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="axis-bar h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Map */}
        {mapPins.length > 0 && (
          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-serif text-xl">Map</h2>
              <span className="text-sm text-text-muted">{reviews.length} {reviews.length === 1 ? 'spot' : 'spots'}</span>
            </div>
            <ReviewMap pins={mapPins} />
          </section>
        )}

        {/* Reviews */}
        <section>
          <h2 className="font-serif text-xl mb-5">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-text-muted">No reviews yet.</p>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => {
                const locScore = locationScoreById[review.location_id]
                const locName = locationById[review.location_id]?.name ?? 'Unknown location'
                return (
                  <Link
                    key={review.id}
                    href={`/locations/${review.location_id}`}
                    className="card-hover flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-4 py-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text group-hover:text-accent transition-colors truncate">
                        {locName}
                      </p>
                      <RelativeTime date={review.created_at} className="text-xs text-text-muted mt-0.5 block" />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {locScore?.tier && <ScoreBadge tier={locScore.tier} size="sm" />}
                      <span className="score-display text-xl">{review.composite?.toFixed(1) ?? '—'}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

      </Container>
    </main>
  )
}
