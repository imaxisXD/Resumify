import { useMemo, useState } from 'react'
import { Check, Download, FileUp, History, KeyRound, Lightbulb, Save, Search, ShieldCheck, UserRound, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { FieldLabel, Input, TextArea } from '../ui/Input'
import { useResumeStore } from '../../stores/resumeStore'
import { scoreResume } from '../../features/resumeScore'
import { matchJob } from '../../features/jobMatch'
import { extractTextFromFile, parseResumeText } from '../../features/importResume'
import { suggestBullet } from '../../features/bulletSuggestions'
import type { ExperienceData, Resume, ResumeBackup, ResumeSection } from '../../stores/types'

type Tab = 'score' | 'import' | 'job' | 'profiles' | 'history' | 'suggestions' | 'settings' | 'backup'

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'score', label: 'Score', icon: <ShieldCheck size={13} /> },
  { id: 'import', label: 'Import', icon: <FileUp size={13} /> },
  { id: 'job', label: 'Job match', icon: <Search size={13} /> },
  { id: 'profiles', label: 'Profiles', icon: <UserRound size={13} /> },
  { id: 'history', label: 'History', icon: <History size={13} /> },
  { id: 'suggestions', label: 'Bullets', icon: <Lightbulb size={13} /> },
  { id: 'settings', label: 'AI', icon: <KeyRound size={13} /> },
  { id: 'backup', label: 'Backup', icon: <Download size={13} /> },
]

export function ResumePowerPanel({ resumeId, onClose }: { resumeId: string; onClose?: () => void }) {
  const [tab, setTab] = useState<Tab>('score')
  const resume = useResumeStore((s) => s.resumes[resumeId])
  if (!resume) return null

  return (
    <aside className="h-full min-h-0 bg-[var(--bg-elevated)] flex flex-col">
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[var(--text-faint)]">
              Assist
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
              Fix gaps, import, match jobs, and save versions.
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              aria-label="Close assist tools"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-3 border-b border-[var(--border)]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`h-10 rounded-lg border text-[11px] inline-flex flex-col items-center justify-center gap-0.5 transition-[background,color,border-color,transform] duration-200 active:scale-[0.98] ${
              tab === item.id
                ? 'border-[var(--accent-hi)] bg-[var(--accent-soft)] text-[var(--accent-hi)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {tab === 'score' ? <ScoreTab resumeId={resumeId} /> : null}
        {tab === 'import' ? <ImportTab resumeId={resumeId} /> : null}
        {tab === 'job' ? <JobTab resumeId={resumeId} /> : null}
        {tab === 'profiles' ? <ProfilesTab resumeId={resumeId} /> : null}
        {tab === 'history' ? <HistoryTab resumeId={resumeId} /> : null}
        {tab === 'suggestions' ? <SuggestionsTab resumeId={resumeId} /> : null}
        {tab === 'settings' ? <SettingsTab /> : null}
        {tab === 'backup' ? <BackupTab /> : null}
      </div>
    </aside>
  )
}

function ScoreTab({ resumeId }: { resumeId: string }) {
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const result = useMemo(() => (resume ? scoreResume(resume) : null), [resume])
  if (!result) return null
  return (
    <div className="space-y-4">
      <PanelTitle title="Resume score" badge={`${result.score}/100`} />
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>ATS basics</span>
          <span>{result.issues.length ? `${result.issues.length} fixes` : 'ready'}</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg)] overflow-hidden border border-[var(--border)]">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${result.score}%` }} />
        </div>
      </div>
      <List title="Fixes" items={result.issues.map((item) => `${item.label}: ${item.fix}`)} empty="No fixes needed." />
      <List title="Good signs" items={result.strengths} empty="Add more details to unlock strengths." />
    </div>
  )
}

function ImportTab({ resumeId }: { resumeId: string }) {
  const replaceResume = useResumeStore((s) => s.replaceResume)
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<Resume | null>(null)
  const [status, setStatus] = useState('')
  const onReview = () => {
    const parsed = parseResumeText(text, 'Imported Resume')
    setDraft(parsed)
    setStatus('Review the imported sections before applying.')
  }
  const counts = draft ? importCounts(draft) : null
  return (
    <div className="space-y-4">
      <PanelTitle title="Import resume" />
      <Notice tone="info">Paste text or choose a file. Nothing changes until you press Apply.</Notice>
      <FieldLabel>Paste resume text</FieldLabel>
      <TextArea value={text} onChange={(e) => setText(e.currentTarget.value)} className="min-h-[160px]" />
      <input
        type="file"
        accept=".txt,.pdf,.doc,.docx"
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0]
          if (!file) return
          setStatus('Reading file...')
          try {
            setText(await extractTextFromFile(file))
            setDraft(null)
            setStatus('File text is ready. Review it, then import.')
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Could not read file.')
          }
        }}
        className="text-[12px] text-[var(--text-muted)]"
      />
      <Button variant="primary" onClick={onReview} disabled={!text.trim()}>
        Review import
      </Button>
      {counts ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
          <div>
            <div className="text-[13px] font-medium text-[var(--text)]">{counts.name}</div>
            <div className="mt-1 text-[11.5px] text-[var(--text-faint)]">
              {counts.sections} sections, {counts.skills} skills, {counts.bullets} bullets
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={<Check size={13} />}
              onClick={() => {
                if (!draft) return
                replaceResume(resumeId, draft, 'Before import')
                setStatus('Imported into this resume.')
              }}
            >
              Apply
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDraft(null)}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}
      {status ? <p className="text-[12px] text-[var(--text-muted)]">{status}</p> : null}
    </div>
  )
}

function JobTab({ resumeId }: { resumeId: string }) {
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const saveJobMatch = useResumeStore((s) => s.saveJobMatch)
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const [description, setDescription] = useState('')
  const [aiText, setAiText] = useState('')
  const [saved, setSaved] = useState(false)
  const result = useMemo(() => (resume && description ? matchJob(resume, description) : null), [resume, description])
  if (!resume) return null
  return (
    <div className="space-y-4">
      <PanelTitle title="Job match" badge={result ? `${result.score}%` : undefined} />
      <FieldLabel>Job description</FieldLabel>
      <TextArea value={description} onChange={(e) => setDescription(e.currentTarget.value)} className="min-h-[150px]" />
      {result ? (
        <>
          <KeywordList title="Matched" words={result.matchedKeywords} />
          <KeywordList title="Missing" words={result.missingKeywords} />
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => {
                saveJobMatch({
                  resumeId,
                  title: description.split('\n')[0]?.slice(0, 40) || 'Job match',
                  description,
                  matchedKeywords: result.matchedKeywords,
                  missingKeywords: result.missingKeywords,
                  score: result.score,
                })
                setSaved(true)
              }}
            >
              {saved ? 'Saved' : 'Save match'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                setAiText('Asking AI...')
                try {
                  const { suggestKeywordsWithAi } = await import('../../features/ai')
                  setAiText(await suggestKeywordsWithAi(aiSettings, JSON.stringify(resume), description))
                } catch (error) {
                  setAiText(error instanceof Error ? error.message : 'AI failed.')
                }
              }}
            >
              Ask AI
            </Button>
          </div>
          {aiText ? <Notice tone={aiText.includes('Add your OpenRouter') || aiText.includes('failed') ? 'error' : 'info'}>{aiText}</Notice> : null}
        </>
      ) : null}
    </div>
  )
}

function ProfilesTab({ resumeId }: { resumeId: string }) {
  const profiles = useResumeStore((s) => s.profileLibrary)
  const saveProfileFromResume = useResumeStore((s) => s.saveProfileFromResume)
  const applyProfileToResume = useResumeStore((s) => s.applyProfileToResume)
  const deleteProfile = useResumeStore((s) => s.deleteProfile)
  return (
    <div className="space-y-4">
      <PanelTitle title="Profile library" />
      <Button variant="primary" icon={<Save size={13} />} onClick={() => saveProfileFromResume(resumeId)}>
        Save current profile
      </Button>
      <div className="space-y-2">
        {profiles.map((profile) => (
          <MiniCard key={profile.id} title={profile.name} meta={`${profile.skills.groups.length} skill groups`}>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => applyProfileToResume(resumeId, profile.id, 'fill')}>
                Fill
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyProfileToResume(resumeId, profile.id, 'replace')}>
                Replace
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteProfile(profile.id)}>
                Delete
              </Button>
            </div>
          </MiniCard>
        ))}
        {!profiles.length ? <EmptyText>No saved profiles yet.</EmptyText> : null}
      </div>
    </div>
  )
}

function HistoryTab({ resumeId }: { resumeId: string }) {
  const history = useResumeStore((s) => s.resumeHistory[resumeId] ?? [])
  const saveSnapshot = useResumeStore((s) => s.saveSnapshot)
  const restoreSnapshot = useResumeStore((s) => s.restoreSnapshot)
  const deleteSnapshot = useResumeStore((s) => s.deleteSnapshot)
  return (
    <div className="space-y-4">
      <PanelTitle title="Version history" />
      <Button variant="primary" onClick={() => saveSnapshot(resumeId, 'Manual save')}>
        Save version
      </Button>
      <div className="space-y-2">
        {history.map((item) => (
          <MiniCard key={item.id} title={item.label} meta={new Date(item.createdAt).toLocaleString()}>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => restoreSnapshot(resumeId, item.id)}>
                Restore
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteSnapshot(resumeId, item.id)}>
                Delete
              </Button>
            </div>
          </MiniCard>
        ))}
        {!history.length ? <EmptyText>No saved versions yet.</EmptyText> : null}
      </div>
    </div>
  )
}

function SuggestionsTab({ resumeId }: { resumeId: string }) {
  const resume = useResumeStore((s) => s.resumes[resumeId])
  const updateSectionData = useResumeStore((s) => s.updateSectionData)
  const aiSettings = useResumeStore((s) => s.aiSettings)
  const [aiResult, setAiResult] = useState('')
  const [aiTarget, setAiTarget] = useState<{ itemId: string; bulletId: string } | null>(null)
  const experience = resume?.sections.find((section) => section.type === 'experience')
  const items = (experience?.data as ExperienceData | undefined)?.items ?? []
  return (
    <div className="space-y-4">
      <PanelTitle title="Bullet suggestions" />
      {items.flatMap((item) =>
        item.bullets.map((bullet) => {
          const suggestion = suggestBullet(bullet.text, item.role)
          return (
            <MiniCard key={bullet.id} title={bullet.text || 'Empty bullet'} meta={suggestion.reason}>
              <p className="text-[12px] text-[var(--text)] leading-relaxed">{suggestion.suggested}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!experience) return
                    updateSectionData(resumeId, experience.id, {
                      items: items.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              bullets: entry.bullets.map((entryBullet) =>
                                entryBullet.id === bullet.id ? { ...entryBullet, text: suggestion.suggested } : entryBullet,
                              ),
                            }
                          : entry,
                      ),
                    })
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    setAiResult('Asking AI...')
                    setAiTarget({ itemId: item.id, bulletId: bullet.id })
                    try {
                      const { improveBulletWithAi } = await import('../../features/ai')
                      setAiResult(await improveBulletWithAi(aiSettings, bullet.text))
                    } catch (error) {
                      setAiResult(error instanceof Error ? error.message : 'AI failed.')
                    }
                  }}
                >
                  AI
                </Button>
              </div>
            </MiniCard>
          )
        }),
      )}
      {aiResult ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)] mb-2">
            AI suggestion
          </div>
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{aiResult}</p>
          {aiTarget && experience && !aiResult.includes('Asking AI') && !aiResult.includes('Add your OpenRouter') ? (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                updateSectionData(resumeId, experience.id, {
                  items: items.map((entry) =>
                    entry.id === aiTarget.itemId
                      ? {
                          ...entry,
                          bullets: entry.bullets.map((entryBullet) =>
                            entryBullet.id === aiTarget.bulletId ? { ...entryBullet, text: cleanAiBullet(aiResult) } : entryBullet,
                          ),
                        }
                      : entry,
                  ),
                })
              }}
            >
              Apply AI text
            </Button>
          ) : null}
        </div>
      ) : null}
      {!items.length ? <EmptyText>Add work bullets to see suggestions.</EmptyText> : null}
    </div>
  )
}

function SettingsTab() {
  const settings = useResumeStore((s) => s.aiSettings)
  const setAiSettings = useResumeStore((s) => s.setAiSettings)
  return (
    <div className="space-y-4">
      <PanelTitle title="AI settings" />
      <Notice tone="info">AI is optional. Rule checks work without a key.</Notice>
      <label className="flex items-center gap-2 text-[13px] text-[var(--text)]">
        <input type="checkbox" checked={settings.enabled} onChange={(e) => setAiSettings({ enabled: e.currentTarget.checked })} />
        Enable AI actions
      </label>
      <FieldLabel>OpenRouter key</FieldLabel>
      <Input type="password" value={settings.apiKey} onChange={(e) => setAiSettings({ apiKey: e.currentTarget.value })} />
      <FieldLabel>Model</FieldLabel>
      <Input value={settings.model} onChange={(e) => setAiSettings({ model: e.currentTarget.value })} />
      <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
        The key is saved in this browser and is used only when you press an AI button.
      </p>
    </div>
  )
}

function BackupTab() {
  const exportBackup = useResumeStore((s) => s.exportBackup)
  const importBackup = useResumeStore((s) => s.importBackup)
  const [status, setStatus] = useState('')
  return (
    <div className="space-y-4">
      <PanelTitle title="Backup" />
      <Notice tone="info">Backup includes resumes, profiles, history, matches, and AI settings.</Notice>
      <Button
        variant="primary"
        onClick={() => {
          const backup = exportBackup()
          const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `resumify-backup-${new Date().toISOString().slice(0, 10)}.json`
          link.click()
          URL.revokeObjectURL(url)
        }}
      >
        Export backup
      </Button>
      <input
        type="file"
        accept=".json"
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0]
          if (!file) return
          try {
            importBackup(JSON.parse(await file.text()) as ResumeBackup)
            setStatus('Backup imported.')
          } catch {
            setStatus('Backup file is not valid.')
          }
        }}
        className="text-[12px] text-[var(--text-muted)]"
      />
      {status ? <p className="text-[12px] text-[var(--text-muted)]">{status}</p> : null}
    </div>
  )
}

function PanelTitle({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-display text-[24px] leading-none">{title}</h3>
      {badge ? <Badge tone="accent">{badge}</Badge> : null}
    </div>
  )
}

function List({ title, items, empty }: { title: string; items: Array<string>; empty: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)] mb-2">{title}</div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="text-[12px] leading-relaxed text-[var(--text)] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyText>{empty}</EmptyText>
      )}
    </div>
  )
}

function KeywordList({ title, words }: { title: string; words: Array<string> }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--text-faint)] mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((word) => (
          <Badge key={word} tone={title === 'Missing' ? 'danger' : 'accent'}>
            {word}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function MiniCard({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="font-medium text-[13px] text-[var(--text)]">{title}</div>
      {meta ? <div className="mt-1 text-[11.5px] text-[var(--text-faint)]">{meta}</div> : null}
      <div className="mt-3">{children}</div>
    </div>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">{children}</p>
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-[12px] leading-relaxed ${
        tone === 'error'
          ? 'border-[color-mix(in_oklab,var(--danger)_30%,transparent)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] text-[var(--danger)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
      }`}
    >
      {children}
    </div>
  )
}

function importCounts(resume: Resume) {
  const skills = resume.sections
    .filter((section): section is ResumeSection<'skills'> => section.type === 'skills')
    .flatMap((section) => section.data.groups.flatMap((group) => group.skills)).length
  const bullets = resume.sections
    .filter((section): section is ResumeSection<'experience'> => section.type === 'experience')
    .flatMap((section) => section.data.items.flatMap((item) => item.bullets)).length
  const personal = resume.sections.find((section): section is ResumeSection<'personal'> => section.type === 'personal')
  return {
    name: personal?.data.fullName || resume.name,
    sections: resume.sections.length,
    skills,
    bullets,
  }
}

function cleanAiBullet(value: string) {
  return value.replace(/^[-•*]\s*/, '').trim()
}
