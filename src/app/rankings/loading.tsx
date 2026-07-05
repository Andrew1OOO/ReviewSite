import Container from '@/components/Container'

export default function Loading() {
  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7">
          <div className="h-10 w-36 bg-border rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-24 bg-border rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="h-6 w-7 bg-border rounded animate-pulse shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-1/2 bg-border rounded animate-pulse" />
                <div className="h-3 w-1/4 bg-border rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-5 w-16 bg-border rounded-full animate-pulse" />
                <div className="h-8 w-10 bg-border rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  )
}
