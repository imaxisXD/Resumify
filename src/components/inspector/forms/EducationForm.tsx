import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import type { EducationItem, ResumeNode } from '../../../stores/types'
import { useNodeListField } from '../useNodeListField'

export function EducationForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'education'>
}) {
  const schools = useNodeListField<'education', EducationItem>({
    resumeId,
    node,
    field: 'items',
    makeItem: makeEmptyEducationItem,
  })
  const items = schools.items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Schools
        </h3>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={12} />}
          onClick={() => schools.add()}
        >
          Add school
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <Field label="School">
              <Input
                value={item.school}
                onChange={(e) => schools.update(item.id, { school: e.target.value })}
                placeholder="University of Cambridge"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Degree">
                <Input
                  value={item.degree}
                  onChange={(e) => schools.update(item.id, { degree: e.target.value })}
                  placeholder="B.A."
                />
              </Field>
              <Field label="Field">
                <Input
                  value={item.field}
                  onChange={(e) => schools.update(item.id, { field: e.target.value })}
                  placeholder="Computer Science"
                />
              </Field>
              <Field label="Start">
                <Input
                  value={item.start}
                  onChange={(e) => schools.update(item.id, { start: e.target.value })}
                  placeholder="2014"
                />
              </Field>
              <Field label="End">
                <Input
                  value={item.end}
                  onChange={(e) => schools.update(item.id, { end: e.target.value })}
                  placeholder="2018"
                />
              </Field>
            </div>
            <Field label="Notes">
              <TextArea
                rows={2}
                value={item.notes}
                onChange={(e) => schools.update(item.id, { notes: e.target.value })}
                placeholder="Honours, GPA, thesis"
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => schools.remove(item.id)}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove school
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function makeEmptyEducationItem(): EducationItem {
  return {
    id: nanoid(6),
    school: '',
    degree: '',
    field: '',
    start: '',
    end: '',
    notes: '',
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}
