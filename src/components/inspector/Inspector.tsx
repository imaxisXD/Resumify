import { X, Trash2 } from 'lucide-react'
import { useResumeStore } from '../../stores/resumeStore'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { NODE_META } from '../canvas/nodes/_shared/registry'
import type { NodeKind, ResumeNode } from '../../stores/types'
import { PersonalForm } from './forms/PersonalForm'
import { SummaryForm } from './forms/SummaryForm'
import { ExperienceForm } from './forms/ExperienceForm'
import { EducationForm } from './forms/EducationForm'
import { SkillsForm } from './forms/SkillsForm'
import { ProjectsForm } from './forms/ProjectsForm'
import { CustomForm } from './forms/CustomForm'

export function Inspector({ resumeId }: { resumeId: string }) {
  const selectedId = useResumeStore((s) => s.selectedNodeId)
  const node = useResumeStore((s) => {
    const r = s.resumes[resumeId]
    if (!r || !s.selectedNodeId) return null
    return r.nodes.find((n) => n.id === s.selectedNodeId) ?? null
  }) as ResumeNode | null
  const setSelected = useResumeStore((s) => s.setSelectedNode)
  const removeNode = useResumeStore((s) => s.removeNode)

  if (!node || !selectedId) return null

  const meta = NODE_META[node.type as NodeKind]
  const Icon = meta.icon

  return (
    <div
      key={selectedId}
      className="absolute inset-y-0 right-0 z-30 w-[400px] max-w-[92vw] flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.7)] animate-slide-in-right"
    >
      <header className="flex items-center gap-2.5 px-4 h-[60px] border-b border-[var(--border)]">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-[var(--surface-2)] border border-[var(--border)] text-[var(--accent-hi)]">
          <Icon size={14} />
        </span>
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {meta.kind}
          </span>
          <span className="text-[14px] font-medium tracking-tight">{meta.label}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {node.type !== 'personal' ? (
            <ConfirmDialog
              title={`Delete ${meta.label}?`}
              description={`This removes ${meta.label} from this resume and from the preview. You cannot undo this.`}
              confirmLabel="Delete section"
              onConfirm={() => removeNode(resumeId, node.id)}
            >
              <IconButton
                icon={<Trash2 size={14} />}
                label="Delete section"
                className="hover:text-[var(--danger)]"
              />
            </ConfirmDialog>
          ) : null}
          <IconButton
            icon={<X size={14} />}
            label="Close inspector"
            onClick={() => setSelected(null)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <FormFor node={node} resumeId={resumeId} />
      </div>

      <footer className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          autosaved · #{node.id.slice(-6)}
        </span>
        <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
          Done
        </Button>
      </footer>
    </div>
  )
}

function FormFor({ node, resumeId }: { node: ResumeNode; resumeId: string }) {
  switch (node.type as NodeKind) {
    case 'personal':
      return <PersonalForm resumeId={resumeId} node={node as ResumeNode<'personal'>} />
    case 'summary':
      return <SummaryForm resumeId={resumeId} node={node as ResumeNode<'summary'>} />
    case 'experience':
      return <ExperienceForm resumeId={resumeId} node={node as ResumeNode<'experience'>} />
    case 'education':
      return <EducationForm resumeId={resumeId} node={node as ResumeNode<'education'>} />
    case 'skills':
      return <SkillsForm resumeId={resumeId} node={node as ResumeNode<'skills'>} />
    case 'projects':
      return <ProjectsForm resumeId={resumeId} node={node as ResumeNode<'projects'>} />
    case 'custom':
      return <CustomForm resumeId={resumeId} node={node as ResumeNode<'custom'>} />
  }
}
