import type { DifficultyCounts } from '../types/map'

const LABELS = [
  { key: 'easy' as const, label: 'E' },
  { key: 'normal' as const, label: 'N' },
  { key: 'hard' as const, label: 'H' },
  { key: 'extreme' as const, label: 'X' },
]

export function DifficultyBadges({ counts }: { counts: DifficultyCounts }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-mono">
      {LABELS.map(({ key, label }) => {
        const n = counts[key]
        const active = n > 0
        return (
          <span
            key={key}
            title={`${label}: ${n} notes`}
            className={active ? 'text-accent' : 'text-muted/40'}
          >
            {label}
            {active ? <span className="text-muted ml-0.5">{n}</span> : null}
          </span>
        )
      })}
    </div>
  )
}