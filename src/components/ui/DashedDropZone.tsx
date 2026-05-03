import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '#/lib/utils'
import { Card, CardContent } from './Card'

type Props = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode
  title: string
  hint?: string
  active?: boolean
}

export function DashedDropZone({ icon, title, hint, active, className, ...rest }: Props) {
  return (
    <Card
      {...rest}
      className={cn(
        'border-dashed py-0 text-center transition-colors',
        active
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card/40 hover:bg-card',
        className,
      )}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
        {icon ? (
        <div className="grid size-10 place-items-center rounded-full border border-border bg-muted text-muted-foreground [&>svg]:size-4">
            {icon}
        </div>
        ) : null}
        <div className="px-6">
        <div className="text-[14px] font-medium text-foreground">{title}</div>
        {hint ? (
          <div className="mt-1 font-mono text-[12px] uppercase tracking-wider text-muted-foreground">
            {hint}
          </div>
        ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
