'use client'

interface AxisSliderProps {
  name: string
  label: string
  value: number
  onChange: (value: number) => void
  description?: string
  note?: string
  onNoteChange?: (note: string) => void
}

export default function AxisSlider({
  name,
  label,
  value,
  onChange,
  description,
  note,
  onNoteChange,
}: AxisSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label htmlFor={name} className="text-sm font-medium text-text block">
            {label}
          </label>
          {description && (
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
        <span className="score-display text-3xl shrink-0 w-14 text-right">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        id={name}
        name={name}
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-border cursor-pointer"
      />
      <div className="flex justify-between text-xs text-text-muted/60 px-0.5">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
      {onNoteChange && (
        <input
          type="text"
          value={note ?? ''}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={`Note on ${label.toLowerCase()} (optional)`}
          className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-card text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
        />
      )}
    </div>
  )
}
