import type { Edge, Node } from '@xyflow/react'

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

export type NodeKind =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'custom'

export type NodeDataMap = {
  personal: PersonalData
  summary: SummaryData
  experience: ExperienceData
  education: EducationData
  skills: SkillsData
  projects: ProjectsData
  custom: CustomData
}

// React Flow's Node generic constrains data to Record<string, unknown>.
// Our concrete data shapes satisfy that at runtime; we cast at the boundary.
export type ResumeNode<K extends NodeKind = NodeKind> = Node<
  Record<string, unknown> & { kind: K },
  K
> & {
  data: NodeDataMap[K] & { kind: K }
}

export type TemplateId = 'classic' | 'modern' | 'compact'

export type Resume = {
  id: string
  name: string
  templateId: TemplateId
  nodes: Array<ResumeNode>
  edges: Array<Edge>
  createdAt: number
  updatedAt: number
}
