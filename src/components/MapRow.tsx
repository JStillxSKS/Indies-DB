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
      className="grid grid-cols-[56px_1fr_auto] sm:grid-cols-[64px_1fr_auto] items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl border border-border bg-surface hover:border-accent/40 transition-colors"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-surface2 overflow-hidden flex items-center justify-center shrink-0">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-muted/30">♪</span>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{map.title}</p>
          <p className="text-sm text-muted truncate">{map.artist}</p>
          <p className="text-xs text-muted truncate">by {map.charter}</p>
        </div>

        <DifficultyBadges counts={map.difficulties} size="md" />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {map.bpm_est ? <span>~{map.bpm_est} BPM</span> : null}
          <span>{date}</span>
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-2 shrink-0 pl-2 sm:pl-4 border-l border-border/50">
        <span className="text-xs text-muted tabular-nums whitespace-nowrap">
          {map.downloads.toLocaleString()} download{map.downloads === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-lg btn-primary text-xs whitespace-nowrap"
        >
          Download
        </button>
      </div>
    </Link>
  )
}