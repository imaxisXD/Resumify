import type { PersonalData } from '../../../stores/types'
import type { PreviewResume, PreviewSection } from '../previewData'
import { cn } from '../../../lib/cn'

export function ClassicTemplate({ preview }: { preview: PreviewResume }) {
  const style = preview.style
  const templateClass = {
    classic: 'resume-classic',
    modern: 'resume-modern',
    compact: 'resume-compact',
    professional: 'resume-professional',
  }[preview.templateId]
  const fontClass = {
    serif: 'font-display',
    sans: 'font-sans',
    mono: 'font-mono',
    'source-sans': 'font-source-sans',
    merriweather: 'font-merriweather',
    calibri: 'font-calibri',
    times: 'font-times',
    'roboto-mono': 'font-roboto-mono',
  }[style.font]
  const pageClass = style.pageSize === 'letter' ? 'resume-page-letter' : 'resume-page-a4'
  const spacingClass = `resume-spacing-${style.spacing}`
  const dividerClass = `resume-divider-${style.divider}`

  return (
    <article
      className={cn(
        'resume-template w-full bg-[var(--paper)] text-[var(--paper-ink)]',
        pageClass,
        templateClass,
        fontClass,
        spacingClass,
        dividerClass,
      )}
      style={{
        '--resume-accent': style.accentColor,
        '--paper-ink': style.textColor,
        '--resume-font-size': `${style.fontSize}px`,
        '--resume-line-height': style.lineHeight,
        '--resume-section-scale': style.sectionSpacing,
        '--resume-margin-scale': style.marginScale,
        '--resume-indent-scale': style.indent,
      } as React.CSSProperties}
    >
      <div className="resume-page-pad">
        {preview.personal ? <PersonalHeader data={preview.personal.data} /> : null}
        <div className="resume-sections flex flex-col">
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
    <header className="resume-header">
      <h1 className="resume-name">
        {data.fullName || 'Your name'}
      </h1>
      {data.title ? (
        <div className="resume-title">{data.title}</div>
      ) : null}
      <div className="resume-contact flex flex-wrap items-center gap-x-4 gap-y-1">
        {data.email ? <span>{data.email}</span> : null}
        {data.phone ? <span className="opacity-50">·</span> : null}
        {data.phone ? <span>{data.phone}</span> : null}
        {data.location ? <span className="opacity-50">·</span> : null}
        {data.location ? <span>{data.location}</span> : null}
      </div>
      {links.length ? (
        <div className="resume-links flex flex-wrap items-center gap-x-3 gap-y-1">
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
      <div className="resume-section-head flex items-baseline gap-3">
        <h2>{title}</h2>
        <span className="flex-1 h-px" />
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
          <p className="resume-copy">{d.text}</p>
        </Section>
      )
    }
    case 'experience': {
      const d = section.data
      return (
        <Section title="Experience">
          <div className="resume-items flex flex-col">
            {d.items.map((it) => (
              <div key={it.id}>
                <div className="resume-item-head flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="resume-main">
                      {it.role || 'Role'}
                      {it.company ? (
                        <span className="font-normal text-[var(--paper-ink)]/70"> · {it.company}</span>
                      ) : null}
                    </div>
                    {it.location ? (
                      <div className="resume-muted">{it.location}</div>
                    ) : null}
                  </div>
                  <div className="resume-date shrink-0">
                    {it.start || '—'} → {it.current ? 'present' : it.end || '—'}
                  </div>
                </div>
                {it.bullets.length ? (
                  <ul className="resume-list">
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
          <div className="resume-items flex flex-col">
            {d.items.map((it) => (
              <div key={it.id} className="resume-item-head flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="resume-main">
                    {it.school || 'School'}
                  </div>
                  <div className="resume-copy">
                    {[it.degree, it.field].filter(Boolean).join(' · ')}
                    {it.notes ? <span className="text-[var(--paper-ink)]/45"> — {it.notes}</span> : null}
                  </div>
                </div>
                <div className="resume-date shrink-0">
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
          <div className="resume-items flex flex-col">
            {d.groups.map((g) => (
              <div key={g.id} className="resume-copy">
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
          <div className="resume-items flex flex-col">
            {d.items.map((it) => {
              const url = splitImportedUrl(it.url)
              const description = mergeProjectDescription(url.trailing, it.description)
              return (
                <div key={it.id}>
                  <div className="resume-project-head">
                    <div className="resume-main resume-breakable">
                      {it.name || 'Project'}
                    </div>
                    {url.href ? (
                      <div className="resume-muted resume-breakable">{url.href}</div>
                    ) : null}
                  </div>
                  {description ? (
                    <p className="resume-copy resume-breakable resume-project-description">{description}</p>
                  ) : null}
                  {it.bullets?.length ? (
                    <ul className="resume-list">
                      {it.bullets.map((bullet) => (
                        <li key={bullet.id} className="pl-1">
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {it.tech.length ? (
                    <div className="resume-copy resume-breakable mt-1">
                      <span className="font-semibold text-[var(--paper-ink)] normal-case">Tech Stack: </span>
                      <span className="normal-case">{it.tech.join(', ')}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </Section>
      )
    }
    case 'custom': {
      const d = section.data
      return (
        <Section title={d.title || 'Custom'}>
          <div className="resume-items flex flex-col">
            {d.items.map((it) => (
              <div key={it.id}>
                <div className="resume-item-head flex items-baseline justify-between gap-3">
                  <div className="resume-main min-w-0">
                    {it.title}
                  </div>
                  {it.subtitle ? (
                    <div className="resume-date resume-breakable shrink-0">
                      {it.subtitle}
                    </div>
                  ) : null}
                </div>
                {it.body ? (
                  <p className="resume-copy">{it.body}</p>
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

function splitImportedUrl(value: string) {
  const [href = '', ...rest] = value.split('•')
  return {
    href: href.trim(),
    trailing: rest.join(' ').trim(),
  }
}

function mergeProjectDescription(fromUrl: string, description: string) {
  const parts = [fromUrl, description]
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(parts)).join(' ')
}
