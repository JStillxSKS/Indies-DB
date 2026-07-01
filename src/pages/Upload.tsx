import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { parseIndiesFile } from '../lib/indiesParser'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { ParsedIndies } from '../types/map'
import { DifficultyBadges } from '../components/DifficultyBadges'

export function Upload() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [parsed, setParsed] = useState<ParsedIndies | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-4">Supabase not configured</h1>
        <p className="text-muted text-sm mb-4">
          Copy <code className="text-accent">.env.example</code> to <code className="text-accent">.env</code> and add your Supabase URL and anon key.
        </p>
      </div>
    )
  }

  if (authLoading) return <p className="text-muted text-center py-20">Loading…</p>

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-4">Sign in to upload</h1>
        <p className="text-muted mb-6">You need an account to publish maps.</p>
        <Link to="/login" className="px-5 py-2.5 rounded-lg btn-primary font-medium inline-block">
          Login
        </Link>
      </div>
    )
  }

  async function handleFile(file: File) {
    setError(null)
    setParsed(null)
    try {
      const result = await parseIndiesFile(file)
      setParsed(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file')
    }
  }

  async function handlePublish() {
    if (!parsed || !supabase || !user) return
    setPublishing(true)
    setError(null)

    try {
      const mapId = crypto.randomUUID()
      const filePath = `maps/${user.id}/${mapId}.indies`
      let coverPath: string | null = null

      const { error: uploadErr } = await supabase.storage
        .from('indies')
        .upload(filePath, parsed.file, { upsert: false })

      if (uploadErr) throw uploadErr

      if (parsed.coverBlob) {
        coverPath = `covers/${user.id}/${mapId}.png`
        const { error: coverErr } = await supabase.storage
          .from('indies')
          .upload(coverPath, parsed.coverBlob, { upsert: false, contentType: 'image/png' })
        if (coverErr) coverPath = null
      }

      const { data, error: insertErr } = await supabase
        .from('maps')
        .insert({
          id: mapId,
          title: parsed.title,
          artist: parsed.artist,
          charter: parsed.charter,
          mapper_id: user.id,
          file_path: filePath,
          cover_path: coverPath,
          bpm_est: parsed.bpmEst,
          difficulties: parsed.difficulties,
        })
        .select('id')
        .single()

      if (insertErr) throw insertErr
      navigate(`/maps/${data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Upload a map</h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          dragOver ? 'border-accent bg-accent/5' : 'border-border bg-surface'
        }`}
      >
        <p className="text-muted mb-4">Drop a finished .indies file here</p>
        <label className="inline-block px-4 py-2 rounded-lg bg-surface2 border border-border cursor-pointer hover:border-accent text-sm">
          Browse files
          <input
            type="file"
            accept=".indies"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {parsed && (
        <div className="mt-8 p-5 rounded-xl border border-border bg-surface">
          <h2 className="font-semibold mb-3">Parsed from file</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted w-16">Title</dt>
              <dd>{parsed.title}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted w-16">Artist</dt>
              <dd>{parsed.artist}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted w-16">Charter</dt>
              <dd>{parsed.charter}</dd>
            </div>
            <div className="flex gap-2 items-center">
              <dt className="text-muted w-16">Charts</dt>
              <dd><DifficultyBadges counts={parsed.difficulties} /></dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted w-16">BPM</dt>
              <dd>~{parsed.bpmEst}</dd>
            </div>
          </dl>

          {parsed.coverBlob && (
            <img
              src={URL.createObjectURL(parsed.coverBlob)}
              alt=""
              className="w-24 h-24 rounded-lg mt-4 object-cover"
            />
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="mt-6 w-full py-3 rounded-lg btn-primary disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      )}
    </div>
  )
}