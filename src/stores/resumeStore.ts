import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'

import type {
  NodeDataMap,
  NodeKind,
  Resume,
  ResumeNode,
  TemplateId,
  Theme,
} from './types'
import { createResumeNode, defaultDataFor, makeNewResume } from './factories'
import {
  applyGraphLink,
  edgeOrderIndex as readEdgeOrderIndex,
  readResumeGraph,
  removeGraphNode,
} from './resumeGraph'

type State = {
  theme: Theme
  resumes: Record<string, Resume>
  order: Array<string>
  selectedNodeId: string | null
  view: 'builder' | 'preview' | 'both'
  hasHydrated: boolean
  resumeInkOverride: string | null
  pickerPosition: { x: number; y: number } | null
}

type Actions = {
  setTheme: (t: Theme) => void
  setView: (v: State['view']) => void
  setSelectedNode: (id: string | null) => void
  setHasHydrated: (b: boolean) => void
  setResumeInk: (hex: string | null) => void
  setPickerPosition: (pos: { x: number; y: number } | null) => void

  createResume: (name?: string) => string
  deleteResume: (id: string) => void
  renameResume: (id: string, name: string) => void
  duplicateResume: (id: string) => string | null
  setTemplate: (id: string, t: TemplateId) => void

  applyNodeChanges: (id: string, changes: Array<NodeChange>) => void
  applyEdgeChanges: (id: string, changes: Array<EdgeChange>) => void
  connect: (id: string, conn: Connection) => void
  addNode: <K extends NodeKind>(id: string, kind: K, position: { x: number; y: number }) => string
  removeNode: (id: string, nodeId: string) => void
  updateNodeData: <K extends NodeKind>(id: string, nodeId: string, patch: Partial<NodeDataMap[K]>) => void
}

function buildSeedResume(name = 'Untitled Resume'): Resume {
  return makeNewResume(name)
}

const STORAGE_KEY = 'resumify.v1'

export const useResumeStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resumes: {},
      order: [],
      selectedNodeId: null,
      view: 'both',
      hasHydrated: false,
      resumeInkOverride: null,
      pickerPosition: null,

      setTheme: (t) => set({ theme: t }),
      setView: (v) => set({ view: v }),
      setSelectedNode: (id) => set({ selectedNodeId: id }),
      setHasHydrated: (b) => set({ hasHydrated: b }),
      setResumeInk: (hex) => set({ resumeInkOverride: hex }),
      setPickerPosition: (pos) => set({ pickerPosition: pos }),

      createResume: (name) => {
        const r = buildSeedResume(name ?? `Resume ${Object.keys(get().resumes).length + 1}`)
        set((s) => ({
          resumes: { ...s.resumes, [r.id]: r },
          order: [r.id, ...s.order],
        }))
        return r.id
      },

      deleteResume: (id) => {
        set((s) => {
          const { [id]: _, ...rest } = s.resumes
          return { resumes: rest, order: s.order.filter((x) => x !== id) }
        })
      },

      renameResume: (id, name) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          return {
            resumes: { ...s.resumes, [id]: { ...r, name, updatedAt: Date.now() } },
          }
        })
      },

      duplicateResume: (id) => {
        const src = get().resumes[id]
        if (!src) return null
        const newId = nanoid(8)
        const idMap = new Map<string, string>()
        const nodes = src.nodes.map((n) => {
          const newNodeId = `${n.type}-${nanoid(6)}`
          idMap.set(n.id, newNodeId)
          return { ...n, id: newNodeId } as ResumeNode
        })
        const edges = src.edges.map((e) => ({
          ...e,
          id: nanoid(8),
          source: idMap.get(e.source) ?? e.source,
          target: idMap.get(e.target) ?? e.target,
        }))
        const copy: Resume = {
          ...src,
          id: newId,
          name: `${src.name} (copy)`,
          nodes,
          edges,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          resumes: { ...s.resumes, [newId]: copy },
          order: [newId, ...s.order],
        }))
        return newId
      },

      setTemplate: (id, t) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          return { resumes: { ...s.resumes, [id]: { ...r, templateId: t, updatedAt: Date.now() } } }
        })
      },

      applyNodeChanges: (id, changes) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          const nodes = applyNodeChanges(changes, r.nodes) as Array<ResumeNode>
          if (sameNodes(nodes, r.nodes)) return s
          return {
            resumes: { ...s.resumes, [id]: { ...r, nodes, updatedAt: Date.now() } },
          }
        })
      },

      applyEdgeChanges: (id, changes) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          const edges = applyEdgeChanges(changes, r.edges)
          if (sameEdges(edges, r.edges)) return s
          return {
            resumes: { ...s.resumes, [id]: { ...r, edges, updatedAt: Date.now() } },
          }
        })
      },

      connect: (id, conn) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          if (!conn.source || !conn.target) return s
          const next = applyGraphLink(r, { source: conn.source, target: conn.target })
          return { resumes: { ...s.resumes, [id]: { ...next, updatedAt: Date.now() } } }
        })
      },

      addNode: (id, kind, position) => {
        const node = createResumeNode(kind, position) as unknown as ResumeNode
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          return {
            resumes: { ...s.resumes, [id]: { ...r, nodes: [...r.nodes, node], updatedAt: Date.now() } },
          }
        })
        return node.id
      },

      removeNode: (id, nodeId) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          const next = removeGraphNode(r, nodeId)
          return {
            resumes: { ...s.resumes, [id]: { ...next, updatedAt: Date.now() } },
            selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
          }
        })
      },

      updateNodeData: (id, nodeId, patch) => {
        set((s) => {
          const r = s.resumes[id]
          if (!r) return s
          const nodes = r.nodes.map((n) =>
            n.id === nodeId ? ({ ...n, data: { ...n.data, ...patch } } as ResumeNode) : n,
          )
          return {
            resumes: { ...s.resumes, [id]: { ...r, nodes, updatedAt: Date.now() } },
          }
        })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null
          const raw = window.localStorage.getItem(name)
          return raw ? JSON.parse(raw) : null
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return
          window.localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          window.localStorage.removeItem(name)
        },
      },
      partialize: (s) =>
        ({
          theme: s.theme,
          resumes: s.resumes,
          order: s.order,
          view: s.view,
          resumeInkOverride: s.resumeInkOverride,
          pickerPosition: s.pickerPosition,
        }) as State & Actions,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

// Helpers (selectors)
export function getResume(id: string | undefined): Resume | undefined {
  if (!id) return undefined
  return useResumeStore.getState().resumes[id]
}

export function selectOrderedNodes(resume: Resume): Array<ResumeNode> {
  return readResumeGraph(resume).orderedNodes
}

export function selectDisconnectedNodes(resume: Resume): Array<ResumeNode> {
  return readResumeGraph(resume).looseNodes
}

export function selectErrors(resume: Resume): Array<{ id: string; message: string }> {
  return readResumeGraph(resume).issues
}

// Convenience used by node components on add
export function emptyDataFor<K extends NodeKind>(kind: K) {
  return defaultDataFor(kind)
}

// Shallow-compare two nodes arrays element-wise on the fields React Flow may mutate.
// Returns true if the resulting array is functionally identical to `prev`.
function sameNodes(next: Array<ResumeNode>, prev: Array<ResumeNode>): boolean {
  if (next === prev) return true
  if (next.length !== prev.length) return false
  for (let i = 0; i < next.length; i++) {
    const a = next[i]
    const b = prev[i]
    if (a === b) continue
    if (a.id !== b.id) return false
    if (a.position?.x !== b.position?.x || a.position?.y !== b.position?.y) return false
    if ((a as { selected?: boolean }).selected !== (b as { selected?: boolean }).selected) return false
    if ((a as { dragging?: boolean }).dragging !== (b as { dragging?: boolean }).dragging) return false
    if (a.data !== b.data) return false
  }
  return true
}

function sameEdges(next: Array<Edge>, prev: Array<Edge>): boolean {
  if (next === prev) return true
  if (next.length !== prev.length) return false
  for (let i = 0; i < next.length; i++) {
    const a = next[i]
    const b = prev[i]
    if (a === b) continue
    if (a.id !== b.id) return false
    if (a.source !== b.source || a.target !== b.target) return false
    if ((a as { selected?: boolean }).selected !== (b as { selected?: boolean }).selected) return false
  }
  return true
}

// Used by edge labels to compute order index for an edge
export function edgeOrderIndex(resume: Resume, edge: Edge): number | null {
  return readEdgeOrderIndex(resume, edge)
}
