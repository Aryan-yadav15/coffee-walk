// Storybook nature on the green stretches: pines, grass clumps, toadstools, flowering bushes and ferns.
import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { toon } from './kit'
import { dist, place, rng, tAt } from './path'

/* ---------- multi-coloured geometry, so one instanced mesh can be a whole plant ---------- */

/** Paints a geometry one colour, or a vertical gradient from `c` at the bottom to `top`. */
function paint(g: THREE.BufferGeometry, c: string, top?: string) {
  g = g.index ? g.toNonIndexed() : g
  const a = new THREE.Color(c), b = new THREE.Color(top ?? c), k = new THREE.Color()
  g.computeBoundingBox()
  const { min, max } = g.boundingBox!
  const p = g.attributes.position
  const col = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) k.lerpColors(a, b, (p.getY(i) - min.y) / (max.y - min.y || 1)).toArray(col, i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.deleteAttribute('uv')
  return g
}

const moved = (g: THREE.BufferGeometry, p: [number, number, number], r: [number, number, number] = [0, 0, 0], s: number | [number, number, number] = 1) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...p),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),
    typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s),
  )
  return g.applyMatrix4(m)
}

const PINE = (() => {
  const tiers: [number, number, number, string, string][] = [
    [1.15, 1.5, 1.35, '#2f6b4a', '#4f9a5c'],
    [0.9, 1.3, 2.15, '#3a7d50', '#5fae63'],
    [0.6, 1.1, 2.85, '#468c56', '#79c070'],
  ]
  return mergeGeometries([
    paint(moved(new THREE.CylinderGeometry(0.11, 0.16, 1, 8), [0, 0.5, 0]), '#7a4b30'),
    ...tiers.map(([r, h, y, c, top]) => paint(moved(new THREE.ConeGeometry(r, h, 11, 1), [0, y, 0]), c, top)),
  ])
})()

const TOADSTOOL = (() => {
  const spots = [[0.2, 0.62, 0.12], [-0.16, 0.66, 0.14], [0.02, 0.72, -0.18], [-0.05, 0.6, 0.27], [0.24, 0.58, -0.12]]
  return mergeGeometries([
    paint(moved(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 10), [0, 0.25, 0]), '#efe4cf', '#fff8ec'),
    paint(moved(new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), [0, 0.46, 0], [0, 0, 0], [1, 0.75, 1]), '#c8402f', '#e8553f'),
    ...spots.map((p) => paint(moved(new THREE.SphereGeometry(0.05, 8, 6), p as [number, number, number], [0, 0, 0], [1, 0.5, 1]), '#fff8ec')),
  ])
})()

const GRASS = (() => {
  const blades = [[0, 0, 0.5], [0.1, 0.5, 0.42], [-0.1, -0.5, 0.44], [0.04, 2.3, 0.36], [-0.06, 3.9, 0.4]]
  return mergeGeometries(
    blades.map(([x, a, h]) => {
      const g = new THREE.ConeGeometry(0.11, h, 4, 1)
      g.translate(0, h / 2, 0)
      return paint(moved(g, [x, 0, 0], [0.3, a, 0.0]), '#6aa84f', '#cdea8c')
    }),
  )
})()

const BUSH = (() => {
  const blobs: [number, number, number, number][] = [[0, 0.42, 0, 0.55], [0.48, 0.32, 0.12, 0.4], [-0.45, 0.34, 0.08, 0.42], [0.1, 0.36, 0.42, 0.36]]
  const flowers = [[0.25, 0.85, 0.25], [-0.3, 0.72, 0.3], [0.55, 0.6, 0.3], [-0.05, 0.92, -0.1], [-0.6, 0.55, 0.2], [0.2, 0.62, 0.6]]
  return mergeGeometries([
    ...blobs.map(([x, y, z, r]) => paint(moved(new THREE.IcosahedronGeometry(r, 2), [x, y, z]), '#3f7d48', '#6db35f')),
    ...flowers.map((p) => paint(moved(new THREE.IcosahedronGeometry(0.07, 1), p as [number, number, number]), '#ffffff')),
  ])
})()

const FERN = (() => {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const g = new THREE.SphereGeometry(0.5, 8, 4)
    g.scale(0.26, 0.14, 0.7)
    g.translate(0, 0.12, 0.55)
    return paint(moved(g, [0, 0, 0], [-0.35, (i / 7) * Math.PI * 2, 0]), '#3d7a42', '#78b75e')
  })
  return mergeGeometries(leaves)
})()

// A street tree in a terracotta pot, for the city stretch.
const PLANTER = (() => {
  const crown: [number, number, number, number][] = [[0, 2.2, 0, 0.85], [0.45, 1.95, 0.2, 0.6], [-0.42, 2.0, -0.1, 0.62], [0.05, 2.75, 0.05, 0.6]]
  return mergeGeometries([
    paint(moved(new THREE.CylinderGeometry(0.62, 0.48, 0.7, 14), [0, 0.35, 0]), '#b4573a', '#d9774f'),
    paint(moved(new THREE.CylinderGeometry(0.66, 0.66, 0.1, 14), [0, 0.72, 0]), '#e08a5e'),
    paint(moved(new THREE.CylinderGeometry(0.08, 0.11, 1.4, 6), [0, 1.3, 0]), '#7a4b30'),
    ...crown.map(([x, y, z, r]) => paint(moved(new THREE.IcosahedronGeometry(r, 2), [x, y, z]), '#3f8a4d', '#79c070')),
  ])
})()

const plantMat = toon({ vertexColors: true })

/* ---------- placement ---------- */

// Buildings, booths and scenes that plants must stay out of: [t, side, radius].
const KEEP_OUT: [number, number, number][] = [
  [0.014, -4.4, 4], [0.15, -8.5, 6], [0.142, -3.3, 3], [0.222, -14, 9], [0.25, -27, 10], [0.252, -6, 6], [0.264, 6.8, 7],
  [0.27, -15, 8], [0.306, -7.5, 7], [0.338, -3.6, 3], [0.373, -7, 7], [0.4, -5.6, 5], [0.42, -5.6, 5], [0.428, -10.5, 6],
  [0.995, 3.3, 3], [1.004, -2.7, 4], [1.02, 2.6, 3], [1.024, -1.9, 3],
]
const keepOut = KEEP_OUT.map(([t, side, r]) => ({ ...place(t, side), r }))
const clear = (x: number, z: number, pad = 0) => keepOut.every((k) => Math.hypot(k.x - x, k.z - z) > k.r + pad)

/** A spot on the green: most of the walk until the city, and the park at the end. */
function greenSpot(r: () => number, near: number, far: number, pad = 0) {
  for (;;) {
    const t = r() < 0.86 ? -0.07 + r() * 0.51 : 0.905 + r() * 0.15
    const side = (r() < 0.5 ? -1 : 1) * (near + r() * r() * (far - near))
    const { x, z } = place(t, side)
    // the opening view is a tidy lawn: a little grass near the start, nothing taller
    if (t < 0.045 && Math.abs(side) < 26 && (pad > 0 || r() < 0.75)) continue
    if (clear(x, z, pad)) return { x, z }
  }
}

type Inst = { x: number; z: number; s: number; r: number; tint: string; sy?: number }

function Instances({ geo, list, shadow = true }: { geo: THREE.BufferGeometry; list: Inst[]; shadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color()
    list.forEach((it, i) => {
      o.position.set(it.x, 0, it.z)
      o.rotation.set(0, it.r, 0)
      o.scale.set(it.s, it.s * (it.sy ?? 1), it.s)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
      ref.current.setColorAt(i, c.set(it.tint))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor!.needsUpdate = true
  }, [list])
  return <instancedMesh ref={ref} args={[geo, plantMat, list.length]} castShadow={shadow} receiveShadow frustumCulled={false} />
}

const TINTS = ['#ffffff', '#f2f7e4', '#e4f0ff', '#fff3df']

export function Foliage({ lite = false }: { lite?: boolean }) {
  const sets = useMemo(() => {
    const r = rng(314)
    const k = lite ? 0.5 : 1
    const make = (n: number, near: number, far: number, pad: number, size: () => number, sy?: () => number) =>
      Array.from({ length: Math.round(n * k) }, () => ({
        ...greenSpot(r, near, far, pad), s: size(), r: r() * 6.28, tint: TINTS[Math.floor(r() * TINTS.length)], sy: sy?.(),
      }))
    // pines come in little groves
    const pines: Inst[] = []
    for (let g = 0; g < 46 * k; g++) {
      const c = greenSpot(r, 12, 70, 3)
      const n = 2 + Math.floor(r() * 4)
      for (let i = 0; i < n; i++) {
        const x = c.x + (r() - 0.5) * 7, z = c.z + (r() - 0.5) * 7
        if (clear(x, z, 2)) pines.push({ x, z, s: 1.1 + r() * 1.3, sy: 1 + r() * 0.35, r: r() * 6.28, tint: TINTS[Math.floor(r() * 4)] })
      }
    }
    // toadstools grow in rings of three to five
    const shrooms: Inst[] = []
    for (let g = 0; g < 40 * k; g++) {
      const c = greenSpot(r, 3, 22, 1)
      const n = 2 + Math.floor(r() * 4)
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + r(), d = 0.5 + r() * 0.6
        shrooms.push({ x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d, s: 0.45 + r() * 0.55, r: r() * 6.28, tint: TINTS[Math.floor(r() * 4)] })
      }
    }
    const tallGrass = make(lite ? 1200 : 2000, 2.3, 36, 0, () => 0.8 + r() * 0.7, () => 0.7 + r() * 0.5)
    const bushes = make(120, 3.2, 30, 1.2, () => 0.8 + r() * 0.8)
    const ferns = make(90, 2.6, 26, 0.6, () => 0.7 + r() * 0.7)
    // city: potted trees between the lamps, kept clear of the booths on the left
    const planters: Inst[] = []
    const booths = (t: number) => (t > 0.515 && t < 0.83)
    for (let d = dist(0.47) + 5.7; d < dist(0.9); d += 11.4) {
      const t = tAt(d)
      for (const side of [3.4, -3.4]) {
        if (side < 0 && booths(t)) continue
        planters.push({ ...place(t, side), s: 0.85 + r() * 0.25, r: r() * 6.28, tint: TINTS[Math.floor(r() * 4)] })
      }
    }
    return { pines, shrooms, tallGrass, bushes, ferns, planters }
  }, [lite])

  return (
    <>
      <Instances geo={PINE} list={sets.pines} />
      <Instances geo={TOADSTOOL} list={sets.shrooms} />
      <Instances geo={GRASS} list={sets.tallGrass} shadow={false} />
      <Instances geo={BUSH} list={sets.bushes} />
      <Instances geo={FERN} list={sets.ferns} shadow={false} />
      <Instances geo={PLANTER} list={sets.planters} />
    </>
  )
}
