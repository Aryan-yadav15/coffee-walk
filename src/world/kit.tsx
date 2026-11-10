// Shared building blocks: every prop in the world is made from these few shapes.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { useMemo, type ReactNode } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { place } from './path'
import { buildingTextures, glowTexture, signTexture, type SignOpts } from './textures'

/** 0 at midday, 1 at night. Anything that lights up registers a callback here. */
export const night = { v: 0, fns: [] as ((n: number) => void)[] }

const pyr = new THREE.ConeGeometry(0.7071, 1, 4)
pyr.rotateY(Math.PI / 4)
export const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 28),
  cup: new THREE.CylinderGeometry(0.5, 0.36, 1, 28),
  cone: new THREE.ConeGeometry(0.5, 1, 24),
  pyr,
  ico: new THREE.IcosahedronGeometry(0.5, 3),
  sph: new THREE.SphereGeometry(0.5, 28, 18),
  dome: new THREE.SphereGeometry(0.5, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
  plane: new THREE.PlaneGeometry(1, 1),
}

// Boxes get bevelled edges. The bevel must not stretch with the box, so each size is its own geometry.
const boxes = new Map<string, THREE.BufferGeometry>()
function rbox(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`
  let g = boxes.get(key)
  if (!g) boxes.set(key, (g = new RoundedBoxGeometry(w, h, d, 3, Math.min(0.09, Math.min(w, h, d) * 0.42))))
  return g
}

const caps = new Map<string, THREE.BufferGeometry>()
/** Capsule of radius `r` whose straight part is `len` long. */
export function capsule(r: number, len: number) {
  const key = `${r}|${len}`
  let g = caps.get(key)
  if (!g) caps.set(key, (g = new THREE.CapsuleGeometry(r, len, 8, 20)))
  return g
}

/**
 * Everything is cel shaded: light falls off in three soft bands (shadow, mid,
 * lit) instead of a smooth gradient, which is what gives the painted look.
 */
export const RAMP = (() => {
  const n = 64
  const data = new Uint8Array(n * 4)
  const band = (x: number, at: number) => THREE.MathUtils.smoothstep(x, at - 0.025, at + 0.025)
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1)
    const v = 0.5 + 0.27 * band(x, 0.46) + 0.23 * band(x, 0.66)
    data.fill(Math.round(v * 255), i * 4, i * 4 + 4)
  }
  const tex = new THREE.DataTexture(data, n, 1)
  tex.magFilter = tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
})()

export const toon = (params: THREE.MeshToonMaterialParameters = {}) => new THREE.MeshToonMaterial({ gradientMap: RAMP, ...params })

const mats = new Map<string, THREE.MeshToonMaterial>()

export function mat(c: string) {
  let m = mats.get(c)
  if (!m) mats.set(c, (m = toon({ color: c })))
  return m
}

/** Glows a little by day (`base`) and more at night (`gain`). */
export function glow(c: string, base = 0.1, gain = 1.8) {
  const key = `${c}|${base}|${gain}`
  let m = mats.get(key)
  if (!m) {
    const made = toon({ color: c, emissive: c, emissiveIntensity: base })
    night.fns.push((n) => (made.emissiveIntensity = base + gain * n))
    mats.set(key, (m = made))
  }
  return m
}

export type V3 = [number, number, number]
type MProps = {
  g?: keyof typeof G
  geo?: THREE.BufferGeometry
  c?: string
  m?: THREE.Material
  p?: V3
  s?: V3 | number
  r?: V3
  shadow?: boolean
} & Omit<ThreeElements['mesh'], 'position' | 'scale' | 'rotation'>

export function M({ g = 'box', geo, c = '#ffffff', m, p, s, r, shadow = true, ...rest }: MProps) {
  const bevel = !geo && g === 'box' && s !== undefined
  const geometry = geo ?? (bevel ? (typeof s === 'number' ? rbox(s, s, s) : rbox(...(s as V3))) : G[g])
  return (
    <mesh geometry={geometry} material={m ?? mat(c)} position={p} scale={bevel ? undefined : s} rotation={r} castShadow={shadow} receiveShadow {...rest} />
  )
}

type SignProps = SignOpts & { text: string; p?: V3; r?: V3; lit?: number; back?: string | false }

export function Sign({ text, w, h, bg, fg, hand, p, r, lit = 0.3, back = '#5a4636' }: SignProps) {
  const material = useMemo(() => {
    const tex = signTexture(text, { w, h, bg, fg, hand })
    const m = toon({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: lit })
    night.fns.push((n) => (m.emissiveIntensity = lit + n * 0.7))
    return m
  }, [text, w, h, bg, fg, hand, lit])
  return (
    <group position={p} rotation={r}>
      <mesh geometry={G.plane} material={material} scale={[w, h, 1]} position={[0, 0, 0.045]} />
      {back && <M c={back} s={[w + 0.14, h + 0.14, 0.08]} />}
    </group>
  )
}

/** Soft halo that fades in at night. */
export function Halo({ p, s = 3 }: { p?: V3; s?: number }) {
  const material = useMemo(() => {
    const m = new THREE.SpriteMaterial({ map: glowTexture(), blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
    night.fns.push((n) => (m.opacity = n * 0.9))
    return m
  }, [])
  return <sprite material={material} position={p} scale={s} />
}

type AtProps = { t: number; side?: number; y?: number; face?: boolean; turn?: number; rot?: number; children: ReactNode }

/**
 * Puts children beside the walk. The camera looks down from behind and to the
 * right, so by default everything turns its front (+z) that way, `turn`
 * radians past side-on. `face={false}` aligns +z with the walking direction.
 */
export function At({ t, side = 0, y = 0, face = true, turn = 0.3, rot = 0, children }: AtProps) {
  const { x, z, yaw } = useMemo(() => place(t, side), [t, side])
  return (
    <group position={[x, y, z]} rotation={[0, (face ? yaw - Math.PI / 2 - turn : yaw) + rot, 0]}>
      {children}
    </group>
  )
}

type TapProps = { onTap: () => void; children: ReactNode } & Omit<ThreeElements['group'], 'onClick'>

/** Makes its children tappable. Ignores taps that were really a look-around drag. */
export function Tap({ onTap, children, ...rest }: TapProps) {
  return (
    <group
      {...rest}
      onClick={(e) => {
        if (e.delta > 8) return
        e.stopPropagation()
        onTap()
      }}
      onPointerOver={(e) => (e.stopPropagation(), (document.body.style.cursor = 'pointer'))}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {children}
    </group>
  )
}

/** Invisible, generous hit area so small things are tappable on phones. */
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
export const Hit = ({ p, s }: { p?: V3; s: V3 | number }) => <mesh geometry={G.sph} material={hitMat} position={p} scale={s} />

const bTex = [
  [3, 4, 11],
  [4, 7, 23],
  [5, 10, 37],
].map(([c, r, seed]) => buildingTextures(c, r, seed))
const bMats = new Map<string, THREE.MeshToonMaterial>()

export function Building({ w, h, d, c, roof = '#6b5b6e' }: { w: number; h: number; d: number; c: string; roof?: string }) {
  const v = h < 6 ? 0 : h < 14 ? 1 : 2
  const key = c + v
  let m = bMats.get(key)
  if (!m) {
    const made = toon({ color: c, ...bTex[v], emissive: '#ffffff', emissiveIntensity: 0 })
    night.fns.push((n) => (made.emissiveIntensity = n * 1.3))
    bMats.set(key, (m = made))
  }
  return (
    <group>
      <mesh geometry={G.box} material={m} scale={[w, h, d]} position={[0, h / 2, 0]} castShadow receiveShadow />
      <M c={c} s={[w + 0.3, 0.5, d + 0.3]} p={[0, 0.25, 0]} />
      <M c={roof} s={[w + 0.5, 0.35, d + 0.5]} p={[0, h + 0.17, 0]} />
      {/* rooftop clutter */}
      <M g="cyl" c="#d9d2c5" s={[1.1, 1.2, 1.1]} p={[w * 0.22, h + 0.95, -d * 0.18]} />
      <M g="cone" c={roof} s={[1.3, 0.5, 1.3]} p={[w * 0.22, h + 1.8, -d * 0.18]} />
      <M c="#c7ccd6" s={[1, 0.5, 0.7]} p={[-w * 0.25, h + 0.6, d * 0.2]} />
    </group>
  )
}
