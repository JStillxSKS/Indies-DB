import { createClient } from '@supabase/supabase-js'
import type { MapRecord } from '../types/map'
import type { DifficultyKey, ScoreRecord } from '../types/score'
import { demoMapById, demoMapsSorted, demoSearch } from './demoMaps'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)

export const supabase = supabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function coverPublicUrl(coverPath: string | null): string | null {
  if (!supabase || !coverPath) return null
  const { data } = supabase.storage.from('indies').getPublicUrl(coverPath)
  return data.publicUrl
}

export function filePublicUrl(filePath: string): string | null {
  if (!supabase) return null
  const { data } = supabase.storage.from('indies').getPublicUrl(filePath)
  return data.publicUrl
}

export async function fetchMaps(sort: 'newest' | 'downloads', limit = 24): Promise<MapRecord[]> {
  if (!supabase) return demoMapsSorted(sort).slice(0, limit)
  const order = sort === 'downloads' ? 'downloads' : 'created_at'
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .order(order, { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as MapRecord[]
}

export async function fetchMap(id: string): Promise<MapRecord | null> {
  if (!supabase) return demoMapById(id)
  const { data, error } = await supabase.from('maps').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as MapRecord | null
}

export async function searchMaps(query: string): Promise<MapRecord[]> {
  if (!supabase) return query.trim() ? demoSearch(query) : demoMapsSorted('newest')
  if (!query.trim()) return fetchMaps('newest', 50)
  const q = query.trim()
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .or(`title.ilike.%${q}%,artist.ilike.%${q}%,charter.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as MapRecord[]
}

export async function incrementDownload(mapId: string): Promise<void> {
  if (!supabase) return
  await supabase.rpc('increment_download', { map_id: mapId })
}

export type MapFilter = 'all' | 'has_extreme'

export async function fetchMapsFiltered(
  sort: 'newest' | 'downloads',
  filter: MapFilter = 'all',
  limit = 50,
): Promise<MapRecord[]> {
  let maps = await fetchMaps(sort, limit)
  if (filter === 'has_extreme') {
    maps = maps.filter((m) => m.difficulties.extreme > 0)
  }
  return maps
}

export async function fetchUserMaps(userId: string): Promise<MapRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('maps')
    .select('*')
    .eq('mapper_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as MapRecord[]
}

export async function deleteMap(map: MapRecord): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const paths = [map.file_path, map.cover_path].filter(Boolean) as string[]
  if (paths.length) {
    await supabase.storage.from('indies').remove(paths)
  }

  const { error } = await supabase.from('maps').delete().eq('id', map.id)
  if (error) throw error
}

export async function fetchAllMapsForStats(): Promise<MapRecord[]> {
  return fetchMaps('newest', 200)
}

export async function fetchMapScores(
  mapId: string,
  difficulty: DifficultyKey,
  limit = 20,
): Promise<ScoreRecord[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('map_id', mapId)
    .eq('difficulty', difficulty)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }
  return (data ?? []) as ScoreRecord[]
}