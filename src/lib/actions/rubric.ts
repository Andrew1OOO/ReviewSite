'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AxisDraft {
  label: string
  description: string
  weight: number
}

export async function saveOnboarding(foodCategory: string, axes: AxisDraft[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  if (!foodCategory.trim()) return { error: 'Food category is required.' }
  if (axes.length < 2) return { error: 'Add at least 2 scoring axes.' }
  if (axes.length > 6) return { error: 'Maximum 6 axes.' }
  for (const a of axes) {
    if (!a.label.trim()) return { error: 'All axes need a label.' }
    if (a.weight <= 0) return { error: 'All axes need a weight greater than 0.' }
  }

  // Upsert profile
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      food_category: foodCategory.trim(),
      onboarding_done: true,
    }, { onConflict: 'id' })

  if (profileErr) return { error: profileErr.message }

  // Replace all existing axes for this user
  await supabase.from('rubric_axes').delete().eq('user_id', user.id)

  const { error: axesErr } = await supabase.from('rubric_axes').insert(
    axes.map((a, i) => ({
      user_id: user.id,
      label: a.label.trim(),
      description: a.description.trim() || null,
      weight: a.weight,
      position: i,
    }))
  )

  if (axesErr) return { error: axesErr.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateRubric(foodCategory: string, axes: AxisDraft[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  if (!foodCategory.trim()) return { error: 'Food category is required.' }
  if (axes.length < 2) return { error: 'Add at least 2 scoring axes.' }
  if (axes.length > 6) return { error: 'Maximum 6 axes.' }
  for (const a of axes) {
    if (!a.label.trim()) return { error: 'All axes need a label.' }
    if (a.weight <= 0) return { error: 'All axes need a weight greater than 0.' }
  }

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ food_category: foodCategory.trim() })
    .eq('id', user.id)

  if (profileErr) return { error: profileErr.message }

  await supabase.from('rubric_axes').delete().eq('user_id', user.id)

  const { error: axesErr } = await supabase.from('rubric_axes').insert(
    axes.map((a, i) => ({
      user_id: user.id,
      label: a.label.trim(),
      description: a.description.trim() || null,
      weight: a.weight,
      position: i,
    }))
  )

  if (axesErr) return { error: axesErr.message }

  revalidatePath('/profile')
  revalidatePath('/profile/rubric')
  return { success: true }
}
