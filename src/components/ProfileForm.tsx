'use client'

import { useState } from 'react'

interface ProfileFormProps {
  displayName: string
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean } | void>
}

export default function ProfileForm({ displayName, action }: ProfileFormProps) {
  const [value, setValue] = useState(displayName)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg(null)

    const fd = new FormData()
    fd.set('display_name', value)
    const result = await action(fd)

    if (result && 'error' in result && result.error) {
      setStatus('error')
      setErrorMsg(result.error)
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-start">
      <input
        type="text"
        name="display_name"
        value={value}
        onChange={(e) => { setValue(e.target.value); setStatus('idle') }}
        maxLength={40}
        required
        className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-page text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
      />
      <button
        type="submit"
        disabled={status === 'saving' || value.trim() === displayName}
        className="px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
      >
        {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save'}
      </button>

      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-600 mt-1 absolute">{errorMsg}</p>
      )}
    </form>
  )
}
