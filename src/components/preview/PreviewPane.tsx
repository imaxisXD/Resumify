import { ClassicTemplate } from './templates/ClassicTemplate'
import { usePreviewResume } from './previewData'
import { PreviewToolbar } from './PreviewToolbar'
import { JobKeywordRail } from './JobKeywordRail'
import { useResumeStore } from '../../stores/resumeStore'

export function PreviewPane({ resumeId }: { resumeId: string }) {
  const preview = usePreviewResume(resumeId)
  const view = useResumeStore((state) => state.view)
  const zoom = preview?.style.zoom ?? 100
  const showKeywordRail = view === 'preview'

  return (
    <div className="h-full min-h-0 w-full bg-[var(--bg)]">
      <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <PreviewToolbar resumeId={resumeId} />
        <div className={showKeywordRail ? 'grid min-h-0 xl:grid-cols-[minmax(0,1fr)_300px]' : 'grid min-h-0'}>
          <div className="min-h-0 overflow-y-auto px-6 py-6">
            <div className="mx-auto flex w-full max-w-[760px] flex-col items-center gap-3">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)] self-start">
                Preview
              </div>
              <div
                className="print-surface w-full min-h-[880px] rounded-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-visible animate-fade-up origin-top"
                style={{ transform: `scale(${zoom / 100})`, marginBottom: `${Math.max(0, zoom - 100) * 8}px` }}
              >
                {preview ? <ClassicTemplate preview={preview} /> : null}
              </div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)] self-end">
                Page 1 / 1
              </div>
            </div>
          </div>
          {showKeywordRail ? <JobKeywordRail resumeId={resumeId} /> : null}
        </div>
      </div>
    </div>
  )
}
