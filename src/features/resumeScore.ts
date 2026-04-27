import type { ExperienceData, PersonalData, ProjectsData, Resume, SkillsData } from '../stores/types'

export type ScoreIssue = {
  id: string
  label: string
  fix: string
  points: number
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
    if (!data.fullName.trim()) issues.push(issue('name', 'Missing name', 'Add your full name.', 8))
    if (!looksLikeEmail(data.email)) issues.push(issue('email', 'Missing valid email', 'Add a valid email address.', 8))
    if (!data.phone.trim()) issues.push(issue('phone', 'Missing phone', 'Add a phone number.', 6))
    if (!data.location.trim()) issues.push(issue('location', 'Missing location', 'Add city and country or remote location.', 6))
    if (data.fullName && looksLikeEmail(data.email) && data.phone && data.location) strengths.push('Contact details are complete.')
  }

  if (!skills) {
    issues.push(issue('skills', 'Missing skills', 'Add a skills section with role keywords.', 16))
  } else {
    const count = (skills.data as SkillsData).groups.flatMap((group) => group.skills).filter(Boolean).length
    if (count < 8) issues.push(issue('skill-count', 'Too few skills', 'Add at least 8 useful skills.', 10))
    else strengths.push('Skills section has enough keywords.')
  }

  if (!experience) {
    issues.push(issue('experience', 'Missing experience', 'Add at least one role with bullet points.', 18))
  } else {
    const items = (experience.data as ExperienceData).items
    if (items.length === 0) issues.push(issue('experience-empty', 'No work entries', 'Add at least one work entry.', 12))
    const bullets = items.flatMap((item) => item.bullets.map((bullet) => bullet.text).filter(Boolean))
    if (bullets.length < 3) issues.push(issue('bullet-count', 'Too few work bullets', 'Add 3 or more work bullets.', 10))
    if (bullets.filter(hasNumber).length === 0) issues.push(issue('numbers', 'No numbers in bullets', 'Add metrics like %, time saved, users, or revenue.', 8))
    if (items.some((item) => !item.start || !item.end)) issues.push(issue('dates', 'Missing dates', 'Add start and end dates for each role.', 6))
    if (bullets.length >= 3) strengths.push('Work section has useful bullet detail.')
  }

  if (projects) {
    const emptyProjects = (projects.data as ProjectsData).items.filter(
      (item) => item.name && !item.description && item.bullets.every((bullet) => !bullet.text.trim()),
    )
    if (emptyProjects.length) issues.push(issue('projects', 'Projects need impact', 'Add one result or detail to each project.', 5))
  }

  if (!['professional', 'classic', 'modern', 'compact'].includes(resume.templateId)) {
    issues.push(issue('template', 'Template may not be ATS safe', 'Use an ATS-safe layout.', 8))
  } else {
    strengths.push('Layout is ATS safe.')
  }

  const score = Math.max(0, Math.min(100, 100 - issues.reduce((sum, item) => sum + item.points, 0)))
  return { score, issues, strengths }
}

function issue(id: string, label: string, fix: string, points: number): ScoreIssue {
  return { id, label, fix, points }
}

function looksLikeEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value)
}

function hasNumber(value: string) {
  return /\d|%|percent|x\b|users?|customers?|revenue|saved|reduced|increased/i.test(value)
}
