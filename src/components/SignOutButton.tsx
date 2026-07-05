'use client'

import { signOut } from '@/lib/actions/auth'

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition rounded-md hover:bg-page"
    >
      Sign out
    </button>
  )
}
