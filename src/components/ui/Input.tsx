import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const baseField =
  'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-faint)] outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--accent-glow)]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={cn(baseField, 'h-9', className)} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        {...rest}
        className={cn(baseField, 'min-h-[80px] resize-y leading-relaxed', className)}
      />
    )
  },
)

export function FieldLabel({
  children,
  hint,
  className,
}: {
  children: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-[12px] text-[var(--text-muted)]', className)}>
      <span className="flex items-center justify-between">
        <span className="font-medium tracking-wide uppercase text-[11px] text-[var(--text-muted)]">
          {children}
        </span>
        {hint ? (
          <span className="font-mono text-[10.5px] text-[var(--text-faint)]">{hint}</span>
        ) : null}
      </span>
    </label>
  )
}
