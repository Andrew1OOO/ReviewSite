'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveReviewBody, appendReviewBody } from '@/lib/reviewBody'
import { computeComposite } from '@/lib/reviewAxes'
import type { RubricAxis } from '@/lib/types'

function parseScores(fd: FormData, axes: RubricAxis[]): Record<string, number> {
  return Object.fromEntries(
    axes.map((a) => [a.id, parseFloat((fd.get(`score_${a.id}`) as string) ?? '5')])
  )
}

function parseNotes(fd: FormData, axes: RubricAxis[]): Record<string, string | null> {
  return Object.fromEntries(
    axes.map((a) => {
      const v = ((fd.get(`note_${a.id}`) as string) ?? '').trim()
      return [a.id, v || null]
    })
  )
}

export async function addReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  // Resolve locationId — either an existing one or create a new location row
  let locationId = formData.get('locationId') as string | null

  if (!locationId) {
    const locationMode = formData.get('locationMode') as string
    if (locationMode === 'new') {
      const name    = (formData.get('locationName')    as string)?.trim()
      const address = (formData.get('locationAddress') as string)?.trim()
      const city    = (formData.get('locationCity')    as string)?.trim()
      const lat     = formData.get('locationLat')
      const lng     = formData.get('locationLng')
      const isChain = formData.get('isChain') === 'true'

      if (!name || !city) return { error: 'Location name and city are required.' }

      const { data: loc, error: locErr } = await supabase
        .from('locations')
        .insert({ name, address: address || '', city, lat: lat ? parseFloat(lat as string) : null, lng: lng ? parseFloat(lng as string) : null, is_chain: isChain })
        .select('id')
        .single()

      if (locErr || !loc) return { error: locErr?.message ?? 'Failed to create location.' }
      locationId = loc.id
    } else {
      return { error: 'Location is required.' }
    }
  }

  // locationId is guaranteed non-null here — both branches above either set it or return
  const resolvedLocationId = locationId as string

  const { data: axesData } = await supabase
    .from('rubric_axes').select('*').eq('user_id', user.id).order('position')
  const axes = (axesData ?? []) as RubricAxis[]
  if (axes.length === 0) return { error: 'Set up your rubric before reviewing.' }

  const scores = parseScores(formData, axes)
  const notes = parseNotes(formData, axes)
  const composite = parseFloat(computeComposite(axes, scores).toFixed(1))

  const { data: review, error: reviewErr } = await supabase
    .from('reviews')
    .insert({ location_id: resolvedLocationId, user_id: user.id, composite })
    .select('id')
    .single()

  if (reviewErr || !review) return { error: reviewErr?.message ?? 'Failed to create review.' }

  const { error: scoresErr } = await supabase.from('review_scores').insert(
    axes.map((a) => ({ review_id: review.id, axis_id: a.id, score: scores[a.id] ?? 5, note: notes[a.id] }))
  )
  if (scoresErr) return { error: scoresErr.message }

  const { body, notesText } = await resolveReviewBody(supabase, user.id, review.id, formData)
  await supabase.from('reviews').update({ body, notes: notesText }).eq('id', review.id)

  revalidatePath(`/locations/${resolvedLocationId}`)
  revalidatePath('/rankings')
  revalidatePath('/')
  redirect(`/locations/${resolvedLocationId}`)
}

export async function updateReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const reviewId = formData.get('reviewId') as string
  const locationId = formData.get('locationId') as string

  const { data: axesData } = await supabase
    .from('rubric_axes').select('*').eq('user_id', user.id).order('position')
  const axes = (axesData ?? []) as RubricAxis[]
  if (axes.length === 0) return { error: 'Set up your rubric before reviewing.' }

  const scores = parseScores(formData, axes)
  const notes = parseNotes(formData, axes)
  const composite = parseFloat(computeComposite(axes, scores).toFixed(1))

  const { error: reviewErr } = await supabase
    .from('reviews').update({ composite }).eq('id', reviewId).eq('user_id', user.id)
  if (reviewErr) return { error: reviewErr.message }

  await supabase.from('review_scores').delete().eq('review_id', reviewId)
  const { error: scoresErr } = await supabase.from('review_scores').insert(
    axes.map((a) => ({ review_id: reviewId, axis_id: a.id, score: scores[a.id] ?? 5, note: notes[a.id] }))
  )
  if (scoresErr) return { error: scoresErr.message }

  const { body, notesText } = await resolveReviewBody(supabase, user.id, reviewId, formData)
  await supabase.from('reviews').update({ body, notes: notesText }).eq('id', reviewId)

  revalidatePath(`/locations/${locationId}`)
  revalidatePath('/rankings')
  revalidatePath('/')
  redirect(`/locations/${locationId}`)
}

export async function deleteReview(reviewId: string, locationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath(`/locations/${locationId}`)
  revalidatePath('/rankings')
  revalidatePath('/')
  redirect(`/locations/${locationId}`)
}

export async function deleteReviewPhoto(photoId: string, locationId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('review_photos').delete().eq('id', photoId)
  if (error) return { error: error.message }
  revalidatePath(`/locations/${locationId}`)
  return { success: true }
}
