// The scenery, in walking order. Positions (`t`) line up with the beats in src/story.ts.
import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ME } from '../story'
import { chaiMode, findEgg, set } from '../state'
import { blip } from '../sound'
import { KhaoStalls } from './Stalls'
import { Exhibit } from './Exhibit'
import { Engine } from './Engine'
import { Barista, Hackers, Painter, Scanner, Scenes, Team } from './Scenes'
import { DeliveryPins, InstallCounter, InternshipDoor, MedalWall, NeuralNet, PhoneBillboard, TrophyStage } from './Flex'
import { At, Building, G, Halo, Hit, M, Sign, Tap, glow, mat, night, toon, type V3 } from './kit'
import { paintedGround } from './paint'
import { Foliage } from './Foliage'
import { TOTAL, dist, place, rng, smooth, tAt } from './path'

/* ---------- ground ---------- */

const GRASS = new THREE.Color('#a9d174')
const PAVED = new THREE.Color('#9a95a8')
const PARK = new THREE.Color('#7fae78')
const groundColor = (t: number, out: THREE.Color) =>
  out.copy(GRASS).lerp(PAVED, smooth(0.43, 0.48, t)).lerp(PARK, smooth(0.9, 0.97, t))

function ribbon(t0: number, t1: number, side: number, width: number, y: number, color: (t: number, out: THREE.Color) => void, n = 160) {
  const pos: number[] = [], col: number[] = [], nor: number[] = [], idx: number[] = []
  const c = new THREE.Color()
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    const a = place(t, side - width / 2), b = place(t, side + width / 2)
    color(t, c)
    pos.push(a.x, y, a.z, b.x, y, b.z)
    col.push(c.r, c.g, c.b, c.r, c.g, c.b)
    nor.push(0, 1, 0, 0, 1, 0)
    if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setIndex(idx)
  return g
}

const vertexMat = paintedGround()
const plainMat = toon({ vertexColors: true })

function Ground() {
  const land = useMemo(() => {
    const g = new THREE.PlaneGeometry(800, 900, 1, 120)
    g.rotateX(-Math.PI / 2)
    g.translate(0, 0, -TOTAL / 2)
    const p = g.attributes.position
    const col = new Float32Array(p.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < p.count; i++) groundColor(tAt(-p.getZ(i)), c).toArray(col, i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])
  const path = useMemo(() => {
    const sand = new THREE.Color('#efdcaa'), walk = new THREE.Color('#d9d2c5')
    return ribbon(-0.06, 1.035, 0, 3.6, 0.03, (t, c) => c.copy(sand).lerp(walk, smooth(0.43, 0.48, t)))
  }, [])
  const edge = useMemo(() => {
    const dirt = new THREE.Color('#cdb27c'), kerb = new THREE.Color('#b3adb8')
    return ribbon(-0.06, 1.035, 0, 4.3, 0.015, (t, c) => c.copy(dirt).lerp(kerb, smooth(0.43, 0.48, t)))
  }, [])
  const road = useMemo(() => ribbon(0.452, 0.9, 8, 6, 0.02, (_, c) => c.set('#4b4a59')), [])
  const dashes = useMemo(() => Array.from({ length: Math.floor((dist(0.9) - dist(0.458)) / 4) }, (_, i) => tAt(dist(0.458) + i * 4)), [])
  return (
    <>
      <mesh geometry={land} material={vertexMat} receiveShadow />
      <mesh geometry={edge} material={vertexMat} receiveShadow />
      <mesh geometry={path} material={vertexMat} receiveShadow />
      <mesh geometry={road} material={plainMat} receiveShadow />
      {dashes.map((t) => (
        <At key={t} t={t} side={8} face={false}>
          <M c="#e9e4d4" s={[0.16, 0.02, 1.4]} p={[0, 0.03, 0]} shadow={false} />
        </At>
      ))}
    </>
  )
}

/* ---------- trees, flowers, rocks ---------- */

const NEAR_TREES: [number, number, number][] = [
  [-0.02, 8, 1.1], [0.03, 9, 1.3], [0.045, -8, 1], [0.065, -5.5, 1.2], [0.07, 9, 0.9], [0.1, -5.5, 1.3],
  [0.118, 8.5, 1.1], [0.128, -7, 1.2], [0.185, 8, 1], [0.192, -6, 1.3], [0.225, 9, 1.1], [0.24, -7, 1],
  [0.275, 8, 1.3], [0.28, -6, 1.1], [0.35, 9, 1.2], [0.35, -13, 1], [0.4, 9, 1.3], [0.455, -13.5, 1.1],
  [0.445, 8, 1], [0.92, -6, 1.2], [0.94, 8, 1.3], [0.97, -7.5, 1], [0.985, 9, 1.1],
]
const LEAVES = ['#6fae5c', '#86c06a', '#5a9c5a', '#a4cf6e', '#79b866', '#f2a65a', '#f08b7d']
const softMat = toon()

/** Fills an instanced mesh from a list of placements. */
function useInstances(list: { p: V3; s: V3; c?: string; r?: number }[]) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color()
    list.forEach((it, i) => {
      o.position.set(...it.p)
      o.scale.set(...it.s)
      o.rotation.set(0, it.r ?? 0, 0)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
      if (it.c) ref.current.setColorAt(i, c.set(it.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [list])
  return ref
}

function Trees() {
  const { trunks, crowns } = useMemo(() => {
    const r = rng(42)
    const spots = NEAR_TREES.map(([t, side, s]) => ({ ...place(t, side), s, warm: r() < 0.25 }))
    for (let i = 0; i < 150; i++) {
      const t = r() < 0.8 ? -0.08 + r() * 0.52 : 0.9 + r() * 0.16
      spots.push({ ...place(t, (r() < 0.5 ? -1 : 1) * (20 + r() * 60)), s: 0.9 + r() * 0.9, warm: r() < 0.12 })
    }
    const trunks: { p: V3; s: V3 }[] = [], crowns: { p: V3; s: V3; c: string }[] = []
    for (const { x, z, s, warm } of spots) {
      const c = new THREE.Color(LEAVES[warm ? 5 + Math.floor(r() * 2) : Math.floor(r() * 5)])
      trunks.push({ p: [x, 0.8 * s, z], s: [0.34 * s, 1.6 * s, 0.34 * s] })
      // three overlapping blobs make one soft crown
      const blobs: [number, number, number, number][] = [[0, 2.5, 0, 2.6], [0.75, 2.1, 0.3, 1.8], [-0.6, 2.2, -0.35, 1.9], [0.1, 3.4, 0.1, 1.7]]
      blobs.forEach(([bx, by, bz, bs], i) =>
        crowns.push({ p: [x + bx * s, by * s, z + bz * s], s: [bs * s, bs * s * 0.92, bs * s], c: '#' + c.clone().offsetHSL(0, 0, (i - 1) * 0.025).getHexString() }),
      )
    }
    return { trunks, crowns }
  }, [])
  const t = useInstances(trunks), c = useInstances(crowns)
  return (
    <>
      <instancedMesh ref={t} args={[G.cyl, mat('#8a5a3c'), trunks.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={c} args={[G.ico, softMat, crowns.length]} castShadow receiveShadow frustumCulled={false} />
    </>
  )
}

const PETALS = ['#ffffff', '#ffd166', '#f08b7d', '#f7a8c4', '#c9b6f2']

/** Small stuff that only matters from above: flowers, grass tufts, bushes and rocks on the green parts. */
function Meadow() {
  const { flowers, tufts, rocks } = useMemo(() => {
    const r = rng(77)
    const flowers: { p: V3; s: V3; c: string }[] = [], tufts: { p: V3; s: V3; c: string; r: number }[] = [], rocks: { p: V3; s: V3; c: string; r: number }[] = []
    const spot = () => {
      const t = r() < 0.82 ? -0.05 + r() * 0.49 : 0.91 + r() * 0.13
      return place(t, (r() < 0.5 ? -1 : 1) * (2.4 + r() * r() * 26))
    }
    for (let i = 0; i < 520; i++) {
      const { x, z } = spot()
      flowers.push({ p: [x, 0.12, z], s: [0.16, 0.12, 0.16], c: PETALS[Math.floor(r() * PETALS.length)] })
    }
    for (let i = 0; i < 420; i++) {
      const { x, z } = spot()
      const big = r() < 0.12
      const k = big ? 0.9 + r() * 0.8 : 0.22 + r() * 0.2
      tufts.push({ p: [x, k * (big ? 0.35 : 0.4), z], s: big ? [k * 1.3, k * 0.9, k * 1.3] : [k, k * 1.4, k], c: big ? '#6fae5c' : '#8fc468', r: r() * 6 })
    }
    for (let i = 0; i < 70; i++) {
      const { x, z } = spot()
      const k = 0.25 + r() * 0.5
      rocks.push({ p: [x, k * 0.2, z], s: [k * 1.3, k * 0.7, k], c: r() < 0.5 ? '#b9b4ad' : '#a39e99', r: r() * 6 })
    }
    return { flowers, tufts, rocks }
  }, [])
  const f = useInstances(flowers), t = useInstances(tufts), k = useInstances(rocks)
  return (
    <>
      <instancedMesh ref={f} args={[G.sph, softMat, flowers.length]} frustumCulled={false} />
      <instancedMesh ref={t} args={[G.ico, softMat, tufts.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={k} args={[G.ico, softMat, rocks.length]} castShadow receiveShadow frustumCulled={false} />
    </>
  )
}

/* ---------- small reusable props ---------- */

function Lamp() {
  return (
    <group>
      <M g="cyl" c="#3b3b4a" s={[0.1, 3.6, 0.1]} p={[0, 1.8, 0]} />
      <M c="#3b3b4a" s={[0.08, 0.08, 0.8]} p={[0, 3.6, 0.35]} />
      <M g="sph" m={glow('#ffd89a', 0.2, 2.6)} s={0.32} p={[0, 3.5, 0.7]} shadow={false} />
      <Halo p={[0, 3.5, 0.7]} s={3.4} />
    </group>
  )
}

function Bench() {
  return (
    <group>
      <M c="#a8703f" s={[1.8, 0.08, 0.5]} p={[0, 0.48, 0]} />
      <M c="#a8703f" s={[1.8, 0.5, 0.08]} p={[0, 0.8, -0.24]} r={[-0.15, 0, 0]} />
      <M c="#3b3b4a" s={[0.08, 0.48, 0.45]} p={[-0.75, 0.24, 0]} />
      <M c="#3b3b4a" s={[0.08, 0.48, 0.45]} p={[0.75, 0.24, 0]} />
    </group>
  )
}

function Easel({ text, bg, fg }: { text: string; bg: string; fg?: string }) {
  return (
    <group>
      <M c="#b98a5e" s={[0.07, 2.3, 0.07]} p={[-0.55, 1.1, 0]} r={[0.12, 0, 0.1]} />
      <M c="#b98a5e" s={[0.07, 2.3, 0.07]} p={[0.55, 1.1, 0]} r={[0.12, 0, -0.1]} />
      <M c="#b98a5e" s={[0.07, 2.2, 0.07]} p={[0, 1.05, -0.45]} r={[-0.3, 0, 0]} />
      <Sign text={text} w={1.5} h={1.9} bg={bg} fg={fg} p={[0, 1.55, 0.1]} r={[-0.1, 0, 0]} back="#f7f3ea" />
    </group>
  )
}

function Awning({ w, c, p }: { w: number; c: string; p: V3 }) {
  const n = Math.round(w / 0.5)
  return (
    <group position={p} rotation={[0.28, 0, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <M key={i} c={i % 2 ? '#fff8ec' : c} s={[w / n, 0.08, 1.5]} p={[(i + 0.5) * (w / n) - w / 2, 0, 0]} />
      ))}
    </group>
  )
}

/* ---------- 0 · the coffee stall ---------- */

function CoffeeStall() {
  return (
    <>
      <At t={0.014} side={-4.4} turn={0.5}>
        <Exhibit id="about" marker={[1.9, 3.2, 0.4]}>
        <Barista />
        <M c="#c9483f" s={[2.8, 1, 1.3]} p={[0, 0.65, 0]} />
        <M c="#f3e3c3" s={[3, 0.1, 1.5]} p={[0, 1.2, 0]} />
        <M g="cyl" c="#2f2a33" s={[0.5, 0.12, 0.5]} p={[-1, 0.25, 0.7]} r={[Math.PI / 2, 0, 0]} />
        <M g="cyl" c="#2f2a33" s={[0.5, 0.12, 0.5]} p={[1, 0.25, 0.7]} r={[Math.PI / 2, 0, 0]} />
        <M c="#6a4a3a" s={[0.08, 1.6, 0.08]} p={[-1.4, 2, 0.6]} />
        <M c="#6a4a3a" s={[0.08, 1.6, 0.08]} p={[1.4, 2, 0.6]} />
        <Awning w={3.2} c="#e8833a" p={[0, 2.75, 0.5]} />
        <Sign text={'COFFEE\n~and chai, if you know where to tap'} w={2.6} h={0.8} p={[0, 3.45, 0.2]} bg="#2a2320" fg="#ffe9c7" />
        {/* the kettle: tap it */}
        <Tap onTap={chaiMode} position={[0.85, 1.25, 0.2]}>
          <Hit s={0.9} p={[0, 0.25, 0]} />
          <M g="cup" c="#c7ccd6" s={[0.42, 0.4, 0.42]} p={[0, 0.2, 0]} r={[Math.PI, 0, 0]} />
          <M g="cone" c="#c7ccd6" s={[0.1, 0.36, 0.1]} p={[0.28, 0.25, 0]} r={[0, 0, -1]} />
          <M g="sph" c="#2f2a33" s={0.1} p={[0, 0.44, 0]} />
        </Tap>
        {[-0.9, -0.6, -0.3].map((x) => (
          <M key={x} g="cup" c="#fdf6ea" s={[0.16, 0.22, 0.16]} p={[x, 1.36, 0.3]} />
        ))}
        <M g="sph" m={glow('#ffd89a', 0.3, 2)} s={0.2} p={[0, 2.5, 0.5]} shadow={false} />
        </Exhibit>
      </At>
      <At t={0.03} side={2.7} turn={0.7}>
        <M c="#6a4a3a" s={[0.9, 1.3, 0.06]} p={[0, 0.62, -0.18]} r={[0.25, 0, 0]} />
        <Sign text={"TODAY'S SPECIAL\none long story\n~(served with coffee)"} w={0.85} h={1.2} p={[0, 0.64, 0.02]} r={[-0.25, 0, 0]} bg="#2f3a35" fg="#f4efdf" hand />
      </At>
    </>
  )
}

/* ---------- 1 · the rabbit hole ---------- */

function RabbitHole() {
  const rabbit = useRef<THREE.Group>(null!)
  const up = useRef(0)
  useFrame((_, dt) => {
    up.current = Math.max(0, up.current - dt)
    rabbit.current.position.y = THREE.MathUtils.damp(rabbit.current.position.y, up.current > 0 ? 0.3 : -0.36, 7, dt)
  })
  return (
    <At t={0.103} side={2.7}>
      <Tap
        onTap={() => {
          up.current = 2.6
          blip('pop')
          findEgg('rabbit', 'the rabbit hole. it had documentation. I did not read it.')
        }}
      >
        <Hit s={1.7} p={[0, 0.3, 0]} />
        <M g="cyl" c="#8a6a48" s={[1.5, 0.08, 1.5]} p={[0, 0.03, 0]} />
        <M g="cyl" c="#1b1410" s={[1, 0.02, 1]} p={[0, 0.08, 0]} shadow={false} />
        <group ref={rabbit} position={[0, -0.36, 0]}>
          <M g="sph" c="#f4efe6" s={[0.36, 0.34, 0.34]} p={[0, 0.1, 0]} />
          <M c="#f4efe6" s={[0.09, 0.42, 0.05]} p={[-0.09, 0.42, 0]} r={[0, 0, 0.12]} />
          <M c="#f4efe6" s={[0.09, 0.42, 0.05]} p={[0.09, 0.42, 0]} r={[0, 0, -0.12]} />
          <M c="#f2a7b0" s={[0.04, 0.3, 0.02]} p={[-0.09, 0.42, 0.03]} r={[0, 0, 0.12]} shadow={false} />
          <M c="#f2a7b0" s={[0.04, 0.3, 0.02]} p={[0.09, 0.42, 0.03]} r={[0, 0, -0.12]} shadow={false} />
          <M c="#1f1a1c" s={[0.04, 0.05, 0.02]} p={[-0.08, 0.15, 0.17]} shadow={false} />
          <M c="#1f1a1c" s={[0.04, 0.05, 0.02]} p={[0.08, 0.15, 0.17]} shadow={false} />
          <M c="#f2a7b0" s={[0.04, 0.03, 0.02]} p={[0, 0.08, 0.18]} shadow={false} />
        </group>
      </Tap>
      <M c="#b98a5e" s={[0.07, 1, 0.07]} p={[1, 0.5, -0.3]} />
      <Sign text={'↓ rabbit hole\n~est. 2022'} w={1} h={0.5} p={[1, 1.1, -0.26]} hand />
    </At>
  )
}

/* ---------- 2 · design first ---------- */

function DesignLane() {
  const btn = useRef<THREE.Group>(null!)
  const press = useRef(0)
  useFrame((_, dt) => {
    press.current = Math.max(0, press.current - dt * 3)
    btn.current.position.y = 1.02 - Math.sin(press.current * Math.PI) * 0.09
  })
  return (
    <>
      {/* the button that started it all */}
      <At t={0.126} side={2.8}>
        <M c="#f7f3ea" s={[0.9, 0.9, 0.9]} p={[0, 0.45, 0]} />
        <Sign text={'<Button />\n~v1, 2022'} w={0.8} h={0.5} p={[0, 0.5, 0.42]} back={false} bg="#f7f3ea" />
        <Tap
          onTap={() => {
            press.current = 1
            blip('pop')
            findEgg('button', 'one custom button. that is how all of this started.')
          }}
        >
          <Hit s={1.3} p={[0, 1, 0]} />
          <group ref={btn} position={[0, 1.02, 0]}>
            <M g="cyl" c="#ff5a4d" s={[0.62, 0.2, 0.62]} />
          </group>
          <M g="cyl" c="#2f2a33" s={[0.76, 0.08, 0.76]} p={[0, 0.92, 0]} />
        </Tap>
      </At>
      <At t={0.142} side={-3.3}>
        <Exhibit id="design" marker={[0, 3.4, 0]}><Easel text={'Aa\n~kerning matters'} bg="#ff6b35" fg="#fff8ec" /><Painter /></Exhibit>
      </At>
      <At t={0.159} side={-3.6}><Exhibit id="design" marker={false}><Easel text={'4px\n~≠ 5px'} bg="#233833" fg="#f4efdf" /></Exhibit></At>
      <At t={0.176} side={-3.4}><Exhibit id="design" marker={false}><Easel text={'KONNEXIONS\n~graphic design lead'} bg="#d8a340" /></Exhibit></At>
      {/* a very large pencil */}
      <At t={0.15} side={-8.5} face={false}>
        <group rotation={[0.2, 0, 0.35]} position={[0, 0, 0]}>
          <M g="cone" c="#f2d6a8" s={[0.7, 1.1, 0.7]} p={[0, 0.55, 0]} r={[Math.PI, 0, 0]} />
          <M g="cone" c="#2f2a33" s={[0.24, 0.38, 0.24]} p={[0, 0.19, 0]} r={[Math.PI, 0, 0]} />
          <M g="cyl" c="#f5c23e" s={[0.7, 4.4, 0.7]} p={[0, 3.3, 0]} />
          <M g="cyl" c="#c7ccd6" s={[0.72, 0.4, 0.72]} p={[0, 5.7, 0]} />
          <M g="cyl" c="#f08b7d" s={[0.7, 0.5, 0.7]} p={[0, 6.15, 0]} />
        </group>
      </At>
      {/* swatches */}
      <At t={0.186} side={3.2}>
        {['#ff6b35', '#f5c23e', '#3d5a80', '#233833'].map((c, i) => (
          <M key={c} c={c} s={[0.5, 0.5, 0.5]} p={[i * 0.6 - 0.9, 0.25 + (i % 2) * 0.5, 0]} r={[0, i * 0.3, 0]} />
        ))}
      </At>
    </>
  )
}

/* ---------- 3 · campus ---------- */

function Campus() {
  return (
    <>
      <At t={0.207} face={false}>
        <M c="#c9735a" s={[1, 5, 1]} p={[-3.2, 2.5, 0]} />
        <M c="#c9735a" s={[1, 5, 1]} p={[3.2, 2.5, 0]} />
        <M c="#f3e3c3" s={[1.3, 0.3, 1.3]} p={[-3.2, 5.1, 0]} />
        <M c="#f3e3c3" s={[1.3, 0.3, 1.3]} p={[3.2, 5.1, 0]} />
        <M c="#a85a44" s={[7.4, 1.1, 0.6]} p={[0, 4.3, 0]} />
        <Sign text="KIIT" w={3} h={0.85} p={[0, 4.3, 0.32]} r={[0, Math.PI, 0]} bg="#f3e3c3" back={false} />
      </At>
      <At t={0.222} side={-14} turn={0.15}><Building w={11} h={7.5} d={6} c="#d98a6f" roof="#8f4f3f" /></At>
      <At t={0.25} side={-27} turn={0.15}><Building w={12} h={11} d={6} c="#e6c9a0" roof="#8f4f3f" /></At>
      <At t={0.27} side={-15} turn={0.15}><Building w={9} h={5.5} d={6} c="#d98a6f" roof="#8f4f3f" /></At>
      <At t={0.232} side={3.2} turn={0}><Bench /></At>
      <At t={0.215} side={-2.6}><Lamp /></At>
      <At t={0.258} side={2.6} rot={Math.PI}><Lamp /></At>
    </>
  )
}

/* ---------- 4 · first gig ---------- */

function FirstGig() {
  return (
    <>
      <At t={0.306} side={-7.5} turn={0.35}>
        <Exhibit id="bitstobugs" marker={[2.2, 6.6, 1.6]}>
        <Building w={6} h={4.6} d={4.5} c="#f2e2c4" roof="#3d5a80" />
        <M c="#3d5a80" s={[1, 2, 0.1]} p={[0, 1, 2.26]} />
        <Awning w={2} c="#3d5a80" p={[0, 2.5, 2.8]} />
        <Sign text={'BitsToBugs\n~designer in, full-stack dev out'} w={4.6} h={1.1} p={[0, 5.4, 2]} bg="#3d5a80" fg="#fff8ec" />
        </Exhibit>
      </At>
      <At t={0.338} side={-3.6} turn={0.5}>
        <M c="#6a4a3a" s={[0.1, 1.5, 0.1]} p={[0, 0.75, -0.05]} />
        <Sign
          text={'"incredibly punctual,\nexceptional work ethics"\n~Lakshit Verma, BitsToBugs'}
          w={2.6} h={1.2} p={[0, 1.8, 0]} hand
        />
      </At>
      <At t={0.295} side={2.6} rot={Math.PI}><Lamp /></At>
    </>
  )
}

/* ---------- 5 · hackathons, and the wet cat ---------- */

function Laptop({ p, r = 0 }: { p: V3; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <M c="#c7ccd6" s={[0.42, 0.03, 0.3]} />
      <M m={glow('#9fd8ff', 0.7, 1.2)} s={[0.42, 0.28, 0.02]} p={[0, 0.15, -0.16]} r={[-0.2, 0, 0]} shadow={false} />
    </group>
  )
}

function Hackathon() {
  return (
    <At t={0.42} side={-5.6} turn={0.4}>
      <Exhibit id="hackathons" marker={[0, 3.9, 0]} hit={[5, 3.2, 4]} hitAt={[0, 1.4, 0]}>
      <Hackers />
      {[[-2.4, -1.8], [2.4, -1.8], [-2.4, 1.8], [2.4, 1.8]].map(([x, z]) => (
        <M key={`${x}${z}`} g="cyl" c="#f7f3ea" s={[0.12, 3, 0.12]} p={[x, 1.5, z]} />
      ))}
      <M c="#f7f3ea" s={[4.9, 0.08, 0.08]} p={[0, 3, -1.8]} />
      <Sign text={'HACKATHON\n~sleep is a deprecated feature'} w={4.4} h={1} p={[0, 2.45, -1.8]} bg="#1f2440" fg="#ffe9c7" />
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
        <M key={x} g="cone" c={['#ff6b35', '#f5c23e', '#5b8def', '#3ddc97'][i]} s={[0.5, 0.5, 0.06]} p={[x, 2.75, 1.8]} r={[Math.PI, 0, 0]} />
      ))}
      <M c="#f7f3ea" s={[4.9, 0.05, 0.05]} p={[0, 3, 1.8]} />
      {/* string lights */}
      {Array.from({ length: 9 }, (_, i) => (
        <M key={i} g="sph" m={glow(['#ffd89a', '#ff8fa3', '#9fd8ff'][i % 3], 0.5, 2.2)} s={0.12} shadow={false}
          p={[-2.4, 2.9 - Math.sin((i / 8) * Math.PI) * 0.5, -1.8 + i * 0.45]} />
      ))}
      {/* tables */}
      {[-1.1, 1.1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <M c="#e6d3b3" s={[1.7, 0.08, 0.9]} p={[0, 0.8, 0]} />
          <M c="#6a4a3a" s={[0.08, 0.8, 0.08]} p={[-0.75, 0.4, 0]} />
          <M c="#6a4a3a" s={[0.08, 0.8, 0.08]} p={[0.75, 0.4, 0]} />
          <Laptop p={[-0.35, 0.86, 0]} r={Math.PI + 0.2} />
          <Laptop p={[0.4, 0.86, 0.05]} r={Math.PI - 0.3} />
          <M g="cyl" c="#3ddc97" s={[0.07, 0.16, 0.07]} p={[0, 0.92, 0.25]} />
          <M g="cyl" c="#3ddc97" s={[0.07, 0.16, 0.07]} p={[0.12, 0.88, 0.3]} r={[Math.PI / 2, 0, 0.4]} />
        </group>
      ))}
      <M c="#3b3b4a" s={[0.1, 2.2, 0.1]} p={[3.3, 1.1, 1.6]} />
      <Sign text="03:47" w={1.1} h={0.5} p={[3.3, 2.4, 1.6]} bg="#150b0b" fg="#ff4d3d" lit={0.9} />
      </Exhibit>
    </At>
  )
}

function WetCat() {
  const rain = useRef<THREE.Group>(null!)
  const cat = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    rain.current.children.forEach((d, i) => (d.position.y = 1.25 - ((clock.elapsedTime * 1.6 + i * 0.37) % 1) * 1.1))
    cat.current.rotation.z = Math.sin(clock.elapsedTime * 22) * 0.012 // shivering
  })
  return (
    <At t={0.446} side={2.6} turn={0.6}>
      <Tap
        onTap={() => {
          blip('bruh')
          set({ meme: 'wetcat' })
          findEgg('cat', 'bruh.')
        }}
      >
        <Hit s={1.6} p={[0, 0.5, 0]} />
        <M g="cyl" c="#7fb7d9" s={[1.5, 0.03, 1.2]} p={[0, 0.045, 0]} shadow={false} />
        <group ref={cat}>
          <M c="#7d828c" s={[0.34, 0.4, 0.3]} p={[0, 0.25, 0]} />
          <M c="#7d828c" s={[0.36, 0.3, 0.3]} p={[0, 0.6, 0.04]} />
          <M g="cone" c="#7d828c" s={[0.12, 0.16, 0.1]} p={[-0.12, 0.8, 0.04]} r={[0, 0, 0.5]} />
          <M g="cone" c="#7d828c" s={[0.12, 0.16, 0.1]} p={[0.12, 0.8, 0.04]} r={[0, 0, -0.5]} />
          {/* huge, betrayed eyes */}
          <M g="sph" c="#f4efe6" s={[0.12, 0.13, 0.04]} p={[-0.09, 0.63, 0.19]} shadow={false} />
          <M g="sph" c="#f4efe6" s={[0.12, 0.13, 0.04]} p={[0.09, 0.63, 0.19]} shadow={false} />
          <M g="sph" c="#1f1a1c" s={[0.06, 0.07, 0.03]} p={[-0.09, 0.62, 0.21]} shadow={false} />
          <M g="sph" c="#1f1a1c" s={[0.06, 0.07, 0.03]} p={[0.09, 0.62, 0.21]} shadow={false} />
          <M c="#5c6069" s={[0.08, 0.02, 0.02]} p={[0, 0.52, 0.2]} shadow={false} />
          <M c="#7d828c" s={[0.07, 0.07, 0.4]} p={[0.16, 0.1, -0.3]} r={[0, 0.5, 0]} />
        </group>
        {/* a personal rain cloud */}
        <M g="ico" c="#6b7280" s={[0.8, 0.35, 0.5]} p={[0, 1.5, 0]} />
        <M g="ico" c="#7b8290" s={[0.5, 0.3, 0.4]} p={[0.3, 1.6, 0.05]} />
        <group ref={rain}>
          {Array.from({ length: 7 }, (_, i) => (
            <M key={i} c="#9fd8ff" s={[0.015, 0.09, 0.015]} p={[Math.sin(i * 2.4) * 0.28, 1, Math.cos(i * 1.7) * 0.16]} shadow={false} />
          ))}
        </group>
      </Tap>
    </At>
  )
}

/* ---------- 6 · the city, and KhaoGully ---------- */

const CITY = ['#e9c9a8', '#d9a08b', '#b8c4d9', '#c9b6d6', '#e6d3b3', '#a9c2b5', '#e0b58f']

function City() {
  const list = useMemo(() => {
    const r = rng(9)
    const out: { t: number; side: number; w: number; h: number; d: number; c: string }[] = []
    for (let d = dist(0.462); d < dist(0.91); d += 7.05) {
      const t = tAt(d)
      const pick = () => CITY[Math.floor(r() * CITY.length)]
      out.push({ t, side: -(14.5 + r() * 2.5), w: 6.2, h: 6 + r() * 9, d: 7, c: pick() })
      out.push({ t: t + 0.006, side: 16.5 + r() * 2, w: 5.6, h: 2.8 + r() * 1.6, d: 5, c: pick() })
      out.push({ t: t + 0.01, side: -(25 + r() * 6), w: 8, h: 14 + r() * 16, d: 8, c: pick() })
    }
    return out
  }, [])
  const lamps = useMemo(() => Array.from({ length: Math.floor((dist(0.92) - dist(0.47)) / 11.4) }, (_, i) => tAt(dist(0.47) + i * 11.4)), [])
  return (
    <>
      {list.map((b, i) => (
        <At key={i} t={b.t} side={b.side} turn={0}><Building {...b} /></At>
      ))}
      {lamps.map((t) => (
        <At key={t} t={t} side={3.2} turn={0} rot={Math.PI}><Lamp /></At>
      ))}
    </>
  )
}

function KhaoGully() {
  return (
    <>
      <At t={0.455} face={false}>
        <M g="cyl" c="#3b3b4a" s={[0.22, 5.6, 0.22]} p={[-3.4, 2.8, 0]} />
        <M g="cyl" c="#3b3b4a" s={[0.22, 5.6, 0.22]} p={[3.4, 2.8, 0]} />
        <Exhibit id="khaogully" marker={[0, 6.6, 0]}>
          <Sign text="KhaoGully" w={6.6} h={1.5} p={[0, 5.2, 0]} r={[0, Math.PI, 0]} bg="#ff6b35" fg="#fff8ec" lit={0.6} back="#3b3b4a" />
        </Exhibit>
        <Halo p={[0, 5.2, -0.4]} s={9} />
      </At>
      <KhaoStalls />
    </>
  )
}

/** A KhaoGully rider doing laps of the city road. `dir` -1 rides the other lane, the other way. */
function Scooter({ start = 0, dir = 1 }: { start?: number; dir?: 1 | -1 }) {
  const ref = useRef<THREE.Group>(null!)
  const wheels = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const span = dist(0.895) - dist(0.455)
    const k = (clock.elapsedTime * 9 + start * span) % span
    const t = tAt(dir > 0 ? dist(0.455) + k : dist(0.895) - k)
    const p = place(t, dir > 0 ? 8.6 : 6.9)
    ref.current.position.set(p.x, 0, p.z)
    ref.current.rotation.y = dir > 0 ? p.yaw : p.yaw + Math.PI
    wheels.current.children.forEach((w) => (w.rotation.x = clock.elapsedTime * 14))
  })
  return (
    <group ref={ref}>
      <Tap
        onTap={() => {
          blip('honk')
          findEgg('scooter', 'beep beep. order #404 is on the way.')
        }}
      >
        <Hit s={2.6} p={[0, 0.9, 0]} />
        <group ref={wheels}>
          <M g="cyl" c="#1f1a1c" s={[0.5, 0.14, 0.5]} p={[0, 0.25, 0.7]} r={[0, 0, Math.PI / 2]} />
          <M g="cyl" c="#1f1a1c" s={[0.5, 0.14, 0.5]} p={[0, 0.25, -0.7]} r={[0, 0, Math.PI / 2]} />
        </group>
        <M c="#ff6b35" s={[0.4, 0.3, 1.5]} p={[0, 0.45, 0]} />
        <M c="#ff6b35" s={[0.36, 0.7, 0.14]} p={[0, 0.85, 0.66]} r={[-0.25, 0, 0]} />
        <M c="#2f2a33" s={[0.8, 0.06, 0.06]} p={[0, 1.22, 0.58]} />
        <M g="sph" m={glow('#fff3c4', 0.6, 2)} s={0.16} p={[0, 1.02, 0.78]} shadow={false} />
        {/* rider */}
        <M c="#3d5a80" s={[0.42, 0.6, 0.3]} p={[0, 1.05, -0.05]} />
        <M c="#e0a47a" s={[0.28, 0.28, 0.28]} p={[0, 1.52, -0.02]} />
        <M g="sph" c="#f5c23e" s={[0.36, 0.26, 0.36]} p={[0, 1.62, -0.03]} />
        {/* delivery box */}
        <M c="#2a2320" s={[0.6, 0.6, 0.6]} p={[0, 0.95, -0.62]} />
        <Sign text="KG" w={0.5} h={0.5} p={[0.31, 0.95, -0.62]} r={[0, Math.PI / 2, 0]} bg="#ff6b35" fg="#fff8ec" back={false} />
        <Sign text="KG" w={0.5} h={0.5} p={[-0.31, 0.95, -0.62]} r={[0, -Math.PI / 2, 0]} bg="#ff6b35" fg="#fff8ec" back={false} />
      </Tap>
    </group>
  )
}

/* ---------- 9 · 3D ---------- */

function Splat() {
  const pts = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const src = new THREE.TorusKnotGeometry(1, 0.36, 260, 14).attributes.position
    const r = rng(5)
    const pos = new Float32Array(src.count * 3), col = new Float32Array(src.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < src.count; i++) {
      pos.set([src.getX(i) + (r() - 0.5) * 0.12, src.getY(i) + (r() - 0.5) * 0.12, src.getZ(i) + (r() - 0.5) * 0.12], i * 3)
      c.setHSL(0.05 + (i / src.count) * 0.55, 0.85, 0.65).toArray(col, i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    pts.current.rotation.y = clock.elapsedTime * 0.35
    pts.current.rotation.x = Math.sin(clock.elapsedTime * 0.4) * 0.3
    pts.current.position.y = 3 + Math.sin(clock.elapsedTime * 0.9) * 0.15
  })
  return (
    <>
      <At t={0.818} side={-5.2} turn={0.5}>
        <Exhibit id="3d" marker={[1.6, 4.4, 0]} hit={[3, 4.5, 3]} hitAt={[0, 2, 0]}>
        <Scanner />
        <M g="cyl" c="#f7f3ea" s={[2.2, 0.5, 2.2]} p={[0, 0.25, 0]} />
        <M g="cyl" c="#3b3b4a" s={[1.6, 0.3, 1.6]} p={[0, 0.65, 0]} />
        <points ref={pts} geometry={geo} position={[0, 3, 0]}>
          <pointsMaterial size={0.04} vertexColors transparent opacity={0.9} depthWrite={false} />
        </points>
        <Halo p={[0, 3, 0]} s={5} />
        <Sign text={'the 3D phase\n~gaussian splats · blender · three.js'} w={3} h={0.75} p={[0, 0.45, 1.25]} r={[-0.3, 0, 0]} bg="#2a2320" fg="#ffe9c7" />
        </Exhibit>
      </At>
      {/* camera on a tripod, pointed at it */}
      <At t={0.812} side={3} turn={0.2}>
        {[0, 2.1, 4.2].map((a) => (
          <M key={a} c="#2f2a33" s={[0.05, 1.5, 0.05]} p={[Math.sin(a) * 0.3, 0.7, Math.cos(a) * 0.3]} r={[Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4]} />
        ))}
        <M c="#2f2a33" s={[0.42, 0.28, 0.24]} p={[0, 1.52, 0]} />
        <M g="cyl" c="#3b3b4a" s={[0.2, 0.2, 0.2]} p={[0, 1.52, 0.2]} r={[Math.PI / 2, 0, 0]} />
        <M g="sph" m={glow('#ff4d3d', 1, 1)} s={0.05} p={[0.15, 1.7, 0.1]} shadow={false} />
      </At>
    </>
  )
}

/* ---------- 10 · the lookout ---------- */

function Lookout() {
  const skyline = useMemo(() => {
    const r = rng(21)
    return Array.from({ length: 34 }, () => ({
      t: 1.2 + r() * 0.26, side: (r() - 0.5) * 260, w: 8 + r() * 7, h: 10 + r() * 30, d: 9, c: CITY[Math.floor(r() * CITY.length)],
    }))
  }, [])
  const stars = useMemo(() => {
    const r = rng(8)
    const pos = new Float32Array(420 * 3)
    for (let i = 0; i < 420; i++) pos.set([(r() - 0.5) * 900, 30 + r() * 260, -260 - r() * 160], i * 3)
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3))
  }, [])
  const starMat = useRef<THREE.PointsMaterial>(null!)
  const moonMat = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame(() => {
    starMat.current.opacity = night.v * night.v
    moonMat.current.opacity = night.v
  })
  const links: [string, string, number][] = [
    ['LinkedIn  →', ME.linkedin, 2.5],
    ['GitHub  →', ME.github, 2.0],
    ['Email  →', `mailto:${ME.email}`, 1.5],
  ]
  return (
    <>
      {skyline.map((b, i) => (
        <At key={i} t={b.t} side={b.side} face={false}><Building {...b} /></At>
      ))}
      <points geometry={stars} position={[0, 0, -TOTAL]}>
        <pointsMaterial ref={starMat} size={2.2} sizeAttenuation={false} color="#ffffff" transparent opacity={0} depthWrite={false} fog={false} />
      </points>
      <mesh geometry={G.sph} position={[-70, 95, -TOTAL - 330]} scale={34}>
        <meshBasicMaterial ref={moonMat} color="#f6f1dc" transparent opacity={0} fog={false} />
      </mesh>
      <At t={1.036} face={false}>
        {[-6, -4, -2, 0, 2, 4, 6].map((x) => <M key={x} c="#3b3b4a" s={[0.12, 1.1, 0.12]} p={[x, 0.55, 0]} />)}
        <M c="#3b3b4a" s={[12.4, 0.1, 0.16]} p={[0, 1.1, 0]} />
        <M c="#3b3b4a" s={[12.4, 0.06, 0.1]} p={[0, 0.6, 0]} />
      </At>
      <At t={1.02} side={2.6} face={false}><Bench /></At>
      <At t={1.004} side={-2.7} turn={0}><Lamp /></At>
      {/* signpost: each arrow is a real link */}
      <At t={1.024} side={-1.9} face={false} rot={Math.PI - 0.35}>
        <M g="cyl" c="#6a4a3a" s={[0.12, 3, 0.12]} p={[0, 1.5, 0]} />
        {links.map(([label, href, y], i) => (
          <Tap key={label} onTap={() => window.open(href, '_blank', 'noopener')} position={[0.15, y, 0.08]} rotation={[0, (i - 1) * 0.18, 0]}>
            <Sign text={label} w={1.5} h={0.4} bg={['#3d5a80', '#2a2320', '#ff6b35'][i]} fg="#fff8ec" lit={0.5} />
          </Tap>
        ))}
      </At>
      {/* bin */}
      <At t={0.995} side={3.3} turn={0.6}>
        <M g="cup" c="#3d8f7a" s={[0.6, 0.8, 0.6]} p={[0, 0.4, 0]} />
        <Sign text={'cups\ngo here'} w={0.4} h={0.3} p={[0, 0.45, 0.28]} back={false} hand />
      </At>
    </>
  )
}

/* ---------- pigeons ---------- */

function Pigeons({ t, side }: { t: number; side: number }) {
  const flock = useRef<THREE.Group>(null!)
  const fly = useRef(0)
  useFrame(({ clock }, dt) => {
    if (fly.current > 0) fly.current += dt
    const k = fly.current
    flock.current.children.forEach((b, i) => {
      if (k > 0) {
        b.position.x += dt * (2.5 + i)
        b.position.y = Math.min(k * k * 2.5, 30)
        b.position.z -= dt * (2 + i * 0.8)
        b.rotation.x = 0
        b.children[3].rotation.z = Math.sin(clock.elapsedTime * 30 + i) * 0.9
        b.children[4].rotation.z = -Math.sin(clock.elapsedTime * 30 + i) * 0.9
        b.visible = k < 7
      } else b.rotation.x = Math.max(0, Math.sin(clock.elapsedTime * 3 + i * 2.1)) * 0.6 // pecking
    })
  })
  return (
    <At t={t} side={side}>
      <Tap
        onTap={() => {
          if (fly.current > 0) return
          fly.current = 0.01
          blip('pop')
          findEgg('pigeon', 'they were in a meeting. you interrupted.')
        }}
      >
        <Hit s={1.8} p={[0, 0.3, 0]} />
        <group ref={flock}>
          {[[0, 0, 0.4], [0.5, 0.2, -0.6], [-0.45, -0.25, 2.2]].map(([x, z, r], i) => (
            <group key={i} position={[x, 0.14, z]} rotation={[0, r, 0]}>
              <M g="ico" c="#8e94a3" s={[0.2, 0.2, 0.34]} />
              <M g="ico" c="#6d7fa3" s={0.14} p={[0, 0.14, 0.16]} />
              <M g="cone" c="#f5c23e" s={[0.04, 0.08, 0.04]} p={[0, 0.13, 0.26]} r={[Math.PI / 2, 0, 0]} />
              <M c="#7c8291" s={[0.26, 0.02, 0.18]} p={[0.14, 0.04, 0]} />
              <M c="#7c8291" s={[0.26, 0.02, 0.18]} p={[-0.14, 0.04, 0]} />
            </group>
          ))}
        </group>
      </Tap>
    </At>
  )
}

const lite = window.matchMedia('(pointer: coarse)').matches

export function World() {
  return (
    <>
      <Ground />
      <Trees />
      <Meadow />
      <Foliage lite={lite} />
      <CoffeeStall />
      <RabbitHole />
      <DesignLane />
      <Campus />
      <FirstGig />
      <Hackathon />
      <WetCat />
      <City />
      <KhaoGully />
      <Scooter />
      <Scooter start={0.15} dir={-1} />
      <Scooter start={0.29} />
      <TrophyStage><Team /></TrophyStage>
      <InternshipDoor />
      <MedalWall />
      <InstallCounter />
      <PhoneBillboard />
      <DeliveryPins />
      <NeuralNet />
      <Engine />
      <Scenes />
      <Splat />
      <Lookout />
      <Pigeons t={0.196} side={1.5} />
      <Pigeons t={0.596} side={-1.6} />
      <Pigeons t={0.965} side={1.4} />
    </>
  )
}
