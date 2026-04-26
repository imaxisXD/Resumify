import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowUpRight, Copy, FilePlus2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useResumeStore } from '../stores/resumeStore'
import { Button } from '../components/ui/Button'
import { DashedDropZone } from '../components/ui/DashedDropZone'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const router = useRouter()
  const hydrated = useResumeStore((s) => s.hasHydrated)
  const order = useResumeStore((s) => s.order)
  const resumes = useResumeStore((s) => s.resumes)
  const createResume = useResumeStore((s) => s.createResume)
  const deleteResume = useResumeStore((s) => s.deleteResume)
  const duplicateResume = useResumeStore((s) => s.duplicateResume)

  const onCreate = () => {
    const id = createResume()
    router.navigate({ to: '/builder/$resumeId', params: { resumeId: id } })
  }

  const list = order.flatMap((id) => {
    const resume = resumes[id]
    return resume ? [resume] : []
  })

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1280px] px-10 py-12 animate-fade-in">
        <header className="flex items-end justify-between gap-6 pb-10 border-b border-dashed border-[var(--border)]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
              Workspace · {hydrated ? `${list.length} ${list.length === 1 ? 'resume' : 'resumes'}` : '…'}
            </div>
            <h1 className="mt-3 font-display text-[56px] leading-[1] text-[var(--text)] text-balance">
              Your resumes,
              <span className="text-[var(--text-muted)] italic"> built from sections.</span>
            </h1>
            <p className="mt-3 max-w-[58ch] text-[15px] text-[var(--text-muted)] leading-relaxed text-pretty">
              Each resume lives on a canvas. Drag in a section, link it to the next, and watch the
              document render itself.
            </p>
          </div>
          <Button variant="primary" size="lg" icon={<FilePlus2 size={16} />} onClick={onCreate}>
            New Resume
          </Button>
        </header>

        {!hydrated ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`loading-resume-${i}`}
                className="h-[200px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 animate-pulse-soft"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <DashedDropZone
            icon={<FilePlus2 />}
            title="No resumes yet"
            hint="Click New Resume to start your first one"
            className="mt-10 h-[260px] cursor-pointer"
            onClick={onCreate}
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((r, idx) => (
              <ResumeCard
                key={r.id}
                index={idx}
                id={r.id}
                name={r.name}
                templateId={r.templateId}
                nodes={r.nodes.length}
                edges={r.edges.length}
                updatedAt={r.updatedAt}
                onDelete={() => deleteResume(r.id)}
                onDuplicate={() => {
                  const newId = duplicateResume(r.id)
                  if (newId) router.navigate({ to: '/builder/$resumeId', params: { resumeId: newId } })
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ResumeCard({
  id,
  name,
  templateId,
  nodes,
  edges,
  updatedAt,
  index,
  onDelete,
  onDuplicate,
}: {
  id: string
  name: string
  templateId: string
  nodes: number
  edges: number
  updatedAt: number
  index: number
  onDelete: () => void
  onDuplicate: () => void
}) {
  return (
    <div
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-[var(--accent-hi)]/50 hover:bg-[var(--surface)]/90 hover:shadow-lg animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
            {shortId(id)}
          </div>
          <h3 className="mt-1.5 font-display text-[24px] leading-tight truncate text-balance">
            {name}
          </h3>
        </div>
        <Badge tone="mono">{templateId}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Sections" value={nodes} />
        <Stat label="Links" value={edges} />
        <Stat label="Edited" value={timeSince(updatedAt)} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <Link
          to="/builder/$resumeId"
          params={{ resumeId: id }}
          className="group/link inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-hi)] hover:text-[var(--accent)] transition-colors duration-200"
        >
          Open canvas
          <ArrowUpRight
            size={14}
            className="transition-transform duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
          />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="size-10 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-[background,color,transform] ease-out active:scale-[0.96] active:duration-100 duration-200 inline-flex items-center justify-center"
            aria-label="Duplicate"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <ConfirmDialog
            title="Delete resume?"
            description={`This removes "${name}" from this browser. You cannot undo this.`}
            confirmLabel="Delete resume"
            onConfirm={onDelete}
          >
            <button
              type="button"
              className="size-10 rounded-lg text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] transition-[background,color,transform] ease-out active:scale-[0.96] active:duration-100 duration-200 inline-flex items-center justify-center"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </ConfirmDialog>
          <button
            type="button"
            className="size-10 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-[background,color,transform] ease-out active:scale-[0.96] active:duration-100 duration-200 inline-flex items-center justify-center"
            aria-label="More"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] px-2.5 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {label}
      </div>
      <div className="mt-1 text-[14px] font-medium text-[var(--text)] tabular-nums">{value}</div>
    </div>
  )
}

function shortId(id: string) {
  return id.toUpperCase().slice(0, 6)
}

function timeSince(ts: number): string {
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
