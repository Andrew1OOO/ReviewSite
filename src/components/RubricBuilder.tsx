'use client'

import { useState } from 'react'
import type { AxisDraft } from '@/lib/actions/rubric'

interface RubricBuilderProps {
  initialCategory?: string
  initialAxes?: AxisDraft[]
  submitLabel: string
  onSubmit: (category: string, axes: AxisDraft[]) => Promise<{ error?: string; success?: boolean } | void>
}

const SUGGESTED_AXES: Record<string, AxisDraft[]> = {
  default: [
    { label: 'Taste', description: 'Overall flavour', weight: 3 },
    { label: 'Freshness', description: 'Ingredient quality', weight: 2 },
    { label: 'Texture', description: 'Mouthfeel and contrast', weight: 2 },
    { label: 'Value', description: 'Worth the price', weight: 1 },
  ],
}

function getSuggested(category: string): AxisDraft[] {
  const key = Object.keys(SUGGESTED_AXES).find(
    (k) => k !== 'default' && category.toLowerCase().includes(k)
  )
  return SUGGESTED_AXES[key ?? 'default']
}

export default function RubricBuilder({
  initialCategory = '',
  initialAxes,
  submitLabel,
  onSubmit,
}: RubricBuilderProps) {
  const [category, setCategory] = useState(initialCategory)
  const [axes, setAxes] = useState<AxisDraft[]>(
    initialAxes ?? SUGGESTED_AXES.default
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalWeight = axes.reduce((s, a) => s + a.weight, 0)

  const updateAxis = (i: number, patch: Partial<AxisDraft>) =>
    setAxes(axes.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))

  const removeAxis = (i: number) => setAxes(axes.filter((_, idx) => idx !== i))

  const addAxis = () =>
    setAxes([...axes, { label: '', description: '', weight: 1 }])

  const handleCategoryBlur = () => {
    if (category && axes === SUGGESTED_AXES.default) {
      setAxes(getSuggested(category))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await onSubmit(category, axes)
    setSaving(false)
    if (result && 'error' in result && result.error) {
      setError(result.error)
    } else if (result && 'success' in result) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    // void result (redirect) — nothing to do
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Food category */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Your food
        </label>
        <p className="text-xs text-text-muted mb-3">
          The one thing you are the group expert on. Be specific — "chicken Caesar wrap" beats "wraps".
        </p>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          onBlur={handleCategoryBlur}
          placeholder="e.g. chicken Caesar wrap, spicy wings, smash burger…"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-page text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
        />
      </div>

      {/* Axes */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium">Scoring axes</label>
          <span className="text-xs text-text-muted">
            Total weight: {totalWeight}
          </span>
        </div>
        <p className="text-xs text-text-muted mb-4">
          What matters to you when judging this food? 2–6 axes. Weights are relative — they get normalised automatically.
        </p>

        <div className="space-y-3">
          {axes.map((axis, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={axis.label}
                    onChange={(e) => updateAxis(i, { label: e.target.value })}
                    placeholder="Axis name"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-page text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition font-medium"
                  />
                  <input
                    type="text"
                    value={axis.description}
                    onChange={(e) => updateAxis(i, { description: e.target.value })}
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-page text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-text-muted mb-1">Weight</label>
                    <input
                      type="number"
                      value={axis.weight}
                      onChange={(e) => updateAxis(i, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
                      min={1}
                      max={10}
                      className="w-14 px-2 py-2 rounded-lg border border-border bg-page text-text text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAxis(i)}
                    disabled={axes.length <= 2}
                    className="mt-5 w-7 h-7 rounded-md border border-border text-text-muted hover:text-tier-shame hover:border-border-strong transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Remove axis"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Weight proportion bar */}
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="axis-bar h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalWeight > 0 ? (axis.weight / totalWeight) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">
                {totalWeight > 0 ? Math.round((axis.weight / totalWeight) * 100) : 0}% of composite
              </p>
            </div>
          ))}
        </div>

        {axes.length < 6 && (
          <button
            type="button"
            onClick={addAxis}
            className="mt-3 w-full px-3 py-2 rounded-lg text-sm font-medium border border-dashed border-border bg-card text-text hover:border-border-strong transition"
          >
            + Add axis
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 px-6 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving…' : saved ? 'Saved ✓' : submitLabel}
      </button>
    </form>
  )
}
