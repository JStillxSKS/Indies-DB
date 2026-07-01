import { useEffect, useState } from 'react'
import type { MapRecord } from '../types/map'
import { fetchMapsFiltered, searchMaps, type MapFilter } from '../lib/supabase'
import { MapRow } from '../components/MapRow'

type Sort = 'newest' | 'downloads'

export function Maps() {
  const [sort, setSort] = useState<Sort>('newest')
  const [filter, setFilter] = useState<MapFilter>('all')
  const [query, setQuery] = useState('')
  const [maps, setMaps] = useState<MapRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const task = query.trim()
      ? searchMaps(query).then((results) =>
          filter === 'has_extreme'
            ? results.filter((m) => m.difficulties.extreme > 0)
            : results,
        )
      : fetchMapsFiltered(sort, filter, 50)

    task.then(setMaps).finally(() => setLoading(false))
  }, [sort, filter, query])

  const tabs: { id: Sort; label: string }[] = [
    { id: 'newest', label: 'Newest' },
    { id: 'downloads', label: 'Most Downloaded' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Maps</h1>

      <input
        type="search"
        placeholder="Search title, artist, mapper…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-md mb-4 px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-muted focus:outline-none focus:border-accent"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {!query &&
          tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSort(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === t.id
                  ? 'btn-primary shadow-none'
                  : 'bg-surface2 text-muted hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}

        <button
          type="button"
          onClick={() => setFilter(filter === 'all' ? 'has_extreme' : 'all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'has_extreme'
              ? 'bg-surface2 text-accent border border-accent/40'
              : 'bg-surface2 text-muted hover:text-text'
          }`}
        >
          {filter === 'has_extreme' ? '✓ Has Extreme' : 'Has Extreme'}
        </button>
      </div>

      {loading ? (
        <p className="text-muted py-12 text-center">Loading…</p>
      ) : maps.length === 0 ? (
        <p className="text-muted py-12 text-center">No maps found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {maps.map((m) => (
            <MapRow key={m.id} map={m} />
          ))}
        </div>
      )}
    </div>
  )
}