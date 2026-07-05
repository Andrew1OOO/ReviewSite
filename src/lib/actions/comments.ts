'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addComment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to comment.' }

  const locationId = formData.get('locationId') as string
  const body = (formData.get('body') as string)?.trim()
  if (!body) return { error: 'Comment cannot be empty.' }

  const { error } = await supabase.from('comments').insert({ location_id: locationId, user_id: user.id, body })
  if (error) return { error: error.message }

  revalidatePath(`/locations/${locationId}`)
  return { success: true }
}

export async function deleteComment(commentId: string, locationId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  revalidatePath(`/locations/${locationId}`)
  return { success: true }
}
