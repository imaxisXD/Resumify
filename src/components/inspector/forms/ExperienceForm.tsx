import { CheckCircle2, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../ui/Button'
import { FieldLabel, Input, TextArea } from '../../ui/Input'
import { SortableList } from '../SortableList'
import type { ExperienceItem, ResumeSection } from '../../../stores/types'
import { updateList, useSectionListField } from '../useSectionListField'
import { useResumeStore } from '../../../stores/resumeStore'
import { reviewBulletQualityWithAi, runAiTask } from '../../../features/ai'
import type { AiBulletQuality, AiSuggestion, BulletMode } from '../../../features/aiTasks'
import { scoreBullet, type ScoreIssue } from '../../../features/resumeScore'

export function ExperienceForm({
  resumeId,
  section,
}: {
  resumeId: string
  section: ResumeSection<'experience'>
}) {
  const roles = useSectionListField<'experience', ExperienceItem>({
    resumeId,
    section,
    field: 'items',
    makeItem: makeEmptyExperienceItem,
  })
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const updateSectionData = useResumeStore((s) => s.updateSectionData)
  const saveSnapshot = useResumeStore((s) => s.saveSnapshot)
  const [suggestion, setSuggestion] = useState<{ itemId: string; bulletId: string; value: AiSuggestion } | null>(null)
  const [aiStatus, setAiStatus] = useState<{ itemId: string; text: string } | null>(null)
  const items = roles.items

  const requestBulletSuggestion = async (item: ExperienceItem, bulletId: string, bullet: string, mode: BulletMode) => {
    if (!resume) return
    setAiStatus({
      itemId: item.id,
      text: mode === 'auto' ? 'Drafting best rewrite...' : 'Drafting rewrite...',
    })
    try {
      setSuggestion({
        itemId: item.id,
        bulletId,
        value: await runAiTask(aiSettings, {
          kind: 'bullet-doctor',
          resume,
          bullet,
          role: item.role,
          company: item.company,
          mode,
        }),
      })
      setAiStatus(null)
    } catch (error) {
      setAiStatus({ itemId: item.id, text: error instanceof Error ? error.message : 'AI failed.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
          Roles
        </h3>
        <Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={() => roles.add()}>
          Add role
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-[12px] text-[var(--text-faint)]">
          No roles yet. Add your most recent role first.
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 flex flex-col gap-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Input
                  value={item.role}
                  onChange={(e) => roles.update(item.id, { role: e.target.value })}
                  placeholder="Senior Engineer"
                />
              </Field>
              <Field label="Company">
                <Input
                  value={item.company}
                  onChange={(e) => roles.update(item.id, { company: e.target.value })}
                  placeholder="Acme Corp"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={item.location}
                  onChange={(e) => roles.update(item.id, { location: e.target.value })}
                  placeholder="Remote"
                />
              </Field>
              <Field label={item.current ? 'Start → present' : 'Dates'}>
                <div className="flex items-center gap-2">
                  <Input
                    value={item.start}
                    onChange={(e) => roles.update(item.id, { start: e.target.value })}
                    placeholder="Jan 2023"
                    className="w-1/2"
                  />
                  <span className="text-[var(--text-faint)] text-[12px]">→</span>
                  <Input
                    value={item.end}
                    onChange={(e) => roles.update(item.id, { end: e.target.value })}
                    disabled={item.current}
                    placeholder={item.current ? 'present' : 'Apr 2024'}
                    className="w-1/2"
                  />
                </div>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={item.current}
                onChange={(e) => roles.update(item.id, { current: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              I currently work here
            </label>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel>Bullets</FieldLabel>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={12} />}
                  onClick={() =>
                    roles.update(item.id, {
                      bullets: [...item.bullets, { id: nanoid(6), text: '' }],
                    })
                  }
                >
                  Add bullet
                </Button>
              </div>
              <SortableList
                items={item.bullets}
                onChange={(next) => roles.update(item.id, { bullets: next })}
                onRemove={(id) =>
                  roles.update(item.id, {
                    bullets: updateList(item.bullets, { type: 'remove', id }),
                  })
                }
                emptyHint="No bullet points yet"
                renderItem={(b) => (
                  <BulletEditor
                    bullet={b}
                    role={item.role}
                    company={item.company}
                    onRequestAi={(mode) => requestBulletSuggestion(item, b.id, b.text, mode)}
                    onChange={(text) =>
                      roles.update(item.id, {
                        bullets: updateList(item.bullets, {
                          type: 'update',
                          id: b.id,
                          patch: { text },
                        }),
                      })
                    }
                  />
                )}
              />
              {aiStatus?.itemId === item.id ? <p className="mt-2 text-[12px] text-[var(--text-muted)]">{aiStatus.text}</p> : null}
              {suggestion && suggestion.itemId === item.id ? (
                <ReviewSuggestion
                  suggestion={suggestion.value}
                  onDismiss={() => setSuggestion(null)}
                  onApply={(value) => {
                    saveSnapshot(resumeId, 'Before AI bullet apply')
                    updateSectionData<'experience'>(resumeId, section.id, {
                      items: items.map((entry) =>
                        entry.id === suggestion.itemId
                          ? {
                              ...entry,
                              bullets: entry.bullets.map((bullet) =>
                                bullet.id === suggestion.bulletId ? { ...bullet, text: value } : bullet,
                              ),
                            }
                          : entry,
                      ),
                    })
                    setSuggestion(null)
                  }}
                />
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => roles.remove(item.id)}
                className="text-[12px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors"
              >
                Remove role
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BulletEditor({
  bullet,
  role,
  company,
  onChange,
  onRequestAi,
}: {
  bullet: { id: string; text: string }
  role?: string
  company?: string
  onChange: (text: string) => void
  onRequestAi: (mode: BulletMode) => void
}) {
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const issues = useMemo(() => scoreBullet(bullet.text), [bullet.text])
  const quality = bulletQuality(bullet.text, issues)
  const [aiReview, setAiReview] = useState<AiBulletQuality | null>(null)
  const [aiChecking, setAiChecking] = useState(false)
  const [aiReviewError, setAiReviewError] = useState('')

  useEffect(() => {
    const clean = bullet.text.trim()
    setAiReview(null)
    setAiReviewError('')
    if (!aiSettings.enabled || clean.length < 24) {
      setAiChecking(false)
      return
    }

    let cancelled = false
    setAiChecking(true)
    const timer = window.setTimeout(() => {
      reviewBulletQualityWithAi(aiSettings, {
        bullet: clean,
        role,
        company,
        heuristicIssues: issues,
      })
        .then((result) => {
          if (!cancelled) setAiReview(result)
        })
        .catch((error) => {
          if (!cancelled) setAiReviewError(error instanceof Error ? error.message : 'AI review failed.')
        })
        .finally(() => {
          if (!cancelled) setAiChecking(false)
        })
    }, 850)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [aiSettings, bullet.text, role, company])

  const displayedQuality = aiReview ? bulletQualityFromAi(aiReview, quality) : quality

  return (
    <div className="flex flex-col gap-2">
      <TextArea
        rows={2}
        value={bullet.text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What you shipped, in one tight line."
        className="!min-h-[44px]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BulletQualityPill
          quality={displayedQuality}
          checking={aiChecking}
          aiEnabled={aiSettings.enabled}
          error={aiReviewError}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<Sparkles />}
          title={`Let AI choose the best edit. Current note: ${displayedQuality.reason}`}
          onClick={() => onRequestAi('auto')}
        >
          Improve with AI
        </Button>
      </div>
    </div>
  )
}

function BulletQualityPill({
  quality,
  checking,
  aiEnabled,
  error,
}: {
  quality: BulletQuality
  checking: boolean
  aiEnabled: boolean
  error: string
}) {
  const label = checking ? 'AI checking' : quality.label
  const title = error || (aiEnabled ? `AI + rules: ${quality.reason}` : `Rules only: ${quality.reason}`)
  return (
    <div
      className={[
        'inline-flex min-h-8 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]',
        checking
          ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
          : quality.kind === 'good'
          ? 'border-[color-mix(in_oklab,var(--accent)_34%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]',
      ].join(' ')}
      title={title}
    >
      {checking ? (
        <Loader2 size={13} className="animate-spin" />
      ) : quality.kind === 'good' ? (
        <CheckCircle2 size={13} />
      ) : (
        <Sparkles size={13} />
      )}
      <span>{label}</span>
      {aiEnabled && !checking ? (
        <span className="ml-0.5 rounded bg-[var(--surface-2)] px-1 font-mono text-[9.5px] uppercase text-[var(--text-faint)]">
          AI
        </span>
      ) : null}
    </div>
  )
}

type BulletQuality = {
  kind: 'good' | 'metric' | 'polish' | 'empty'
  label: string
  reason: string
}

function bulletQuality(text: string, issues: Array<ScoreIssue>): BulletQuality {
  if (!text.trim()) {
    return { kind: 'empty', label: 'Needs a bullet', reason: 'Add one clear action and outcome.' }
  }
  if (!issues.length) {
    return { kind: 'good', label: 'Looks strong', reason: 'This already has a clear action, impact, metric, and clean style.' }
  }
  const metricOnly = issues.every((issue) => issue.category === 'metrics' || issue.category === 'punctuation')
  if (metricOnly && issues.some((issue) => issue.category === 'metrics')) {
    return { kind: 'metric', label: 'Could use a metric', reason: 'This is readable, but a number or concrete scale would make it stronger.' }
  }
  return { kind: 'polish', label: 'Could be sharper', reason: issues[0]?.fix ?? 'Tighten wording and show the result more clearly.' }
}

function bulletQualityFromAi(review: AiBulletQuality, fallback: BulletQuality): BulletQuality {
  const kind: BulletQuality['kind'] =
    review.status === 'strong'
      ? 'good'
      : review.status === 'needs-metric'
        ? 'metric'
        : review.status === 'weak'
          ? 'polish'
          : fallback.kind === 'empty'
            ? 'empty'
            : 'polish'

  return {
    kind,
    label: review.label || fallback.label,
    reason:
      review.summary ||
      review.suggestions[0] ||
      fallback.reason,
  }
}

function ReviewSuggestion({
  suggestion,
  onApply,
  onDismiss,
}: {
  suggestion: AiSuggestion
  onApply: (value: string) => void
  onDismiss: () => void
}) {
  const [draft, setDraft] = useState(suggestion.suggestions[0]?.value ?? '')
  return (
    <div className="mt-3 rounded-xl border border-[var(--accent-hi)]/30 bg-[var(--accent-soft)]/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-medium text-[var(--text)]">{suggestion.title}</div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">{suggestion.summary}</p>
        </div>
        <button type="button" onClick={onDismiss} className="text-[var(--text-faint)] hover:text-[var(--text)]" aria-label="Dismiss AI suggestion">
          <X size={14} />
        </button>
      </div>
      {suggestion.questions?.length ? (
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[12px] text-[var(--text-muted)]">
          {suggestion.questions.map((question) => <li key={question}>{question}</li>)}
        </ul>
      ) : null}
      <TextArea className="mt-3 min-h-[70px]" value={draft} onChange={(e) => setDraft(e.currentTarget.value)} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="primary" onClick={() => onApply(draft)} disabled={!draft.trim()}>
          Apply reviewed text
        </Button>
        <Button size="sm" variant="secondary" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}

function makeEmptyExperienceItem(): ExperienceItem {
  return {
    id: nanoid(6),
    role: '',
    company: '',
    location: '',
    start: '',
    end: '',
    current: false,
    bullets: [],
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}
