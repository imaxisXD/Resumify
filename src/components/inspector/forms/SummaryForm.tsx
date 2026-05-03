import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useResumeStore } from '../../../stores/resumeStore'
import { FieldLabel, TextArea } from '../../ui/Input'
import { Button } from '../../ui/Button'
import type { ResumeSection } from '../../../stores/types'
import { runAiTask } from '../../../features/ai'
import type { AiSuggestion } from '../../../features/aiTasks'

export function SummaryForm({
  resumeId,
  section,
}: {
  resumeId: string
  section: ResumeSection<'summary'>
}) {
  const update = useResumeStore((s) => s.updateSectionData)
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const saveSnapshot = useResumeStore((s) => s.saveSnapshot)
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null)
  const [status, setStatus] = useState('')
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel hint={`${section.data.text.length} chars`}>Summary</FieldLabel>
      <TextArea
        rows={8}
        value={section.data.text}
        onChange={(e) => update<'summary'>(resumeId, section.id, { text: e.target.value })}
        placeholder="One short paragraph that frames who you are."
      />
      <p className="text-[11px] text-[var(--text-faint)] mt-1">
        Aim for 2–3 sentences. Lead with role, anchor with what you build, end with what you care about.
      </p>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant="primary"
          icon={<Sparkles size={13} />}
          onClick={async () => {
            if (!resume) return
            setStatus('Drafting summary...')
            try {
              setSuggestion(await runAiTask(aiSettings, { kind: 'summary-generator', resume, text: section.data.text }))
              setStatus('')
            } catch (error) {
              setStatus(error instanceof Error ? error.message : 'AI failed.')
            }
          }}
        >
          Generate summary
        </Button>
      </div>
      {status ? <p className="text-[12px] text-[var(--text-muted)]">{status}</p> : null}
      {suggestion ? (
        <div className="mt-3 rounded-xl border border-[var(--accent-hi)]/30 bg-[var(--accent-soft)]/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-[var(--text)]">{suggestion.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{suggestion.summary}</p>
            </div>
            <button type="button" onClick={() => setSuggestion(null)} className="text-[var(--text-faint)] hover:text-[var(--text)]" aria-label="Dismiss AI suggestion">
              <X size={14} />
            </button>
          </div>
          <TextArea
            className="mt-3 min-h-[90px]"
            value={suggestion.suggestions[0]?.value ?? ''}
            onChange={(e) =>
              setSuggestion({
                ...suggestion,
                suggestions: [{ id: 'summary', label: 'Summary', value: e.currentTarget.value }],
              })
            }
          />
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                saveSnapshot(resumeId, 'Before AI summary apply')
                update<'summary'>(resumeId, section.id, { text: suggestion.suggestions[0]?.value ?? '' })
                setSuggestion(null)
              }}
            >
              Apply reviewed text
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setSuggestion(null)}>Dismiss</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
