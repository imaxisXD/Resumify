import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '../../ui/Button'
import { FieldLabel, Input } from '../../ui/Input'
import type { ResumeNode, SkillGroup } from '../../../stores/types'
import { TagsInput } from '../TagsInput'
import { useNodeListField } from '../useNodeListField'

export function SkillsForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'skills'>
}) {
  const skillGroups = useNodeListField<'skills', SkillGroup>({
    resumeId,
    node,
    field: 'groups',
    makeItem: makeEmptySkillGroup,
  })
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
