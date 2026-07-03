type ExplicitBadgeProps = {
  size?: 'sm' | 'md'
  /** Show full "Explicit" label instead of compact "E". */
  full?: boolean
}

export function ExplicitBadge({ size = 'sm', full = false }: ExplicitBadgeProps) {
  const pill =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px]'
      : 'px-2 py-1 text-xs'

  return (
    <span
      title="Contains explicit language"
      aria-label="Explicit language"
      className={`inline-flex items-center rounded-md border font-semibold uppercase tracking-wide shrink-0 ${pill} border-amber-500/40 bg-amber-500/15 text-amber-300`}
    >
      {full ? 'Explicit' : 'E'}
    </span>
  )
}