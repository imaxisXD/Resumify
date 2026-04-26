import { describe, expect, it } from 'vitest'
import { buildPreviewResume } from './previewData'
import { createResumeNode } from '../../stores/resumeSections'
import type { Resume } from '../../stores/types'

describe('preview data', () => {
  it('builds clean preview data from the resume graph', () => {
    const personal = createResumeNode('personal', { x: 0, y: 0 }, { id: 'personal' })
    const summary = createResumeNode('summary', { x: 1, y: 0 }, { id: 'summary' })
    const projects = createResumeNode('projects', { x: 2, y: 0 }, { id: 'projects' })
    const loose = createResumeNode('skills', { x: 3, y: 0 }, { id: 'loose' })

    const resume: Resume = {
      id: 'resume',
      name: 'Resume',
      templateId: 'classic',
      nodes: [personal, summary, projects, loose],
      edges: [
        { id: 'one', source: 'personal', target: 'summary' },
        { id: 'two', source: 'summary', target: 'projects' },
      ],
      createdAt: 1,
      updatedAt: 1,
    }

    const preview = buildPreviewResume(resume)
    expect(preview.personal?.id).toBe('personal')
    expect(preview.sections.map((section) => section.kind)).toEqual(['summary', 'projects'])
  })
})

