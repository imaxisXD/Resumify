import { describe, expect, it } from 'vitest'
import { createResumeSection, getSectionList, makeNewResume, PALETTE_ORDER } from './resumeSections'
import type { SectionKind } from './types'

describe('resume sections', () => {
  it('lists every section with labels and hints', () => {
    const sections = getSectionList()
    expect(sections.map((section) => section.kind)).toEqual([
      'personal',
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'custom',
    ])
    expect(sections.every((section) => section.label && section.hint)).toBe(true)
  })

  it('keeps personal out of the palette', () => {
    expect(PALETTE_ORDER).not.toContain('personal')
  })

  it.each<SectionKind>(['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'])(
    'makes a %s section with matching data',
    (kind) => {
      const section = createResumeSection(kind)
      expect(section.type).toBe(kind)
      expect(section.data.kind).toBe(kind)
      expect(section.enabled).toBe(true)
      expect(Boolean(section.locked)).toBe(kind === 'personal')
    },
  )

  it('makes a new resume with ordered sections', () => {
    const resume = makeNewResume('Test resume')
    expect(resume.name).toBe('Test resume')
    expect(resume.sections.length).toBeGreaterThan(1)
    expect(resume.sections[0].type).toBe('personal')
  })
})
