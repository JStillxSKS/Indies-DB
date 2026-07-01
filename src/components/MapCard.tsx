import { Link } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { coverPublicUrl } from '../lib/supabase'
import { DifficultyBadges } from './DifficultyBadges'

export function MapCard({ map }: { map: MapRecord }) {
  const cover = coverPublicUrl(map.cover_path)

  return (
    <Link
      to={`/maps/${map.id}`}
      className="group shrink-0 w-40 sm:w-44 flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/50 transition-colors"
    >
      <div className="aspect-square bg-surface2 flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-3xl text-muted/30">♪</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 min-w-0">
        <p className="font-semibold text-sm truncate">{map.title}</p>
        <p className="text-xs text-muted truncate">{map.artist}</p>
        <p className="text-xs text-muted truncate">by {map.charter}</p>
        <div className="flex items-center justify-between mt-1">
          <DifficultyBadges counts={map.difficulties} />
          <span className="text-xs text-dl font-mono">{map.downloads} DL</span>
        </div>
      </div>
    </Link>
  )
}