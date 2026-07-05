import Link from 'next/link'
import Container from '@/components/Container'

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <Container size="form" className="py-24 text-center">
        <p className="font-serif text-8xl text-border mb-6 select-none">404</p>
        <h1 className="font-serif text-2xl text-text mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-8">
          This page doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/"
          className="btn inline-flex px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition"
        >
          Back to feed
        </Link>
      </Container>
    </main>
  )
}
