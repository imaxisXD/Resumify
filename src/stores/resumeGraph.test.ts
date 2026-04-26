import { describe, expect, it } from 'vitest'
import { applyGraphLink, edgeOrderIndex, readResumeGraph, removeGraphNode } from './resumeGraph'
import { createResumeNode } from './resumeSections'
import type { Resume } from './types'

function makeResume(): Resume {
  const personal = createResumeNode('personal', { x: 0, y: 0 }, { id: 'personal' })
  const summary = createResumeNode('summary', { x: 1, y: 0 }, { id: 'summary' })
  const experience = createResumeNode('experience', { x: 2, y: 0 }, { id: 'experience' })

  return {
    id: 'resume',
    name: 'Resume',
    templateId: 'classic',
    nodes: [personal, summary, experience],
    edges: [],
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('resume graph', () => {
  it('reads order from the personal node', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [
        { id: 'one', source: 'personal', target: 'summary' },
        { id: 'two', source: 'summary', target: 'experience' },
      ],
    }

    const graph = readResumeGraph(resume)
    expect(graph.orderedNodes.map((node) => node.id)).toEqual([
      'personal',
      'summary',
      'experience',
    ])
    expect(graph.edgeNumberById).toEqual({ one: 1, two: 2 })
  })

  it('stops on loops', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [
        { id: 'one', source: 'personal', target: 'summary' },
        { id: 'two', source: 'summary', target: 'personal' },
      ],
    }

    expect(readResumeGraph(resume).orderedNodes.map((node) => node.id)).toEqual([
      'personal',
      'summary',
    ])
  })

  it('reports loose nodes', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [{ id: 'one', source: 'personal', target: 'summary' }],
    }

    const graph = readResumeGraph(resume)
    expect(graph.looseNodes.map((node) => node.id)).toEqual(['experience'])
    expect(graph.issues.map((issue) => issue.message)).toContain(
      'Connect Experience to Personal or another section so it appears in the preview.',
    )
  })

  it('replaces old links when joining nodes', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [
        { id: 'old-source', source: 'personal', target: 'summary' },
        { id: 'old-target', source: 'summary', target: 'experience' },
      ],
    }

    const next = applyGraphLink(resume, { source: 'personal', target: 'experience' })
    expect(next.edges).toEqual([
      {
        id: 'order:personal:experience',
        source: 'personal',
        target: 'experience',
        type: 'order',
        animated: true,
      },
    ])
  })

  it('removes a node and its links', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [
        { id: 'one', source: 'personal', target: 'summary' },
        { id: 'two', source: 'summary', target: 'experience' },
      ],
    }

    const next = removeGraphNode(resume, 'summary')
    expect(next.nodes.map((node) => node.id)).toEqual(['personal', 'experience'])
    expect(next.edges).toEqual([])
  })

  it('reads the edge order number', () => {
    const resume: Resume = {
      ...makeResume(),
      edges: [{ id: 'one', source: 'personal', target: 'summary' }],
    }

    expect(edgeOrderIndex(resume, resume.edges[0])).toBe(1)
  })
})
