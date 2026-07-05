import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/lib/actions/profile'
import { signOut } from '@/lib/actions/auth'
import Container from '@/components/Container'
import ProfileForm from '@/components/ProfileForm'
import type { Review, Profile, RubricAxis } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: profileData }, { data: reviewsData }, { data: axesData }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('reviews').select('id, location_id, composite, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('rubric_axes').select('*').eq('user_id', user.id).order('position'),
  ])

  const profile = profileData as Profile | null
  const reviews = (reviewsData ?? []) as unknown as Pick<Review, 'id' | 'location_id' | 'composite' | 'created_at'>[]
  const axes = (axesData ?? []) as RubricAxis[]

  const locationIds = [...new Set(reviews.map((r) => r.location_id))]
  const { data: locationsData } = locationIds.length > 0
    ? await supabase.from('locations').select('id, name').in('id', locationIds)
    : { data: [] }

  const dishNameById = Object.fromEntries(
    (locationsData ?? []).map((l: { id: string; name: string }) => [l.id, l.name])
  )

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Anonymous'

  return (
    <main className="flex-1">
      <Container size="form" className="py-8 space-y-10">

        {/* Identity */}
        <section>
          <h1 className="font-serif text-4xl mb-1">Profile</h1>
          <p className="text-sm text-text-muted mb-8">{user.email}</p>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-serif text-xl mb-4">Display name</h2>
            <ProfileForm displayName={displayName} action={updateProfile} />
          </div>
        </section>

        {/* Rubric */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Your rubric</h2>
            <Link href="/profile/rubric" className="text-sm text-accent hover:underline">
              Edit
            </Link>
          </div>

          {profile?.food_category ? (
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="font-medium text-text mb-3">{profile.food_category}</p>
              {axes.length > 0 ? (
                <div className="space-y-2">
                  {axes.map((axis) => {
                    const totalWeight = axes.reduce((s, a) => s + a.weight, 0)
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
              ) : (
                <p className="text-sm text-text-muted">No axes defined yet.</p>
              )}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
              <p className="text-sm text-text-muted mb-3">You haven&apos;t set up your rubric yet.</p>
              <Link href="/onboarding" className="text-sm text-accent hover:underline">Set it up →</Link>
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <h2 className="font-serif text-xl mb-5">Your reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-text-muted">
              You haven&apos;t reviewed anything yet.{' '}
              <Link href="/" className="text-accent hover:underline">Find something to review.</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/locations/${review.location_id}`} className="text-sm font-medium text-text hover:text-accent transition-colors truncate block">
                      {dishNameById[review.location_id] ?? 'Unknown location'}
                    </Link>
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="score-display text-xl">{review.composite?.toFixed(1) ?? '—'}</span>
                    <Link href={`/locations/${review.location_id}/review/edit?reviewId=${review.id}`} className="text-xs text-accent hover:underline">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sign out */}
        <section className="pt-2 border-t border-border">
          <form action={signOut}>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-text-muted hover:text-text hover:border-border-strong transition">
              Sign out
            </button>
          </form>
        </section>

      </Container>
    </main>
  )
}
