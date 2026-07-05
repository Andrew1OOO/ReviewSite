'use client'

import { useState } from 'react'
import { signInWithEmail, signInWithPassword } from '@/lib/actions/auth'
import Container from '@/components/Container'

export default function SignInPage() {
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (mode === 'magic') {
      const result = await signInWithEmail(email)
      setLoading(false)
      if (result?.error) setError(result.error)
      else setSubmitted(true)
    } else {
      const result = await signInWithPassword(email, password)
      setLoading(false)
      if (result?.error) setError(result.error)
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"

  return (
    <main className="flex-1 flex items-center justify-center py-16">
      <Container size="form" className="flex justify-center">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-3xl font-normal text-text mb-2">Sign in</h1>

          <div className="flex rounded-lg border border-border overflow-hidden mb-8 text-sm">
            <button
              type="button"
              onClick={() => { setMode('magic'); setError(null) }}
              className={`flex-1 py-2 transition-colors ${mode === 'magic' ? 'bg-accent text-white font-medium' : 'text-text-muted hover:text-text'}`}
            >
              Magic link
            </button>
            <button
              type="button"
              onClick={() => { setMode('password'); setError(null) }}
              className={`flex-1 py-2 transition-colors ${mode === 'password' ? 'bg-accent text-white font-medium' : 'text-text-muted hover:text-text'}`}
            >
              Password
            </button>
          </div>

          {submitted ? (
            <div className="border border-border rounded-lg p-6 bg-card text-sm text-text">
              <p className="font-medium mb-1">Check your inbox.</p>
              <p className="text-text-muted">A sign-in link is on its way.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">Email address</label>
                <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
              {mode === 'password' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">Password</label>
                  <input id="password" type="password" required autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Signing in…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </Container>
    </main>
  )
}
