import { useResumeStore } from '../../stores/resumeStore'
import type { SectionDataMap, SectionKind, ResumeSection } from '../../stores/types'

export type ListItem = { id: string }

export type ListChange<T extends ListItem> =
  | { type: 'update'; id: string; patch: Partial<T> }
  | { type: 'remove'; id: string }
  | { type: 'replace'; items: Array<T> }

export type ListEdit<T extends ListItem> = {
  items: Array<T>
  add: (patch?: Partial<T>) => void
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
  replace: (next: Array<T>) => void
}

export function updateList<T extends ListItem>(
  items: Array<T>,
  change: ListChange<T>,
): Array<T> {
  switch (change.type) {
    case 'update':
      return items.map((item) => (item.id === change.id ? { ...item, ...change.patch } : item))
    case 'remove':
      return items.filter((item) => item.id !== change.id)
    case 'replace':
      return change.items
  }
}

export function useSectionListField<K extends SectionKind, T extends ListItem>({
  resumeId,
  section,
  field,
  makeItem,
}: {
  resumeId: string
  section: ResumeSection<K>
  field: keyof SectionDataMap[K] & string
  makeItem: () => T
}): ListEdit<T> {
  const updateSectionData = useResumeStore((s) => s.updateSectionData)
  const data = section.data as Record<string, unknown>
  const items = (Array.isArray(data[field]) ? data[field] : []) as Array<T>

  const replace = (next: Array<T>) => {
    updateSectionData<K>(resumeId, section.id, { [field]: next } as Partial<SectionDataMap[K]>)
  }

  return {
    items,
    add: (patch = {}) => replace([...items, { ...makeItem(), ...patch }]),
    update: (id, patch) => replace(updateList(items, { type: 'update', id, patch })),
    remove: (id) => replace(updateList(items, { type: 'remove', id })),
    replace,
  }
}

