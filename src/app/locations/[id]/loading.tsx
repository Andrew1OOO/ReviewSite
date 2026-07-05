import Container from '@/components/Container'

export default function Loading() {
  return (
    <main className="flex-1">
      <Container size="reading" className="py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 space-y-2">
            <div className="h-9 w-2/3 bg-border rounded-lg animate-pulse" />
            <div className="h-4 w-1/3 bg-border rounded animate-pulse" />
          </div>
          <div className="h-16 w-16 bg-border rounded-lg animate-pulse shrink-0" />
        </div>
        <div className="h-6 w-20 bg-border rounded-full animate-pulse mb-8 mt-3" />

        {/* Review cards */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-8 w-12 bg-border rounded animate-pulse" />
                  <div className="h-3 w-24 bg-border rounded animate-pulse" />
                </div>
                <div className="h-4 w-28 bg-border rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-border rounded animate-pulse" />
                      <div className="h-4 w-8 bg-border rounded animate-pulse" />
                    </div>
                    <div className="h-1.5 bg-border rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  )
}
