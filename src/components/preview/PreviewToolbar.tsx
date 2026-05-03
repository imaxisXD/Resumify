import { Baseline, Check, ChevronDown, FileText, Grid2X2, Minus, MoveHorizontal, Palette, Plus, Rows3, SlidersHorizontal, Type, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useResumeStore } from '../../stores/resumeStore'
import type { ResumeStyle } from '../../stores/types'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { TemplateGallery } from '../templates/TemplateGallery'
import { templateName } from '../../features/templates'

const pageOptions: Array<{ value: ResumeStyle['pageSize']; label: string }> = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]

const fontOptions: Array<{ value: ResumeStyle['font']; label: string }> = [
  { value: 'sans', label: 'Geist Sans' },
  { value: 'serif', label: 'Instrument Serif' },
  { value: 'mono', label: 'Geist Mono' },
  { value: 'source-sans', label: 'Source Sans' },
  { value: 'merriweather', label: 'Merriweather' },
  { value: 'calibri', label: 'Calibri' },
  { value: 'times', label: 'Times' },
  { value: 'roboto-mono', label: 'Roboto Mono' },
]

const dividerOptions: Array<{ value: ResumeStyle['divider']; label: string }> = [
  { value: 'line', label: 'Line' },
  { value: 'accent', label: 'Accent' },
  { value: 'none', label: 'None' },
]

export function PreviewToolbar({ resumeId }: { resumeId: string }) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(true)
  const [fitMessage, setFitMessage] = useState<string | null>(null)
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const setTemplate = useResumeStore((s) => s.setTemplate)
  const setResumeStyle = useResumeStore((s) => s.setResumeStyle)
  const saveSnapshot = useResumeStore((s) => s.saveSnapshot)
  if (!resume) return null
  const style = resume.style

  const patchStyle = (patch: Partial<ResumeStyle>) => {
    saveSnapshot(resumeId, 'Before style change')
    setFitMessage(null)
    setResumeStyle(resumeId, patch)
  }

  const autoAdjust = () => {
    const fit = measurePreviewFit()
    saveSnapshot(resumeId, 'Before auto-adjust')

    if (!fit || fit.ratio <= 0.98) {
      setResumeStyle(resumeId, { zoom: 100, viewAsPages: true })
      flashFitMessage('Already fits on 1 page')
      return
    }

    const patch = fitPatch(style, fit.ratio)
    setResumeStyle(resumeId, {
      ...patch,
      zoom: 100,
      viewAsPages: true,
    })
    flashFitMessage('Auto-adjusted to fit on 1 page')

    window.setTimeout(() => {
      const nextFit = measurePreviewFit()
      if (!nextFit || nextFit.ratio <= 1.01) return
      const latest = useResumeStore.getState().resumes[resumeId]?.style ?? style
      setResumeStyle(resumeId, fitPatch(latest, nextFit.ratio, 0.9))
    }, 120)
  }

  const flashFitMessage = (message: string) => {
    setFitMessage(message)
    window.setTimeout(() => setFitMessage((current) => (current === message ? null : current)), 2600)
  }

  const lastSaved = formatLastSaved(resume.updatedAt)

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg-elevated)]/95 px-3 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={<WandSparkles size={13} />} onClick={autoAdjust}>
              Auto-adjust
            </Button>
            <Button
              size="sm"
              variant={adjustmentsOpen ? 'primary' : 'secondary'}
              icon={<SlidersHorizontal size={13} />}
              onClick={() => setAdjustmentsOpen((open) => !open)}
            >
              Adjustments
            </Button>
            <Button size="sm" variant="secondary" icon={<Grid2X2 size={13} />} onClick={() => setGalleryOpen(true)}>
              {templateName(resume.templateId)}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--text-faint)]">
            {fitMessage ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--surface-2)] px-2 py-1 text-[var(--text)] animate-pop-in">
                <Check size={12} className="text-[var(--success)]" />
                {fitMessage}
              </span>
            ) : null}
            <span>{lastSaved}</span>
          </div>
        </div>
        {adjustmentsOpen ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-2">
            <Select value={style.font} onChange={(font) => patchStyle({ font })} options={fontOptions} triggerIcon={<Type size={13} />} className="h-8 min-w-[148px] text-[12px]" align="left" />
            <Stepper label="Font size" shortLabel="Font" value={style.fontSize} min={10} max={17} step={0.5} onChange={(fontSize) => patchStyle({ fontSize })} />
            <Stepper label="Line height" shortLabel="Line" value={style.lineHeight} min={1.1} max={1.8} step={0.05} onChange={(lineHeight) => patchStyle({ lineHeight })} icon={<Rows3 size={13} />} />
            <Stepper label="Section spacing" shortLabel="Space" value={style.sectionSpacing} min={0.75} max={1.6} step={0.05} onChange={(sectionSpacing) => patchStyle({ sectionSpacing })} icon={<MoveHorizontal size={13} />} />
            <Stepper label="Margin" value={style.marginScale} min={0.75} max={1.35} step={0.05} onChange={(marginScale) => patchStyle({ marginScale })} />
            <Stepper label="Indent" value={style.indent} min={0.6} max={1.6} step={0.1} onChange={(indent) => patchStyle({ indent })} />
            <Select value={style.divider} onChange={(divider) => patchStyle({ divider })} options={dividerOptions} className="h-8 min-w-[92px] text-[12px]" align="left" />
            <Select value={style.pageSize} onChange={(pageSize) => patchStyle({ pageSize })} options={pageOptions} triggerIcon={<FileText size={13} />} className="h-8 min-w-[92px] text-[12px]" align="left" />
            <Stepper label="Zoom" value={style.zoom} min={70} max={150} step={5} onChange={(zoom) => patchStyle({ zoom })} />
            <Color label="Text color" value={style.textColor} onChange={(textColor) => patchStyle({ textColor })} />
            <Color label="Accent color" value={style.accentColor} onChange={(accentColor) => patchStyle({ accentColor })} />
            <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={style.viewAsPages}
                onChange={(e) => patchStyle({ viewAsPages: e.currentTarget.checked })}
                className="accent-[var(--accent)]"
              />
              Pages
            </label>
          </div>
        ) : null}
      </div>
      {galleryOpen ? (
        <TemplateGallery
          current={resume.templateId}
          onSelect={(template) => {
            saveSnapshot(resumeId, 'Before template change')
            setTemplate(resumeId, template)
          }}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
    </>
  )
}

function Stepper({
  label,
  shortLabel,
  value,
  min,
  max,
  step,
  icon,
  onChange,
}: {
  label: string
  shortLabel?: string
  value: number
  min: number
  max: number
  step: number
  icon?: ReactNode
  onChange: (value: number) => void
}) {
  const next = (direction: 1 | -1) => {
    const valueNext = Math.min(max, Math.max(min, Number((value + step * direction).toFixed(2))))
    onChange(valueNext)
  }
  return (
    <div className="inline-flex h-8 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--text-muted)]">
      <span className="inline-flex min-w-[48px] items-center gap-1 px-2">
        {icon ?? <Baseline size={13} />}
        <span className="sr-only">{label}</span>
        <span aria-hidden>{shortLabel ?? label}</span>
      </span>
      <button type="button" className="grid h-full w-7 place-items-center border-l border-[var(--border)] hover:bg-[var(--surface-2)]" onClick={() => next(-1)} aria-label={`Decrease ${label}`}>
        <Minus size={12} />
      </button>
      <span className="w-9 text-center font-mono text-[11px] text-[var(--text)]">{value}</span>
      <button type="button" className="grid h-full w-7 place-items-center border-l border-[var(--border)] hover:bg-[var(--surface-2)]" onClick={() => next(1)} aria-label={`Increase ${label}`}>
        <Plus size={12} />
      </button>
    </div>
  )
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
      <Palette size={13} />
      <span className="sr-only">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="size-5 rounded border border-[var(--border)] bg-transparent p-0"
        aria-label={label}
      />
      <ChevronDown size={12} aria-hidden />
    </label>
  )
}

function measurePreviewFit() {
  const page = document.querySelector<HTMLElement>('.print-surface .resume-template')
  const content = page?.querySelector<HTMLElement>('.resume-page-pad')
  if (!page || !content) return null
  const pageHeight = page.clientHeight || page.getBoundingClientRect().height
  const pageWidth = page.clientWidth || page.getBoundingClientRect().width
  if (!pageHeight || !pageWidth) return null
  const heightRatio = content.scrollHeight / pageHeight
  const widthRatio = content.scrollWidth / pageWidth
  return {
    ratio: Math.max(heightRatio, widthRatio),
    contentHeight: content.scrollHeight,
    contentWidth: content.scrollWidth,
    pageHeight,
    pageWidth,
  }
}

function fitPatch(style: ResumeStyle, ratio: number, extraCompression = 1): Partial<ResumeStyle> {
  const compression = clamp(Math.pow(0.97 / ratio, 0.72) * extraCompression, 0.74, 0.99)
  return {
    spacing: 'compact',
    fontSize: round(clamp(style.fontSize * compression, 10, style.fontSize), 1),
    lineHeight: round(clamp(1.1 + (style.lineHeight - 1.1) * compression, 1.1, style.lineHeight), 2),
    sectionSpacing: round(clamp(style.sectionSpacing * compression, 0.72, style.sectionSpacing), 2),
    marginScale: round(clamp(style.marginScale * Math.max(0.82, compression), 0.74, style.marginScale), 2),
    indent: round(clamp(style.indent * Math.max(0.88, compression), 0.68, style.indent), 2),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits: number) {
  const multiple = 10 ** digits
  return Math.round(value * multiple) / multiple
}

function formatLastSaved(updatedAt: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))
  if (seconds < 10) return 'Saved just now'
  if (seconds < 60) return `Saved ${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Saved ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Saved ${days}d ago`
}
