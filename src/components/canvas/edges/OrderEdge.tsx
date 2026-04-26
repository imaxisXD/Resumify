import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { useResumeStore, edgeOrderIndex } from '../../../stores/resumeStore'
import { useParams } from '@tanstack/react-router'

export function OrderEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, id } = props
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.32,
  })

  const params = useParams({ strict: false }) as { resumeId?: string }
  const order = useResumeStore((s) => {
    const r = s.resumes[params.resumeId ?? '']
    if (!r) return null
    const edge = r.edges.find((e) => e.id === id)
    if (!edge) return null
    return edgeOrderIndex(r, edge)
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? 'var(--accent)' : 'var(--border-strong)',
          strokeWidth: selected ? 1.6 : 1.25,
          strokeDasharray: '5 5',
          animation: 'dash-flow 800ms linear infinite',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="select-none"
        >
          <div
            className={
              'inline-flex h-6 min-w-[28px] items-center justify-center rounded-full border px-2 font-mono text-[10.5px] tracking-wider backdrop-blur-sm transition-colors ' +
              (selected
                ? 'bg-[var(--accent-soft)] border-[var(--accent-hi)]/50 text-[var(--accent-hi)]'
                : 'bg-[var(--surface)] border-[var(--border-strong)] text-[var(--text-muted)]')
            }
          >
            {order != null ? String(order).padStart(2, '0') : '—'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
