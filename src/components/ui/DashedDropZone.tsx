import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode
  title: string
  hint?: string
  active?: boolean
}

export function DashedDropZone({ icon, title, hint, active, className, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center transition-colors',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]/40'
          : 'border-[var(--border-strong)] bg-[var(--surface)]/40 hover:bg-[var(--surface)]',
        className,
      )}
    >
      {icon ? (
        <div className="size-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] grid place-items-center text-[var(--text-muted)] [&>svg]:size-4">
          {icon}
        </div>
      ) : null}
      <div className="px-6">
        <div className="text-[14px] text-[var(--text)] font-medium">{title}</div>
        {hint ? (
          <div className="mt-1 text-[12px] text-[var(--text-faint)] font-mono uppercase tracking-wider">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  )
}
