import Container from '@/components/Container'

export default function Loading() {
  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="h-10 w-24 bg-border rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-48 bg-border rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 w-2/3 bg-border rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-border rounded animate-pulse" />
              </div>
              <div className="h-8 w-12 bg-border rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  )
}
