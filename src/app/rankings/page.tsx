import { createClient } from '@/lib/supabase/server'
import Container from '@/components/Container'
import Pagination from '@/components/Pagination'
import RankingsFilter from '@/components/RankingsFilter'
import type { LocationScore } from '@/lib/types'

export const revalidate = 60

const PAGE_SIZE = 50

interface PageProps {
  searchParams: Promise<{ page?: string; food?: string }>
}

export default async function RankingsPage({ searchParams }: PageProps) {
  const { page: pageParam, food: foodParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const foodFilter = foodParam?.trim() || null

  const supabase = await createClient()

  // All distinct food categories from reviewers (for the dropdown)
  const { data: categoriesData } = await supabase
    .from('profiles')
    .select('food_category')
    .eq('onboarding_done', true)
    .not('food_category', 'is', null)

  const foodCategories = [
    ...new Set(
      (categoriesData ?? [])
        .map((p: { food_category: string | null }) => p.food_category)
        .filter(Boolean) as string[]
    ),
  ].sort()

  // If a food filter is active, find location IDs reviewed by users with that category
  let filteredLocationIds: string[] | null = null
  if (foodFilter) {
    const { data: reviewerData } = await supabase
      .from('profiles')
      .select('id')
      .eq('food_category', foodFilter)
      .eq('onboarding_done', true)

    const reviewerIds = (reviewerData ?? []).map((p: { id: string }) => p.id)

    if (reviewerIds.length > 0) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('location_id')
        .in('user_id', reviewerIds)

      filteredLocationIds = [
        ...new Set((reviewData ?? []).map((r: { location_id: string }) => r.location_id)),
      ]
    } else {
      filteredLocationIds = [] // no reviewers → no results
    }
  }

  // Build ranked queries, optionally filtered to specific location IDs
  const ids = filteredLocationIds
  const safeIds = ids !== null ? (ids.length > 0 ? ids : ['']) : null

  const countQuery = supabase
    .from('location_scores')
    .select('id', { count: 'exact', head: true })
    .not('avg_composite', 'is', null)

  const dataQuery = supabase
    .from('location_scores')
    .select('*')
    .not('avg_composite', 'is', null)
    .order('avg_composite', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const [{ count }, { data }] = await Promise.all([
    safeIds !== null ? countQuery.in('id', safeIds) : countQuery,
    safeIds !== null ? dataQuery.in('id', safeIds) : dataQuery,
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const locations = (data ?? []) as LocationScore[]
  const rankOffset = (page - 1) * PAGE_SIZE

  // Build pagination base path preserving the food filter
  const paginationBase = foodFilter
    ? `/rankings?food=${encodeURIComponent(foodFilter)}`
    : '/rankings'

  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7">
          <h1 className="font-serif text-4xl mb-2">Rankings</h1>
          <p className="text-text-muted text-sm">
            {total} {total === 1 ? 'spot' : 'spots'} ranked
            {foodFilter && <span> · {foodFilter}</span>}
          </p>
        </div>

        {foodCategories.length === 0 && locations.length === 0 ? (
          <div className="text-center py-24 text-text-muted">
            <p>No reviews yet.</p>
          </div>
        ) : (
          <>
            <RankingsFilter
              locations={locations}
              rankOffset={rankOffset}
              foodCategories={foodCategories}
              activeFood={foodFilter}
            />
            <Pagination page={page} totalPages={totalPages} basePath={paginationBase} />
          </>
        )}
      </Container>
    </main>
  )
}
