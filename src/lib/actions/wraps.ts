'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitWrap(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to add a dish.' }

  // --- Location ---
  const locationMode = formData.get('locationMode') as 'existing' | 'new'
  let locationId: string

  if (locationMode === 'existing') {
    locationId = formData.get('locationId') as string
    if (!locationId) return { error: 'Please select a location.' }
  } else {
    const name = formData.get('locationName') as string
    const address = formData.get('locationAddress') as string
    const city = formData.get('locationCity') as string
    const lat = formData.get('locationLat')
    const lng = formData.get('locationLng')
    const isChain = formData.get('isChain') === 'true'

    if (!name || !address || !city) return { error: 'Please fill in all location fields.' }

    const { data: loc, error: locErr } = await supabase
      .from('locations')
      .insert({ name, address, city, lat: lat ? parseFloat(lat as string) : null, lng: lng ? parseFloat(lng as string) : null, is_chain: isChain })
      .select('id')
      .single()

    if (locErr || !loc) return { error: locErr?.message ?? 'Failed to create location.' }
    locationId = loc.id
  }

  // --- Photo upload ---
  const photoFile = formData.get('photo') as File | null
  let photoUrl: string | null = null

  if (photoFile && photoFile.size > 0) {
    const ext = photoFile.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('wrap-photos').upload(path, photoFile, { upsert: false })
    if (uploadErr) return { error: `Photo upload failed: ${uploadErr.message}` }
    const { data: urlData } = supabase.storage.from('wrap-photos').getPublicUrl(path)
    photoUrl = urlData.publicUrl
  }

  // --- Dish ---
  const dishName = formData.get('wrapName') as string
  const priceRaw = formData.get('price') as string
  const price = priceRaw ? parseFloat(priceRaw) : null

  if (!dishName) return { error: 'Dish name is required.' }

  const { data: dish, error: dishErr } = await supabase
    .from('dishes')
    .insert({ location_id: locationId, name: dishName, price, photo_url: photoUrl })
    .select('id')
    .single()

  if (dishErr || !dish) return { error: dishErr?.message ?? 'Failed to create dish.' }

  // Redirect to the review page so the user can score it with their rubric
  redirect(`/wraps/${dish.id}/review`)
}
