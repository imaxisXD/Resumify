import { describe, expect, it } from 'vitest'
import { buildPreviewResume } from './previewData'
import { createResumeSection } from '../../stores/resumeSections'
import { DEFAULT_RESUME_STYLE, type Resume } from '../../stores/types'

describe('preview data', () => {
  it('builds clean preview data from ordered resume sections', () => {
    const personal = createResumeSection('personal', { id: 'personal' })
    const summary = createResumeSection('summary', { id: 'summary' })
    const projects = createResumeSection('projects', { id: 'projects' })
    const hidden = createResumeSection('skills', { id: 'hidden', enabled: false })

    const resume: Resume = {
      id: 'resume',
      name: 'Resume',
      templateId: 'classic',
      style: DEFAULT_RESUME_STYLE,
      sections: [personal, summary, projects, hidden],
      createdAt: 1,
      updatedAt: 1,
    }

    const preview = buildPreviewResume(resume)
    expect(preview.personal?.id).toBe('personal')
    expect(preview.sections.map((section) => section.kind)).toEqual(['summary', 'projects'])
  })
})
