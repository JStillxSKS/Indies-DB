import { useEffect, useState } from 'react'
import type { DifficultyKey, GameModeKey, ScoreRecord } from '../types/score'
import { fetchMapScores } from '../lib/supabase'
import {
  defaultDifficultyForMode,
  DIFFICULTIES_BY_MODE,
  GAME_MODES,
} from '../lib/leaderboardConfig'

export function Leaderboard({ mapId }: { mapId: string }) {
  const [gameMode, setGameMode] = useState<GameModeKey>('classic')
  const [difficulty, setDifficulty] = useState<DifficultyKey>('hardcore')
  const [scores, setScores] = useState<ScoreRecord[]>([])
  const [loading, setLoading] = useState(true)

  const difficulties = DIFFICULTIES_BY_MODE[gameMode]

  useEffect(() => {
    if (!difficulties.some((d) => d.key === difficulty)) {
      setDifficulty(defaultDifficultyForMode(gameMode))
    }
  }, [gameMode, difficulty, difficulties])

  useEffect(() => {
    setLoading(true)
    fetchMapScores(mapId, difficulty, gameMode)
      .then(setScores)
      .finally(() => setLoading(false))
  }, [mapId, difficulty, gameMode])

  const rowGrid =
    'grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_auto_auto] gap-2 sm:gap-4 items-center px-3 py-2.5 text-sm'

  const tabClass = (active: boolean) =>
    active
      ? 'px-2.5 py-1 rounded-md text-xs btn-primary shadow-none'
      : 'px-2.5 py-1 rounded-md text-xs border border-border bg-surface2 text-muted hover:text-text'

  return (
    <section className="rounded-xl border border-border bg-surface2/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text uppercase tracking-wide">
            Leaderboard
          </h2>
          <p className="text-xs text-muted mt-1">
            {gameMode === 'classic' ? 'Classic' : 'Arcade'} · community high scores
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {GAME_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setGameMode(m.key)}
                className={tabClass(gameMode === m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {difficulties.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDifficulty(d.key)}
                className={tabClass(difficulty === d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div
          className={`${rowGrid} bg-surface border-b border-border text-xs font-semibold text-muted uppercase tracking-wide`}
        >
          <span className="text-center">#</span>
          <span>Player</span>
          <span className="text-right">Score</span>
          <span className="hidden sm:block text-right">Stats</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted py-6 text-center bg-surface">Loading scores…</p>
        ) : scores.length === 0 ? (
          <p className="text-sm text-muted py-8 text-center bg-surface">No scores yet</p>
        ) : (
          <ol className="divide-y divide-border">
            {scores.map((row, i) => (
              <li key={row.id} className={`${rowGrid} bg-surface`}>
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
      </div>
    </section>
  )
}