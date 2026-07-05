import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from './ThemeToggle'
import Container from './Container'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user
    ? (await supabase.from('profiles').select('display_name, avatar_url').eq('id', user.id).single()).data
    : null

  const initials = (profile?.display_name ?? user?.email ?? '?')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
          <Link href="/reviewers" className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors rounded-md">
            Reviewers
          </Link>
          {user && (
            <Link href="/submit" className="px-3 py-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors rounded-md">
              + Submit
            </Link>
          )}
          <div className="ml-3 pl-3 border-l border-border flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Link
                href="/profile"
                className="ml-1 w-8 h-8 rounded-full overflow-hidden bg-accent-soft border border-border hover:border-border-strong transition-colors flex items-center justify-center shrink-0"
                aria-label="Profile"
              >
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name ?? 'Profile'}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs font-medium text-accent select-none">{initials}</span>
                )}
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
