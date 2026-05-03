import { Check, FileText, LayoutTemplate, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { templatesForCategory, type TemplateCategory } from '../../features/templates'
import type { TemplateId } from '../../stores/types'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

const filters: Array<{ id: TemplateCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'simple', label: 'Simple' },
  { id: 'modern', label: 'Modern' },
  { id: 'compact', label: 'Compact' },
  { id: 'creative', label: 'Creative' },
]

export function TemplateGallery({
  current,
  onSelect,
  onClose,
}: {
  current: TemplateId
  onSelect: (id: TemplateId) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState<TemplateCategory>('all')
  const templates = templatesForCategory(filter)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 animate-fade-in">
      <section className="w-full max-w-5xl max-h-[86vh] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl shadow-black/45">
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
              Templates
            </div>
            <h2 className="mt-1 font-display text-[30px] leading-none">Choose a resume layout</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            aria-label="Close template gallery"
          >
            <X size={15} />
          </button>
        </header>
        <div className="grid min-h-0 grid-cols-[190px_minmax(0,1fr)]">
          <aside className="border-r border-[var(--border)] p-3">
            <div className="flex flex-col gap-1">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    filter === item.id
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-hi)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>
          <div className="min-h-0 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onSelect(template.id)}
                  className={`group rounded-xl border bg-[var(--surface)] p-3 text-left transition-[border-color,background,transform] hover:-translate-y-0.5 hover:bg-[var(--surface-2)] ${
                    template.id === current ? 'border-[var(--accent-hi)]' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="aspect-[1.55] rounded-lg border border-[var(--border)] bg-white p-4 text-[#15151a] shadow-inner">
                    <div className={`mx-auto h-2 w-32 rounded ${template.id === 'modern' ? 'bg-[var(--accent)]' : 'bg-[#222]'}`} />
                    <div className="mx-auto mt-2 h-1.5 w-44 rounded bg-[#d7d7d7]" />
                    <div className="mt-5 space-y-2">
                      {[0, 1, 2].map((line) => (
                        <div key={line}>
                          <div className="h-1.5 w-24 rounded bg-[var(--accent)]" />
                          <div className="mt-1.5 h-1 rounded bg-[#dedede]" />
                          <div className="mt-1 h-1 w-4/5 rounded bg-[#ededed]" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 font-medium text-[var(--text)]">
                        <LayoutTemplate size={14} />
                        {template.name}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{template.description}</p>
                    </div>
                    {template.id === current ? <Check size={17} className="text-[var(--accent-hi)]" /> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {template.atsSafe ? (
                      <Badge tone="accent">
                        <span className="inline-flex items-center gap-1"><ShieldCheck size={11} /> ATS-safe</span>
                      </Badge>
                    ) : null}
                    <Badge tone="neutral">
                      <span className="inline-flex items-center gap-1"><FileText size={11} /> PDF</span>
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
