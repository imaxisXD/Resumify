import { nanoid } from 'nanoid'
import { createResumeSection, makeNewResume } from '../stores/resumeSections'
import type { ExperienceItem, Resume } from '../stores/types'

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist')
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
    const pages: Array<string> = []
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    }
    return pages.join('\n')
  }

  if (
    file.type.includes('wordprocessingml') ||
    file.name.toLowerCase().endsWith('.docx') ||
    file.name.toLowerCase().endsWith('.doc')
  ) {
    const mammoth = (await import('mammoth/mammoth.browser')).default
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return result.value
  }

  return file.text()
}

export function parseResumeText(text: string, name = 'Imported Resume'): Resume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const resume = makeNewResume(name)
  const lower = text.toLowerCase()
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ''
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] ?? ''
  const firstLine = lines.find((line) => !line.includes('@') && !/\d{4}/.test(line)) ?? name
  const skillLine = lines.find((line) => /skills|technologies|tools/i.test(line)) ?? ''
  const skills = extractSkills(`${skillLine} ${text}`)
  const experienceItems = extractExperience(lines)

  resume.sections = [
    createResumeSection('personal', {
      data: {
        kind: 'personal',
        fullName: firstLine,
        title: guessTitle(lines),
        email,
        phone,
        location: '',
        website: '',
        links: [],
      },
    }),
    createResumeSection('skills', {
      data: {
        kind: 'skills',
        groups: [{ id: nanoid(6), label: 'Skills', skills }],
      },
    }),
    createResumeSection('experience', {
      data: { kind: 'experience', items: experienceItems },
    }),
  ]

  if (/summary|profile|objective/.test(lower)) {
    resume.sections.splice(
      1,
      0,
      createResumeSection('summary', {
        data: { kind: 'summary', text: lines.slice(1, 4).join(' ') },
      }),
    )
  }

  return { ...resume, name, updatedAt: Date.now() }
}

function guessTitle(lines: Array<string>) {
  return lines.find((line) => /engineer|developer|designer|manager|analyst|lead|architect/i.test(line)) ?? ''
}

function extractSkills(text: string): Array<string> {
  const known = [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Python',
    'Java',
    'Go',
    'Rust',
    'AWS',
    'Docker',
    'Kubernetes',
    'Postgres',
    'SQL',
    'GraphQL',
    'REST',
    'Tailwind CSS',
    'Git',
  ]
  return known.filter((skill) => text.toLowerCase().includes(skill.toLowerCase())).slice(0, 20)
}

function extractExperience(lines: Array<string>): Array<ExperienceItem> {
  const bullets = lines.filter((line) => /^[-•*]/.test(line) || /\d+%|\d+x|\d+ users?/i.test(line))
  const roleLine = lines.find((line) => /engineer|developer|manager|designer|analyst|lead/i.test(line)) ?? ''
  const dateLine = lines.find((line) => /\b(20\d{2}|19\d{2}|present|current)\b/i.test(line)) ?? ''
  const [start = '', end = ''] = dateLine.split(/\s*(?:-|–|—|to)\s*/i)
  return [
    {
      id: nanoid(6),
      role: roleLine,
      company: '',
      location: '',
      start,
      end,
      current: /present|current/i.test(end),
      bullets: bullets.slice(0, 6).map((bullet) => ({ id: nanoid(6), text: bullet.replace(/^[-•*]\s*/, '') })),
    },
  ]
}
