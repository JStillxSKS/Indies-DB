import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { MapRecord } from '../types/map'
import { deleteMap, fetchUserMaps, supabaseConfigured } from '../lib/supabase'
import { MapRow } from '../components/MapRow'

export function MyMaps() {
  const { user, loading: authLoading } = useAuth()
  const [maps, setMaps] = useState<MapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !supabaseConfigured) {
      setLoading(false)
      return
    }
    fetchUserMaps(user.id).then(setMaps).finally(() => setLoading(false))
  }, [user])

  if (!supabaseConfigured) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center text-muted">
        Connect Supabase to manage your uploads.
      </div>
    )
  }

  if (authLoading) return <p className="text-muted text-center py-20">Loading…</p>

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted mb-4">Sign in to see your maps.</p>
        <Link to="/login" className="text-accent">Login →</Link>
      </div>
    )
  }

  async function handleDelete(map: MapRecord) {
    if (!confirm(`Delete "${map.title}"? This cannot be undone.`)) return
    setDeleting(map.id)
    try {
      await deleteMap(map)
      setMaps((prev) => prev.filter((m) => m.id !== map.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Maps</h1>
        <Link
          to="/upload"
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium"
        >
          Upload new
        </Link>
      </div>

      {loading ? (
        <p className="text-muted py-12 text-center">Loading…</p>
      ) : maps.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted mb-4">You haven&apos;t uploaded any maps yet.</p>
          <Link to="/upload" className="text-accent font-medium">Upload your first map →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {maps.map((m) => (
            <div key={m.id} className="relative group">
              <MapRow map={m} />
              <button
                type="button"
                disabled={deleting === m.id}
                onClick={() => handleDelete(m)}
                className="absolute top-3 right-3 px-2 py-1 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deleting === m.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}