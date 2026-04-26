import * as SelectPrimitive from '@radix-ui/react-select'
import type { ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

export type SelectOption<T extends string> = {
  value: T
  label: string
  hint?: string
  disabled?: boolean
  icon?: ReactNode
}

type Props<T extends string> = {
  value: T
  options: Array<SelectOption<T>>
  onChange: (v: T) => void
  className?: string
  triggerIcon?: ReactNode
  align?: 'left' | 'right'
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  className,
  triggerIcon,
  align = 'right',
}: Props<T>) {
  const current = options.find((o) => o.value === value)

  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectPrimitive.Trigger
        className={cn(
          'inline-flex h-10 min-w-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-2.5 pr-2 text-[13px] font-medium text-[var(--text)] transition-colors duration-150 hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] data-[state=open]:border-[var(--accent-hi)]/40 data-[state=open]:bg-[var(--surface-2)]',
          className,
        )}
      >
        {triggerIcon ? (
          <span className="text-[var(--text-muted)] [&>svg]:size-4">{triggerIcon}</span>
        ) : null}
        <SelectPrimitive.Value placeholder="Select...">
          {current?.label ?? 'Select...'}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={14} className="text-[var(--text-muted)]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          sideOffset={6}
          align={align === 'right' ? 'end' : 'start'}
          position="popper"
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xl shadow-black/40 animate-pop-in"
        >
          <SelectPrimitive.Viewport>
            {options.map((opt) => {
              const isCurrent = opt.value === value
              return (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'relative flex min-h-10 w-full cursor-default items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 text-left text-[13px] text-[var(--text)] transition-colors duration-150 data-[disabled]:text-[var(--text-faint)] data-[disabled]:pointer-events-none data-[highlighted]:bg-[var(--surface-2)] data-[highlighted]:outline-none',
                    isCurrent && !opt.disabled && 'bg-[var(--surface-2)]',
                  )}
                >
                  {opt.icon ? (
                    <span className="[&>svg]:size-3.5 text-[var(--text-muted)]">{opt.icon}</span>
                  ) : null}
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  {opt.hint ? (
                    <span aria-hidden className="ml-auto text-[10.5px] font-mono text-[var(--text-faint)] uppercase">
                      {opt.hint}
                    </span>
                  ) : null}
                  <SelectPrimitive.ItemIndicator className="absolute right-2 inline-flex items-center justify-center text-[var(--accent-hi)]">
                    <Check size={14} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              )
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
