import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateRubric } from '@/lib/actions/rubric'
import RubricBuilder from '@/components/RubricBuilder'
import Container from '@/components/Container'
import type { RubricAxis } from '@/lib/types'

export default async function RubricEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: profileData }, { data: axesData }] = await Promise.all([
    supabase.from('profiles').select('food_category').eq('id', user.id).single(),
    supabase.from('rubric_axes').select('*').eq('user_id', user.id).order('position'),
  ])

  const axes = (axesData ?? []) as RubricAxis[]

  return (
    <main className="flex-1">
      <Container size="form" className="py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-2">Edit rubric</h1>
          <p className="text-text-muted text-sm">
            Change your food category or scoring axes. Existing reviews keep their
            original scores — only new reviews use the updated rubric.
          </p>
        </div>
        <RubricBuilder
          initialCategory={profileData?.food_category ?? ''}
          initialAxes={axes.map((a) => ({
            label: a.label,
            description: a.description ?? '',
            weight: a.weight,
          }))}
          submitLabel="Save rubric"
          onSubmit={updateRubric}
        />
      </Container>
    </main>
  )
}
