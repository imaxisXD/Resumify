import {
  AlertTriangle,
  Columns2,
  Download,
  Eye,
  Inbox,
  LayoutGrid,
  Layout,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useResumeStore, selectErrors } from '../../stores/resumeStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { SegmentedControl } from '../ui/SegmentedControl'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Brand } from './Brand'
import { Tooltip } from '../ui/Tooltip'

export function TopBar({ resumeId }: { resumeId: string }) {
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const view = useResumeStore((s) => s.view)
  const setView = useResumeStore((s) => s.setView)
  const setTemplate = useResumeStore((s) => s.setTemplate)
  const renameResume = useResumeStore((s) => s.renameResume)
  const errors = useMemo(() => (resume ? selectErrors(resume) : []), [resume])

  const [renaming, setRenaming] = useState(false)
  const [errorsOpen, setErrorsOpen] = useState(false)
  const errorsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!errorsOpen) return
    function onDoc(e: MouseEvent) {
      if (!errorsRef.current) return
      if (!errorsRef.current.contains(e.target as Node)) setErrorsOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [errorsOpen])

  if (!resume) return null

  return (
    <header className="shrink-0 h-[60px] flex items-center gap-3 px-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] z-20">
      <div className="flex items-center gap-3 pr-3 mr-1 border-r border-[var(--border)] h-full">
        <Brand size="sm" />
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          Editing
        </span>
        {renaming ? (
          <input
            autoFocus
            defaultValue={resume.name}
            onBlur={(e) => {
              renameResume(resumeId, e.currentTarget.value || resume.name)
              setRenaming(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setRenaming(false)
            }}
            className="font-display text-[20px] leading-none tracking-tight bg-transparent min-w-[140px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="group inline-flex items-center gap-1.5 font-display text-[20px] leading-none tracking-tight text-[var(--text)] hover:text-[var(--accent-hi)] transition-colors duration-200"
          >
            <span className="truncate max-w-[280px]">{resume.name}</span>
            <Pencil
              size={11}
              className="text-[var(--text-faint)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
            />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-2">
        <div ref={errorsRef} className="relative">
          <Button
            size="sm"
            variant={errors.length ? 'danger' : 'subtle'}
            icon={errors.length ? <AlertTriangle size={12} /> : <Sparkles size={12} />}
            onClick={() => setErrorsOpen((o) => !o)}
            className="min-w-[88px]"
          >
            {errors.length ? 'Needs fixes' : 'Ready'}
            {errors.length ? (
              <Badge tone="danger" className="ml-1">
                {errors.length}
              </Badge>
            ) : null}
          </Button>
          {errorsOpen ? (
            <div
              className="absolute z-50 top-[calc(100%+6px)] left-0 w-[320px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl shadow-black/40 animate-pop-in"
              style={{ '--pop-origin': 'top left' } as React.CSSProperties}
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)] mb-2">
                What to fix
              </div>
              {errors.length === 0 ? (
                <div className="text-[12px] text-[var(--text-muted)]">
                  All sections are connected and ready to preview.
                </div>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {errors.map((e, i) => (
                    <li
                      key={e.id}
                      style={{ animationDelay: `${i * 30}ms` }}
                      className="text-[12px] text-[var(--text)] flex items-start gap-2 leading-snug animate-fade-up"
                    >
                      <span className="mt-[3px] size-1.5 rounded-full bg-[var(--danger)] shrink-0" />
                      {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        <Tooltip label="Import (coming soon)">
          <Button size="sm" variant="subtle" icon={<Inbox size={12} />} disabled>
            Import
          </Button>
        </Tooltip>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'builder', label: 'Builder', icon: <LayoutGrid size={12} /> },
            { value: 'both', label: 'Both', icon: <Columns2 size={12} /> },
            { value: 'preview', label: 'Preview', icon: <Eye size={12} /> },
          ]}
        />

        <Select
          value={resume.templateId}
          onChange={(t) => setTemplate(resumeId, t)}
          triggerIcon={<Layout size={14} />}
          options={[
            { value: 'classic', label: 'Classic', hint: 'Default' },
            { value: 'modern', label: 'Modern', hint: 'Soon', disabled: true },
            { value: 'compact', label: 'Compact', hint: 'Soon', disabled: true },
          ]}
        />

        <Tooltip label="Download (PDF in next phase)">
          <Button variant="primary" size="md" icon={<Download size={14} />} disabled>
            Download
          </Button>
        </Tooltip>

        <ThemeToggle />
      </div>
    </header>
  )
}
