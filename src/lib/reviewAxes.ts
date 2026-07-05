import type { RubricAxis } from '@/lib/types'

/** Scores keyed by axis id */
export type AxisScores = Record<string, number>
/** Notes keyed by axis id */
export type AxisNotes = Record<string, string>

export const defaultScore = () => 5

export const defaultScores = (axes: RubricAxis[]): AxisScores =>
  Object.fromEntries(axes.map((a) => [a.id, defaultScore()]))

export const emptyNotes = (axes: RubricAxis[]): AxisNotes =>
  Object.fromEntries(axes.map((a) => [a.id, '']))

/**
 * Compute a 0–100 composite from a set of axes and scores.
 * Weights are normalised so they always sum to 1, regardless of what
 * values the user entered.
 */
export function computeComposite(axes: RubricAxis[], scores: AxisScores): number {
  const totalWeight = axes.reduce((s, a) => s + a.weight, 0)
  if (totalWeight === 0) return 0
  return axes.reduce((sum, axis) => {
    const score = scores[axis.id] ?? 0
    return sum + (score * axis.weight) / totalWeight
  }, 0) * 10
}
