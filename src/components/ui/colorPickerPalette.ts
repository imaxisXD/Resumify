export type Petal = {
  id: string
  ring: number
  index: number
  angle: number
  radius: number
  size: number
  hex: string
}

export type Sizing = {
  diameter: number
  ringCounts: readonly [number, number]
  ringRadii: readonly [number, number]
  ringPetalSizes: readonly [number, number]
  centerSize: number
  bloomSigma: number
  dockWidth: number
  dockHeight: number
  dockGap: number
  iconSize: number
}

const LG: Sizing = {
  diameter: 280,
  ringCounts: [12, 6],
  ringRadii: [86, 38],
  ringPetalSizes: [78, 66],
  centerSize: 52,
  bloomSigma: 90,
  dockWidth: 132,
  dockHeight: 40,
  dockGap: 14,
  iconSize: 14,
}

const MD: Sizing = {
  diameter: 200,
  ringCounts: [12, 6],
  ringRadii: [62, 27],
  ringPetalSizes: [56, 48],
  centerSize: 38,
  bloomSigma: 64,
  dockWidth: 116,
  dockHeight: 36,
  dockGap: 12,
  iconSize: 12,
}

const SM: Sizing = {
  diameter: 144,
  ringCounts: [12, 6],
  ringRadii: [44, 20],
  ringPetalSizes: [40, 34],
  centerSize: 28,
  bloomSigma: 46,
  dockWidth: 96,
  dockHeight: 30,
  dockGap: 10,
  iconSize: 11,
}

export const SIZINGS = { sm: SM, md: MD, lg: LG } as const
export type SizeKey = keyof typeof SIZINGS

export const RING_COUNTS = LG.ringCounts
export const RING_RADII = LG.ringRadii
export const RING_PETAL_SIZES = LG.ringPetalSizes
export const CENTER_SIZE = LG.centerSize

const HUE_OFFSET_DEG = -90

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number) => {
    const c = ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function paletteForRing(ring: number): { s: number; l: number } {
  switch (ring) {
    case 0:
      return { s: 92, l: 60 }
    case 1:
      return { s: 60, l: 80 }
    default:
      return { s: 100, l: 100 }
  }
}

export function buildPalette(sizing: Sizing = LG): Array<Petal> {
  const petals: Array<Petal> = []

  for (let ring = 0; ring < sizing.ringCounts.length; ring++) {
    const count = sizing.ringCounts[ring]
    const radius = sizing.ringRadii[ring]
    const size = sizing.ringPetalSizes[ring]
    const { s, l } = paletteForRing(ring)
    const offsetDeg = ring % 2 === 1 ? 180 / count : 0

    for (let i = 0; i < count; i++) {
      const hue = (360 / count) * i + offsetDeg
      const angle = hue + HUE_OFFSET_DEG
      const hex = hslToHex(hue, s, l)
      petals.push({
        id: `r${ring}-i${i}`,
        ring,
        index: i,
        angle,
        radius,
        size,
        hex,
      })
    }
  }

  petals.push({
    id: 'center',
    ring: 2,
    index: 0,
    angle: 0,
    radius: 0,
    size: sizing.centerSize,
    hex: '#ffffff',
  })

  return petals
}

export function petalScreenPosition(
  petal: Petal,
  centerX: number,
  centerY: number,
): { x: number; y: number } {
  const rad = (petal.angle * Math.PI) / 180
  return {
    x: centerX + Math.cos(rad) * petal.radius,
    y: centerY + Math.sin(rad) * petal.radius,
  }
}
