import type { MapRecord } from '../types/map'

/** Placeholder catalog for UI preview when Supabase is not configured */
export const DEMO_MAPS: MapRecord[] = [
  {
    id: 'demo-1',
    title: 'Demo Track One',
    artist: 'Sample Artist',
    charter: 'DemoMapper',
    mapper_id: '00000000-0000-0000-0000-000000000001',
    file_path: 'maps/demo/demo-1.indies',
    cover_path: null,
    bpm_est: 128,
    difficulties: { easy: 24, normal: 96, hard: 210, extreme: 412 },
    downloads: 84,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Demo Track Two',
    artist: 'Another Band',
    charter: 'ChartFan42',
    mapper_id: '00000000-0000-0000-0000-000000000002',
    file_path: 'maps/demo/demo-2.indies',
    cover_path: null,
    bpm_est: 142,
    difficulties: { easy: 0, normal: 0, hard: 156, extreme: 389 },
    downloads: 41,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'Demo Track Three',
    artist: 'Test Ensemble',
    charter: 'RhythmLab',
    mapper_id: '00000000-0000-0000-0000-000000000003',
    file_path: 'maps/demo/demo-3.indies',
    cover_path: null,
    bpm_est: 96,
    difficulties: { easy: 18, normal: 72, hard: 180, extreme: 301 },
    downloads: 127,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Demo Track Four',
    artist: 'Placeholder Act',
    charter: 'BeatForge',
    mapper_id: '00000000-0000-0000-0000-000000000004',
    file_path: 'maps/demo/demo-4.indies',
    cover_path: null,
    bpm_est: 168,
    difficulties: { easy: 32, normal: 110, hard: 245, extreme: 520 },
    downloads: 203,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Demo Track Five',
    artist: 'Synth Pack',
    charter: 'NightChart',
    mapper_id: '00000000-0000-0000-0000-000000000005',
    file_path: 'maps/demo/demo-5.indies',
    cover_path: null,
    bpm_est: 118,
    difficulties: { easy: 0, normal: 45, hard: 120, extreme: 278 },
    downloads: 19,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
]

export function demoMapsSorted(sort: 'newest' | 'downloads'): MapRecord[] {
  const copy = [...DEMO_MAPS]
  if (sort === 'downloads') return copy.sort((a, b) => b.downloads - a.downloads)
  return copy.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function demoSearch(query: string): MapRecord[] {
  const q = query.toLowerCase()
  return DEMO_MAPS.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.artist.toLowerCase().includes(q) ||
      m.charter.toLowerCase().includes(q),
  )
}

export function demoMapById(id: string): MapRecord | null {
  return DEMO_MAPS.find((m) => m.id === id) ?? null
}