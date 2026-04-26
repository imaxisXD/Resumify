import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Droplet, RotateCcw, Triangle } from 'lucide-react'
import { useResumeStore } from '../../stores/resumeStore'
import {
  buildPalette,
  petalScreenPosition,
  SIZINGS,
  type Petal,
  type SizeKey,
} from './colorPickerPalette'

const DEFAULT_INSET = 24

const BLOOM_BOOST_NEAR = 0.18
const BLOOM_DIP_FAR = 0.06
const BLOOM_LERP = 0.22
const BLOOM_REST_EPSILON = 0.001

type FrameHandle = { cancel: () => void }

function scheduleFrame(cb: () => void): FrameHandle {
  if (typeof window === 'undefined') return { cancel: () => {} }
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    const id = window.requestAnimationFrame(cb)
    return { cancel: () => window.cancelAnimationFrame(id) }
  }
  const id = window.setTimeout(cb, 16)
  return { cancel: () => window.clearTimeout(id) }
}

export function ColorPickerDock({ size = 'lg' }: { size?: SizeKey } = {}) {
  const setResumeInk = useResumeStore((s) => s.setResumeInk)
  const inkOverride = useResumeStore((s) => s.resumeInkOverride)
  const persistedPosition = useResumeStore((s) => s.pickerPosition)
  const setPickerPosition = useResumeStore((s) => s.setPickerPosition)

  const sizing = SIZINGS[size]
  const wheelDiameter = sizing.diameter
  const wheelRadius = wheelDiameter / 2
  const palette = useMemo(() => buildPalette(sizing), [sizing])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const wheelRef = useRef<HTMLDivElement | null>(null)
  const petalRefs = useRef<Array<HTMLButtonElement | null>>([])
  const targetScales = useRef<Array<number>>(palette.map(() => 1))
  const currentScales = useRef<Array<number>>(palette.map(() => 1))
  const rafRef = useRef<FrameHandle | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(persistedPosition)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  const tick = useCallback(() => {
    const targets = targetScales.current
    const currents = currentScales.current
    let moved = false
    for (let i = 0; i < palette.length; i++) {
      const prev = currents[i]
      const next = prev + (targets[i] - prev) * BLOOM_LERP
      if (Math.abs(next - prev) > BLOOM_REST_EPSILON) moved = true
      currents[i] = next
      const el = petalRefs.current[i]
      if (el) el.style.transform = `scale(${next.toFixed(3)})`
    }
    if (moved) {
      rafRef.current = scheduleFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [palette])

  const ensureRaf = useCallback(() => {
    if (rafRef.current == null) rafRef.current = scheduleFrame(tick)
  }, [tick])

  const onWheelMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const wheel = wheelRef.current
      if (!wheel) return
      const rect = wheel.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const px = e.clientX
      const py = e.clientY
      const sigma = sizing.bloomSigma
      const distFromCenter = Math.hypot(px - cx, py - cy)
      if (distFromCenter > wheelRadius + 14) {
        for (let i = 0; i < palette.length; i++) targetScales.current[i] = 1
        ensureRaf()
        return
      }
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i]
        const pos = petalScreenPosition(p, cx, cy)
        const d = Math.hypot(px - pos.x, py - pos.y)
        const proximity = Math.exp(-(d * d) / (sigma * sigma))
        const boost = BLOOM_BOOST_NEAR * proximity
        const dip = BLOOM_DIP_FAR * (1 - proximity)
        targetScales.current[i] = 1 + boost - dip
      }
      ensureRaf()
    },
    [palette, ensureRaf, sizing.bloomSigma, wheelRadius],
  )

  const onWheelLeave = useCallback(() => {
    for (let i = 0; i < palette.length; i++) targetScales.current[i] = 1
    ensureRaf()
  }, [palette, ensureRaf])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        rafRef.current.cancel()
        rafRef.current = null
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (position) return
    if (typeof window === 'undefined') return
    setPosition({
      x: window.innerWidth - wheelDiameter - DEFAULT_INSET - 24,
      y: window.innerHeight - wheelDiameter - DEFAULT_INSET - 96,
    })
  }, [position])

  const onPetalClick = useCallback(
    (petal: Petal) => {
      if (petal.id === 'center') {
        setResumeInk(null)
      } else {
        setResumeInk(petal.hex)
      }
    },
    [setResumeInk],
  )

  const onDockPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      dragRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      }
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    },
    [],
  )

  const onDockPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const next = {
      x: e.clientX - dragRef.current.offsetX,
      y: e.clientY - dragRef.current.offsetY,
    }
    setPosition({
      x: Math.max(8, Math.min(window.innerWidth - wheelDiameter - 8, next.x)),
      y: Math.max(8, Math.min(window.innerHeight - wheelDiameter - 96, next.y)),
    })
  }, [])

  const onDockPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return
      dragRef.current = null
      ;(e.target as Element).releasePointerCapture?.(e.pointerId)
      if (position) setPickerPosition(position)
    },
    [position, setPickerPosition],
  )

  const selectedHex = inkOverride ?? null
  const hoveredPetal = palette.find((p) => p.id === hoveredId) ?? null
  const wheelGlowHex = hoveredPetal && hoveredPetal.id !== 'center' ? hoveredPetal.hex : null

  if (!position) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 60,
        width: wheelDiameter,
        userSelect: 'none',
        animation: 'fade-in 280ms var(--ease-out) both',
      }}
      aria-label="Resume text color picker"
      role="group"
    >
      <div
        style={{
          position: 'relative',
          width: wheelDiameter + 8,
          height: wheelDiameter + 8,
          borderRadius: '50%',
          padding: 4,
          background:
            'conic-gradient(from 0deg, #ff5d6c, #ff8a3d, #ffd84a, #8fe26b, #4ad7c0, #4aa9ff, #6e6cff, #b75dff, #ff5db4, #ff5d6c)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px -30px rgba(0,0,0,0.7), 0 14px 32px -16px rgba(0,0,0,0.55), 0 0 60px -10px rgba(255, 100, 220, 0.35)',
          filter: 'saturate(1.1)',
          marginLeft: -4,
        }}
      >
        <div
          ref={wheelRef}
          onMouseMove={onWheelMove}
          onMouseLeave={onWheelLeave}
          style={{
            position: 'relative',
            width: wheelDiameter,
            height: wheelDiameter,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 50% 45%, rgba(28,28,32,0.97) 0%, rgba(12,12,16,0.99) 75%, rgba(6,6,10,1) 100%)',
            boxShadow: wheelGlowHex
              ? `inset 0 0 28px ${wheelGlowHex}33, inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 0 24px rgba(0,0,0,0.55), 0 0 32px 4px ${wheelGlowHex}55`
              : 'inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 24px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            overflow: 'hidden',
            transition: 'box-shadow 260ms var(--ease-out)',
          }}
        >

        {palette.map((petal, i) => {
          const center = wheelRadius
          const pos = petalScreenPosition(petal, center, center)
          const isCenter = petal.id === 'center'
          const isHovered = hoveredId === petal.id
          const isSelected = isCenter
            ? selectedHex === null
            : selectedHex?.toLowerCase() === petal.hex.toLowerCase()
          return (
            <button
              key={petal.id}
              type="button"
              ref={(el) => {
                petalRefs.current[i] = el
              }}
              onClick={() => onPetalClick(petal)}
              onMouseEnter={() => setHoveredId(petal.id)}
              onMouseLeave={() => setHoveredId((cur) => (cur === petal.id ? null : cur))}
              aria-label={isCenter ? 'Reset to theme default' : `Pick color ${petal.hex}`}
              aria-pressed={isSelected}
              style={{
                position: 'absolute',
                left: pos.x - petal.size / 2,
                top: pos.y - petal.size / 2,
                width: petal.size,
                height: petal.size,
                borderRadius: '50%',
                background: petal.hex,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transformOrigin: '50% 50%',
                willChange: 'transform',
                transition: 'box-shadow 200ms var(--ease-out)',
                boxShadow: isSelected
                  ? `0 0 0 2.5px #ffffff, 0 0 0 4px rgba(0,0,0,0.55)`
                  : isHovered
                    ? `0 0 0 1.25px rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.18)`
                    : isCenter
                      ? '0 4px 12px -4px rgba(255,255,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.35)'
                      : `inset 0 0 0 1px rgba(255,255,255,0.14)`,
                zIndex: isCenter ? 22 : 10 + petal.ring,
              }}
            />
          )
        })}
        </div>
      </div>

      <div
        onPointerDown={onDockPointerDown}
        onPointerMove={onDockPointerMove}
        onPointerUp={onDockPointerUp}
        onPointerCancel={onDockPointerUp}
        style={{
          margin: `${sizing.dockGap}px auto 0`,
          width: sizing.dockWidth,
          height: sizing.dockHeight,
          borderRadius: 999,
          background: 'rgba(20, 20, 25, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 14px 32px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          cursor: 'grab',
          touchAction: 'none',
        }}
        aria-label="Color picker actions (drag to move)"
        role="toolbar"
      >
        <DockButton
          label="Reset to theme"
          onClick={() => setResumeInk(null)}
          active={!inkOverride}
          buttonSize={sizing.dockHeight - 8}
        >
          <RotateCcw size={sizing.iconSize} />
        </DockButton>
        <DockButton label="Eyedropper (soon)" buttonSize={sizing.dockHeight - 8}>
          <Droplet size={sizing.iconSize} />
        </DockButton>
        <DockButton label="Palette mode (soon)" buttonSize={sizing.dockHeight - 8}>
          <Triangle size={sizing.iconSize - 1} />
        </DockButton>
      </div>
    </div>
  )
}

function DockButton({
  children,
  label,
  onClick,
  active,
  buttonSize = 32,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  buttonSize?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 200ms var(--ease-out), color 200ms var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.95)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        if (active) return
        ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
