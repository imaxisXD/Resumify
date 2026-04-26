import type { NodeProps } from '@xyflow/react'
import { NodeShell } from './_shared/NodeShell'
import { NODE_META } from './_shared/registry'
import { useResumeStore } from '../../../stores/resumeStore'
import type { ResumeNode } from '../../../stores/types'

export function SummaryNode({ id, data, selected }: NodeProps<ResumeNode<'summary'>>) {
  const meta = NODE_META.summary
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const empty = !data.text?.trim()

  return (
    <NodeShell
      kind={meta.kind}
      label={meta.label}
      Icon={meta.icon}
      selected={selected}
      onEdit={() => setSelected(id)}
      empty={empty}
      meta={`${data.text?.length ?? 0} chars`}
    >
      <p className="line-clamp-3 italic font-display text-[14px] text-[var(--text)] leading-snug">
        {data.text || 'A short, sharp paragraph that frames who you are.'}
      </p>
    </NodeShell>
  )
}
