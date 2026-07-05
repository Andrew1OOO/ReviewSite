import Link from 'next/link'

interface PaginationProps {
  page: number
  totalPages: number
  basePath: string   // e.g. "/" or "/rankings"
}

export default function Pagination({ page, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const sep = basePath.includes('?') ? '&' : '?'

  const prev = page > 1 ? `${basePath}${sep}page=${page - 1}` : null
  const next = page < totalPages ? `${basePath}${sep}page=${page + 1}` : null

  // Show at most 5 page numbers centred around current page
  const delta = 2
  const start = Math.max(1, page - delta)
  const end   = Math.min(totalPages, page + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btnBase = 'inline-flex items-center justify-center h-9 min-w-[2.25rem] px-3 rounded-lg text-sm transition'
  const btnActive = 'bg-accent text-white font-medium'
  const btnInactive = 'text-text-muted hover:text-text hover:bg-border/50 border border-border'
  const btnDisabled = 'text-text-muted/40 cursor-not-allowed border border-border/50'

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-8">
      {prev ? (
        <Link href={prev} className={`${btnBase} ${btnInactive}`} aria-label="Previous page">
          ←
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled="true">←</span>
      )}

      {start > 1 && (
        <>
          <Link href={`${basePath}${sep}page=1`} className={`${btnBase} ${btnInactive}`}>1</Link>
          {start > 2 && <span className="px-1 text-text-muted text-sm">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={`${basePath}${sep}page=${p}`}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-text-muted text-sm">…</span>}
          <Link href={`${basePath}${sep}page=${totalPages}`} className={`${btnBase} ${btnInactive}`}>{totalPages}</Link>
        </>
      )}

      {next ? (
        <Link href={next} className={`${btnBase} ${btnInactive}`} aria-label="Next page">
          →
        </Link>
      ) : (
        <span className={`${btnBase} ${btnDisabled}`} aria-disabled="true">→</span>
      )}
    </nav>
  )
}
