import { ReviewBlock } from '@/lib/types'

type PhotoBlock = Extract<ReviewBlock, { type: 'photo' }>

/** Tokenize text into literal string segments and photo-key references. */
function tokenize(text: string | undefined | null): Array<{ kind: 'text'; value: string } | { kind: 'photo'; key: number }> {
  if (!text) return []
  const parts = text.split(/(\[photo:\d+\])/g)
  return parts
    .filter((p) => p.length > 0)
    .map((p) => {
      const match = p.match(/^\[photo:(\d+)\]$/)
      if (match) return { kind: 'photo' as const, key: parseInt(match[1], 10) }
      return { kind: 'text' as const, value: p }
    })
}

interface PhotoFigureProps {
  photo: PhotoBlock
}

function PhotoFigure({ photo }: PhotoFigureProps) {
  return (
    <figure className="my-4">
      <div className="rounded-lg overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || 'Review photo'}
          loading="lazy"
          className="w-full h-auto max-h-[32rem] object-contain"
        />
      </div>
      {photo.caption && (
        <figcaption className="text-xs text-text-muted mt-1.5 text-center">{photo.caption}</figcaption>
      )}
    </figure>
  )
}

interface InlineContentProps {
  content: string
  photoMap: Map<number, PhotoBlock>
}

/**
 * Split a content string into paragraph chunks on double-newlines,
 * then within each chunk expand [photo:N] tokens into inline figures.
 */
function InlineContent({ content, photoMap }: InlineContentProps) {
  // Split on paragraph breaks first
  const paragraphs = content.split(/\n\n+/)

  return (
    <>
      {paragraphs.map((para, pi) => {
        const tokens = tokenize(para)

        // Pure-text paragraph — fast path
        if (tokens.every((t) => t.kind === 'text')) {
          // Single-line paragraph
          if (!para.includes('\n')) {
            return <p key={pi} className="text-sm text-text leading-relaxed">{para}</p>
          }
          // Multi-line paragraph: preserve hard line breaks
          const lines = para.split('\n')
          return (
            <p key={pi} className="text-sm text-text leading-relaxed">
              {lines.map((line, li) => (
                <span key={li}>
                  {line}
                  {li < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          )
        }

        // Mixed paragraph: photo tokens break out of the <p>
        return (
          <div key={pi}>
            {tokens.map((token, i) => {
              if (token.kind === 'photo') {
                const photo = photoMap.get(token.key)
                if (!photo) return null
                return <PhotoFigure key={i} photo={photo} />
              }
              if (!token.value.trim()) return null
              const lines = token.value.split('\n')
              return (
                <p key={i} className="text-sm text-text leading-relaxed">
                  {lines.map((line, li) => (
                    <span key={li}>
                      {line}
                      {li < lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              )
            })}
          </div>
        )
      })}
    </>
  )
}

export default function ReviewBody({ blocks }: { blocks: ReviewBlock[] }) {
  // Build a key → photo lookup so text blocks can expand tokens
  const photoMap = new Map<number, PhotoBlock>()
  for (const b of blocks) {
    if (b.type === 'photo') photoMap.set(b.key, b)
  }

  // Track which photo keys have already been rendered inline inside text blocks
  // so orphan photos (never referenced) can still be shown at the end.
  const renderedKeys = new Set<number>()

  const textBlockElements: React.ReactNode[] = []

  for (const block of blocks) {
    if (block.type === 'photo') continue // handled inline or at the end
    // Guard against old 'image' blocks persisted before the migration
    if (!('content' in block)) continue

    const tokens = tokenize(block.content)
    // Collect which photo keys this block references
    for (const t of tokens) {
      if (t.kind === 'photo') renderedKeys.add(t.key)
    }

    if (block.type === 'heading') {
      textBlockElements.push(
        <h3 key={block.content + textBlockElements.length} className="font-serif text-lg text-text mt-6 first:mt-0">
          <InlineContent content={block.content} photoMap={photoMap} />
        </h3>
      )
    } else {
      textBlockElements.push(
        <div key={block.content + textBlockElements.length} className="space-y-3">
          <InlineContent content={block.content} photoMap={photoMap} />
        </div>
      )
    }
  }

  // Any photos not referenced inline are appended at the end
  const orphanPhotos = blocks.filter(
    (b): b is PhotoBlock => b.type === 'photo' && !renderedKeys.has(b.key)
  )

  return (
    <div className="space-y-4">
      {textBlockElements}
      {orphanPhotos.map((photo) => (
        <PhotoFigure key={photo.key} photo={photo} />
      ))}
    </div>
  )
}
