export type Theme = 'dark' | 'light' | 'riso'

export type PersonalData = {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  website: string
  links: Array<{ id: string; label: string; url: string }>
}

export type SummaryData = {
  text: string
}

export type ExperienceItem = {
  id: string
  role: string
  company: string
  location: string
  start: string
  end: string
  current: boolean
  bullets: Array<{ id: string; text: string }>
}

export type ExperienceData = {
  items: Array<ExperienceItem>
}

export type EducationItem = {
  id: string
  school: string
  degree: string
  field: string
  start: string
  end: string
  notes: string
}

export type EducationData = {
  items: Array<EducationItem>
}

export type SkillGroup = {
  id: string
  label: string
  skills: Array<string>
}

export type SkillsData = {
  groups: Array<SkillGroup>
}

export type ProjectItem = {
  id: string
  name: string
  url: string
  description: string
  bullets: Array<{ id: string; text: string }>
  tech: Array<string>
}

export type ProjectsData = {
  items: Array<ProjectItem>
}

export type CustomItem = {
  id: string
  title: string
  subtitle: string
  body: string
}

export type CustomData = {
  title: string
  items: Array<CustomItem>
}

export type SectionKind =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'custom'

export type SectionDataMap = {
  personal: PersonalData
  summary: SummaryData
  experience: ExperienceData
  education: EducationData
  skills: SkillsData
  projects: ProjectsData
  custom: CustomData
}

export type ResumeSection<K extends SectionKind = SectionKind> = {
  id: string
  type: K
  data: SectionDataMap[K] & { kind: K }
  enabled: boolean
  locked?: boolean
}

export type TemplateId = 'classic' | 'modern' | 'compact' | 'professional'

export type ResumeStyle = {
  font: 'serif' | 'sans' | 'mono'
  spacing: 'compact' | 'normal' | 'wide'
  pageSize: 'a4' | 'letter'
  accentColor: string
}

export const DEFAULT_RESUME_STYLE: ResumeStyle = {
  font: 'sans',
  spacing: 'compact',
  pageSize: 'a4',
  accentColor: '#0a84ff',
}

export type Resume = {
  id: string
  name: string
  templateId: TemplateId
  style: ResumeStyle
  sections: Array<ResumeSection>
  createdAt: number
  updatedAt: number
}

export type Profile = {
  id: string
  name: string
  personal: PersonalData
  education: EducationData
  skills: SkillsData
  experience: ExperienceData
  createdAt: number
  updatedAt: number
}

export type ResumeSnapshot = {
  id: string
  resumeId: string
  label: string
  resume: Resume
  createdAt: number
}

export type JobMatch = {
  id: string
  resumeId: string
  title: string
  description: string
  matchedKeywords: Array<string>
  missingKeywords: Array<string>
  score: number
  createdAt: number
}

export type AiSettings = {
  enabled: boolean
  apiKey: string
  model: string
}

export type ResumeBackup = {
  version: 3
  exportedAt: number
  resumes: Record<string, Resume>
  order: Array<string>
  profileLibrary: Array<Profile>
  resumeHistory: Record<string, Array<ResumeSnapshot>>
  jobMatches: Record<string, Array<JobMatch>>
  aiSettings: AiSettings
}
