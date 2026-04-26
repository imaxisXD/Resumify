import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Tooltip({
  label,
  side = 'bottom',
  children,
}: {
  label: string
  side?: 'top' | 'bottom'
  children: ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show ? (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[11px] font-medium tracking-tight bg-[var(--surface-3)] text-[var(--text)] border border-[var(--border-strong)] shadow-lg shadow-black/40 whitespace-nowrap pointer-events-none animate-pop-in',
            side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
          )}
          style={
            {
              '--pop-origin': side === 'bottom' ? 'top center' : 'bottom center',
            } as React.CSSProperties
          }
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}
