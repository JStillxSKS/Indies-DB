import { useEffect, useState } from 'react'
import type { DifficultyKey, ScoreRecord } from '../types/score'
import { fetchMapScores } from '../lib/supabase'

const DIFFICULTIES: { key: DifficultyKey; label: string }[] = [
  { key: 'extreme', label: 'Extreme' },
  { key: 'hard', label: 'Hard' },
  { key: 'normal', label: 'Normal' },
  { key: 'easy', label: 'Easy' },
]

export function Leaderboard({ mapId }: { mapId: string }) {
  const [difficulty, setDifficulty] = useState<DifficultyKey>('extreme')
  const [scores, setScores] = useState<ScoreRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchMapScores(mapId, difficulty)
      .then(setScores)
      .finally(() => setLoading(false))
  }, [mapId, difficulty])

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
          Leaderboard
        </h2>
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDifficulty(d.key)}
              className={
                difficulty === d.key
                  ? 'px-2.5 py-1 rounded-md text-xs btn-primary shadow-none'
                  : 'px-2.5 py-1 rounded-md text-xs border border-border bg-surface2 text-muted hover:text-text'
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading scores…</p>
      ) : scores.length === 0 ? (
        <p className="text-sm text-muted py-4 text-center border border-border rounded-lg bg-surface2/50">
          No scores yet — finish a run and tap <span className="text-text">Discord → Submit Score</span> in-game.
        </p>
      ) : (
        <ol className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {scores.map((row, i) => (
            <li
              key={row.id}
              className="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_auto_auto] gap-2 sm:gap-4 items-center px-3 py-2.5 bg-surface text-sm"
            >
              <span
                className={`font-mono tabular-nums text-center ${
                  i === 0 ? 'text-accent font-bold' : i < 3 ? 'text-text font-semibold' : 'text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate font-medium">{row.player_name}</span>
              <span className="font-mono tabular-nums text-accent text-right">
                {row.score.toLocaleString()}
              </span>
              <span className="hidden sm:block text-xs text-muted text-right tabular-nums">
                {row.accuracy != null ? `${Math.round(row.accuracy * 100)}%` : '—'}
                {row.max_combo != null ? ` · ${row.max_combo} combo` : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}