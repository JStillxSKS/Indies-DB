import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { MapRecord } from '../types/map'
import {
  coverPublicUrl,
  deleteMap,
  fetchMap,
  filePublicUrl,
  incrementDownload,
  supabaseConfigured,
} from '../lib/supabase'
import { DifficultyBar } from '../components/DifficultyBar'
import { Leaderboard } from '../components/Leaderboard'

export function MapDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [map, setMap] = useState<MapRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwner = user && map && user.id === map.mapper_id

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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!map || !confirm(`Delete "${map.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteMap(map)
      navigate('/my-maps')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
      setDeleting(false)
    }
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
  const ogTitle = `${map.title} — ${map.artist}`
  const ogDescription = `Chart by ${map.charter} · Indies-DB`
  const ogImage = cover ?? `${window.location.origin}/og-default.svg`
  const pageUrl = window.location.href

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Helmet>
        <title>{ogTitle} · Indies-DB</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Indies-DB" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={pageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <Link to="/maps" className="text-sm text-muted hover:text-text mb-6 inline-block">
        ← Back to maps
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-xl bg-surface2 border border-border overflow-hidden shrink-0 mx-auto sm:mx-0 shadow-lg shadow-black/20">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-muted/30">♪</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">{map.title}</h1>
          <p className="text-lg text-muted mb-4">{map.artist}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-sm text-muted px-3 py-1.5 rounded-lg bg-surface2 border border-border">
              Charter <span className="text-text">{map.charter}</span>
            </span>
            {map.bpm_est ? (
              <span className="text-sm text-muted px-3 py-1.5 rounded-lg bg-surface2 border border-border">
                ~{map.bpm_est} BPM
              </span>
            ) : null}
            <span className="text-sm text-muted px-3 py-1.5 rounded-lg bg-surface2 border border-border">
              Uploaded <span className="text-text">{date}</span>
            </span>
            <span className="text-sm text-muted px-3 py-1.5 rounded-lg bg-surface2 border border-border tabular-nums">
              <span className="text-text">{map.downloads.toLocaleString()}</span> download
              {map.downloads === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={handleDownload}
              className="px-6 py-3 rounded-lg btn-primary"
            >
              Download .indies
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="px-4 py-3 rounded-lg border border-border bg-surface hover:border-accent/40 text-sm"
            >
              {copied ? 'Link copied!' : 'Share link'}
            </button>
            {isOwner && supabaseConfigured && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-3 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>

          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-4">
            Difficulties
          </h2>
          <DifficultyBar counts={map.difficulties} />

          <div className="mt-10">
            <Leaderboard mapId={map.id} />
          </div>

          <Link to="/install" className="inline-block mt-8 text-sm text-accent hover:text-accent-hover">
            How to install →
          </Link>
        </div>
      </div>
    </div>
  )
}