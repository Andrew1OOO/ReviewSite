import Container from '@/components/Container'

export default function Loading() {
  return (
    <main className="flex-1">
      <Container size="form" className="py-8">
        <div className="h-9 w-40 bg-border rounded-lg animate-pulse mb-8" />
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-border rounded animate-pulse" />
            <div className="h-10 bg-card border border-border rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-border rounded animate-pulse" />
            <div className="h-10 bg-card border border-border rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-border rounded animate-pulse" />
            <div className="h-32 bg-card border border-border rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-border rounded-lg animate-pulse" />
        </div>
      </Container>
    </main>
  )
}
