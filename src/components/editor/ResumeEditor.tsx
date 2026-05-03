import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  FolderGit2,
  GripVertical,
  PanelRightOpen,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../../lib/cn'
import { SECTION_INFO } from '../../stores/resumeSections'
import { missingSectionKinds, useResumeStore } from '../../stores/resumeStore'
import type { SectionKind, ResumeSection } from '../../stores/types'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { PersonalForm } from '../inspector/forms/PersonalForm'
import { SummaryForm } from '../inspector/forms/SummaryForm'
import { ExperienceForm } from '../inspector/forms/ExperienceForm'
import { EducationForm } from '../inspector/forms/EducationForm'
import { SkillsForm } from '../inspector/forms/SkillsForm'
import { ProjectsForm } from '../inspector/forms/ProjectsForm'
import { CustomForm } from '../inspector/forms/CustomForm'
import { ResumePowerPanel } from '../power/ResumePowerPanel'
import { scoreResume, type ScoreIssue } from '../../features/resumeScore'

const ICONS = {
  personal: UserRound,
  summary: FileText,
  experience: BriefcaseBusiness,
  education: BookOpen,
  skills: Wrench,
  projects: FolderGit2,
  custom: Award,
} satisfies Record<SectionKind, React.ComponentType<{ size?: number }>>

export function ResumeEditor({ resumeId }: { resumeId: string }) {
  const [toolsOpen, setToolsOpen] = useState(false)
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const selectedId = useResumeStore((s) => s.selectedSectionId)
  const setSelected = useResumeStore((s) => s.setSelectedSection)
  const addSection = useResumeStore((s) => s.addSection)
  const removeSection = useResumeStore((s) => s.removeSection)
  const reorderSections = useResumeStore((s) => s.reorderSections)
  const toggleSection = useResumeStore((s) => s.toggleSection)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selected = useMemo(() => {
    if (!resume) return null
    return resume.sections.find((section) => section.id === selectedId) ?? resume.sections[0] ?? null
  }, [resume, selectedId])

  if (!resume) return null

  const missing = missingSectionKinds(resume)
  const score = scoreResume(resume)

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = resume.sections.findIndex((section) => section.id === active.id)
    const newIndex = resume.sections.findIndex((section) => section.id === over.id)
    if (oldIndex <= 0 || newIndex <= 0) return
    reorderSections(resumeId, arrayMove(resume.sections, oldIndex, newIndex))
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[var(--bg)]">
      <div className="h-full min-h-0 grid grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="min-h-0 border-r border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
            Sections
          </div>
          <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">Resume score</div>
                <div className="mt-1 text-[24px] font-semibold leading-none text-[var(--text)]">{score.score}</div>
              </div>
              <div className="text-right text-[11.5px] text-[var(--text-muted)]">
                {score.issues.length ? `${score.issues.length} fixes` : 'Ready'}
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${score.score}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext items={resume.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {resume.sections.map((section) => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    active={section.id === selected?.id}
                    issueCount={score.issues.filter((item) => item.sectionId === section.id).length}
                    onSelect={() => setSelected(section.id)}
                    onToggle={(enabled) => toggleSection(resumeId, section.id, enabled)}
                    onRemove={() => removeSection(resumeId, section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {missing.length ? (
          <div className="border-t border-[var(--border)] p-3">
            <div className="grid grid-cols-2 gap-2">
              {missing.map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant="secondary"
                  icon={<Plus size={12} />}
                  onClick={() => addSection(resumeId, kind)}
                >
                  {SECTION_INFO[kind].label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {selected && score.issues.some((item) => item.sectionId === selected.id) ? (
          <SectionQualityPanel issues={score.issues.filter((item) => item.sectionId === selected.id)} />
        ) : null}
      </aside>

      <main className="min-h-0 overflow-y-auto">
        {selected ? (
          <div className="mx-auto max-w-[820px] px-6 py-6">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <SectionIcon kind={selected.type} className="size-9" />
                <div className="min-w-0">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                    Edit section
                  </div>
                  <h2 className="font-display text-[30px] leading-none tracking-tight">
                    {SECTION_INFO[selected.type].label}
                  </h2>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="primary"
                  icon={<Sparkles size={14} />}
                  iconRight={<PanelRightOpen size={14} />}
                  onClick={() => setToolsOpen(true)}
                >
                  Assist
                </Button>
              </div>
            </header>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <FormFor section={selected} resumeId={resumeId} />
            </div>
          </div>
        ) : null}
      </main>
      </div>
      {toolsOpen ? (
        <div className="absolute inset-0 z-30">
          <button
            type="button"
            aria-label="Close assist tools"
            className="absolute inset-0 bg-black/35"
            onClick={() => setToolsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[min(390px,calc(100vw-320px))] min-w-[340px] border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/35">
            <ResumePowerPanel resumeId={resumeId} onClose={() => setToolsOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionRow({
  section,
  active,
  onSelect,
  onToggle,
  onRemove,
  issueCount,
}: {
  section: ResumeSection
  active: boolean
  issueCount: number
  onSelect: () => void
  onToggle: (enabled: boolean) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: section.type === 'personal',
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const label = SECTION_INFO[section.type].label

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border bg-[var(--surface)] transition-[border-color,background-color,box-shadow] duration-200',
        active ? 'border-[var(--accent-hi)] bg-[var(--surface-2)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]',
        isDragging && 'z-10 shadow-2xl shadow-black/35',
      )}
    >
      <div className="flex items-center">
        <button
          type="button"
          className={cn(
            'w-9 self-stretch grid place-items-center border-r border-[var(--border)] text-[var(--text-faint)]',
            section.type === 'personal' ? 'cursor-default opacity-40' : 'cursor-grab active:cursor-grabbing hover:text-[var(--text-muted)]',
          )}
          {...attributes}
          {...listeners}
          aria-label={`Move ${label}`}
        >
          <GripVertical size={14} />
        </button>
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 flex items-center gap-2.5 px-3 py-3 text-left">
          <SectionIcon kind={section.type} />
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[var(--text)] truncate">{label}</span>
            <span className="block text-[11.5px] text-[var(--text-faint)] truncate">{SECTION_INFO[section.type].hint}</span>
          </span>
          {issueCount ? (
            <span className="ml-auto rounded-md border border-[color-mix(in_oklab,var(--danger)_28%,transparent)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--danger)]">
              {issueCount}
            </span>
          ) : null}
        </button>
        {section.type !== 'personal' ? (
          <label className="px-2">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => onToggle(e.currentTarget.checked)}
              aria-label={`Show ${label}`}
            />
          </label>
        ) : null}
        {section.type !== 'personal' ? (
          <ConfirmDialog
            title={`Delete ${label}?`}
            description={`This removes ${label} from this resume. You cannot undo this.`}
            confirmLabel="Delete section"
            onConfirm={onRemove}
          >
            <button
              type="button"
              className="w-9 self-stretch grid place-items-center border-l border-[var(--border)] text-[var(--text-faint)] hover:text-[var(--danger)]"
              aria-label={`Delete ${label}`}
            >
              <Trash2 size={13} />
            </button>
          </ConfirmDialog>
        ) : null}
      </div>
    </div>
  )
}

function SectionQualityPanel({ issues }: { issues: Array<ScoreIssue> }) {
  return (
    <div className="border-t border-[var(--border)] p-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
        Section health
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {issues.slice(0, 5).map((issue) => (
          <div key={issue.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
            <div className="text-[12px] font-medium text-[var(--text)]">{issue.label}</div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-muted)]">{issue.fix}</p>
          </div>
        ))}
        {!issues.length ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[12px] text-[var(--text-muted)]">
            No obvious issues in this section.
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SectionIcon({ kind, className }: { kind: SectionKind; className?: string }) {
  const Icon = ICONS[kind]
  return (
    <span className={cn('size-7 shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-2)] grid place-items-center text-[var(--accent-hi)]', className)}>
      <Icon size={14} />
    </span>
  )
}

function FormFor({ section, resumeId }: { section: ResumeSection; resumeId: string }) {
  switch (section.type) {
    case 'personal':
      return <PersonalForm resumeId={resumeId} section={section as ResumeSection<'personal'>} />
    case 'summary':
      return <SummaryForm resumeId={resumeId} section={section as ResumeSection<'summary'>} />
    case 'experience':
      return <ExperienceForm resumeId={resumeId} section={section as ResumeSection<'experience'>} />
    case 'education':
      return <EducationForm resumeId={resumeId} section={section as ResumeSection<'education'>} />
    case 'skills':
      return <SkillsForm resumeId={resumeId} section={section as ResumeSection<'skills'>} />
    case 'projects':
      return <ProjectsForm resumeId={resumeId} section={section as ResumeSection<'projects'>} />
    case 'custom':
      return <CustomForm resumeId={resumeId} section={section as ResumeSection<'custom'>} />
  }
}
