import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] hover:bg-[var(--accent-hi)] text-white border border-[var(--accent-hi)] btn-glow',
  secondary:
    'bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]',
  ghost:
    'bg-transparent hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent',
  danger:
    'bg-transparent hover:bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] border border-[color-mix(in_oklab,var(--danger)_28%,transparent)]',
  subtle:
    'bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] border border-[var(--border)]',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 min-w-10 px-3 text-[12px] rounded-md gap-1.5',
  md: 'h-10 min-w-10 px-3.5 text-[13px] rounded-lg gap-2',
  lg: 'h-11 px-4 text-[14px] rounded-lg gap-2',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = 'secondary', size = 'md', icon, iconRight, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={cn(
        'inline-flex items-center justify-center font-medium whitespace-nowrap select-none transition-[background,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] active:duration-100 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {icon ? <span className="shrink-0 [&>svg]:size-3.5">{icon}</span> : null}
      {children}
      {iconRight ? <span className="shrink-0 [&>svg]:size-3.5">{iconRight}</span> : null}
    </button>
  )
})
