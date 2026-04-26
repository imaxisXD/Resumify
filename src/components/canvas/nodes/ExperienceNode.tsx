import type { NodeProps } from '@xyflow/react'
import { NodeShell } from './_shared/NodeShell'
import { NODE_META } from './_shared/registry'
import { useResumeStore } from '../../../stores/resumeStore'
import type { ResumeNode } from '../../../stores/types'

export function ExperienceNode({ id, data, selected }: NodeProps<ResumeNode<'experience'>>) {
  const meta = NODE_META.experience
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const items = data.items
  const total = items.length

  return (
    <NodeShell
      kind={meta.kind}
      label={meta.label}
      Icon={meta.icon}
      selected={selected}
      onEdit={() => setSelected(id)}
      empty={total === 0}
      meta={`${total} ${total === 1 ? 'role' : 'roles'}`}
    >
      <div className="flex flex-col gap-2">
        {items.slice(0, 2).map((it) => (
          <div key={it.id} className="flex flex-col gap-0.5">
            <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
              {it.role || 'Role'} <span className="text-[var(--text-faint)]">·</span>{' '}
              <span className="text-[var(--text-muted)]">{it.company || 'Company'}</span>
            </div>
            <div className="font-mono text-[10.5px] text-[var(--text-faint)] uppercase tracking-wide">
              {it.start || '—'} → {it.current ? 'present' : it.end || '—'}
            </div>
          </div>
        ))}
        {total > 2 ? (
          <div className="text-[11px] text-[var(--text-faint)] mt-0.5">+{total - 2} more</div>
        ) : null}
        {total === 0 ? (
          <div className="text-[12px] text-[var(--text-faint)]">No roles yet. Open this section to add one.</div>
        ) : null}
      </div>
    </NodeShell>
  )
}
