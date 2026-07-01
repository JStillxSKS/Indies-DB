import type { DifficultyCounts } from '../types/map'

const ROWS = [
  { key: 'easy' as const, label: 'Easy' },
  { key: 'normal' as const, label: 'Normal' },
  { key: 'hard' as const, label: 'Hard' },
  { key: 'extreme' as const, label: 'Extreme' },
]

export function DifficultyBar({ counts }: { counts: DifficultyCounts }) {
  const max = Math.max(counts.extreme, counts.hard, counts.normal, counts.easy, 1)

  return (
    <div className="space-y-3">
      {ROWS.map(({ key, label }) => {
        const n = counts[key]
        const pct = Math.round((n / max) * 100)
        return (
          <div key={key} className="grid grid-cols-[80px_1fr_64px] items-center gap-3 text-sm">
            <span className="text-muted">{label}</span>
            <div className="h-2 rounded-full bg-surface2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  background: 'linear-gradient(90deg, #e8262a, #ffb800)',
                  width: `${pct}%`,
                  opacity: n > 0 ? 1 : 0.2,
                }}
              />
            </div>
            <span className="text-right text-muted font-mono text-xs">{n} notes</span>
          </div>
        )
      })}
    </div>
  )
}