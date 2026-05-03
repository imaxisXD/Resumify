import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { Button } from './Button'

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
    <Button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      variant={active ? 'subtle' : 'ghost'}
      size={size === 'md' ? 'icon' : 'icon-xs'}
      {...rest}
      className={cn(
        active ? 'text-primary ring-1 ring-primary/30' : null,
        className,
      )}
    >
      {icon}
    </Button>
  )
})
