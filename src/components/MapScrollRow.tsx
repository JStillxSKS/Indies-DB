import type { MapRecord } from '../types/map'
import { MapCard } from './MapCard'

export function MapScrollRow({ title, maps }: { title: string; maps: MapRecord[] }) {
  if (maps.length === 0) return null

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold mb-4 px-1">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {maps.map((m) => (
          <MapCard key={m.id} map={m} />
        ))}
      </div>
    </section>
  )
}