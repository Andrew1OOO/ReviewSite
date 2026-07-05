import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ScoreBadge from '@/components/ScoreBadge'
import Container from '@/components/Container'
import Pagination from '@/components/Pagination'
import type { LocationScore } from '@/lib/types'

export const revalidate = 60

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function RankingsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const supabase = await createClient()

  const [{ count }, { data }] = await Promise.all([
    supabase
      .from('location_scores')
      .select('id', { count: 'exact', head: true })
      .not('avg_composite', 'is', null),
    supabase
      .from('location_scores')
      .select('*')
      .not('avg_composite', 'is', null)
      .order('avg_composite', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const locations = (data ?? []) as LocationScore[]
  // Global rank offset for display number (e.g. page 2 starts at 51)
  const rankOffset = (page - 1) * PAGE_SIZE

  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7">
          <h1 className="font-serif text-4xl mb-2">Rankings</h1>
          <p className="text-text-muted text-sm">
            {total} {total === 1 ? 'spot' : 'spots'} ranked
          </p>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <Link
                  key={loc.id}
                  href={`/locations/${loc.id}`}
                  className="feed-item card-hover flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border-strong group"
                >
                  <span className="font-serif text-lg text-text-muted w-7 text-center shrink-0 tabular-nums">
                    {rankOffset + i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text text-sm truncate group-hover:text-accent transition-colors">
                      {loc.location_name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {loc.location_city}
                      {loc.is_chain && ' · Chain'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {loc.tier && <ScoreBadge tier={loc.tier} size="sm" />}
                    <div className="text-right">
                      <span className="score-display text-2xl">
                        {loc.avg_composite !== null ? loc.avg_composite.toFixed(1) : '—'}
                      </span>
                      <p className="text-xs text-text-muted">
                        {loc.review_count} {loc.review_count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} basePath="/rankings" />
          </>
        )}
      </Container>
    </main>
  )
}
