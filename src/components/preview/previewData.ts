import { useMemo } from 'react'
import { defaultResumeStyle, useResumeStore } from '../../stores/resumeStore'
import { SECTION_LABEL } from '../../stores/resumeSections'
import type {
  CustomData,
  EducationData,
  ExperienceData,
  PersonalData,
  ProjectsData,
  Resume,
  ResumeStyle,
  SkillsData,
  SummaryData,
  TemplateId,
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
  templateId: TemplateId
  style: ResumeStyle
  personal: { id: string; data: PersonalData } | null
  sections: Array<PreviewSection>
}

export function buildPreviewResume(resume: Resume): PreviewResume {
  const resumeSections = resume.sections ?? []
  const personalSection = resumeSections.find((section) => section.type === 'personal')
  const sections = resumeSections.flatMap((section): Array<PreviewSection> => {
    if (section.type === 'personal' || !section.enabled) return []

    const previewSection = toPreviewSection(section)
    return previewSection && shouldShowSection(previewSection) ? [previewSection] : []
  })

  return {
    id: resume.id,
    templateId: resume.templateId ?? 'classic',
    style: { ...defaultResumeStyle, ...resume.style },
    personal: personalSection
      ? { id: personalSection.id, data: personalSection.data as PersonalData }
      : null,
    sections,
  }
}

export function usePreviewResume(resumeId: string): PreviewResume | null {
  const resume = useResumeStore((state) => state.resumes[resumeId])
  return useMemo(() => (resume ? buildPreviewResume(resume) : null), [resume])
}

function toPreviewSection(section: Resume['sections'][number]): PreviewSection | null {
  switch (section.type) {
    case 'summary':
      return { id: section.id, kind: 'summary', title: SECTION_LABEL.summary, data: section.data as SummaryData }
    case 'experience':
      return {
        id: section.id,
        kind: 'experience',
        title: SECTION_LABEL.experience,
        data: section.data as ExperienceData,
      }
    case 'education':
      return {
        id: section.id,
        kind: 'education',
        title: SECTION_LABEL.education,
        data: section.data as EducationData,
      }
    case 'skills':
      return { id: section.id, kind: 'skills', title: SECTION_LABEL.skills, data: section.data as SkillsData }
    case 'projects':
      return {
        id: section.id,
        kind: 'projects',
        title: SECTION_LABEL.projects,
        data: section.data as ProjectsData,
      }
    case 'custom': {
      const data = section.data as CustomData
      return { id: section.id, kind: 'custom', title: data.title || SECTION_LABEL.custom, data }
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
