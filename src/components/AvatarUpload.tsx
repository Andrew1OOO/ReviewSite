'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '@/lib/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  displayName: string
}

export default function AvatarUpload({ currentUrl, displayName }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const displayUrl = preview ?? currentUrl

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('idle')
    setErrorMsg(null)
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setStatus('uploading')
    setErrorMsg(null)

    const fd = new FormData()
    fd.set('avatar', file)
    const result = await uploadAvatar(fd)

    if (result && 'error' in result && result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const hasNewFile = !!preview

  return (
    <div className="flex items-center gap-5">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden bg-accent-soft border-2 border-border hover:border-border-strong transition group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Change profile picture"
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={!!preview} /* blob URLs can't go through Next image */
          />
        ) : (
          <span className="text-xl font-serif text-accent select-none">{initials}</span>
        )}
        {/* hover overlay */}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-medium">Change</span>
        </span>
      </button>

      <div className="flex flex-col gap-2 min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
        <p className="text-sm text-text-muted">
          {hasNewFile ? 'Ready to upload.' : 'Click your avatar to change it.'}
        </p>
        {hasNewFile && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="btn px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition disabled:opacity-60"
            >
              {status === 'uploading' ? 'Uploading…' : status === 'saved' ? 'Saved ✓' : 'Save photo'}
            </button>
            <button
              type="button"
              onClick={() => { setPreview(null); setStatus('idle'); if (inputRef.current) inputRef.current.value = '' }}
              className="px-3 py-1.5 rounded-lg text-xs text-text-muted border border-border hover:border-border-strong transition"
            >
              Cancel
            </button>
          </div>
        )}
        {status === 'error' && errorMsg && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}
