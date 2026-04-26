import type { Edge } from '@xyflow/react'
import type { NodeDataMap, NodeKind, Resume, ResumeNode } from './types'
import { NODE_LABEL } from './resumeSections'

export type GraphLink = { source: string; target: string }

export type GraphIssue = {
  id: string
  message: string
}

export type ResumeGraph = {
  orderedNodes: Array<ResumeNode>
  looseNodes: Array<ResumeNode>
  issues: Array<GraphIssue>
  edgeNumberById: Record<string, number>
}

export function readResumeGraph(resume: Resume): ResumeGraph {
  const personal = resume.nodes.find((node) => node.type === 'personal')
  const orderedNodes = personal ? walkFrom(personal, resume) : resume.nodes
  const inDocument = new Set(orderedNodes.map((node) => node.id))
  const looseNodes = resume.nodes.filter(
    (node) => node.type !== 'personal' && !inDocument.has(node.id),
  )
  const edgeNumberById = numberEdges(orderedNodes, resume.edges)

  return {
    orderedNodes,
    looseNodes,
    edgeNumberById,
    issues: readGraphIssues(personal, looseNodes),
  }
}

export function applyGraphLink(resume: Resume, link: GraphLink): Resume {
  const edges = [
    ...resume.edges.filter((edge) => edge.source !== link.source && edge.target !== link.target),
    makeOrderEdge(link),
  ]

  return { ...resume, edges }
}

export function removeGraphNode(resume: Resume, nodeId: string): Resume {
  return {
    ...resume,
    nodes: resume.nodes.filter((node) => node.id !== nodeId),
    edges: resume.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  }
}

export function edgeOrderIndex(resume: Resume, edge: Edge): number | null {
  return readResumeGraph(resume).edgeNumberById[edge.id] ?? null
}

function walkFrom(start: ResumeNode, resume: Resume): Array<ResumeNode> {
  const nodeById = new Map(resume.nodes.map((node) => [node.id, node]))
  const nextBySource = new Map<string, string>()

  for (const edge of resume.edges) {
    if (!nextBySource.has(edge.source)) nextBySource.set(edge.source, edge.target)
  }

  const orderedNodes: Array<ResumeNode> = [start]
  const seen = new Set<string>([start.id])
  let cursor: string | undefined = start.id

  while (cursor) {
    const next = nextBySource.get(cursor)
    if (!next || seen.has(next)) break

    const node = nodeById.get(next)
    if (!node) break

    orderedNodes.push(node)
    seen.add(node.id)
    cursor = node.id
  }

  return orderedNodes
}

function numberEdges(orderedNodes: Array<ResumeNode>, edges: Array<Edge>): Record<string, number> {
  const edgeNumberById: Record<string, number> = {}

  for (let index = 0; index < orderedNodes.length - 1; index++) {
    const source = orderedNodes[index].id
    const target = orderedNodes[index + 1].id
    const edge = edges.find((item) => item.source === source && item.target === target)
    if (edge) edgeNumberById[edge.id] = index + 1
  }

  return edgeNumberById
}

function readGraphIssues(
  personal: ResumeNode | undefined,
  looseNodes: Array<ResumeNode>,
): Array<GraphIssue> {
  const issues: Array<GraphIssue> = []

  if (personal) {
    const data = personal.data as NodeDataMap['personal'] & { kind: 'personal' }
    if (!data.fullName?.trim()) {
      issues.push({ id: personal.id, message: 'Add your name in Personal. It appears at the top of the resume.' })
    }
    if (!data.email?.trim()) {
      issues.push({ id: personal.id, message: 'Add your email in Personal so employers can contact you.' })
    }
  }

  for (const node of looseNodes) {
    const label = NODE_LABEL[node.type as NodeKind]
    issues.push({
      id: node.id,
      message: `Connect ${label} to Personal or another section so it appears in the preview.`,
    })
  }

  return issues
}

function makeOrderEdge(link: GraphLink): Edge {
  return {
    id: `order:${link.source}:${link.target}`,
    source: link.source,
    target: link.target,
    type: 'order',
    animated: true,
  }
}
