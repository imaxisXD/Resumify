# Refactor Issue Drafts

These drafts could not be opened as GitHub issues from this folder because it is not a Git repo. `gh` needs a repo to target.

Shared note for all issues: `npm test` starts Vitest, then fails before tests run with `TypeError: require_react is not a function`. Fix that before adding the new tests below.

## 1. Move Resume Graph Rules Into One Plain Helper

## Problem

The resume graph rules are split across the store, canvas, preview, error checks, and edge labels.

- `resumeStore.ts` joins nodes, reads order, finds loose nodes, and finds errors.
- `ResumeCanvas.tsx` sends join actions into the store.
- `OrderEdge.tsx` asks the store how to number an edge.
- Preview code also depends on the same order rule.

The shared rule is simple: the resume starts from the `personal` node, and linked nodes form the print order. Today, a change to that rule can break one screen while another still looks fine.

## Public Calls

```ts
type GraphLink = { source: string; target: string }
type GraphIssue = { nodeId: string; message: string }
type ResumeGraph = {
  orderedNodes: Array<ResumeNode>
  looseNodes: Array<ResumeNode>
  issues: Array<GraphIssue>
  edgeNumberById: Record<string, number>
}

readResumeGraph(resume: Resume): ResumeGraph
applyGraphLink(resume: Resume, link: GraphLink): Resume
removeGraphNode(resume: Resume, nodeId: string): Resume
```

Caller example:

```ts
const graph = readResumeGraph(resume)
const nextResume = applyGraphLink(resume, { source, target })
```

## Outside Needs

This is in memory only. It needs `Resume`, `ResumeNode`, and edge data.

## Tests

New tests:

- reads order from `personal`
- stops on missing nodes
- stops on loops
- reports loose nodes
- replaces old outgoing and incoming links on join
- removes node links when a node is deleted
- gives stable edge numbers

Old tests to avoid:

- small tests for store selectors that repeat the same graph checks
- UI tests that only prove graph math

## Build Notes

The store should call this helper and save the returned resume. UI code should read `readResumeGraph` results instead of reading raw edges when it needs order, loose nodes, issues, or edge numbers.

## 2. Put Resume Section Setup In One Place

## Problem

Adding one resume section touches too many files:

- data types
- default data
- node creation
- section labels
- palette order
- canvas node map
- inspector form map
- preview switch blocks

This makes new sections risky. A missed edit can make a section appear in one place but fail in another.

## Public Calls

```ts
type SectionInfo = {
  kind: NodeKind
  label: string
  hint: string
  canDelete: boolean
  canAddFromPalette: boolean
}

getSectionList(): Array<SectionInfo>
makeSectionNode(kind: NodeKind, position: { x: number; y: number }): ResumeNode
makeNewResume(name?: string): Resume
```

Caller example:

```ts
const sections = getSectionList()
const node = makeSectionNode('experience', { x: 320, y: 80 })
```

## Outside Needs

This is in memory only. It needs `nanoid` and the resume data types. Keep icons and colors in UI files so plain data code does not import React.

## Tests

New tests:

- every section has default data
- every section has a label and hint
- only `personal` is not deletable
- palette sections do not include `personal`
- made nodes have the right type, data, id, and delete rule

Old tests to avoid:

- separate label checks in palette, inspector, and canvas
- tests that repeat the same default data rules in many places

## Build Notes

Keep one plain section list for data rules. UI maps can add icons, colors, and visual details on top.

## 3. Build Preview Data Before Rendering Templates

## Problem

Preview templates receive raw canvas nodes. Each template has to find the personal node, skip empty sections, and switch on every section type.

That means the base preview and v1/v2/v3 previews repeat the same data work before doing their own visual work.

## Public Calls

```ts
type PreviewResume = {
  personal: PersonalData | null
  sections: Array<PreviewSection>
}

type PreviewSection =
  | { kind: 'summary'; title: string; data: SummaryData }
  | { kind: 'experience'; title: string; data: ExperienceData }
  | { kind: 'education'; title: string; data: EducationData }
  | { kind: 'skills'; title: string; data: SkillsData }
  | { kind: 'projects'; title: string; data: ProjectsData }
  | { kind: 'custom'; title: string; data: CustomData }

buildPreviewResume(resume: Resume): PreviewResume
```

Caller example:

```tsx
const preview = buildPreviewResume(resume)
return <ClassicTemplate preview={preview} />
```

## Outside Needs

This is in memory only. It should use the graph helper and section setup.

## Tests

New tests:

- personal data is moved to `personal`
- loose nodes do not render
- sections keep graph order
- empty sections are skipped or kept by the chosen rule
- custom section uses its custom title

Old tests to avoid:

- template tests that build full canvas nodes just to prove order
- duplicate preview data checks in each visual version

## Build Notes

Templates should own layout and style only. They should not need to know how graph edges become print order.

## 4. Share Canvas Behavior Across Base, V1, V2, And V3

## Problem

The base canvas and the three visual canvases repeat the same behavior:

- read nodes and edges
- move nodes
- change edges
- join nodes
- drop a new section
- add from palette
- select and clear selection

Only the look changes.

## Public Calls

```ts
type CanvasSetup = {
  nodeTypes: NodeTypes
  edgeTypes: EdgeTypes
  edgeAnimated: boolean
  addOffsetX: number
}

useResumeCanvas(resumeId: string, setup: CanvasSetup): {
  nodes: Array<ResumeNode>
  edges: Array<Edge>
  reactFlowProps: object
  dropProps: object
  addSection: (kind: NodeKind) => void
  setFlow: (flow: ReactFlowInstance) => void
}
```

Caller example:

```tsx
const canvas = useResumeCanvas(resumeId, setup)

return (
  <div {...canvas.dropProps}>
    <ReactFlow {...canvas.reactFlowProps} onInit={canvas.setFlow} />
    <Palette onAdd={canvas.addSection} />
  </div>
)
```

## Outside Needs

This is UI code. It needs React Flow, the resume store, and the drag data key. Each visual version still owns its node cards, edge look, palette look, background, and controls.

## Tests

New tests:

- add from palette chooses the right position
- drop uses the canvas point from React Flow
- node click selects
- canvas click clears
- connect calls the graph/store path once

Old tests to avoid:

- separate add/drop tests for base, v1, v2, and v3

## Build Notes

Keep the hook small. If a visual version needs special behavior later, add a small option instead of forking the whole canvas again.

## 5. Move Inspector List Edits Out Of Forms

## Problem

Forms repeat list update work by hand:

- add item
- update item
- remove item
- replace list after sort
- commit tags
- update nested bullets

This is now spread across experience, education, skills, projects, and custom forms.

## Public Calls

```ts
type ListItem = { id: string }

type ListEdit<T extends ListItem> = {
  items: Array<T>
  add: () => void
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
  replace: (next: Array<T>) => void
}

useNodeListField<K extends NodeKind, T extends ListItem>(
  resumeId: string,
  node: ResumeNode<K>,
  field: string,
  makeItem: () => T,
): ListEdit<T>

updateList<T extends ListItem>(
  items: Array<T>,
  change:
    | { type: 'update'; id: string; patch: Partial<T> }
    | { type: 'remove'; id: string }
    | { type: 'replace'; items: Array<T> },
): Array<T>
```

Caller example:

```tsx
const roles = useNodeListField(resumeId, node, 'items', makeEmptyExperienceItem)

<Button onClick={roles.add}>Add role</Button>
<SortableList items={roles.items} onChange={roles.replace} onRemove={roles.remove} />
```

## Outside Needs

This is in memory plus the resume store. It needs `updateNodeData` and small item makers like `makeEmptyExperienceItem`.

## Tests

New tests:

- add creates an item with an id
- update changes only the matching item
- remove deletes the matching item
- replace keeps the given order
- tag helper trims and ignores empty input
- nested bullet helper changes only the selected role

Old tests to avoid:

- separate form tests that only prove array copy code

## Build Notes

Forms should still own their fields and layout. The shared code should only own list changes.

