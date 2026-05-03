import { Plus, Sparkles, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import type { ResumeSection, SkillGroup } from '../../../stores/types'
import { TagsInput } from '../TagsInput'
import { useSectionListField } from '../useSectionListField'
import { useResumeStore } from '../../../stores/resumeStore'
import { runAiTask } from '../../../features/ai'
import type { AiSuggestion } from '../../../features/aiTasks'

export function SkillsForm({
  resumeId,
  section,
}: {
  resumeId: string
  section: ResumeSection<'skills'>
}) {
  const skillGroups = useSectionListField<'skills', SkillGroup>({
    resumeId,
    section,
    field: 'groups',
    makeItem: makeEmptySkillGroup,
  })
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const update = useResumeStore((s) => s.updateSectionData)
  const saveSnapshot = useResumeStore((s) => s.saveSnapshot)
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null)
  const [status, setStatus] = useState('')
  const groups = skillGroups.items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Groups
        </h3>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={12} />}
          onClick={() => skillGroups.add()}
        >
          Add group
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
          Clean duplicate skills, group related keywords, and align the list to your target role.
        </p>
        <Button
          size="sm"
          variant="primary"
          icon={<Sparkles size={13} />}
          onClick={async () => {
            if (!resume) return
            setStatus('Cleaning skills...')
            try {
              setSuggestion(await runAiTask(aiSettings, {
                kind: 'skills-cleanup',
                resume,
                skills: groups.flatMap((group) => group.skills),
              }))
              setStatus('')
            } catch (error) {
              setStatus(error instanceof Error ? error.message : 'AI failed.')
            }
          }}
        >
          AI cleanup
        </Button>
      </div>
      {status ? <p className="text-[12px] text-[var(--text-muted)]">{status}</p> : null}
      {suggestion ? (
        <div className="rounded-xl border border-[var(--accent-hi)]/30 bg-[var(--accent-soft)]/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-[var(--text)]">{suggestion.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{suggestion.summary}</p>
            </div>
            <button type="button" onClick={() => setSuggestion(null)} className="text-[var(--text-faint)] hover:text-[var(--text)]" aria-label="Dismiss AI suggestion">
              <X size={14} />
            </button>
          </div>
          <TextArea
            className="mt-3 min-h-[80px]"
            value={suggestion.suggestions[0]?.value ?? ''}
            onChange={(e) =>
              setSuggestion({
                ...suggestion,
                suggestions: [{ id: 'skills', label: 'Skills', value: e.currentTarget.value }],
              })
            }
          />
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const skills = (suggestion.suggestions[0]?.value ?? '').split(/[,;\n]/).map((skill) => skill.trim()).filter(Boolean)
                saveSnapshot(resumeId, 'Before AI skills apply')
                update<'skills'>(resumeId, section.id, {
                  groups: [{ id: nanoid(6), label: 'Skills', skills }],
                })
                setSuggestion(null)
              }}
            >
              Apply reviewed skills
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSuggestion(null)}>Dismiss</Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Input
                value={g.label}
                onChange={(e) => skillGroups.update(g.id, { label: e.target.value })}
                placeholder="Languages"
              />
              <button
                type="button"
                onClick={() => skillGroups.remove(g.id)}
                className="text-[11.5px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove
              </button>
            </div>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <TagsInput
                value={g.skills}
                onChange={(skills) => skillGroups.update(g.id, { skills })}
                placeholder="Type a skill, press Enter…"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function makeEmptySkillGroup(): SkillGroup {
  return { id: nanoid(6), label: 'New group', skills: [] }
}
