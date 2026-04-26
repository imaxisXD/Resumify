import type { NodeProps } from '@xyflow/react'
import { NodeShell } from './_shared/NodeShell'
import { NODE_META } from './_shared/registry'
import { useResumeStore } from '../../../stores/resumeStore'
import type { ResumeNode } from '../../../stores/types'

export function CustomNode({ id, data, selected }: NodeProps<ResumeNode<'custom'>>) {
  const meta = NODE_META.custom
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const total = data.items.length

  return (
    <NodeShell
      kind={meta.kind}
      label={data.title || meta.label}
      Icon={meta.icon}
      selected={selected}
      onEdit={() => setSelected(id)}
      empty={total === 0}
      meta={`${total} ${total === 1 ? 'item' : 'items'}`}
    >
      <div className="flex flex-col gap-2">
        {data.items.slice(0, 2).map((it) => (
          <div key={it.id} className="flex flex-col gap-0.5">
            <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
              {it.title || 'Item'}
            </div>
            <div className="font-mono text-[10.5px] text-[var(--text-faint)] uppercase tracking-wide">
              {it.subtitle || ''}
            </div>
          </div>
        ))}
        {total === 0 ? (
          <div className="text-[12px] text-[var(--text-faint)]">No items yet. Open this section to add one.</div>
        ) : null}
      </div>
    </NodeShell>
  )
}
