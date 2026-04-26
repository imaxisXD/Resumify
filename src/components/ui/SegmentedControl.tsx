import { cn } from '../../lib/cn'

type Props<T extends string> = {
  value: T
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>
  onChange: (v: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: Props<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] gap-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 min-w-8 px-2 rounded text-[11.5px] font-medium transition-[background,color,border-color,transform] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.95] active:duration-100 duration-200',
              active
                ? 'bg-[var(--accent-soft)] text-[var(--accent-hi)] border border-[var(--accent-hi)]/30'
                : 'border border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
            )}
          >
            {opt.icon ? <span className="[&>svg]:size-3">{opt.icon}</span> : null}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
