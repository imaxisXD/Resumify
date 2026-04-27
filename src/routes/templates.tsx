import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { Badge } from '../components/ui/Badge'

export const Route = createFileRoute('/templates')({ component: Templates })

const templates = [
  {
    id: 'professional',
    name: 'Pro ATS',
    description: 'Matches the uploaded resume style: centered header, blue section labels, tight one-page spacing.',
    available: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional single-column resume with clear headings and plain text.',
    available: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sharper heading style with an accent line, still single-column and ATS safe.',
    available: true,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Tighter spacing for longer resumes while keeping normal text structure.',
    available: true,
  },
]

function Templates() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-10 py-12 animate-fade-in">
        <header className="pb-10 border-b border-dashed border-[var(--border)]">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
            Templates
          </div>
          <h1 className="mt-3 font-display text-[48px] leading-[1] tracking-tight">
            One resume. <span className="italic text-[var(--text-muted)]">Many layouts.</span>
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-[var(--text-muted)] leading-relaxed">
            Templates show the same resume in different layouts. Switch any time without losing
            your content.
          </p>
        </header>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((t, i) => (
            <article
              key={t.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 animate-fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="aspect-[3/4] rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--paper)]/95 p-5 text-[var(--paper-ink)]">
                <div className="flex items-center gap-2 border-b border-black/15 pb-3">
                  <FileText size={16} />
                  <span className="font-display text-[24px] tracking-tight">{t.name}</span>
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  <span className="h-2 w-2/3 bg-black/70" />
                  <span className="h-1.5 w-full bg-black/20" />
                  <span className="h-1.5 w-5/6 bg-black/20" />
                  <span className="mt-2 h-2 w-1/2 bg-black/70" />
                  <span className="h-1.5 w-full bg-black/20" />
                  <span className="h-1.5 w-4/5 bg-black/20" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="font-display text-[22px] leading-tight">{t.name}</h3>
                <Badge tone="accent">ATS safe</Badge>
              </div>
              <p className="mt-2 text-[13px] text-[var(--text-muted)] leading-relaxed">
                {t.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
