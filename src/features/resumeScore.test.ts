import { describe, expect, it } from 'vitest'
import { makeNewResume } from '../stores/resumeSections'
import type { ResumeSection } from '../stores/types'
import { issuesForSection, scoreBullet, scoreResume } from './resumeScore'

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

  it('flags local bullet quality issues', () => {
    const issues = scoreBullet('Worked on many things with our team', 'experience-1', 'item-1', 'bullet-1')
    expect(issues.map((item) => item.category)).toEqual(
      expect.arrayContaining(['punctuation', 'metrics', 'style']),
    )
    expect(issues.every((item) => item.sectionId === 'experience-1')).toBe(true)
  })

  it('finds issues for a selected section', () => {
    const resume = makeNewResume('Test')
    const experience = resume.sections.find((section) => section.type === 'experience') as ResumeSection<'experience'>
    experience.data.items[0].bullets[0].text = 'Helped with things'
    const issues = issuesForSection(resume, experience.id)
    expect(issues.some((item) => item.bulletId === experience.data.items[0].bullets[0].id)).toBe(true)
  })
})
