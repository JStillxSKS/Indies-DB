import type { DifficultyKey, GameModeKey } from '../types/score'

export const GAME_MODES: { key: GameModeKey; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'arcade', label: 'Arcade' },
]

export const DIFFICULTIES_BY_MODE: Record<GameModeKey, { key: DifficultyKey; label: string }[]> = {
  classic: [
    { key: 'hardcore', label: 'Hardcore' },
    { key: 'extreme', label: 'Extreme' },
    { key: 'hard', label: 'Hard' },
    { key: 'normal', label: 'Normal' },
    { key: 'easy', label: 'Easy' },
  ],
  arcade: [
    { key: 'extreme', label: 'Extreme' },
    { key: 'hard', label: 'Hard' },
    { key: 'normal', label: 'Normal' },
    { key: 'easy', label: 'Easy' },
  ],
}

export function defaultDifficultyForMode(mode: GameModeKey): DifficultyKey {
  return mode === 'classic' ? 'hardcore' : 'extreme'
}