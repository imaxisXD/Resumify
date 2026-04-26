import { Plus, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useResumeStore } from '../../../stores/resumeStore'
import { FieldLabel, Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import type { ResumeNode } from '../../../stores/types'

export function PersonalForm({
  resumeId,
  node,
}: {
  resumeId: string
  node: ResumeNode<'personal'>
}) {
  const update = useResumeStore((s) => s.updateNodeData)
  const data = node.data
  const set = (patch: Partial<typeof data>) =>
    update<'personal'>(resumeId, node.id, patch as Partial<typeof data>)

  return (
    <div className="flex flex-col gap-5">
      <Section title="Identity">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name">
            <Input
              value={data.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              placeholder="Ada Lovelace"
            />
          </Field>
          <Field label="Title">
            <Input
              value={data.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Software Engineer"
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input
              type="email"
              value={data.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={data.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </Field>
          <Field label="Location">
            <Input
              value={data.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="London, UK"
            />
          </Field>
          <Field label="Website">
            <Input
              value={data.website}
              onChange={(e) => set({ website: e.target.value })}
              placeholder="ada.dev"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Links"
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={<Plus size={12} />}
            onClick={() =>
              set({
                links: [...data.links, { id: nanoid(6), label: 'New', url: '' }],
              })
            }
          >
            Add link
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {data.links.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-[12px] text-[var(--text-faint)] text-center">
              No links added yet
            </div>
          ) : null}
          {data.links.map((link, i) => (
            <div key={link.id} className="flex items-center gap-2">
              <Input
                value={link.label}
                onChange={(e) => {
                  const next = [...data.links]
                  next[i] = { ...link, label: e.target.value }
                  set({ links: next })
                }}
                placeholder="Label"
                className="w-[110px]"
              />
              <Input
                value={link.url}
                onChange={(e) => {
                  const next = [...data.links]
                  next[i] = { ...link, url: e.target.value }
                  set({ links: next })
                }}
                placeholder="github.com/you"
              />
              <button
                type="button"
                aria-label="Remove link"
                className="size-8 shrink-0 rounded-md text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[var(--surface-2)] inline-flex items-center justify-center transition-colors"
                onClick={() => set({ links: data.links.filter((l) => l.id !== link.id) })}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}
