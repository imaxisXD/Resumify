import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn(
        'bg-[var(--surface)] border border-[var(--border)] rounded-xl',
        className,
      )}
    />
  )
}
