import { ToggleGroup, ToggleGroupItem } from './toggle-group'
import { cn } from '#/lib/utils'

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
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T)
      }}
      variant="outline"
      size="default"
      spacing={0}
      className={cn(
        'rounded-lg border border-border bg-card p-0.5',
        className,
      )}
    >
      {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={opt.label}
            className={cn(
              'gap-1.5 border-transparent text-[11.5px]',
              opt.value === value ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
            )}
          >
            {opt.icon ? <span data-icon="inline-start">{opt.icon}</span> : null}
            {opt.label}
          </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
