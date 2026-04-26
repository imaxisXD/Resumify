import { describe, expect, it } from 'vitest'
import {
  buildPalette,
  petalScreenPosition,
  CENTER_SIZE,
  RING_COUNTS,
  RING_PETAL_SIZES,
  RING_RADII,
} from './colorPickerPalette'

describe('color picker palette', () => {
  it('produces 12+6 ring petals plus a white center', () => {
    const petals = buildPalette()
    expect(petals).toHaveLength(12 + 6 + 1)
    const ringTotals = RING_COUNTS.map((_, ring) =>
      petals.filter((p) => p.ring === ring).length,
    )
    expect(ringTotals).toEqual([12, 6])
    const center = petals.find((p) => p.id === 'center')!
    expect(center.hex).toBe('#ffffff')
    expect(center.size).toBe(CENTER_SIZE)
  })

  it('every petal has a valid 7-char hex string', () => {
    const petals = buildPalette()
    for (const p of petals) {
      expect(p.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('outer ring is more saturated than inner ring', () => {
    const petals = buildPalette()
    const minChannel = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return Math.min(r, g, b)
    }
    const outer = petals.filter((p) => p.ring === 0)
    const inner = petals.filter((p) => p.ring === 1)
    const outerAvg = outer.reduce((a, p) => a + minChannel(p.hex), 0) / outer.length
    const innerAvg = inner.reduce((a, p) => a + minChannel(p.hex), 0) / inner.length
    expect(innerAvg).toBeGreaterThan(outerAvg)
  })

  it('petal screen positions land on the expected radius from the center', () => {
    const petals = buildPalette()
    const cx = 140
    const cy = 140
    for (const p of petals) {
      const pos = petalScreenPosition(p, cx, cy)
      const d = Math.hypot(pos.x - cx, pos.y - cy)
      expect(Math.abs(d - p.radius)).toBeLessThan(0.001)
    }
  })

  it('all petals stay within the wheel boundary (140px radius)', () => {
    const petals = buildPalette()
    for (const p of petals) {
      expect(p.radius + p.size / 2).toBeLessThanOrEqual(140)
    }
  })

  it('outer-ring petals overlap each other (size > arc gap)', () => {
    for (let ring = 0; ring < RING_COUNTS.length; ring++) {
      const count = RING_COUNTS[ring]
      const radius = RING_RADII[ring]
      const size = RING_PETAL_SIZES[ring]
      const arcDist = 2 * radius * Math.sin(Math.PI / count)
      expect(size).toBeGreaterThan(arcDist)
    }
  })

  it('adjacent rings overlap (petal radii sum exceeds ring-to-ring distance)', () => {
    for (let ring = 0; ring < RING_COUNTS.length - 1; ring++) {
      const dist = RING_RADII[ring] - RING_RADII[ring + 1]
      const sumRadii = RING_PETAL_SIZES[ring] / 2 + RING_PETAL_SIZES[ring + 1] / 2
      expect(sumRadii).toBeGreaterThan(dist)
    }
  })

  it('is deterministic across calls', () => {
    expect(buildPalette()).toEqual(buildPalette())
  })
})
