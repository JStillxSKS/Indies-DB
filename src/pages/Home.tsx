import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { fetchAllMapsForStats, fetchMaps } from '../lib/supabase'
import { MapScrollRow } from '../components/MapScrollRow'
import { StatsBar } from '../components/StatsBar'
import { LoadingGrid } from '../components/LoadingGrid'

export function Home() {
  const [recent, setRecent] = useState<MapRecord[]>([])
  const [popular, setPopular] = useState<MapRecord[]>([])
  const [allMaps, setAllMaps] = useState<MapRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchMaps('newest', 12),
      fetchMaps('downloads', 12),
      fetchAllMapsForStats(),
    ])
      .then(([r, p, all]) => {
        setRecent(r)
        setPopular(p)
        setAllMaps(all)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 relative">
          <p className="text-accent text-sm font-semibold uppercase tracking-widest mb-3">
            Smash Drums
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 max-w-2xl leading-tight">
            Indies-DB
          </h1>
          <p className="text-muted max-w-xl text-lg mb-2 -mt-2">
            Community maps for mappers
          </p>
          <p className="text-muted max-w-xl mb-8">
            Upload finished .indies packs, browse charts, and download — all difficulties in one file.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/maps"
              className="px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm"
            >
              Browse maps
            </Link>
            <Link
              to="/upload"
              className="px-5 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/50 text-sm font-medium"
            >
              Upload a map
            </Link>
            <Link
              to="/install"
              className="px-5 py-2.5 rounded-lg text-muted hover:text-text text-sm"
            >
              How to install →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {!loading && allMaps.length > 0 && <StatsBar maps={allMaps} />}

        {loading ? (
          <LoadingGrid count={5} />
        ) : recent.length === 0 && popular.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <p className="text-muted mb-4">No maps yet. Be the first to upload!</p>
            <Link to="/upload" className="text-accent hover:text-accent-hover font-medium">
              Upload a map →
            </Link>
          </div>
        ) : (
          <>
            <MapScrollRow title="Recently Added" maps={recent} />
            <MapScrollRow title="Most Downloaded" maps={popular} />
          </>
        )}
      </div>
    </div>
  )
}