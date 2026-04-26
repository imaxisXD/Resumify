import type { NodeProps } from '@xyflow/react'
import { NodeShell } from './_shared/NodeShell'
import { NODE_META } from './_shared/registry'
import { useResumeStore } from '../../../stores/resumeStore'
import type { ResumeNode } from '../../../stores/types'

export function PersonalNode({ id, data, selected }: NodeProps<ResumeNode<'personal'>>) {
  const meta = NODE_META.personal
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const filled = !!(data.fullName?.trim() && data.email?.trim())

  return (
    <NodeShell
      kind={meta.kind}
      label={meta.label}
      Icon={meta.icon}
      selected={selected}
      locked
      showTarget={false}
      empty={!filled}
      onEdit={() => setSelected(id)}
      meta={`#${id.slice(-6)}`}
    >
      <div className="flex flex-col gap-1.5">
        <div className="text-[14px] font-medium text-[var(--text)] tracking-tight truncate">
          {data.fullName || 'Your name'}
        </div>
        <div className="text-[12px] text-[var(--text-muted)] truncate">
          {data.title || 'Your title'}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
          {data.email ? <span className="font-mono">{data.email}</span> : null}
          {data.location ? <span>· {data.location}</span> : null}
        </div>
      </div>
    </NodeShell>
  )
}
