import type { PersonalData } from '../../../stores/types'
import type { PreviewResume, PreviewSection } from '../previewData'

export function ClassicTemplate({ preview }: { preview: PreviewResume }) {
  return (
    <article className="min-h-[880px] w-full bg-[var(--paper)] text-[var(--paper-ink)] font-sans">
      <div className="px-12 py-12">
        {preview.personal ? <PersonalHeader data={preview.personal.data} /> : null}
        <div className="mt-8 flex flex-col gap-7">
          {preview.sections.map((section) => (
            <SectionFor key={section.id} section={section} />
          ))}
        </div>
      </div>
    </article>
  )
}

function PersonalHeader({ data }: { data: PersonalData }) {
  const links = [data.website, ...data.links.map((l) => `${l.label}: ${l.url}`)].filter(Boolean)
  return (
    <header className="border-b border-[var(--paper-ink)]/15 pb-5">
      <h1 className="font-display text-[44px] leading-[0.95] tracking-tight">
        {data.fullName || 'Your name'}
      </h1>
      {data.title ? (
        <div className="mt-1 text-[15px] text-[var(--paper-ink)]/60 italic font-display">{data.title}</div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[var(--paper-ink)]/70 font-mono">
        {data.email ? <span>{data.email}</span> : null}
        {data.phone ? <span className="opacity-50">·</span> : null}
        {data.phone ? <span>{data.phone}</span> : null}
        {data.location ? <span className="opacity-50">·</span> : null}
        {data.location ? <span>{data.location}</span> : null}
      </div>
      {links.length ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--paper-ink)]/60 font-mono">
          {links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      ) : null}
    </header>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-2">
        <h2 className="font-display text-[20px] leading-none tracking-tight">{title}</h2>
        <span className="flex-1 h-px bg-[var(--paper-ink)]/15" />
      </div>
      {children}
    </section>
  )
}

function SectionFor({ section }: { section: PreviewSection }) {
  switch (section.kind) {
    case 'summary': {
      const d = section.data
      return (
        <Section title="Summary">
          <p className="text-[13px] leading-relaxed text-[var(--paper-ink)]/80">{d.text}</p>
        </Section>
      )
    }
    case 'experience': {
      const d = section.data
      return (
        <Section title="Experience">
          <div className="flex flex-col gap-4">
            {d.items.map((it) => (
              <div key={it.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[var(--paper-ink)] tracking-tight">
                      {it.role || 'Role'}
                      {it.company ? (
                        <span className="font-normal text-[var(--paper-ink)]/70"> · {it.company}</span>
                      ) : null}
                    </div>
                    {it.location ? (
                      <div className="text-[12px] text-[var(--paper-ink)]/55">{it.location}</div>
                    ) : null}
                  </div>
                  <div className="text-[11.5px] font-mono uppercase tracking-wider text-[var(--paper-ink)]/55 whitespace-nowrap">
                    {it.start || '—'} → {it.current ? 'present' : it.end || '—'}
                  </div>
                </div>
                {it.bullets.length ? (
                  <ul className="mt-1.5 ml-4 list-[square] text-[12.5px] text-[var(--paper-ink)]/80 leading-relaxed marker:text-[var(--paper-ink)]/40">
                    {it.bullets.map((b) => (
                      <li key={b.id} className="pl-1">
                        {b.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      )
    }
    case 'education': {
      const d = section.data
      return (
        <Section title="Education">
          <div className="flex flex-col gap-3">
            {d.items.map((it) => (
              <div key={it.id} className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-semibold text-[var(--paper-ink)] tracking-tight">
                    {it.school || 'School'}
                  </div>
                  <div className="text-[12px] text-[var(--paper-ink)]/65">
                    {[it.degree, it.field].filter(Boolean).join(' · ')}
                    {it.notes ? <span className="text-[var(--paper-ink)]/45"> — {it.notes}</span> : null}
                  </div>
                </div>
                <div className="text-[11.5px] font-mono uppercase tracking-wider text-[var(--paper-ink)]/55 whitespace-nowrap">
                  {it.start || '—'} → {it.end || '—'}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )
    }
    case 'skills': {
      const d = section.data
      return (
        <Section title="Skills">
          <div className="flex flex-col gap-1.5">
            {d.groups.map((g) => (
              <div key={g.id} className="text-[12.5px] text-[var(--paper-ink)]/85 leading-relaxed">
                <span className="font-semibold text-[var(--paper-ink)]">{g.label}: </span>
                <span className="text-[var(--paper-ink)]/75">{g.skills.join(' · ')}</span>
              </div>
            ))}
          </div>
        </Section>
      )
    }
    case 'projects': {
      const d = section.data
      return (
        <Section title="Projects">
          <div className="flex flex-col gap-3">
            {d.items.map((it) => (
              <div key={it.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[13.5px] font-semibold text-[var(--paper-ink)] tracking-tight">
                    {it.name || 'Project'}
                  </div>
                  {it.url ? (
                    <div className="text-[11.5px] font-mono text-[var(--paper-ink)]/55">{it.url}</div>
                  ) : null}
                </div>
                {it.description ? (
                  <p className="text-[12.5px] text-[var(--paper-ink)]/80 leading-relaxed">{it.description}</p>
                ) : null}
                {it.tech.length ? (
                  <div className="mt-1 text-[11.5px] font-mono uppercase tracking-wide text-[var(--paper-ink)]/55">
                    {it.tech.join(' · ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      )
    }
    case 'custom': {
      const d = section.data
      return (
        <Section title={d.title || 'Custom'}>
          <div className="flex flex-col gap-3">
            {d.items.map((it) => (
              <div key={it.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[13.5px] font-semibold text-[var(--paper-ink)] tracking-tight">
                    {it.title}
                  </div>
                  {it.subtitle ? (
                    <div className="text-[11.5px] font-mono uppercase tracking-wider text-[var(--paper-ink)]/55">
                      {it.subtitle}
                    </div>
                  ) : null}
                </div>
                {it.body ? (
                  <p className="text-[12.5px] text-[var(--paper-ink)]/80 leading-relaxed">{it.body}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      )
    }
    default:
      return null
  }
}
