import { GripVertical } from 'lucide-react'
import { NODE_META, PALETTE_ORDER } from './nodes/_shared/registry'
import type { NodeKind } from '../../stores/types'

export const PALETTE_DRAG_TYPE = 'application/x-resumify-node'

export function NodePalette({ onAdd }: { onAdd: (kind: NodeKind) => void }) {
  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-20 w-[208px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md shadow-[0_18px_48px_-12px_rgba(0,0,0,0.45)] animate-fade-up">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          Sections
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--text-faint)]">drag · click</span>
      </div>
      <div className="flex flex-col p-1.5 gap-0.5">
        {PALETTE_ORDER.map((kind, i) => {
          const meta = NODE_META[kind]
          const Icon = meta.icon
          return (
            <div
              key={kind}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(PALETTE_DRAG_TYPE, kind)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onClick={() => onAdd(kind)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAdd(kind)
                }
              }}
              style={{ animationDelay: `${80 + i * 35}ms` }}
              className="group flex items-center gap-2 rounded-lg px-2 py-2 cursor-grab active:cursor-grabbing transition-[background,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] active:duration-100 hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)] focus:outline-none animate-fade-up"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent-hi)] group-hover:border-[var(--accent-hi)]/40 transition-[border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]">
                <Icon size={13} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-[var(--text)] tracking-tight">
                  {meta.label}
                </div>
                <div className="text-[10.5px] text-[var(--text-faint)] truncate">{meta.hint}</div>
              </div>
              <GripVertical
                size={12}
                className="text-[var(--text-faint)] opacity-0 -translate-x-0.5 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
