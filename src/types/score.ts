export type DifficultyKey = 'easy' | 'normal' | 'hard' | 'extreme'

export type ScoreRecord = {
  id: string
  map_id: string
  player_name: string
  difficulty: DifficultyKey
  score: number
  accuracy: number | null
  max_combo: number | null
  mod_version: string | null
  created_at: string
}