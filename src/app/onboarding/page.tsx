import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveOnboarding } from '@/lib/actions/rubric'
import RubricBuilder from '@/components/RubricBuilder'
import Container from '@/components/Container'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_done) redirect('/')

  return (
    <main className="flex-1">
      <Container size="form" className="py-8">
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-2">Claim your food</h1>
          <p className="text-text-muted text-sm">
            Pick the one food you are the group expert on, then build your personal
            scoring rubric. You can tweak it later from your profile.
          </p>
        </div>
        <RubricBuilder
          submitLabel="Let's go"
          onSubmit={saveOnboarding}
        />
      </Container>
    </main>
  )
}
