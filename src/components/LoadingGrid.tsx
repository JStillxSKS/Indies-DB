export function LoadingGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-44 rounded-xl border border-border bg-surface overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-surface2" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-surface2 rounded w-3/4" />
            <div className="h-3 bg-surface2 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}