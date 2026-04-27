import { nanoid } from 'nanoid'
import { DEFAULT_RESUME_STYLE } from './types'
import type {
  CustomData,
  EducationData,
  ExperienceData,
  SectionDataMap,
  SectionKind,
  PersonalData,
  ProjectsData,
  Resume,
  ResumeSection,
  SkillsData,
  SummaryData,
} from './types'

export type Point = { x: number; y: number }

export type SectionInfo = {
  kind: SectionKind
  label: string
  hint: string
  canDelete: boolean
  canAddFromPalette: boolean
}

export const SECTION_LABEL: Record<SectionKind, string> = {
  personal: 'Personal',
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  custom: 'Custom Section',
}

export const SECTION_INFO: Record<SectionKind, SectionInfo> = {
  personal: {
    kind: 'personal',
    label: 'Personal',
    hint: 'Identity · contact · links',
    canDelete: false,
    canAddFromPalette: false,
  },
  summary: {
    kind: 'summary',
    label: 'Summary',
    hint: 'A short paragraph at the top',
    canDelete: true,
    canAddFromPalette: true,
  },
  experience: {
    kind: 'experience',
    label: 'Experience',
    hint: 'Roles, companies, bullets',
    canDelete: true,
    canAddFromPalette: true,
  },
  education: {
    kind: 'education',
    label: 'Education',
    hint: 'Schools, degrees, dates',
    canDelete: true,
    canAddFromPalette: true,
  },
  skills: {
    kind: 'skills',
    label: 'Skills',
    hint: 'Grouped tags',
    canDelete: true,
    canAddFromPalette: true,
  },
  projects: {
    kind: 'projects',
    label: 'Projects',
    hint: 'Side work, links, tech',
    canDelete: true,
    canAddFromPalette: true,
  },
  custom: {
    kind: 'custom',
    label: 'Custom Section',
    hint: 'Awards, talks, anything',
    canDelete: true,
    canAddFromPalette: true,
  },
}

export const SECTION_ORDER: Array<SectionKind> = [
  'personal',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'custom',
]

export const PALETTE_ORDER = SECTION_ORDER.filter(
  (kind) => SECTION_INFO[kind].canAddFromPalette,
)

export function getSectionList(): Array<SectionInfo> {
  return SECTION_ORDER.map((kind) => SECTION_INFO[kind])
}

export function defaultPersonal(): PersonalData {
  return {
    fullName: 'Ada Lovelace',
    title: 'Software Engineer',
    email: 'ada@example.com',
    phone: '+1 (555) 123-4567',
    location: 'London, UK',
    website: 'ada.dev',
    links: [
      { id: nanoid(6), label: 'GitHub', url: 'github.com/ada' },
      { id: nanoid(6), label: 'LinkedIn', url: 'linkedin.com/in/ada' },
    ],
  }
}

export function defaultSummary(): SummaryData {
  return {
    text:
      'Engineer with a decade of experience building reliable backend systems and clean developer tools. Comfortable across the stack, partial to type systems and small interfaces.',
  }
}

export function defaultExperience(): ExperienceData {
  return {
    items: [
      {
        id: nanoid(6),
        role: 'Senior Software Engineer',
        company: 'Acme Corp',
        location: 'Remote',
        start: 'Jan 2023',
        end: '',
        current: true,
        bullets: [
          {
            id: nanoid(6),
            text:
              'Led the migration of the billing service to event-sourced architecture, cutting reconciliation incidents by 80%.',
          },
          {
            id: nanoid(6),
            text: 'Mentored 4 engineers; introduced an internal RFC process now used company-wide.',
          },
        ],
      },
    ],
  }
}

export function defaultEducation(): EducationData {
  return {
    items: [
      {
        id: nanoid(6),
        school: 'University of Cambridge',
        degree: 'B.A.',
        field: 'Computer Science',
        start: '2014',
        end: '2018',
        notes: 'First-class honours',
      },
    ],
  }
}

export function defaultSkills(): SkillsData {
  return {
    groups: [
      { id: nanoid(6), label: 'Languages', skills: ['TypeScript', 'Go', 'Python', 'Rust'] },
      { id: nanoid(6), label: 'Tools', skills: ['Postgres', 'Redis', 'Kafka', 'Terraform'] },
    ],
  }
}

export function defaultProjects(): ProjectsData {
  return {
    items: [
      {
        id: nanoid(6),
        name: 'Resumify',
        url: 'github.com/ada/resumify',
        description: 'A resume builder with live preview and PDF export.',
        bullets: [
          { id: nanoid(6), text: 'Built a live resume editor with drag-and-drop section ordering.' },
          { id: nanoid(6), text: 'Added ATS-safe previews with print-ready layout settings.' },
        ],
        tech: ['React', 'TypeScript', 'Tailwind CSS'],
      },
    ],
  }
}

export function defaultCustom(): CustomData {
  return {
    title: 'Awards',
    items: [
      {
        id: nanoid(6),
        title: 'IEEE Outstanding Engineer',
        subtitle: '2022',
        body: 'Recognised for contributions to open-source observability tools.',
      },
    ],
  }
}

export function defaultDataFor<K extends SectionKind>(kind: K): SectionDataMap[K] {
  switch (kind) {
    case 'personal':
      return defaultPersonal() as SectionDataMap[K]
    case 'summary':
      return defaultSummary() as SectionDataMap[K]
    case 'experience':
      return defaultExperience() as SectionDataMap[K]
    case 'education':
      return defaultEducation() as SectionDataMap[K]
    case 'skills':
      return defaultSkills() as SectionDataMap[K]
    case 'projects':
      return defaultProjects() as SectionDataMap[K]
    case 'custom':
      return defaultCustom() as SectionDataMap[K]
  }
  const neverKind: never = kind
  return neverKind
}

export function createResumeSection<K extends SectionKind>(
  kind: K,
  overrides?: Partial<ResumeSection<K>>,
): ResumeSection<K> {
  const data = { kind, ...(defaultDataFor(kind) as SectionDataMap[K]) } as SectionDataMap[K] & {
    kind: K
  }

  return {
    id: `${kind}-${nanoid(6)}`,
    type: kind,
    data,
    enabled: true,
    locked: !SECTION_INFO[kind].canDelete,
    ...overrides,
  } as unknown as ResumeSection<K>
}

export function makeNewResume(name = 'Untitled Resume'): Resume {
  const id = nanoid(8)
  const now = Date.now()
  return {
    id,
    name,
    templateId: 'professional',
    style: DEFAULT_RESUME_STYLE,
    sections: [
      createResumeSection('personal'),
      createResumeSection('skills'),
      createResumeSection('experience'),
      createResumeSection('education'),
      createResumeSection('projects'),
    ],
    createdAt: now,
    updatedAt: now,
  }
}
