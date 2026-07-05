import type { ReviewScore, RubricAxis } from '@/lib/types'

interface DynamicAxisBreakdownProps {
  axes: RubricAxis[]
  scores: ReviewScore[]
}

export default function AxisBreakdown({ axes, scores }: DynamicAxisBreakdownProps) {
  const scoreByAxis = Object.fromEntries(scores.map((s) => [s.axis_id, s.score]))
  const totalWeight = axes.reduce((s, a) => s + a.weight, 0)

  return (
    <div className="space-y-4">
      {axes.map((axis) => {
        const score = scoreByAxis[axis.id] ?? null
        const pct = score !== null ? (score / 10) * 100 : 0
        const pctOfComposite = totalWeight > 0 ? Math.round((axis.weight / totalWeight) * 100) : 0

        return (
          <div key={axis.id}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{axis.label}</span>
                <span className="text-xs text-text-muted bg-border/60 px-1.5 py-0.5 rounded-full">
                  {pctOfComposite}%
                </span>
              </div>
              <span className="score-display text-xl">
                {score !== null ? score.toFixed(1) : '—'}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="axis-bar h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {axis.description && (
              <p className="text-xs text-text-muted mt-1">{axis.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
