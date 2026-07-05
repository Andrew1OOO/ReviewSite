import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from './ThemeToggle'
import Container from './Container'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <Container className="h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-text hover:text-accent transition-colors">
          Bites
        </Link>
        <nav className="flex items-center gap-0.5">
          <Link href="/" className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors rounded-md">
            Home
          </Link>
          <Link href="/rankings" className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors rounded-md">
            Rankings
          </Link>
          {user && (
            <Link href="/submit" className="px-3 py-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors rounded-md">
              + Submit
            </Link>
          )}
          <div className="ml-3 pl-3 border-l border-border flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Link href="/profile" className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors rounded-md">
                Profile
              </Link>
            ) : (
              <Link href="/signin" className="btn px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </Container>
    </header>
  )
}
