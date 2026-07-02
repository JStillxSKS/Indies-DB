import type { DifficultyCounts } from '../types/map'

const LABELS = [
  { key: 'easy' as const, label: 'Easy', short: 'E' },
  { key: 'normal' as const, label: 'Normal', short: 'N' },
  { key: 'hard' as const, label: 'Hard', short: 'H' },
  { key: 'extreme' as const, label: 'Extreme', short: 'X' },
] as const

type DifficultyBadgesProps = {
  counts: DifficultyCounts
  size?: 'sm' | 'md'
}

export function DifficultyBadges({ counts, size = 'sm' }: DifficultyBadgesProps) {
  const pill =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px] gap-1'
      : 'px-2 py-1 text-xs gap-1.5'

  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label="Difficulty note counts">
      {LABELS.map(({ key, label, short }) => {
        const n = counts[key]
        const active = n > 0
        return (
          <span
            key={key}
            role="listitem"
            title={`${label}: ${n} notes`}
            className={`inline-flex items-center rounded-md border font-mono tabular-nums ${pill} ${
              active
                ? 'border-accent/25 bg-accent/10 text-text'
                : 'border-border/60 bg-surface2/50 text-muted/35'
            }`}
          >
            <span className={active ? 'text-accent font-semibold' : ''}>{short}</span>
            {active ? <span className="text-muted">{n.toLocaleString()}</span> : null}
          </span>
        )
      })}
    </div>
  )
}