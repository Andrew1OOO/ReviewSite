'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const displayName = (formData.get('display_name') as string ?? '').trim()
  if (!displayName) return { error: 'Display name cannot be empty.' }
  if (displayName.length > 40) return { error: 'Display name must be 40 characters or fewer.' }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No file provided.' }
  if (file.size > 5 * 1024 * 1024) return { error: 'File must be under 5 MB.' }
  if (!file.type.startsWith('image/')) return { error: 'File must be an image.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatar-photos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('avatar-photos')
    .getPublicUrl(path)

  // Bust the CDN cache with a version param so the browser re-fetches
  const avatarUrl = `${publicUrl}?v=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: user.id, avatar_url: avatarUrl }, { onConflict: 'id' })

  if (profileError) return { error: profileError.message }

  revalidatePath('/profile')
  revalidatePath('/', 'layout')
  return { success: true, avatarUrl }
}
