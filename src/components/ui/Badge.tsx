import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'accent' | 'danger' | 'success' | 'mono'

const tones: Record<Tone, string> = {
  neutral: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
  accent: 'bg-[var(--accent-soft)] text-[var(--accent-hi)] border-[var(--accent-hi)]/30',
  danger: 'bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_28%,transparent)]',
  success: 'bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_28%,transparent)]',
  mono: 'bg-transparent text-[var(--text-faint)] border-[var(--border)] font-mono tracking-wide',
}

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 px-2 h-[22px] rounded-md border text-[11px] font-medium leading-none tabular-nums',
        tones[tone],
        className,
      )}
    />
  )
}
