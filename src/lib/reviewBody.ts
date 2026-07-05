import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReviewBlock } from '@/lib/types'

/**
 * The editor's in-memory representation of a photo.
 * Photos are managed in a side-panel and referenced in text via [photo:N] tokens.
 */
export interface EditorPhoto {
  key: number
  file?: File | null
  previewUrl?: string
  url?: string
  caption: string
}

export interface EditorTextBlock {
  id: string
  type: 'heading' | 'text'
  content: string
}

/** Legacy alias */
export type EditorBlock = EditorTextBlock

export const newTextBlock = (type: 'heading' | 'text'): EditorTextBlock => ({
  id: crypto.randomUUID(),
  type,
  content: '',
})

export const newPhoto = (existingPhotos: EditorPhoto[]): EditorPhoto => {
  const key = existingPhotos.length === 0 ? 1 : Math.max(...existingPhotos.map((p) => p.key)) + 1
  return { key, caption: '' }
}

// ---------------------------------------------------------------------------
// Deserialization: persisted ReviewBlock[] → editor state
// ---------------------------------------------------------------------------

export function editorStateFromBody(body: ReviewBlock[] | null | undefined): {
  bodyText: string
  photos: EditorPhoto[]
} {
  if (!body || body.length === 0) return { bodyText: '', photos: [] }

  const photos: EditorPhoto[] = []
  const textParts: string[] = []

  for (const b of body) {
    if (b.type === 'photo') {
      photos.push({ key: b.key, url: b.url, caption: b.caption ?? '' })
    } else {
      // Prefix headings with a '#' marker so round-trip preserves intent visually
      textParts.push(b.type === 'heading' ? `# ${b.content}` : b.content)
    }
  }

  return { bodyText: textParts.join('\n\n'), photos }
}

// ---------------------------------------------------------------------------
// Serialization: editor state → FormData payload
// ---------------------------------------------------------------------------

type BodyPayloadItem =
  | { type: 'photo'; key: number; fileIndex: number; caption: string }
  | { type: 'photo'; key: number; url: string; caption: string }
  | { type: 'text'; content: string }

export function appendReviewBody(
  fd: FormData,
  { bodyText, photos }: { bodyText: string; photos: EditorPhoto[] }
) {
  const files: File[] = []
  const payload: BodyPayloadItem[] = []

  for (const p of photos) {
    if (p.file) {
      const fileIndex = files.length
      files.push(p.file)
      payload.push({ type: 'photo', key: p.key, fileIndex, caption: p.caption })
    } else if (p.url) {
      payload.push({ type: 'photo', key: p.key, url: p.url, caption: p.caption })
    }
  }

  const content = bodyText.trim()
  if (content) payload.push({ type: 'text', content })

  fd.set('body', JSON.stringify(payload))
  fd.delete('bodyPhotos')
  files.forEach((f) => fd.append('bodyPhotos', f))
}

// ---------------------------------------------------------------------------
// Server-side: resolve uploads and produce final ReviewBlock[]
// ---------------------------------------------------------------------------

export async function resolveReviewBody(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  fd: FormData
): Promise<{ body: ReviewBlock[] | null; notesText: string | null }> {
  const files = fd.getAll('bodyPhotos') as File[]
  const uploadedUrls: (string | null)[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file || file.size === 0) { uploadedUrls.push(null); continue }
    const ext = file.name.split('.').pop()
    const path = `${userId}/${reviewId}/${Date.now()}-${i}.${ext}`
    const { error } = await supabase.storage.from('review-photos').upload(path, file, { upsert: false })
    if (error) { uploadedUrls.push(null); continue }
    const { data } = supabase.storage.from('review-photos').getPublicUrl(path)
    uploadedUrls.push(data.publicUrl)
  }

  let parsed: unknown[] = []
  try {
    const raw = fd.get('body') as string | null
    parsed = raw ? (JSON.parse(raw) as unknown[]) : []
  } catch { parsed = [] }

  const blocks: ReviewBlock[] = []
  for (const item of parsed) {
    const b = item as Record<string, unknown>
    if (b.type === 'photo') {
      let url = typeof b.url === 'string' ? b.url : null
      if (typeof b.fileIndex === 'number') url = uploadedUrls[b.fileIndex] ?? null
      if (url && typeof b.key === 'number') {
        const caption = typeof b.caption === 'string' ? b.caption.trim() : ''
        blocks.push({ type: 'photo', key: b.key, url, caption: caption || null })
      }
    } else if ((b.type === 'text' || b.type === 'heading') && typeof b.content === 'string' && b.content.trim()) {
      blocks.push({ type: b.type, content: b.content.trim() })
    }
  }

  const notesText =
    blocks
      .filter((b): b is Extract<ReviewBlock, { content: string }> => b.type !== 'photo')
      .map((b) => b.content)
      .join('\n\n') || null

  return { body: blocks.length ? blocks : null, notesText }
}
