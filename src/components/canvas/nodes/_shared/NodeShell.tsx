import { Handle, Position } from '@xyflow/react'
import { Pencil, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../../../lib/cn'

type Props = {
  selected?: boolean
  kind: string
  label: string
  Icon: LucideIcon
  locked?: boolean
  showSource?: boolean
  showTarget?: boolean
  onEdit?: () => void
  empty?: boolean
  children: ReactNode
  meta?: ReactNode
  width?: number
}

export function NodeShell({
  selected,
  kind,
  label,
  Icon,
  locked,
  showSource = true,
  showTarget = true,
  onEdit,
  empty,
  children,
  meta,
  width = 248,
}: Props) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl bg-[var(--surface)] text-[var(--text)] transition-[box-shadow,border-color] duration-200 ease-out',
        'border',
        selected
          ? 'border-[var(--accent-hi)] shadow-[0_0_0_3px_var(--accent-glow),0_24px_50px_-22px_var(--accent-glow)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]',
      )}
      style={{ width }}
    >
      {/* Dashed accent rim shown when empty/hovered */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-[3px] rounded-[14px] border border-dashed transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]',
          empty
            ? 'border-[var(--accent-hi)]/35 opacity-100'
            : 'border-[var(--border-strong)] opacity-0 group-hover:opacity-50',
        )}
      />
      {showTarget ? (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={!locked || true}
          className="!top-[-6px]"
        />
      ) : null}

      <div className="relative flex items-center gap-2 px-3.5 pt-3 pb-2.5">
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent-hi)]">
          <Icon size={13} />
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          {kind}
        </span>
        <span className="text-[14px] font-medium tracking-tight ml-0.5">{label}</span>
        {locked ? (
          <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--text-faint)]">
            start
          </span>
        ) : null}
      </div>

      <div className="relative h-px bg-[var(--border)]" />

      <div className="relative px-3.5 py-3 text-[12.5px] text-[var(--text-muted)] leading-snug">
        {children}
      </div>

      {meta || onEdit ? (
        <div className="relative h-px bg-[var(--border)]" />
      ) : null}
      {meta || onEdit ? (
        <div className="relative flex items-center justify-between px-3.5 py-2">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {meta}
          </div>
          {onEdit ? (
          <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="group/edit inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-hi)] transition-colors duration-200"
            >
              <Pencil size={11} />
              Edit
            </button>
          ) : null}
        </div>
      ) : null}

      {showSource ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bottom-[-6px]"
        />
      ) : null}
    </div>
  )
}
