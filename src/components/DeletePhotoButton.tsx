'use client'

import { useState } from 'react'

interface DeletePhotoButtonProps {
  photoId: string
  wrapId: string
  action: (photoId: string, wrapId: string) => Promise<{ error?: string } | { success: boolean }>
}

export default function DeletePhotoButton({ photoId, wrapId, action }: DeletePhotoButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleDelete() {
    if (!confirm('Remove this photo?')) return
    setDeleting(true)
    const result = await action(photoId, wrapId)
    if ('error' in result && result.error) {
      alert(result.error)
      setDeleting(false)
    } else {
      setDeleted(true)
    }
  }

  if (deleted) return null

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition disabled:opacity-50"
      title="Remove photo"
    >
      ×
    </button>
  )
}
