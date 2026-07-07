export type DifficultyKey = 'easy' | 'normal' | 'hard' | 'extreme' | 'hardcore'

export type GameModeKey = 'classic' | 'arcade'

export type ScoreRecord = {
  id: string
  map_id: string
  player_name: string
  difficulty: DifficultyKey
  game_mode: GameModeKey
  score: number
  accuracy: number | null
  max_combo: number | null
  mod_version: string | null
  created_at: string
}