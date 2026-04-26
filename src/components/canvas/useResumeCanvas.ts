import {
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useCallback, useMemo, useState, type DragEvent, type MouseEvent } from 'react'

import { useResumeStore } from '../../stores/resumeStore'
import type { NodeKind, ResumeNode } from '../../stores/types'

const EMPTY_NODES: Array<ResumeNode> = []
const EMPTY_EDGES: Array<Edge> = []

export const RESUME_SECTION_DRAG_TYPE = 'application/x-resumify-node'

export type ResumeCanvasOptions = {
  dragType?: string
  addOffsetX?: number
  getPalettePosition?: (nodes: Array<ResumeNode>) => { x: number; y: number }
}

export function useResumeCanvas(resumeId: string, options: ResumeCanvasOptions = {}) {
  const dragType = options.dragType ?? RESUME_SECTION_DRAG_TYPE
  const addOffsetX = options.addOffsetX ?? 320
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null)
  const [isDraggingOver, setDraggingOver] = useState(false)

  const nodes = useResumeStore((s) => s.resumes[resumeId]?.nodes ?? EMPTY_NODES) as Array<ResumeNode>
  const edges = useResumeStore((s) => s.resumes[resumeId]?.edges ?? EMPTY_EDGES) as Array<Edge>
  const applyNodeChanges = useResumeStore((s) => s.applyNodeChanges)
  const applyEdgeChanges = useResumeStore((s) => s.applyEdgeChanges)
  const connect = useResumeStore((s) => s.connect)
  const addNode = useResumeStore((s) => s.addNode)
  const setSelected = useResumeStore((s) => s.setSelectedNode)

  const onNodesChange = useCallback(
    (changes: Array<NodeChange>) => {
      if (changes.length) applyNodeChanges(resumeId, changes)
    },
    [applyNodeChanges, resumeId],
  )

  const onEdgesChange = useCallback(
    (changes: Array<EdgeChange>) => {
      if (changes.length) applyEdgeChanges(resumeId, changes)
    },
    [applyEdgeChanges, resumeId],
  )

  const onConnect = useCallback(
    (connection: Connection) => connect(resumeId, connection),
    [connect, resumeId],
  )

  const addSection = useCallback(
    (kind: NodeKind, position?: { x: number; y: number }) => {
      const nextPosition = position ?? readPalettePosition(nodes, addOffsetX, options.getPalettePosition)
      const id = addNode(resumeId, kind, nextPosition)
      setSelected(id)
    },
    [addNode, addOffsetX, nodes, options.getPalettePosition, resumeId, setSelected],
  )

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      setDraggingOver(false)
      const kind = event.dataTransfer.getData(dragType) as NodeKind
      if (!kind || !flow) return

      addSection(
        kind,
        flow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      )
    },
    [addSection, dragType, flow],
  )

  const onDragOver = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (event.dataTransfer.types.includes(dragType)) setDraggingOver(true)
    },
    [dragType],
  )

  const onDragLeave = useCallback((event: DragEvent) => {
    if (event.currentTarget === event.target) setDraggingOver(false)
  }, [])

  const onPaneClick = useCallback(() => setSelected(null), [setSelected])

  const onNodeClick = useCallback(
    (_: MouseEvent, node: { id: string }) => setSelected(node.id),
    [setSelected],
  )

  const defaultEdgeOptions = useMemo(() => ({ type: 'order' }), [])

  return {
    nodes,
    edges,
    isEmpty: nodes.length <= 1 && edges.length === 0,
    isDraggingOver,
    setFlow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDrop,
    onDragOver,
    onDragLeave,
    onPaneClick,
    onNodeClick,
    addSection,
    defaultEdgeOptions,
  }
}

function readPalettePosition(
  nodes: Array<ResumeNode>,
  addOffsetX: number,
  getPalettePosition: ResumeCanvasOptions['getPalettePosition'],
) {
  if (getPalettePosition) return getPalettePosition(nodes)

  const xs = nodes.map((node) => node.position.x)
  const ys = nodes.map((node) => node.position.y)
  const maxX = xs.length ? Math.max(...xs) : 0
  const minY = ys.length ? Math.min(...ys) : 80
  return { x: maxX + addOffsetX, y: minY + (nodes.length % 3) * 40 }
}
