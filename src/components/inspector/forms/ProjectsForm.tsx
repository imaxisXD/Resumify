import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import type { ProjectItem, ResumeNode } from '../../../stores/types'
import { TagsInput } from '../TagsInput'
import { useNodeListField } from '../useNodeListField'

export function ProjectsForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'projects'>
}) {
  const projects = useNodeListField<'projects', ProjectItem>({
    resumeId,
    node,
    field: 'items',
    makeItem: makeEmptyProjectItem,
  })
  const items = projects.items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Projects
        </h3>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={12} />}
          onClick={() => projects.add()}
        >
          Add project
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <Input
                  value={item.name}
                  onChange={(e) => projects.update(item.id, { name: e.target.value })}
                  placeholder="Project"
                />
              </Field>
              <Field label="URL">
                <Input
                  value={item.url}
                  onChange={(e) => projects.update(item.id, { url: e.target.value })}
                  placeholder="github.com/you/proj"
                />
              </Field>
            </div>
            <Field label="Description">
              <TextArea
                rows={2}
                value={item.description}
                onChange={(e) => projects.update(item.id, { description: e.target.value })}
                placeholder="What it does, in one line."
              />
            </Field>
            <div>
              <FieldLabel>Tech</FieldLabel>
              <TagsInput
                value={item.tech}
                onChange={(tech) => projects.update(item.id, { tech })}
                placeholder="Add tech, press Enter…"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => projects.remove(item.id)}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove project
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function makeEmptyProjectItem(): ProjectItem {
  return { id: nanoid(6), name: '', url: '', description: '', tech: [] }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}
