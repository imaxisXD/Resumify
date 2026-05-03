import type { ExperienceData, PersonalData, ProjectsData, Resume, SkillsData } from '../stores/types'

export type ScoreIssue = {
  id: string
  label: string
  fix: string
  points: number
  sectionId?: string
  itemId?: string
  bulletId?: string
  category:
    | 'contact'
    | 'skills'
    | 'experience'
    | 'projects'
    | 'template'
    | 'punctuation'
    | 'metrics'
    | 'style'
    | 'dates'
  severity: 'high' | 'medium' | 'low'
}

export type ResumeScore = {
  score: number
  issues: Array<ScoreIssue>
  strengths: Array<string>
}

export function scoreResume(resume: Resume): ResumeScore {
  const issues: Array<ScoreIssue> = []
  const strengths: Array<string> = []
  const personal = resume.sections.find((section) => section.type === 'personal')
  const skills = resume.sections.find((section) => section.type === 'skills' && section.enabled)
  const experience = resume.sections.find((section) => section.type === 'experience' && section.enabled)
  const projects = resume.sections.find((section) => section.type === 'projects' && section.enabled)

  if (!personal) {
    issues.push(issue('personal', 'Missing contact section', 'Add name, email, phone, and location.', 20))
  } else {
    const data = personal.data as PersonalData
    if (!data.fullName.trim()) issues.push(issue('name', 'Missing name', 'Add your full name.', 8, 'contact', 'high', personal.id))
    if (!looksLikeEmail(data.email)) issues.push(issue('email', 'Missing valid email', 'Add a valid email address.', 8, 'contact', 'high', personal.id))
    if (!data.phone.trim()) issues.push(issue('phone', 'Missing phone', 'Add a phone number.', 6, 'contact', 'medium', personal.id))
    if (!data.location.trim()) issues.push(issue('location', 'Missing location', 'Add city and country or remote location.', 6, 'contact', 'medium', personal.id))
    if (data.fullName && looksLikeEmail(data.email) && data.phone && data.location) strengths.push('Contact details are complete.')
  }

  if (!skills) {
    issues.push(issue('skills', 'Missing skills', 'Add a skills section with role keywords.', 16, 'skills', 'high'))
  } else {
    const count = (skills.data as SkillsData).groups.flatMap((group) => group.skills).filter(Boolean).length
    if (count < 8) issues.push(issue('skill-count', 'Too few skills', 'Add at least 8 useful skills.', 10, 'skills', 'medium', skills.id))
    else strengths.push('Skills section has enough keywords.')
  }

  if (!experience) {
    issues.push(issue('experience', 'Missing experience', 'Add at least one role with bullet points.', 18, 'experience', 'high'))
  } else {
    const items = (experience.data as ExperienceData).items
    if (items.length === 0) issues.push(issue('experience-empty', 'No work entries', 'Add at least one work entry.', 12, 'experience', 'high', experience.id))
    const bullets = items.flatMap((item) => item.bullets.map((bullet) => bullet.text).filter(Boolean))
    if (bullets.length < 3) issues.push(issue('bullet-count', 'Too few work bullets', 'Add 3 or more work bullets.', 10, 'experience', 'medium', experience.id))
    if (bullets.filter(hasNumber).length === 0) issues.push(issue('numbers', 'No numbers in bullets', 'Add metrics like %, time saved, users, or revenue.', 8, 'metrics', 'medium', experience.id))
    for (const item of items) {
      if (!item.start || (!item.end && !item.current)) {
        issues.push(issue(`dates-${item.id}`, 'Missing dates', 'Add start and end dates for this role.', 4, 'dates', 'medium', experience.id, item.id))
      }
      for (const bullet of item.bullets) {
        issues.push(...scoreBullet(bullet.text, experience.id, item.id, bullet.id))
      }
    }
    if (bullets.length >= 3) strengths.push('Work section has useful bullet detail.')
  }

  if (projects) {
    const emptyProjects = (projects.data as ProjectsData).items.filter(
      (item) => item.name && !item.description && item.bullets.every((bullet) => !bullet.text.trim()),
    )
    if (emptyProjects.length) issues.push(issue('projects', 'Projects need impact', 'Add one result or detail to each project.', 5, 'projects', 'low', projects.id))
  }

  if (!['professional', 'classic', 'modern', 'compact'].includes(resume.templateId)) {
    issues.push(issue('template', 'Template may not be ATS safe', 'Use an ATS-safe layout.', 8, 'template', 'medium'))
  } else {
    strengths.push('Layout is ATS safe.')
  }

  const score = Math.max(0, Math.min(100, 100 - issues.reduce((sum, item) => sum + item.points, 0)))
  return { score, issues, strengths }
}

export function issuesForSection(resume: Resume, sectionId: string): Array<ScoreIssue> {
  return scoreResume(resume).issues.filter((item) => item.sectionId === sectionId || item.itemId === sectionId)
}

export function scoreBullet(text: string, sectionId?: string, itemId?: string, bulletId?: string): Array<ScoreIssue> {
  const clean = text.trim()
  const issues: Array<ScoreIssue> = []
  if (!clean) {
    issues.push(issue(`empty-${bulletId ?? 'bullet'}`, 'Empty bullet', 'Add a result-driven bullet or remove this line.', 3, 'experience', 'low', sectionId, itemId, bulletId))
    return issues
  }
  if (!/[.!?]$/.test(clean)) {
    issues.push(issue(`punctuation-${bulletId ?? clean}`, 'Punctuated bullet points', 'End this bullet with punctuation.', 1, 'punctuation', 'low', sectionId, itemId, bulletId))
  }
  if (!hasNumber(clean)) {
    issues.push(issue(`metric-${bulletId ?? clean}`, 'Quantified bullet points', 'Add a metric when possible: %, time saved, users, revenue, or volume.', 2, 'metrics', 'medium', sectionId, itemId, bulletId))
  }
  if (/^(worked on|helped|responsible for|handled|did|made)\b/i.test(clean)) {
    issues.push(issue(`weak-${bulletId ?? clean}`, 'Weak action verb', 'Start with a stronger verb such as built, improved, led, shipped, reduced, or increased.', 2, 'style', 'medium', sectionId, itemId, bulletId))
  }
  if (/\b(i|me|my|we|our|us)\b/i.test(clean)) {
    issues.push(issue(`pronoun-${bulletId ?? clean}`, 'Personal pronoun', 'Remove personal pronouns and keep the bullet resume-focused.', 1, 'style', 'low', sectionId, itemId, bulletId))
  }
  if (/\b(responsible for|helped with|various|several|many|things|stuff|really|very)\b/i.test(clean)) {
    issues.push(issue(`filler-${bulletId ?? clean}`, 'Filler or vague words', 'Replace vague wording with a concrete action and outcome.', 1, 'style', 'low', sectionId, itemId, bulletId))
  }
  if (/\b(was|were|been|being)\s+\w+ed\b/i.test(clean)) {
    issues.push(issue(`passive-${bulletId ?? clean}`, 'Passive voice', 'Use active voice and name the shipped outcome directly.', 1, 'style', 'low', sectionId, itemId, bulletId))
  }
  if (clean.split(/\s+/).length > 34) {
    issues.push(issue(`wordy-${bulletId ?? clean}`, 'Wordy content', 'Trim this bullet to one tight action-result line.', 1, 'style', 'low', sectionId, itemId, bulletId))
  }
  return issues
}

function issue(
  id: string,
  label: string,
  fix: string,
  points: number,
  category: ScoreIssue['category'] = 'contact',
  severity: ScoreIssue['severity'] = 'high',
  sectionId?: string,
  itemId?: string,
  bulletId?: string,
): ScoreIssue {
  return { id, label, fix, points, category, severity, sectionId, itemId, bulletId }
}

function looksLikeEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value)
}

function hasNumber(value: string) {
  return /\d|%|percent|\bx\b/i.test(value)
}
