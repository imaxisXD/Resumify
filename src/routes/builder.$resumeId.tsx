import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ResumeCanvas } from '../components/canvas/ResumeCanvas'
import { Inspector } from '../components/inspector/Inspector'
import { PreviewPane } from '../components/preview/PreviewPane'
import { TopBar } from '../components/shell/TopBar'
import { useResumeStore } from '../stores/resumeStore'
import { cn } from '../lib/cn'
import { Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ColorPickerDock } from '../components/ui/ColorPickerDock'

export const Route = createFileRoute('/builder/$resumeId')({ component: Builder })

function Builder() {
  const { resumeId } = Route.useParams()
  const router = useRouter()
  const hydrated = useResumeStore((s) => s.hasHydrated)
  const exists = useResumeStore((s) => Boolean(s.resumes[resumeId]))
  const view = useResumeStore((s) => s.view)
  const createResume = useResumeStore((s) => s.createResume)

  if (!hydrated) {
    return (
      <div className="flex-1 grid place-items-center text-(--text-muted) text-[13px] font-mono uppercase tracking-[0.2em] animate-pulse-soft">
        Loading your resumes...
      </div>
    )
  }

  if (!exists) {
    return (
      <div className="flex-1 grid place-items-center px-10">
        <div className="max-w-md text-center animate-fade-up">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-(--text-faint)">
            Resume not found
          </div>
          <h2 className="mt-3 font-display text-[36px] leading-tight tracking-tight">
            We could not find this resume.
          </h2>
          <p className="mt-2 text-[14px] text-(--text-muted) leading-relaxed">
            It may have been deleted, or it may be saved on another device.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => router.navigate({ to: '/' })}>
              Back to resumes
            </Button>
            <Button
              variant="primary"
              icon={<Sparkles size={14} />}
              onClick={() => {
                const id = createResume()
                router.navigate({ to: '/builder/$resumeId', params: { resumeId: id } })
              }}
            >
              New resume
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar resumeId={resumeId} />
      <div className="flex-1 min-h-0 relative">
        <div
          className={cn(
            'absolute inset-0 grid',
            view === 'builder' && 'grid-cols-[1fr_0fr]',
            view === 'preview' && 'grid-cols-[0fr_1fr]',
            view === 'both' && 'grid-cols-[3fr_2fr]',
          )}
        >
          <div
            className={cn(
              'min-h-0 min-w-0 relative overflow-hidden border-r border-(--border) transition-opacity duration-200 ease-out',
              view === 'preview' && 'pointer-events-none opacity-0',
            )}
          >
            <ResumeCanvas resumeId={resumeId} />
          </div>
          <div
            className={cn(
              'min-h-0 min-w-0 relative overflow-hidden bg-(--bg) transition-opacity duration-200 ease-out',
              view === 'builder' && 'pointer-events-none opacity-0',
            )}
          >
            <PreviewPane resumeId={resumeId} />
          </div>
        </div>
        <Inspector resumeId={resumeId} />
      </div>
      <ColorPickerDock size="sm" />
    </div>
  )
}
