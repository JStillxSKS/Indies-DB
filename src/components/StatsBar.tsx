import type { MapRecord } from '../types/map'

export function StatsBar({ maps }: { maps: MapRecord[] }) {
  const totalDownloads = maps.reduce((s, m) => s + m.downloads, 0)
  const withExtreme = maps.filter((m) => m.difficulties.extreme > 0).length

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
      {[
        { label: 'Maps', value: maps.length },
        { label: 'Downloads', value: totalDownloads },
        { label: 'With Extreme', value: withExtreme },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-center"
        >
          <div className="text-2xl font-bold text-accent">{s.value}</div>
          <div className="text-xs text-muted mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}