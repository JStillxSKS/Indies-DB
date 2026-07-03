import { Link } from 'react-router-dom'
import type { MapRecord } from '../types/map'
import { coverPublicUrl } from '../lib/supabase'
import { DifficultyBadges } from './DifficultyBadges'
import { ExplicitBadge } from './ExplicitBadge'

export function MapCard({ map }: { map: MapRecord }) {
  const cover = coverPublicUrl(map.cover_path)

  return (
    <Link
      to={`/maps/${map.id}`}
      className="group shrink-0 w-40 sm:w-44 flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:border-accent/50 transition-colors"
    >
      <div className="relative aspect-square bg-surface2 flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-3xl text-muted/30">♪</span>
        )}
        {map.explicit ? (
          <span className="absolute top-2 right-2">
            <ExplicitBadge />
          </span>
        ) : null}
      </div>
      <div className="p-3 flex flex-col gap-2 min-w-0">
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold text-sm truncate">{map.title}</p>
          <p className="text-xs text-muted truncate">{map.artist}</p>
          <p className="text-xs text-muted truncate">by {map.charter}</p>
        </div>

        <div className="pt-2 border-t border-border/60 space-y-2">
          <DifficultyBadges counts={map.difficulties} />
          <p className="text-[11px] text-muted text-right tabular-nums">
            {map.downloads.toLocaleString()} download{map.downloads === 1 ? '' : 's'}
          </p>
        </div>
      </div>
    </Link>
  )
}