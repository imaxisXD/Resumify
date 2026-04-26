import type { NodeProps } from '@xyflow/react'
import { NodeShell } from './_shared/NodeShell'
import { NODE_META } from './_shared/registry'
import { useResumeStore } from '../../../stores/resumeStore'
import type { ResumeNode } from '../../../stores/types'

export function SkillsNode({ id, data, selected }: NodeProps<ResumeNode<'skills'>>) {
  const meta = NODE_META.skills
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const total = data.groups.reduce((acc, g) => acc + g.skills.length, 0)

  return (
    <NodeShell
      kind={meta.kind}
      label={meta.label}
      Icon={meta.icon}
      selected={selected}
      onEdit={() => setSelected(id)}
      empty={total === 0}
      meta={`${data.groups.length} groups · ${total} tags`}
    >
      <div className="flex flex-col gap-2">
        {data.groups.slice(0, 2).map((g) => (
          <div key={g.id} className="flex flex-col gap-1">
            <div className="font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-[0.18em]">
              {g.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {g.skills.slice(0, 6).map((s) => (
                <span
                  key={`${g.id}-${s}`}
                  className="px-1.5 py-0.5 rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[10.5px] text-[var(--text)]"
                >
                  {s}
                </span>
              ))}
              {g.skills.length > 6 ? (
                <span className="px-1.5 py-0.5 text-[10.5px] text-[var(--text-faint)]">
                  +{g.skills.length - 6}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {total === 0 ? (
          <div className="text-[12px] text-[var(--text-faint)]">No skills yet. Open this section to add them.</div>
        ) : null}
      </div>
    </NodeShell>
  )
}
