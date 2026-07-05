import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewSubmitForm from '@/components/ReviewSubmitForm'
import Container from '@/components/Container'
import type { RubricAxis } from '@/lib/types'

export default async function SubmitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin?redirectTo=/submit')

  const [{ data: profileData }, { data: locationsData }, { data: axesData }] = await Promise.all([
    supabase.from('profiles').select('food_category, onboarding_done').eq('id', user.id).single(),
    supabase.from('locations').select('*').order('name'),
    supabase.from('rubric_axes').select('*').eq('user_id', user.id).order('position'),
  ])

  if (!profileData?.onboarding_done) redirect('/onboarding')

  const axes = (axesData ?? []) as RubricAxis[]
  const foodCategory = profileData?.food_category ?? 'your food'

  return (
    <main className="flex-1">
      <Container size="form" className="py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-2">New review</h1>
          <p className="text-text-muted text-sm">
            Where did you try it? Score it against your rubric and write it up.
          </p>
        </div>
        <ReviewSubmitForm
          locations={locationsData ?? []}
          axes={axes}
          foodCategory={foodCategory}
        />
      </Container>
    </main>
  )
}
