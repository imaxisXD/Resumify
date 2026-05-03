import { nanoid } from 'nanoid'
import { createResumeSection, makeNewResume } from '../stores/resumeSections'
import type { EducationItem, ExperienceItem, ProjectItem, Resume } from '../stores/types'

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString()
    }
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages: Array<string> = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(textItemsToLines(content.items).join('\n'))
    }
    return cleanExtractedText(pages.join('\n\n'))
  }

  if (
    file.type.includes('wordprocessingml') ||
    file.name.toLowerCase().endsWith('.docx') ||
    file.name.toLowerCase().endsWith('.doc')
  ) {
    const mammoth = (await import('mammoth/mammoth.browser')).default
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return cleanExtractedText(result.value)
  }

  return cleanExtractedText(await file.text())
}

export function parseResumeText(text: string, name = 'Imported Resume'): Resume {
  const lines = linesFromText(text)
  const resume = makeNewResume(name)
  const lower = text.toLowerCase()
  const sections = splitIntoSections(lines)
  const personalLines = sectionBeforeFirstHeading(lines)
  const email = findEmail(text)
  const phone = findPhone(text)
  const links = findLinks(personalLines.join('\n'), email)
  const firstLine = personalLines.find((line) => looksLikeName(line, email)) ?? lines.find((line) => looksLikeName(line, email)) ?? name
  const skills = extractSkills(sections.skills?.join(' ') || text)
  const experienceItems = extractExperience(lines)
  const educationItems = extractEducation(sections.education ?? [])
  const projectItems = extractProjects(sections.projects ?? [])
  const summary = extractSummary(sections.summary ?? [], lines)
  const resumeName = firstLine && name === 'Imported Resume' ? `${firstLine} Resume` : name

  resume.sections = [
    createResumeSection('personal', {
      data: {
        kind: 'personal',
        fullName: firstLine,
        title: guessTitle(lines, experienceItems),
        email,
        phone,
        location: guessLocation(lines),
        website: links.find((link) => !/linkedin|github|peerlist/i.test(link.url))?.url ?? '',
        links,
      },
    }),
  ]

  if (summary || /summary|profile|objective/.test(lower)) {
    resume.sections.push(
      createResumeSection('summary', {
        data: { kind: 'summary', text: summary },
      }),
    )
  }

  if (skills.length) {
    resume.sections.push(
      createResumeSection('skills', {
        data: {
          kind: 'skills',
          groups: [{ id: nanoid(6), label: 'Skills', skills }],
        },
      }),
    )
  }

  if (experienceItems.length) {
    resume.sections.push(
      createResumeSection('experience', {
        data: { kind: 'experience', items: experienceItems },
      }),
    )
  }

  if (educationItems.length) {
    resume.sections.push(
      createResumeSection('education', {
        data: { kind: 'education', items: educationItems },
      }),
    )
  }

  if (projectItems.length) {
    resume.sections.push(
      createResumeSection('projects', {
        data: { kind: 'projects', items: projectItems },
      }),
    )
  }

  return { ...resume, name: resumeName, updatedAt: Date.now() }
}

function textItemsToLines(items: Array<unknown>): Array<string> {
  const positioned = items
    .map((item) => {
      if (!item || typeof item !== 'object' || !('str' in item)) return null
      const text = String((item as { str: string }).str).trim()
      if (!text) return null
      const transform = (item as { transform?: Array<number> }).transform ?? []
      return { text, x: Number(transform[4] ?? 0), y: Math.round(Number(transform[5] ?? 0) / 3) * 3 }
    })
    .filter(Boolean) as Array<{ text: string; x: number; y: number }>

  const rows = new Map<number, Array<{ text: string; x: number }>>()
  for (const item of positioned) {
    rows.set(item.y, [...(rows.get(item.y) ?? []), item])
  }

  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(' '))
    .map(cleanLine)
    .filter(Boolean)
}

function cleanExtractedText(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/([A-Za-z])\s+\.\s+([A-Za-z])/g, '$1.$2')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+([,.;:)\]])/g, '$1')
    .replace(/([(])\s+/g, '$1')
    .replace(/\s+-\s+/g, ' - ')
    .replace(/\bidenti\s*fi\s*cation\b/gi, 'identification')
    .replace(/\be\s*ffi\s*ciency\b/gi, 'efficiency')
    .replace(/\r/g, '')
}

function linesFromText(text: string): Array<string> {
  return cleanExtractedText(text)
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean)
}

function cleanLine(line: string): string {
  return line
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:)\]])/g, '$1')
    .replace(/([(])\s+/g, '$1')
    .replace(/\s*\/\s*/g, '/')
    .replace(/([A-Za-z])\.\s+(js|io)\b/gi, '$1.$2')
    .trim()
}

function splitIntoSections(lines: Array<string>) {
  const result: Record<string, Array<string>> = {}
  let current = ''
  for (const line of lines) {
    const heading = sectionKey(line)
    if (heading) {
      current = heading
      result[current] = []
      continue
    }
    if (current) result[current].push(line)
  }
  return result as {
    summary?: Array<string>
    skills?: Array<string>
    experience?: Array<string>
    education?: Array<string>
    projects?: Array<string>
  }
}

function sectionBeforeFirstHeading(lines: Array<string>) {
  const index = lines.findIndex((line) => Boolean(sectionKey(line)))
  return index === -1 ? lines.slice(0, 5) : lines.slice(0, index)
}

function sectionKey(line: string): string {
  const normalized = line.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim()
  if (/^(summary|profile|professional summary|objective)$/.test(normalized)) return 'summary'
  if (/^(skills|technical skills|core skills|technologies)$/.test(normalized)) return 'skills'
  if (/^(work experience|professional experience|experience|employment)$/.test(normalized)) return 'experience'
  if (/^(education|academic background)$/.test(normalized)) return 'education'
  if (/^(projects|project experience|personal projects)$/.test(normalized)) return 'projects'
  return ''
}

function findEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
}

function findPhone(text: string) {
  return text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s+/g, '') ?? ''
}

function findLinks(text: string, email = '') {
  const matches = text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s,;)]*)?/gi) ?? []
  const emailDomain = email.split('@')[1]?.toLowerCase()
  const seen = new Set<string>()
  return matches
    .filter((url) => !url.includes('@'))
    .map((url) => url.replace(/^https?:\/\//, '').replace(/[.,;]+$/, ''))
    .filter((url) => url.toLowerCase() !== emailDomain)
    .filter((url) => {
      const key = url.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
    .map((url) => ({ id: nanoid(6), label: linkLabel(url), url }))
}

function linkLabel(url: string) {
  if (/linkedin/i.test(url)) return 'LinkedIn'
  if (/github/i.test(url)) return 'GitHub'
  if (/peerlist/i.test(url)) return 'Peerlist'
  return 'Website'
}

function looksLikeName(line: string, email: string) {
  if (!line || line.includes('@') || line.includes('http') || line === email) return false
  if (sectionKey(line) || /[•|]|\d{4}|^\+?\d/.test(line)) return false
  const words = line.split(/\s+/)
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-Z][A-Za-z.'-]+$/.test(word))
}

function guessTitle(lines: Array<string>, experienceItems: Array<ExperienceItem>) {
  return (
    experienceItems[0]?.role ??
    lines.find((line) => /engineer|developer|designer|manager|analyst|lead|architect|frontend|backend|full.?stack/i.test(line) && !sectionKey(line)) ??
    ''
  )
}

function guessLocation(lines: Array<string>) {
  const line = lines.find((item) => /\b(remote|india|usa|uk|canada|bangalore|bengaluru|gurg?aon|delhi|mumbai|london)\b/i.test(item))
  return line?.match(/\b(Bangalore|Bengaluru|Gurgaon|Gurugram|Delhi|Mumbai|London|Remote|India|USA|UK|Canada)\b.*$/i)?.[0] ?? ''
}

function extractSkills(text: string): Array<string> {
  const raw = text
    .replace(/^skills$/gim, '')
    .split(/,|;|\n|•/)
    .map((skill) => skill.trim().replace(/\s+/g, ' '))
    .flatMap((skill) => skill.split(/\s{2,}/))
    .map((skill) => skill.replace(/[.;]+$/, '').trim())
    .filter((skill) => skill && skill.length <= 48 && !/^(and|including)$/i.test(skill))
  return dedupe(raw).slice(0, 48)
}

function extractExperience(lines: Array<string>): Array<ExperienceItem> {
  const section = splitIntoSections(lines).experience ?? []
  const items: Array<ExperienceItem> = []
  let current: ExperienceItem | null = null

  for (let index = 0; index < section.length; index += 1) {
    const line = section[index]
    const dates = parseDateRange(line)
    if (dates) {
      if (current) items.push(trimExperience(current))
      current = {
        id: nanoid(6),
        role: '',
        company: line.replace(dates.full, '').trim(),
        location: '',
        start: dates.start,
        end: dates.end,
        current: /present|current/i.test(dates.end),
        bullets: [],
      }
      continue
    }

    if (!current) continue

    if (!current.role && !isBullet(line)) {
      const parsed = parseRoleLine(line)
      current.role = parsed.role
      current.location = parsed.location
      continue
    }

    if (isBullet(line)) {
      const text = stripBullet(line)
      if (text) current.bullets.push({ id: nanoid(6), text })
    } else if (current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1]
      last.text = `${last.text} ${line}`.trim()
    }
  }

  if (current) items.push(trimExperience(current))
  return items.filter((item) => item.company || item.role || item.bullets.length)
}

function extractEducation(lines: Array<string>): Array<EducationItem> {
  if (!lines.length) return []
  const degreeLine = lines.find((line) => /bachelor|master|phd|degree|engineering|science|arts|b\.?a|b\.?s|m\.?s/i.test(line)) ?? lines[0]
  const schoolLine = lines.find((line) => line !== degreeLine && /university|college|institute|school/i.test(line)) ?? lines[1] ?? ''
  const date = lines.join(' ').match(/\b(?:\d{1,2}\/)?(?:19|20)\d{2}\b/)?.[0] ?? ''
  const [school, ...notes] = schoolLine.split(/\s*[•,]\s*/)
  return [
    {
      id: nanoid(6),
      school: school?.trim() ?? '',
      degree: degreeLine,
      field: fieldFromDegree(degreeLine),
      start: '',
      end: date,
      notes: notes.filter((item) => item && item !== date).join(' · '),
    },
  ].filter((item) => item.school || item.degree)
}

function extractProjects(lines: Array<string>): Array<ProjectItem> {
  const projects: Array<ProjectItem> = []
  let current: ProjectItem | null = null

  for (const line of lines) {
    if (isUrl(line)) {
      if (current && !current.url) current.url = line.replace(/^https?:\/\//, '')
      continue
    }

    if (current?.tech.length && isLikelyTechContinuation(line)) {
      current.tech = dedupe([...current.tech, ...extractSkills(line)])
      continue
    }

    if (!isBullet(line) && looksLikeProjectTitle(line)) {
      if (current) projects.push(trimProject(current))
      current = { id: nanoid(6), name: line, url: '', description: '', bullets: [], tech: [] }
      continue
    }

    if (!current) continue

    if (/tech stack|technologies/i.test(line)) {
      current.tech = extractSkills(line.replace(/^[•\-*]?\s*(tech stack|technologies)\s*[:-]?/i, ''))
      continue
    }

    if (isBullet(line)) {
      const text = stripBullet(line)
      if (/tech stack|technologies/i.test(text)) current.tech = extractSkills(text.replace(/^(tech stack|technologies)\s*[:-]?/i, ''))
      else current.bullets.push({ id: nanoid(6), text })
    } else if (!current.description) {
      current.description = line
    } else if (current.bullets.length) {
      const last = current.bullets[current.bullets.length - 1]
      last.text = `${last.text} ${line}`.trim()
    }
  }

  if (current) projects.push(trimProject(current))
  return projects.filter((item) => item.name)
}

function extractSummary(summaryLines: Array<string>, lines: Array<string>) {
  if (summaryLines.length) return summaryLines.join(' ')
  const before = sectionBeforeFirstHeading(lines).filter((line) => !looksLikeName(line, findEmail(lines.join('\n'))) && !line.includes('@') && !isUrl(line))
  return before.find((line) => line.split(/\s+/).length > 8) ?? ''
}

function parseDateRange(line: string) {
  const match = line.match(
    /\b((?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?(?:\d{1,2}\/)?(?:19|20)\d{2})\s*(?:-|–|—|to)\s*((?:present|current)|(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?(?:\d{1,2}\/)?(?:19|20)\d{2})\b/i,
  )
  if (!match) return null
  return { full: match[0], start: normalizeDate(match[1]), end: normalizeDate(match[2]) }
}

function normalizeDate(value: string) {
  return value.replace(/\bpresent\b/i, 'present').trim()
}

function parseRoleLine(line: string) {
  const parts = line.split(/\s*[•|]\s*/).filter(Boolean)
  const role = parts[0]?.replace(/\bfull-time\b/i, '').trim() ?? line
  const location = parts.find((part) => /\b(remote|india|usa|uk|bangalore|gurg?aon|london)\b/i.test(part)) ?? ''
  return { role, location }
}

function trimExperience(item: ExperienceItem): ExperienceItem {
  return {
    ...item,
    company: item.company.replace(/[•|]+/g, '').trim(),
    role: item.role.replace(/[•|]+/g, '').trim(),
    location: item.location.replace(/\bfull-time\b/i, '').trim(),
    bullets: item.bullets.map((bullet) => ({ ...bullet, text: cleanLine(bullet.text) })).filter((bullet) => bullet.text),
  }
}

function trimProject(item: ProjectItem): ProjectItem {
  return {
    ...item,
    description: cleanLine(item.description),
    bullets: item.bullets.map((bullet) => ({ ...bullet, text: cleanLine(bullet.text) })).filter((bullet) => bullet.text),
    tech: dedupe(item.tech),
  }
}

function fieldFromDegree(value: string) {
  return value.match(/computer science|software engineering|information technology|data science/i)?.[0] ?? ''
}

function isBullet(line: string) {
  return /^[•\-*]\s*/.test(line)
}

function stripBullet(line: string) {
  return cleanLine(line.replace(/^[•\-*]\s*/, ''))
}

function isUrl(line: string) {
  return /^(?:https?:\/\/)?(?:www\.)?[a-z0-9.-]+\.[a-z]{2,}/i.test(line)
}

function looksLikeProjectTitle(line: string) {
  if (!line || sectionKey(line) || isUrl(line) || parseDateRange(line)) return false
  if (/tech stack|technologies/i.test(line)) return false
  return line.split(/\s+/).length <= 5
}

function isLikelyTechContinuation(line: string) {
  if (!line || isBullet(line) || isUrl(line) || sectionKey(line) || parseDateRange(line)) return false
  return line.includes(',') && line.split(/\s+/).length <= 8
}

function dedupe(values: Array<string>) {
  const seen = new Set<string>()
  const result: Array<string> = []
  for (const value of values) {
    const normalized = cleanLine(value)
    const key = normalized.toLowerCase()
    if (!normalized || seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result
}
