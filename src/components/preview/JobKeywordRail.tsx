import { CheckCircle2, Search, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { matchJob } from '../../features/jobMatch'
import { runAiTask } from '../../features/ai'
import type { AiSuggestion } from '../../features/aiTasks'
import { useResumeStore } from '../../stores/resumeStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/Input'

export function JobKeywordRail({ resumeId }: { resumeId: string }) {
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const saveJobMatch = useResumeStore((s) => s.saveJobMatch)
  const [jobDescription, setJobDescription] = useState('')
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null)
  const [status, setStatus] = useState('')
  const result = useMemo(() => (resume && jobDescription ? matchJob(resume, jobDescription) : null), [resume, jobDescription])

  if (!resume) return null

  return (
    <aside className="min-h-0 overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--text-faint)]">Targeting</div>
          <h3 className="mt-1 font-display text-[24px] leading-none">Job keywords</h3>
        </div>
        {result ? <Badge tone="accent">{result.score}%</Badge> : null}
      </div>
      <TextArea
        value={jobDescription}
        onChange={(e) => {
          setJobDescription(e.currentTarget.value)
          setSuggestion(null)
          setStatus('')
        }}
        placeholder="Paste a job description to compare keywords."
        className="mt-4 min-h-[120px]"
      />
      {result ? (
        <div className="mt-4 space-y-4">
          <KeywordGroup title="Matched" tone="success" words={result.matchedKeywords} />
          <KeywordGroup title="Missing" tone="danger" words={result.missingKeywords} />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              icon={<Search size={13} />}
              onClick={() => {
                saveJobMatch({
                  resumeId,
                  title: jobDescription.split('\n')[0]?.slice(0, 44) || 'Job match',
                  description: jobDescription,
                  matchedKeywords: result.matchedKeywords,
                  missingKeywords: result.missingKeywords,
                  score: result.score,
                })
                setStatus('Saved to job matches.')
              }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Sparkles size={13} />}
              onClick={async () => {
                setStatus('Asking AI...')
                try {
                  setSuggestion(await runAiTask(aiSettings, { kind: 'job-match-optimizer', resume, jobDescription }))
                  setStatus('')
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : 'AI failed.')
                }
              }}
            >
              Optimize
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[12px] leading-relaxed text-[var(--text-muted)]">
          Resumify will show matched and missing keywords here without sending data anywhere.
        </p>
      )}
      {status ? <p className="mt-3 text-[12px] text-[var(--text-muted)]">{status}</p> : null}
      {suggestion ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-[13px] text-[var(--text)]">{suggestion.title}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{suggestion.summary}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--text-faint)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              aria-label="Dismiss job match suggestion"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {suggestion.suggestions.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">{item.label}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--text)]">{item.value}</p>
                {item.rationale ? <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--text-faint)]">{item.rationale}</p> : null}
              </div>
            ))}
          </div>
          <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => setSuggestion(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}
    </aside>
  )
}

function KeywordGroup({ title, words, tone }: { title: string; words: Array<string>; tone: 'success' | 'danger' }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {tone === 'success' ? <CheckCircle2 size={12} /> : null}
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 16).map((word) => (
          <Badge key={word} tone={tone}>
            {word}
          </Badge>
        ))}
        {!words.length ? <span className="text-[12px] text-[var(--text-faint)]">None yet.</span> : null}
      </div>
    </div>
  )
}
