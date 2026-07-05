'use client'

import { useRef } from 'react'
import { EditorPhoto, newPhoto } from '@/lib/reviewBody'

interface BlockEditorProps {
  bodyText: string
  photos: EditorPhoto[]
  onBodyTextChange: (text: string) => void
  onPhotosChange: (photos: EditorPhoto[]) => void
}

export default function BlockEditor({
  bodyText,
  photos,
  onBodyTextChange,
  onPhotosChange,
}: BlockEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── photo helpers ───────────────────────────────────────────────────────

  const updatePhoto = (key: number, patch: Partial<EditorPhoto>) =>
    onPhotosChange(photos.map((p) => (p.key === key ? { ...p, ...patch } : p)))

  const removePhoto = (key: number) => {
    const photo = photos.find((p) => p.key === key)
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
    onPhotosChange(photos.filter((p) => p.key !== key))
    // Strip all [photo:N] tokens for this key from the text
    onBodyTextChange(
      bodyText.replace(new RegExp(`\\[photo:${key}\\]`, 'g'), '').replace(/\n{3,}/g, '\n\n').trim()
    )
  }

  const addPhoto = () => onPhotosChange([...photos, newPhoto(photos)])

  const pickImage = (key: number, file: File | undefined) => {
    if (!file) return
    const photo = photos.find((p) => p.key === key)
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
    updatePhoto(key, { file, previewUrl: URL.createObjectURL(file), url: undefined })
  }

  /** Insert a [photo:N] token at the current cursor position in the textarea. */
  const insertPhotoToken = (key: number) => {
    const el = textareaRef.current
    const token = `[photo:${key}]`
    if (!el) {
      onBodyTextChange((bodyText ? bodyText + '\n\n' : '') + token)
      return
    }
    const start = el.selectionStart ?? bodyText.length
    const end = el.selectionEnd ?? bodyText.length
    const before = bodyText.slice(0, start)
    const after = bodyText.slice(end)
    // Pad with a newline on each side if there's surrounding text
    const padBefore = before.length > 0 && !before.endsWith('\n') ? '\n' : ''
    const padAfter = after.length > 0 && !after.startsWith('\n') ? '\n' : ''
    const newText = before + padBefore + token + padAfter + after
    onBodyTextChange(newText)
    // Restore cursor after the token
    const cursorPos = start + padBefore.length + token.length
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursorPos, cursorPos)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">

      {/* ── Left: unified text area ─────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs text-text-muted px-0.5">
          Write your review freely. Type{' '}
          <code className="text-xs bg-border/60 px-1 py-0.5 rounded font-mono">[photo:1]</code>
          {' '}anywhere to place a photo inline, or hit <strong>Insert</strong> in the photo panel to drop it at the cursor.
        </p>
        <textarea
          ref={textareaRef}
          value={bodyText}
          onChange={(e) => onBodyTextChange(e.target.value)}
          rows={12}
          placeholder={
            photos.length > 0
              ? `Write your review here…\n\nUse [photo:${photos[0].key}] to place your photo inline.`
              : 'Write your review here… add photos on the right and reference them with [photo:1], [photo:2], etc.'
          }
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-page text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-y leading-relaxed"
        />
      </div>

      {/* ── Right: photo panel ────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted px-1">Photos</p>

        {photos.length === 0 && (
          <p className="text-xs text-text-muted bg-card border border-dashed border-border rounded-xl px-3 py-4 text-center">
            Add a photo, then reference it in your text with{' '}
            <code className="font-mono bg-border/60 px-0.5 rounded">[photo:1]</code>
          </p>
        )}

        {photos.map((photo) => (
          <div key={photo.key} className="bg-card border border-border rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-xs font-mono bg-border/60 px-1.5 py-0.5 rounded text-text">
                [photo:{photo.key}]
              </code>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertPhotoToken(photo.key)}
                  title="Insert reference at cursor"
                  className="text-xs px-2 py-1 rounded-md border border-border text-accent hover:border-accent hover:bg-accent/10 transition"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.key)}
                  className="w-7 h-7 rounded-md border border-border text-text-muted hover:text-tier-shame hover:border-border-strong transition"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            </div>

            {photo.previewUrl || photo.url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl || photo.url}
                  alt={photo.caption || `Photo ${photo.key}`}
                  className="w-full max-h-40 object-contain rounded-lg bg-page"
                />
                <label className="inline-block text-xs text-accent hover:underline cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage(photo.key, e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <label className="block">
                <span className="sr-only">Choose photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage(photo.key, e.target.files?.[0])}
                  className="w-full text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-medium file:bg-page file:text-text hover:file:bg-border/40 transition cursor-pointer"
                />
              </label>
            )}

            <input
              type="text"
              value={photo.caption}
              onChange={(e) => updatePhoto(photo.key, { caption: e.target.value })}
              placeholder="Caption (optional)"
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-page text-text text-xs placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addPhoto}
          className="w-full px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-border bg-card text-text hover:border-border-strong transition"
        >
          + Add photo
        </button>
      </div>
    </div>
  )
}
