import { describe, expect, it } from 'vitest'
import { makeNewResume } from '../stores/resumeSections'
import type { ResumeSection } from '../stores/types'
import { scoreResume } from './resumeScore'

describe('resume score', () => {
  it('scores the default resume as ready', () => {
    const result = scoreResume(makeNewResume('Test'))
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('flags missing contact fields', () => {
    const resume = makeNewResume('Test')
    const personal = resume.sections.find((section) => section.type === 'personal') as ResumeSection<'personal'> | undefined
    if (personal) personal.data.email = ''
    const result = scoreResume(resume)
    expect(result.issues.some((item) => item.id === 'email')).toBe(true)
  })
})
