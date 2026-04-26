import { describe, expect, it } from 'vitest'
import { createResumeNode, getSectionList, makeNewResume, PALETTE_ORDER } from './resumeSections'
import type { NodeKind } from './types'

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

  it.each<NodeKind>(['personal', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'])(
    'makes a %s node with matching data',
    (kind) => {
      const node = createResumeNode(kind, { x: 1, y: 2 })
      expect(node.type).toBe(kind)
      expect(node.data.kind).toBe(kind)
      expect(node.position).toEqual({ x: 1, y: 2 })
      expect(node.deletable).toBe(kind !== 'personal')
    },
  )

  it('makes a new resume with a personal node', () => {
    const resume = makeNewResume('Test resume')
    expect(resume.name).toBe('Test resume')
    expect(resume.nodes).toHaveLength(1)
    expect(resume.nodes[0].type).toBe('personal')
  })
})

