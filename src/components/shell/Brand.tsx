import { cn } from '../../lib/cn'

export function Brand({
  collapsed,
  size = 'md',
  className,
}: {
  collapsed?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const tile = size === 'sm' ? 'size-7' : size === 'lg' ? 'size-10' : 'size-9'
  const text =
    size === 'sm' ? 'text-[18px]' : size === 'lg' ? 'text-[26px]' : 'text-[22px]'
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          tile,
          'shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#5050d6] grid place-items-center text-white shadow-[0_4px_18px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.18)] border border-[var(--accent-hi)]/40',
        )}
      >
        <BrandGlyph />
      </div>
      {collapsed ? null : (
        <span className={cn('font-display tracking-tight leading-none text-[var(--text)]', text)}>
          Resumify
        </span>
      )}
    </div>
  )
}

function BrandGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-[55%]" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <path d="M3 1.5h6.5L13 5v9.5H3z" strokeLinejoin="round" />
      <path d="M9.5 1.5V5H13" strokeLinejoin="round" />
      <circle cx="6" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8.5 9H11" strokeLinecap="round" />
      <path d="M5 12h6" strokeLinecap="round" />
    </svg>
  )
}
