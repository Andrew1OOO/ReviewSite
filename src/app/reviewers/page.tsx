import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import Container from '@/components/Container'
import type { Profile } from '@/lib/types'

export const revalidate = 60

export default async function ReviewersPage() {
  const supabase = await createClient()

  // Fetch all profiles that have completed onboarding, with their review counts
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, display_name, food_category, avatar_url')
    .eq('onboarding_done', true)
    .order('display_name')

  const profiles = (profilesData ?? []) as Pick<Profile, 'id' | 'display_name' | 'food_category' | 'avatar_url'>[]

  // Get review count per user in one query
  const { data: countsData } = await supabase
    .from('reviews')
    .select('user_id')

  const reviewCountById = (countsData ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7">
          <h1 className="font-serif text-4xl mb-2">Reviewers</h1>
          <p className="text-text-muted text-sm">
            {profiles.length} {profiles.length === 1 ? 'member' : 'members'}
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <p>No reviewers yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((profile) => {
              const initials = profile.display_name
                .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
              const count = reviewCountById[profile.id] ?? 0

              return (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.id}`}
                  className="feed-item card-hover flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border-strong group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-accent-soft border border-border shrink-0 flex items-center justify-center">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        width={44}
                        height={44}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-accent select-none">{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text text-sm truncate group-hover:text-accent transition-colors">
                      {profile.display_name}
                    </p>
                    {profile.food_category && (
                      <p className="text-xs text-text-muted truncate">{profile.food_category}</p>
                    )}
                  </div>

                  {/* Review count */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-text tabular-nums">{count}</p>
                    <p className="text-xs text-text-muted">{count === 1 ? 'review' : 'reviews'}</p>
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
