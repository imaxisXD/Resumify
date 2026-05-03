import type { Resume } from '../stores/types'
import { matchJob } from './jobMatch'
import type { ScoreIssue } from './resumeScore'

export type AiTaskKind =
  | 'bullet-doctor'
  | 'metric-finder'
  | 'summary-generator'
  | 'skills-cleanup'
  | 'job-match-optimizer'
  | 'variant-generator'

export type BulletMode = 'auto' | 'concise' | 'stronger' | 'quantified' | 'senior' | 'ats-safe'

export type AiTaskInput = {
  kind: AiTaskKind
  resume?: Resume
  text?: string
  bullet?: string
  role?: string
  company?: string
  mode?: BulletMode
  jobDescription?: string
  targetRole?: string
  skills?: Array<string>
}

export type AiSuggestion = {
  title: string
  summary: string
  suggestions: Array<{
    id: string
    label: string
    value: string
    rationale?: string
  }>
  questions?: Array<string>
}

export type AiBulletQualityStatus = 'strong' | 'needs-metric' | 'needs-polish' | 'weak'

export type AiBulletQuality = {
  status: AiBulletQualityStatus
  label: string
  summary: string
  confidence: number
  suggestions: Array<string>
}

export function buildAiPrompt(input: AiTaskInput): string {
  const payload = {
    ...input,
    resume: input.resume ? resumeForAi(input.resume) : undefined,
    deterministicJobMatch:
      input.resume && input.jobDescription ? matchJob(input.resume, input.jobDescription) : undefined,
  }
  const taskRules =
    input.kind === 'bullet-doctor' && (!input.mode || input.mode === 'auto')
      ? [
          'For bullet-doctor with mode "auto", decide the best edit yourself. Prefer the smallest useful improvement.',
          'If the bullet lacks a credible metric, do not invent one; either tighten the wording or return targeted questions in "questions".',
          'If the bullet is already strong, return a subtle polish suggestion and explain that applying it is optional.',
        ]
      : []

  return [
    'You are Resumify AI, a resume writing assistant.',
    'Return only valid JSON matching this TypeScript shape:',
    '{ "title": string, "summary": string, "suggestions": [{ "id": string, "label": string, "value": string, "rationale"?: string }], "questions"?: string[] }',
    'Rules: do not invent employers, dates, private facts, numbers, degrees, or credentials. If a metric is needed but missing, ask a question instead of making one up. Keep resume text ATS-safe and plain text.',
    ...taskRules,
    `Task payload:\n${JSON.stringify(payload, null, 2)}`,
  ].join('\n\n')
}

export function buildBulletQualityPrompt(input: {
  bullet: string
  role?: string
  company?: string
  heuristicIssues?: Array<ScoreIssue>
}): string {
  return [
    'You are Resumify AI reviewing one resume bullet like a careful Grammarly-style writing assistant.',
    'Return only valid JSON matching this TypeScript shape:',
    '{ "status": "strong" | "needs-metric" | "needs-polish" | "weak", "label": string, "summary": string, "confidence": number, "suggestions": string[] }',
    'Rules: do not invent employers, dates, private facts, numbers, degrees, or credentials. Judge only the writing quality, clarity, impact, and ATS readability. If a number would help but is not provided, suggest asking for one instead of inventing it.',
    'Use "strong" only when the bullet has a clear action, meaningful outcome, credible specificity, and clean resume style. Keep label to 2-4 words.',
    `Payload:\n${JSON.stringify(input, null, 2)}`,
  ].join('\n\n')
}

export function parseAiBulletQuality(raw: string, fallback: AiBulletQuality): AiBulletQuality {
  try {
    const parsed = JSON.parse(extractJson(raw.trim())) as Partial<AiBulletQuality>
    const status = normalizeQualityStatus(parsed.status)
    return {
      status,
      label: String(parsed.label || labelForQuality(status)),
      summary: String(parsed.summary || fallback.summary),
      confidence: clampConfidence(parsed.confidence),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String).filter(Boolean).slice(0, 3) : [],
    }
  } catch {
    return fallback
  }
}

export function fallbackBulletQuality(issues: Array<ScoreIssue>): AiBulletQuality {
  if (!issues.length) {
    return {
      status: 'strong',
      label: 'Looks strong',
      summary: 'Rule checks passed: clear wording, metric or scale, punctuation, and no obvious weak phrasing.',
      confidence: 0.74,
      suggestions: [],
    }
  }
  const needsMetric = issues.some((issue) => issue.category === 'metrics')
  return {
    status: needsMetric ? 'needs-metric' : 'needs-polish',
    label: needsMetric ? 'Needs metric' : 'Needs polish',
    summary: issues[0]?.fix ?? 'Tighten this bullet before relying on it.',
    confidence: 0.62,
    suggestions: issues.slice(0, 3).map((issue) => issue.fix),
  }
}

export function parseAiSuggestion(raw: string, fallbackTitle = 'AI suggestion'): AiSuggestion {
  const trimmed = raw.trim()
  const jsonText = extractJson(trimmed)
  try {
    const parsed = JSON.parse(jsonText) as Partial<AiSuggestion>
    return normalizeSuggestion(parsed, fallbackTitle)
  } catch {
    return normalizeSuggestion(
      {
        title: fallbackTitle,
        summary: 'Review this AI-generated text before applying it.',
        suggestions: [{ id: 'suggestion-1', label: fallbackTitle, value: trimmed }],
      },
      fallbackTitle,
    )
  }
}

export function fallbackSuggestion(input: AiTaskInput, reason?: unknown): AiSuggestion {
  const reasonText = reason instanceof Error ? reason.message : ''
  if (input.kind === 'metric-finder') {
    return {
      title: 'Metric questions',
      summary: 'Answer these before adding numbers to the resume.',
      suggestions: [],
      questions: [
        'Did this work improve speed, revenue, conversion, quality, reliability, or time saved?',
        'How many users, customers, teammates, services, or projects were affected?',
        'Can you estimate a before-and-after result without exaggerating?',
      ],
    }
  }
  if (input.kind === 'skills-cleanup') {
    const skills = dedupeSkills(input.skills ?? [])
    return {
      title: 'Cleaned skills',
      summary: 'Duplicate skills were removed locally.',
      suggestions: [{ id: 'skills', label: 'Skills', value: skills.join(', ') }],
    }
  }
  return {
    title: 'Local fallback',
    summary: reasonText
      ? `Codex did not return a usable draft: ${reasonText}`
      : 'This local draft keeps the original meaning and avoids invented facts.',
    suggestions: [
      {
        id: 'draft',
        label: 'Draft',
        value: input.bullet || input.text || '',
        rationale: 'AI provider is unavailable, so Resumify preserved your original text.',
      },
    ],
  }
}

function dedupeSkills(skills: Array<string>) {
  const seen = new Set<string>()
  const cleaned: Array<string> = []
  for (const skill of skills) {
    const normalized = skill.trim().replace(/\s+/g, ' ')
    const key = normalized.toLocaleLowerCase()
    if (!normalized || seen.has(key)) continue
    seen.add(key)
    cleaned.push(normalized)
  }
  return cleaned
}

function normalizeSuggestion(value: Partial<AiSuggestion>, fallbackTitle: string): AiSuggestion {
  const suggestions = Array.isArray(value.suggestions)
    ? value.suggestions
        .map((item, index) => ({
          id: String(item?.id || `suggestion-${index + 1}`),
          label: String(item?.label || `Suggestion ${index + 1}`),
          value: String(item?.value || '').trim(),
          rationale: item?.rationale ? String(item.rationale) : undefined,
        }))
        .filter((item) => item.value)
    : []
  return {
    title: String(value.title || fallbackTitle),
    summary: String(value.summary || 'Review before applying.'),
    suggestions,
    questions: Array.isArray(value.questions) ? value.questions.map(String).filter(Boolean) : undefined,
  }
}

function normalizeQualityStatus(value: unknown): AiBulletQualityStatus {
  if (value === 'strong' || value === 'needs-metric' || value === 'needs-polish' || value === 'weak') return value
  return 'needs-polish'
}

function labelForQuality(status: AiBulletQualityStatus) {
  return {
    strong: 'Looks strong',
    'needs-metric': 'Needs metric',
    'needs-polish': 'Needs polish',
    weak: 'Needs rewrite',
  }[status]
}

function clampConfidence(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return 0.6
  return Math.max(0, Math.min(1, number))
}

function extractJson(value: string): string {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  if (fenced) return fenced.trim()
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')
  if (start !== -1 && end > start) return value.slice(start, end + 1)
  return value
}

function resumeForAi(resume: Resume) {
  return {
    name: resume.name,
    templateId: resume.templateId,
    sections: resume.sections
      .filter((section) => section.enabled)
      .map((section) => ({
        type: section.type,
        data: section.data,
      })),
  }
}
