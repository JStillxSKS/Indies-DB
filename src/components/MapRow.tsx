import { Link } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { coverPublicUrl, filePublicUrl, incrementDownload } from '../lib/supabase'
import { DifficultyBadges } from './DifficultyBadges'

export function MapRow({ map }: { map: MapRecord }) {
  const cover = coverPublicUrl(map.cover_path)

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (map.id.startsWith('demo-')) {
      alert('Demo mode — connect Supabase to enable real downloads.')
      return
    }
    const url = filePublicUrl(map.file_path)
    if (!url) return
    await incrementDownload(map.id)
    const a = document.createElement('a')
    a.href = url
    a.download = `${map.title}.indies`
    a.click()
  }

  const date = new Date(map.created_at).toLocaleDateString()

  return (
    <Link
      to={`/maps/${map.id}`}
      className="grid grid-cols-[56px_1fr_auto] sm:grid-cols-[64px_1fr_auto_auto_auto] items-center gap-3 sm:gap-4 p-3 rounded-xl border border-border bg-surface hover:border-accent/40 transition-colors"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-surface2 overflow-hidden flex items-center justify-center shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted/30">♪</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold truncate">{map.title}</p>
        <p className="text-sm text-muted truncate">{map.artist}</p>
        <p className="text-xs text-muted truncate">by {map.charter}</p>
      </div>

      <div className="hidden sm:block">
        <DifficultyBadges counts={map.difficulties} />
      </div>

      <div className="hidden sm:block text-xs text-muted text-right">
        <div>{map.bpm_est ? `~${map.bpm_est} BPM` : '—'}</div>
        <div>{date}</div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-dl font-mono">{map.downloads} DL</span>
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium"
        >
          Download
        </button>
      </div>
    </Link>
  )
}