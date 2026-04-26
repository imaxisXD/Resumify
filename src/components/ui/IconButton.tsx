import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode
  size?: 'sm' | 'md'
  active?: boolean
  label?: string
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon, size = 'md', active, className, label, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border transition-[background,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.92] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'h-10 w-10',
        active
          ? 'bg-[var(--accent-soft)] text-[var(--accent-hi)] border-[var(--accent-hi)]/40'
          : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border-transparent',
        size === 'md' ? '[&>svg]:size-4' : '[&>svg]:size-3.5',
        className,
      )}
    >
      {icon}
    </button>
  )
})
