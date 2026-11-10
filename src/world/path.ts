// The walk is a gently winding line heading toward -z.
// Everything is positioned by `t` (0 = coffee stall, 1 = the lookout). Busy
// stretches of the story get more ground, so `t` maps to distance unevenly.
export const LENGTH = 300

/** [from t, to t, how many times more ground that stretch gets]. */
const STRETCH: [number, number, number][] = [
  [0.2, 0.28, 1.3], // campus
  [0.355, 0.455, 1.4], // the win and the hackathons
  [0.515, 0.61, 2.2], // the five KhaoGully booths
  [0.61, 0.668, 2.6], // the stack, the engine room and the cloud
  [0.668, 0.8, 1.6], // AI lab and more builds
]

/** Distance walked (in world units) when you reach `t`. */
export function dist(t: number) {
  let d = t
  for (const [a, b, k] of STRETCH) d += (k - 1) * (Math.min(Math.max(t, a), b) - a)
  return d * LENGTH
}

const KNOTS = [-1, ...STRETCH.flatMap(([a, b]) => [a, b]), 4]

/** Inverse of `dist`. */
export function tAt(d: number) {
  for (let i = 1; i < KNOTS.length; i++) {
    const a = KNOTS[i - 1], b = KNOTS[i]
    const da = dist(a), db = dist(b)
    if (d <= db || i === KNOTS.length - 1) return a + ((b - a) * (d - da)) / (db - da)
  }
  return 0
}

export const TOTAL = dist(1)

/** The `t` that is `units` further along the walk from `t`. */
export const ahead = (t: number, units: number) => tAt(dist(t) + units)

const fx = (z: number) => Math.sin(z * 0.03) * 6 + Math.sin(z * 0.0113 + 1) * 4

/** Point on the walk at `t` (0..1), shifted `side` units to the walker's right. */
export function place(t: number, side = 0) {
  const z = -dist(t)
  const dx = fx(z - 0.5) - fx(z + 0.5)
  const len = Math.hypot(dx, 1)
  const f = { x: dx / len, z: -1 / len }
  return { x: fx(z) - f.z * side, z: z + f.x * side, yaw: Math.atan2(f.x, f.z) }
}

export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return k * k * (3 - 2 * k)
}
