import { createFileRoute } from '@tanstack/react-router'
import { Sparkles } from 'lucide-react'
import { Badge } from '../components/ui/Badge'

export const Route = createFileRoute('/templates')({ component: Templates })

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Serif-led, traditional. The default for most engineering and academic resumes.',
    available: true,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column with indigo accents. Great for product, design, and creative roles.',
    available: false,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Single-page guarantee. Dense, every line earned.',
    available: false,
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
              <div
                className={
                  'aspect-[3/4] rounded-xl border border-dashed border-[var(--border-strong)] grid place-items-center text-[var(--text-faint)] ' +
                  (t.available ? 'bg-[var(--paper)]/95 text-[var(--paper-ink)]' : 'bg-[var(--surface-2)]')
                }
              >
                {t.available ? (
                  <span className="font-display text-[26px] tracking-tight">{t.name}</span>
                ) : (
                  <Sparkles size={22} className="opacity-50" />
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <h3 className="font-display text-[22px] leading-tight">{t.name}</h3>
                {t.available ? (
                  <Badge tone="accent">Available</Badge>
                ) : (
                  <Badge tone="mono">Coming soon</Badge>
                )}
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
