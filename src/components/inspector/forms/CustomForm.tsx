import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useResumeStore } from '../../../stores/resumeStore'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import type { CustomItem, ResumeNode } from '../../../stores/types'
import { useNodeListField } from '../useNodeListField'

export function CustomForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'custom'>
}) {
  const update = useResumeStore((s) => s.updateNodeData)
  const data = node.data
  const set = (patch: Partial<typeof data>) =>
    update<'custom'>(resumeId, node.id, patch as Partial<typeof data>)
  const customItems = useNodeListField<'custom', CustomItem>({
    resumeId,
    node,
    field: 'items',
    makeItem: makeEmptyCustomItem,
  })

  return (
    <div className="flex flex-col gap-4">
      <Field label="Section title">
        <Input
          value={data.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Awards"
        />
      </Field>

      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Items
        </h3>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={12} />}
          onClick={() => customItems.add()}
        >
          Add item
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {customItems.items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title">
                <Input
                  value={item.title}
                  onChange={(e) => customItems.update(item.id, { title: e.target.value })}
                  placeholder="Title"
                />
              </Field>
              <Field label="Subtitle">
                <Input
                  value={item.subtitle}
                  onChange={(e) => customItems.update(item.id, { subtitle: e.target.value })}
                  placeholder="2024"
                />
              </Field>
            </div>
            <Field label="Body">
              <TextArea
                rows={2}
                value={item.body}
                onChange={(e) => customItems.update(item.id, { body: e.target.value })}
                placeholder="Optional details."
              />
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => customItems.remove(item.id)}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove item
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function makeEmptyCustomItem(): CustomItem {
  return { id: nanoid(6), title: '', subtitle: '', body: '' }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}
