import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import { SortableList } from '../SortableList'
import type { ExperienceItem, ResumeNode } from '../../../stores/types'
import { updateList, useNodeListField } from '../useNodeListField'

export function ExperienceForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'experience'>
}) {
  const roles = useNodeListField<'experience', ExperienceItem>({
    resumeId,
    node,
    field: 'items',
    makeItem: makeEmptyExperienceItem,
  })
  const items = roles.items

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Roles
        </h3>
        <Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={() => roles.add()}>
          Add role
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-[12px] text-[var(--text-faint)]">
          No roles yet. Add your most recent role first.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Input
                  value={item.role}
                  onChange={(e) => roles.update(item.id, { role: e.target.value })}
                  placeholder="Senior Engineer"
                />
              </Field>
              <Field label="Company">
                <Input
                  value={item.company}
                  onChange={(e) => roles.update(item.id, { company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={item.location}
                  onChange={(e) => roles.update(item.id, { location: e.target.value })}
                  placeholder="Remote"
                />
              </Field>
              <Field label={item.current ? 'Start → present' : 'Dates'}>
                <div className="flex items-center gap-2">
                  <Input
                    value={item.start}
                    onChange={(e) => roles.update(item.id, { start: e.target.value })}
                    placeholder="Jan 2023"
                    className="w-1/2"
                  />
                  <span className="text-[var(--text-faint)] text-[12px]">→</span>
                  <Input
                    value={item.end}
                    onChange={(e) => roles.update(item.id, { end: e.target.value })}
                    disabled={item.current}
                    placeholder={item.current ? 'present' : 'Apr 2024'}
                    className="w-1/2"
                  />
                </div>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={item.current}
                onChange={(e) => roles.update(item.id, { current: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              I currently work here
            </label>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel>Bullets</FieldLabel>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={12} />}
                  onClick={() =>
                    roles.update(item.id, {
                      bullets: [...item.bullets, { id: nanoid(6), text: '' }],
                    })
                  }
                >
                  Add bullet
                </Button>
              </div>
              <SortableList
                items={item.bullets}
                onChange={(next) => roles.update(item.id, { bullets: next })}
                onRemove={(id) =>
                  roles.update(item.id, {
                    bullets: updateList(item.bullets, { type: 'remove', id }),
                  })
                }
                emptyHint="No bullet points yet"
                renderItem={(b) => (
                  <TextArea
                    rows={2}
                    value={b.text}
                    onChange={(e) =>
                      roles.update(item.id, {
                        bullets: updateList(item.bullets, {
                          type: 'update',
                          id: b.id,
                          patch: { text: e.target.value },
                        }),
                      })
                    }
                    placeholder="What you shipped, in one tight line."
                    className="!min-h-[44px]"
                  />
                )}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => roles.remove(item.id)}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove role
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function makeEmptyExperienceItem(): ExperienceItem {
  return {
    id: nanoid(6),
    role: '',
    company: '',
    location: '',
    start: '',
    end: '',
    current: false,
    bullets: [],
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
