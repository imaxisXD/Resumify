import { ClassicTemplate } from './templates/ClassicTemplate'
import { usePreviewResume } from './previewData'

export function PreviewPane({ resumeId }: { resumeId: string }) {
  const preview = usePreviewResume(resumeId)

  return (
    <div className="h-full w-full overflow-y-auto bg-[var(--bg)] py-6 px-6">
      <div className="mx-auto w-full max-w-[760px] flex flex-col items-center gap-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)] self-start">
          Preview
        </div>
        <div
          className="print-surface w-full min-h-[880px] rounded-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.25)] ring-1 ring-black/5 overflow-visible animate-fade-up"
        >
          {preview ? <ClassicTemplate preview={preview} /> : null}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)] self-end">
          Page 1 / 1
        </div>
      </div>
    </div>
  )
}
