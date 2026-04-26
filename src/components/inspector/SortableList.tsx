import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function SortableList<T extends { id: string }>({
  items,
  onChange,
  renderItem,
  onRemove,
  emptyHint,
}: {
  items: Array<T>
  onChange: (next: Array<T>) => void
  renderItem: (item: T, index: number) => ReactNode
  onRemove?: (id: string) => void
  emptyHint?: string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onChange(arrayMove(items, oldIndex, newIndex))
  }

  if (items.length === 0 && emptyHint) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] px-3 py-3 text-[12px] text-[var(--text-faint)] text-center">
        {emptyHint}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => (
            <SortableRow key={item.id} id={item.id} onRemove={onRemove ? () => onRemove(item.id) : undefined}>
              {renderItem(item, idx)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({
  id,
  onRemove,
  children,
}: {
  id: string
  onRemove?: () => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 transition-[box-shadow,border-color,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] animate-fade-up',
        isDragging
          ? 'shadow-2xl shadow-black/40 z-10 border-[var(--accent-hi)]/40 bg-[var(--surface)]'
          : 'hover:border-[var(--border-strong)]',
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="shrink-0 w-10 cursor-grab active:cursor-grabbing flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)] border-r border-[var(--border)] transition-[background,color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0 p-3">{children}</div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="shrink-0 w-10 flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] border-l border-[var(--border)] transition-[background,color,transform] ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.92] active:duration-100 duration-200"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
    </div>
  )
}
