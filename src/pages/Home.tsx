import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { fetchMaps } from '../lib/supabase'
import { MapScrollRow } from '../components/MapScrollRow'

export function Home() {
  const [recent, setRecent] = useState<MapRecord[]>([])
  const [popular, setPopular] = useState<MapRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchMaps('newest', 12), fetchMaps('downloads', 12)])
      .then(([r, p]) => {
        setRecent(r)
        setPopular(p)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="mb-12 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Smash Drums Modding Community
        </h1>
        <p className="text-muted max-w-xl">
          Upload, browse, and download custom Indies maps. One .indies file — all difficulties included.
        </p>
        <Link
          to="/maps"
          className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium text-sm"
        >
          Browse all maps →
        </Link>
      </section>

      {loading ? (
        <p className="text-muted text-center py-12">Loading maps…</p>
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
  )
}