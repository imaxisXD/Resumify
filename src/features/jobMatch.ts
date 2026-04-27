import type { ExperienceData, ProjectsData, Resume, SkillsData } from '../stores/types'

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'you',
  'your',
  'our',
  'are',
  'will',
  'this',
  'that',
  'from',
  'have',
  'has',
  'work',
  'team',
  'role',
  'using',
  'build',
  'develop',
  'experience',
])

export type JobMatchResult = {
  score: number
  matchedKeywords: Array<string>
  missingKeywords: Array<string>
}

export function matchJob(resume: Resume, description: string): JobMatchResult {
  const jobKeywords = extractKeywords(description).slice(0, 40)
  const resumeText = resumeToText(resume).toLowerCase()
  const matchedKeywords = jobKeywords.filter((word) => resumeText.includes(word.toLowerCase()))
  const missingKeywords = jobKeywords.filter((word) => !matchedKeywords.includes(word)).slice(0, 20)
  const score = jobKeywords.length ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 0
  return { score, matchedKeywords, missingKeywords }
}

export function extractKeywords(text: string): Array<string> {
  const counts = new Map<string, number>()
  const phrases = text.match(/\b[A-Z][A-Za-z0-9+#.-]*(?:\s+[A-Z][A-Za-z0-9+#.-]*){0,2}\b/g) ?? []
  for (const phrase of phrases) add(counts, phrase.toLowerCase())
  for (const word of text.toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) ?? []) {
    if (!STOP_WORDS.has(word)) add(counts, word)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word)
}

function resumeToText(resume: Resume): string {
  const parts: Array<string> = [resume.name]
  for (const section of resume.sections) {
    if (!section.enabled) continue
    if (section.type === 'skills') parts.push(...(section.data as SkillsData).groups.flatMap((group) => group.skills))
    if (section.type === 'experience') {
      for (const item of (section.data as ExperienceData).items) {
        parts.push(item.role, item.company, ...item.bullets.map((bullet) => bullet.text))
      }
    }
    if (section.type === 'projects') {
      for (const item of (section.data as ProjectsData).items) {
        parts.push(item.name, item.description, ...item.tech, ...item.bullets.map((bullet) => bullet.text))
      }
    }
  }
  return parts.join(' ')
}

function add(counts: Map<string, number>, word: string) {
  const clean = word.replace(/[^a-z0-9+#.\s-]/g, '').trim()
  if (clean.length < 3 || STOP_WORDS.has(clean)) return
  counts.set(clean, (counts.get(clean) ?? 0) + 1)
}
