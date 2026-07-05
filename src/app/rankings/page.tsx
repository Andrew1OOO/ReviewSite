import { createClient } from '@/lib/supabase/server'
import ScoreBadge from '@/components/ScoreBadge'
import Container from '@/components/Container'
import Pagination from '@/components/Pagination'
import RankingsFilter from '@/components/RankingsFilter'
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
  const rankOffset = (page - 1) * PAGE_SIZE

  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-4xl mb-2">Rankings</h1>
            <p className="text-text-muted text-sm">
              {total} {total === 1 ? 'spot' : 'spots'} ranked
            </p>
          </div>
        </div>

        {locations.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <>
            <RankingsFilter locations={locations} rankOffset={rankOffset} />
            <Pagination page={page} totalPages={totalPages} basePath="/rankings" />
          </>
        )}
      </Container>
    </main>
  )
}
