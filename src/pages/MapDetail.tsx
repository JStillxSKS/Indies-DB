import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { coverPublicUrl, fetchMap, filePublicUrl, incrementDownload } from '../lib/supabase'
import { DifficultyBar } from '../components/DifficultyBar'

export function MapDetail() {
  const { id } = useParams<{ id: string }>()
  const [map, setMap] = useState<MapRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchMap(id)
      .then((m) => {
        if (!m) setNotFound(true)
        else setMap(m)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleDownload() {
    if (!map) return
    if (map.id.startsWith('demo-')) {
      alert('Demo mode — connect Supabase to enable real downloads.')
      return
    }
    const url = filePublicUrl(map.file_path)
    if (!url) return
    await incrementDownload(map.id)
    setMap({ ...map, downloads: map.downloads + 1 })
    const a = document.createElement('a')
    a.href = url
    a.download = `${map.title}.indies`
    a.click()
  }

  if (loading) return <p className="text-muted text-center py-20">Loading…</p>
  if (notFound || !map) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Map not found.</p>
        <Link to="/maps" className="text-accent">← Back to maps</Link>
      </div>
    )
  }

  const cover = coverPublicUrl(map.cover_path)
  const date = new Date(map.created_at).toLocaleDateString()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/maps" className="text-sm text-muted hover:text-text mb-6 inline-block">
        ← Back to maps
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl bg-surface2 border border-border overflow-hidden shrink-0 mx-auto sm:mx-0">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-muted/30">♪</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{map.title}</h1>
          <p className="text-lg text-muted mb-4">{map.artist}</p>
          <p className="text-sm text-muted mb-1">
            Charter: <span className="text-text">{map.charter}</span>
            {map.bpm_est ? ` · ~${map.bpm_est} BPM` : ''}
          </p>
          <p className="text-sm text-muted mb-6">
            Uploaded {date} · {map.downloads} downloads
          </p>

          <button
            type="button"
            onClick={handleDownload}
            className="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold mb-8"
          >
            Download .indies
          </button>

          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
            Difficulties
          </h2>
          <DifficultyBar counts={map.difficulties} />

          <Link to="/install" className="inline-block mt-8 text-sm text-accent hover:text-accent-hover">
            How to install →
          </Link>
        </div>
      </div>
    </div>
  )
}