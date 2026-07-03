export type DifficultyCounts = {
  easy: number
  normal: number
  hard: number
  extreme: number
}

export type MapRecord = {
  id: string
  title: string
  artist: string
  charter: string
  mapper_id: string
  file_path: string
  cover_path: string | null
  bpm_est: number | null
  difficulties: DifficultyCounts
  explicit: boolean
  downloads: number
  created_at: string
}

export type ParsedIndies = {
  title: string
  artist: string
  charter: string
  bpmEst: number
  difficulties: DifficultyCounts
  coverBlob: Blob | null
  file: File
}