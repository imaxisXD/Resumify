import { useMemo } from 'react'
import { useResumeStore } from '../../stores/resumeStore'
import { readResumeGraph } from '../../stores/resumeGraph'
import { NODE_LABEL } from '../../stores/resumeSections'
import type {
  CustomData,
  EducationData,
  ExperienceData,
  PersonalData,
  ProjectsData,
  Resume,
  SkillsData,
  SummaryData,
} from '../../stores/types'

export type PreviewSection =
  | { id: string; kind: 'summary'; title: string; data: SummaryData }
  | { id: string; kind: 'experience'; title: string; data: ExperienceData }
  | { id: string; kind: 'education'; title: string; data: EducationData }
  | { id: string; kind: 'skills'; title: string; data: SkillsData }
  | { id: string; kind: 'projects'; title: string; data: ProjectsData }
  | { id: string; kind: 'custom'; title: string; data: CustomData }

export type PreviewResume = {
  id: string
  personal: { id: string; data: PersonalData } | null
  sections: Array<PreviewSection>
}

export function buildPreviewResume(resume: Resume): PreviewResume {
  const graph = readResumeGraph(resume)
  const personalNode = graph.orderedNodes.find((node) => node.type === 'personal')
  const sections = graph.orderedNodes.flatMap((node): Array<PreviewSection> => {
    if (node.type === 'personal') return []

    const section = toPreviewSection(node)
    return section && shouldShowSection(section) ? [section] : []
  })

  return {
    id: resume.id,
    personal: personalNode
      ? { id: personalNode.id, data: personalNode.data as PersonalData }
      : null,
    sections,
  }
}

export function usePreviewResume(resumeId: string): PreviewResume | null {
  const resume = useResumeStore((state) => state.resumes[resumeId])
  return useMemo(() => (resume ? buildPreviewResume(resume) : null), [resume])
}

function toPreviewSection(node: Resume['nodes'][number]): PreviewSection | null {
  switch (node.type) {
    case 'summary':
      return { id: node.id, kind: 'summary', title: NODE_LABEL.summary, data: node.data as SummaryData }
    case 'experience':
      return {
        id: node.id,
        kind: 'experience',
        title: NODE_LABEL.experience,
        data: node.data as ExperienceData,
      }
    case 'education':
      return {
        id: node.id,
        kind: 'education',
        title: NODE_LABEL.education,
        data: node.data as EducationData,
      }
    case 'skills':
      return { id: node.id, kind: 'skills', title: NODE_LABEL.skills, data: node.data as SkillsData }
    case 'projects':
      return {
        id: node.id,
        kind: 'projects',
        title: NODE_LABEL.projects,
        data: node.data as ProjectsData,
      }
    case 'custom': {
      const data = node.data as CustomData
      return { id: node.id, kind: 'custom', title: data.title || NODE_LABEL.custom, data }
    }
    default:
      return null
  }
}

function shouldShowSection(section: PreviewSection): boolean {
  switch (section.kind) {
    case 'summary':
      return Boolean(section.data.text?.trim())
    case 'experience':
    case 'education':
    case 'projects':
    case 'custom':
      return section.data.items.length > 0
    case 'skills':
      return section.data.groups.length > 0
  }
}
