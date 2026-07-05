import Container from '@/components/Container'

export default function Loading() {
  return (
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-7">
          <div className="h-10 w-36 bg-border rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-24 bg-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="w-11 h-11 rounded-full bg-border animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-border rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-border rounded animate-pulse" />
              </div>
              <div className="text-right space-y-1 shrink-0">
                <div className="h-4 w-6 bg-border rounded animate-pulse ml-auto" />
                <div className="h-3 w-10 bg-border rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  )
}
