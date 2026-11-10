// After the KhaoGully booths: the stack as a claw machine, the street lifting to show the
// engine room underneath (wire an order, survive the lunch rush, the ₹582 bug), and the AWS cloud.
import * as THREE from 'three'
import { useMemo, useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { live, openProject } from '../state'
import { blip } from '../sound'
import { CLOUD_U, CORE_U, ROOM_U, STEPS, eng, eu, roomAt } from '../engine'
import { At, G, Halo, Hit, M, Sign, Tap, glow, mat, type V3 } from './kit'
import { useScreen } from './Flex'
import { Npc, Puffs } from './Stalls'
import { Exhibit, Near } from './Exhibit'
import { ClawMachine } from './Claw'
import { smooth } from './path'

const MONO = 'ui-monospace, "SF Mono", Menlo, monospace'
const FONT = '"Bricolage Grotesque", system-ui, sans-serif'

/** A bouncing arrow over whatever can be tapped next. */
function Pointer({ at }: { at: RefObject<V3 | null> }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const p = at.current
    ref.current.visible = !!p
    if (p) ref.current.position.set(p[0], p[1] + 0.25 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.35, p[2])
  })
  return (
    <group ref={ref}>
      <M g="cone" m={glow('#ff6b35', 0.6, 1)} s={[0.42, 0.6, 0.42]} r={[Math.PI, 0, 0]} p={[0, 0.3, 0]} />
      <Sign text="tap" w={0.62} h={0.32} p={[0, 0.95, 0]} bg="#ff6b35" fg="#fff8ec" hand lit={0.6} back={false} />
    </group>
  )
}

/* ---------- 2 · the engine room ---------- */

const W = 16, D = 5.6
const NODE: Record<string, V3> = {
  app: [-6.1, 0, 0.8], api: [-2.6, 0, -0.3], db: [0.3, 0, -1.6], vault: [-0.4, 0, 1.6], pool: [2.6, 0, 0.5], rest: [6.1, 0, -0.4],
}
const WIRES: [string, string][] = [['app', 'api'], ['api', 'db'], ['api', 'pool'], ['pool', 'rest']]
const v3 = (p: V3, y = 0) => new THREE.Vector3(p[0], p[1] + y, p[2])

function arc(a: V3, b: V3, lift = 1, y0 = 0.6) {
  const m = v3(a).lerp(v3(b), 0.5)
  m.y = y0 + lift
  return new THREE.CatmullRomCurve3([v3(a, y0), m, v3(b, y0)])
}
const CURVES = WIRES.map(([a, b]) => arc(NODE[a], NODE[b], 0.9))
const WEBHOOK = arc(NODE.vault, NODE.api, 1.8, 0.8)
const COIN_DROP = 2.2

/** Hanging loose from its source, plug dangling, until it is connected. */
function looseCable(a: V3, b: V3) {
  const dir = v3(b).sub(v3(a)).setY(0).normalize()
  const p0 = v3(a, 0.6), p1 = v3(a, 0.5).addScaledVector(dir, 0.9), p2 = v3(a, 0.12).addScaledVector(dir, 1.6)
  return { geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p0, p1, p2]), 16, 0.07, 8), plug: p2 }
}

const wireOff = mat('#7b7488')
const wireOn = glow('#ff8a3d', 0.55, 1.4)
const hookMat = glow('#5b8def', 0.6, 1.4)
const parcelGeo = new THREE.BoxGeometry(0.3, 0.24, 0.3)
const parcelMat = glow('#ff6b35', 0.25, 0.8)
const MAX = 48

type Parcel = { seg: number; k: number }

function board(g: CanvasRenderingContext2D, w: number, h: number, lines: [string, string][], bg = '#1e1b2a') {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.textBaseline = 'middle'
  lines.forEach(([text, color], i) => {
    g.fillStyle = color
    g.font = i === 0 ? `800 ${h * 0.3}px ${FONT}` : `600 ${h * 0.17}px ${MONO}`
    g.fillText(text, w * 0.06, i === 0 ? h * 0.32 : h * (0.32 + 0.25 * i))
  })
}

function EngineRoom() {
  const lid = useRef<THREE.Group>(null!)
  const live$ = useRef({ wired: 0, rush: false, fixed: false, stage: 0, a: -99 })
  const parcels = useRef<Parcel[]>([])
  const fx = useRef({ spawn: 0, queue: 0, drain: 0, pool: 0, flash: 0, coinT: -1, pulse: 0 })
  const inst = useRef<THREE.InstancedMesh>(null!)
  const on = useRef<THREE.Mesh[]>([])
  const off = useRef<THREE.Group[]>([])
  const fat = useRef<THREE.Mesh>(null!)
  const seats = useRef<THREE.Mesh[]>([])
  const hand = useRef<THREE.Group>(null!)
  const lever = useRef<THREE.Group>(null!)
  const button = useRef<THREE.Mesh>(null!)
  const fixSign = useRef<THREE.Group>(null!)
  const apiGlow = useRef<THREE.Mesh>(null!)
  const coin = useRef<THREE.Mesh>(null!)
  const gate = useRef<THREE.Group>(null!)
  const gateArm = useRef<THREE.Mesh>(null!)
  const beacon = useRef<THREE.Group>(null!)
  const hook = useRef<THREE.Group>(null!)
  const hookPulse = useRef<THREE.Mesh>(null!)
  const hint = useRef<V3 | null>(null)

  const loose = useMemo(() => WIRES.map(([a, b]) => looseCable(NODE[a], NODE[b])), [])
  const tubes = useMemo(() => CURVES.map((c) => new THREE.TubeGeometry(c, 40, 0.07, 8)), [])
  const fatTube = useMemo(() => new THREE.TubeGeometry(CURVES[0], 40, 0.17, 10), [])
  const hookTube = useMemo(() => new THREE.TubeGeometry(WEBHOOK, 40, 0.05, 6), [])
  const red = useMemo(() => glow('#ff4d4d', 0.8, 1), [])
  const green = useMemo(() => glow('#3ddc97', 0.7, 1), [])
  const seatOff = mat('#cfc6b4'), seatOn = glow('#ff8a3d', 0.6, 1)

  const latency = useScreen(512, 200)
  const status = useScreen(640, 220)
  const drawn = useRef({ latency: '', status: '' })

  const connect = (to: string) => {
    const s = live$.current
    if (s.wired < 4 && WIRES[s.wired][1] === to) {
      eng.wired = s.wired + 1
      blip('pop')
    }
  }

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const time = clock.elapsedTime
    const a = roomAt(live.t)
    const s = live$.current
    s.a = a
    lid.current.rotation.x = -1.75 * smooth(-17, -9, a)

    // what has happened, by scroll position or by tap, whichever came first
    const autoWired = Math.floor(4 * smooth(STEPS.wire[0], STEPS.wire[1], a) + 0.001)
    s.wired = Math.max(autoWired, eng.wired)
    s.rush = s.wired === 4 && (eng.rush || a > STEPS.rushAuto)
    s.fixed = s.rush && (eng.fixed || a > STEPS.fixAuto)
    const [i1, i2, i3] = STEPS.incident
    s.stage = a < i1 ? 0 : a < i2 ? 1 : a < i3 ? 2 : 3

    WIRES.forEach((_, i) => {
      on.current[i].visible = i < s.wired
      off.current[i].visible = i >= s.wired
    })
    fat.current.visible = s.fixed
    on.current[0].visible = s.wired > 0 && !s.fixed

    // parcels: app → api → pool, and once a pool fills, pool → restaurant
    const f = fx.current
    const clog = s.rush && !s.fixed
    if (s.wired >= 3) {
      f.spawn -= dt
      if (f.spawn <= 0 && parcels.current.length < MAX - 12) {
        parcels.current.push({ seg: 0, k: 0 })
        f.spawn = s.rush ? 0.22 : 1.1
      }
    } else parcels.current.length = 0
    const speed = clog ? 0.28 : s.rush ? 0.75 : 0.42
    parcels.current = parcels.current.filter((p) => {
      p.k += dt * speed
      if (p.k < 1) return true
      if (p.seg === 0) {
        if (clog) {
          f.queue = Math.min(12, f.queue + 1)
          return false
        }
        p.seg = 2
        p.k = 0
        return true
      }
      if (p.seg === 2) {
        f.pool++
        if (f.pool >= seats.current.length) {
          f.pool = 0
          f.flash = 1
          if (s.wired === 4) parcels.current.push({ seg: 3, k: 0 })
        }
        return false
      }
      return false
    })
    if (!clog && f.queue > 0) {
      f.drain -= dt
      if (f.drain <= 0) {
        f.queue--
        parcels.current.push({ seg: 2, k: 0 })
        f.drain = 0.12
      }
    }
    const o = new THREE.Object3D()
    let n = 0
    for (const p of parcels.current) {
      CURVES[p.seg].getPoint(Math.min(1, p.k), o.position)
      o.position.y += 0.05
      o.rotation.set(0, p.k * 3, 0)
      o.scale.setScalar(p.seg === 3 ? 1.6 : 1)
      o.updateMatrix()
      inst.current.setMatrixAt(n++, o.matrix)
    }
    // the pile-up outside the API while it is choking
    for (let q = 0; q < f.queue; q++) {
      o.position.set(NODE.api[0] - 1.25 - (q % 3) * 0.32, 0.12 + Math.floor(q / 3) * 0.25, NODE.api[2] + 0.55 + (q % 2) * 0.1)
      o.rotation.set(0, q * 0.7, 0)
      o.scale.setScalar(1)
      o.updateMatrix()
      inst.current.setMatrixAt(n++, o.matrix)
    }
    inst.current.count = n
    inst.current.instanceMatrix.needsUpdate = true

    // pool: seats light up as orders join, then the pool closes and goes out as one delivery
    f.flash = Math.max(0, f.flash - dt * 1.5)
    seats.current.forEach((m, i) => (m.material = i < f.pool || f.flash > 0.3 ? seatOn : seatOff))
    hand.current.rotation.y = -time * (s.rush ? 2.2 : 1)

    lever.current.rotation.z = THREE.MathUtils.damp(lever.current.rotation.z, s.rush ? -0.7 : 0.7, 8, dt)
    button.current.material = s.fixed ? green : red
    button.current.scale.y = clog ? 0.25 + Math.abs(Math.sin(time * 6)) * 0.08 : 0.25
    fixSign.current.visible = clog
    apiGlow.current.visible = clog && Math.sin(time * 8) > 0

    // the ₹582 bug: paid → order bounces off the database → the webhook retries → fixed
    if (s.stage >= 1 && f.coinT < 0) f.coinT = time
    if (s.stage === 0) f.coinT = -1
    const ck = f.coinT < 0 ? 0 : Math.min(1, (time - f.coinT) / 0.9)
    coin.current.visible = s.stage >= 1 && ck < 1
    coin.current.position.y = 0.9 + COIN_DROP * (1 - ck * ck)
    coin.current.rotation.y = time * 6
    const bad = s.stage === 1 || s.stage === 2
    gate.current.visible = s.stage >= 1
    gateArm.current.material = bad ? red : green
    gateArm.current.rotation.z = THREE.MathUtils.damp(gateArm.current.rotation.z, bad ? 0 : 1.3, 6, dt)
    beacon.current.visible = bad
    beacon.current.rotation.y = time * 5
    hook.current.visible = s.stage >= 2
    if (s.stage === 2) WEBHOOK.getPoint((time * 0.6) % 1, hookPulse.current.position)
    hookPulse.current.visible = s.stage === 2

    // boards, repainted only when their text changes
    const lat: [string, string][] = clog
      ? [['p95 12.3 s 🔥', '#ff7a6b'], ['20 requests · loop blocked', '#f4efdf'], [`${f.queue} orders waiting`, '#f5c23e']]
      : s.fixed
        ? [['p95 1.4 s ✓', '#3ddc97'], ['db calls off the event loop', '#f4efdf'], ['lunch rush: handled', '#f5c23e']]
        : [['p95 0.4 s', '#9fd8ff'], ['FastAPI · 2 workers', '#f4efdf'], [s.wired < 4 ? 'waiting for wiring…' : 'all good', '#f5c23e']]
    const latKey = lat.map((l) => l[0]).join()
    if (drawn.current.latency !== latKey) {
      drawn.current.latency = latKey
      board(latency.g, 512, 200, lat)
      latency.tex.needsUpdate = true
    }
    const st: [string, string][] = [
      [['incident board', '#9fd8ff'], ['all orders flowing', '#f4efdf'], ['nothing on fire. yet.', '#f5c23e']],
      [['₹582 paid · no order', '#ff7a6b'], ['razorpay: captured ✓', '#f4efdf'], ['db: check constraint ✕', '#ff7a6b']],
      [['webhook retry…', '#9fd8ff'], ['same rule, same error ✕', '#ff7a6b'], ['flagged, not lost', '#f5c23e']],
      [['fixed ✓', '#3ddc97'], ['migration + schema check on boot', '#f4efdf'], ['money moves last now', '#f5c23e']],
    ][s.stage] as [string, string][]
    const stKey = st[0][0]
    if (drawn.current.status !== stKey) {
      drawn.current.status = stKey
      board(status.g, 640, 220, st, s.stage === 1 || s.stage === 2 ? '#2a1620' : '#1e1b2a')
      status.tex.needsUpdate = true
    }

    // what to tap next
    hint.current =
      a < -16 || a > STEPS.done
        ? null
        : s.wired < 4
          ? (() => { const p = NODE[WIRES[s.wired][1]]; return [p[0], 3.4, p[2]] as V3 })()
          : !s.rush
            ? [NODE.app[0] - 0.4, 2.2, NODE.app[2] + 1.4]
            : !s.fixed
              ? [NODE.api[0] + 0.7, 1.7, NODE.api[2] + 0.9]
              : null
  })

  const node = (id: string) => ({ position: NODE[id] })

  return (
    <At t={eu(ROOM_U)} side={-7.8} turn={0.12}>
      {/* the pit: dark floor, and a cut edge that shows the ground in layers */}
      <M c="#5a5272" s={[W, 0.2, D]} p={[0, 0.1, 0]} />
      {[['#6fae5c', 0.62], ['#a8805a', 0.4], ['#7d5a44', 0.18]].map(([c, y]) => (
        <group key={c as string}>
          <M c={c as string} s={[W + 0.4, 0.22, 0.4]} p={[0, y as number, D / 2]} />
          <M c={c as string} s={[0.4, 0.22, D]} p={[W / 2, y as number, 0]} />
          <M c={c as string} s={[0.4, 0.22, D]} p={[-W / 2, y as number, 0]} />
        </group>
      ))}
      {/* the street, lifted like a lid; its underside is pipes and roots */}
      <group ref={lid} position={[0, 0.2, -D / 2]}>
        <group position={[0, 0.15, D / 2]}>
          <M c="#8f8a9c" s={[W, 0.3, D]} />
          <M c="#5a4636" s={[W - 0.3, 0.06, D - 0.3]} p={[0, -0.17, 0]} />
          {[-1.4, 0, 1.4].map((z) => <M key={z} g="cyl" c="#b9b4ad" s={[0.3, W - 0.8, 0.3]} p={[0, -0.32, z]} r={[0, 0, Math.PI / 2]} />)}
          {[-5, -1, 3.5, 6].map((x) => <M key={x} g="cone" c="#7a4b30" s={[0.12, 0.7, 0.12]} p={[x, -0.5, 0.8 - (x % 2)]} r={[Math.PI, 0, 0]} />)}
          <M c="#e9e4d4" s={[W - 1, 0.04, 0.16]} p={[0, 0.17, 0]} shadow={false} />
        </group>
      </group>
      <Sign text={'ENGINE ROOM\n~what actually runs KhaoGully'} w={4.6} h={1.1} p={[-W / 2 + 2.6, 1.1, D / 2 + 0.3]} bg="#2a2320" fg="#fff8ec" lit={0.5} back="#ff6b35" />

      {/* wires */}
      {WIRES.map(([from], i) => (
        <group key={i}>
          <mesh ref={(m) => { if (m) on.current[i] = m }} geometry={tubes[i]} material={wireOn} />
          <group ref={(g) => { if (g) off.current[i] = g }}>
            <mesh geometry={loose[i].geo} material={wireOff} />
            <M c="#2a2320" s={[0.22, 0.16, 0.3]} p={[loose[i].plug.x, loose[i].plug.y, loose[i].plug.z]} />
          </group>
          {from === 'app' && <mesh ref={fat} geometry={fatTube} material={wireOn} />}
        </group>
      ))}
      <instancedMesh ref={inst} args={[parcelGeo, parcelMat, MAX]} castShadow frustumCulled={false} />

      {/* the customer app */}
      <group {...node('app')}>
        <Tap onTap={() => connect('app')}>
          <M c="#2a2320" s={[1.2, 2.1, 0.18]} p={[0, 1.25, 0]} r={[-0.15, 0, 0]} />
          <Sign text={'KhaoGully\n~🍛 order placed'} w={1} h={1.75} p={[0, 1.27, 0.11]} r={[-0.15, 0, 0]} bg="#ff6b35" fg="#fff8ec" lit={0.6} back={false} />
          <M c="#5b5466" s={[0.7, 0.2, 0.5]} p={[0, 0.25, -0.1]} />
        </Tap>
        <Sign text="app" w={0.9} h={0.36} p={[0, 0.5, 0.75]} bg="#fff8ec" back="#2a2320" />
        {/* the lunch-rush lever */}
        <Tap onTap={() => { eng.wired = 4; eng.rush = true; blip('pop') }}>
          <group position={[-0.4, 0.2, 1.4]}>
            <M c="#5b5466" s={[0.6, 0.3, 0.5]} />
            <group ref={lever} position={[0, 0.15, 0]}>
              <M c="#9aa3b5" s={[0.08, 0.9, 0.08]} p={[0, 0.45, 0]} />
              <M g="sph" c="#ff4d4d" s={0.26} p={[0, 0.92, 0]} />
            </group>
            <Sign text="1 PM rush" w={1.1} h={0.34} p={[0, -0.05, 0.3]} bg="#f5c23e" hand back={false} />
            <Hit s={1.4} p={[0, 0.5, 0]} />
          </group>
        </Tap>
      </group>

      {/* the API */}
      <group {...node('api')}>
        <Tap onTap={() => connect('api')}>
          <M c="#3d5a80" s={[1.9, 1.5, 1.4]} p={[0, 0.95, 0]} />
          <M c="#2a3f5c" s={[2.05, 0.2, 1.55]} p={[0, 1.78, 0]} />
          {[-0.45, 0.45].map((x) => <M key={x} m={glow('#ffd08a', 0.5, 1)} s={[0.5, 0.75, 0.05]} p={[x, 0.75, 0.71]} />)}
          <mesh ref={apiGlow} geometry={G.box} material={red} scale={[2, 1.6, 1.5]} position={[0, 0.95, 0]} />
          <Sign text="API · FastAPI" w={1.7} h={0.36} p={[0, 1.4, 0.72]} bg="#fff8ec" back={false} />
        </Tap>
        <mesh geometry={G.plane} material={latency.material} position={[0, 2.75, 0]} scale={[2.3, 0.9, 1]} />
        <M c="#2a2320" s={[2.4, 1, 0.08]} p={[0, 2.75, -0.06]} />
        {/* unblock-the-loop button */}
        <Tap onTap={() => { if (live$.current.rush) { eng.fixed = true; blip('pop') } }}>
          <group position={[0.75, 0.2, 1.05]}>
            <M c="#5b5466" s={[0.5, 0.6, 0.5]} p={[0, 0.3, 0]} />
            <mesh ref={button} geometry={G.cyl} material={red} position={[0, 0.65, 0]} scale={[0.4, 0.25, 0.4]} />
            <Hit s={1.3} p={[0, 0.6, 0]} />
          </group>
        </Tap>
        <group ref={fixSign}>
          <Sign text="unblock the loop" w={1.6} h={0.36} p={[0.8, 1.35, 1.35]} bg="#ff6b35" fg="#fff8ec" hand lit={0.6} back={false} />
        </group>
      </group>

      {/* Postgres, the gate the bad order bounces off, and the on-call engineer */}
      <Exhibit id="kg-incident" marker={[1.6, 3.9, -1.6]}>
        <group {...node('db')}>
          <Tap onTap={() => connect('db')}>
            {[0.35, 0.85, 1.35].map((y) => <M key={y} g="cyl" c="#5b8def" s={[1.2, 0.42, 1.2]} p={[0, y, 0]} />)}
            <Sign text="Postgres" w={1.2} h={0.32} p={[0, 0.85, 0.62]} bg="#fff8ec" back={false} />
          </Tap>
          <group ref={beacon} position={[0, 1.75, 0]}>
            <M g="sph" m={red} s={0.32} />
            <Halo s={2.4} />
          </group>
          <group ref={gate} position={[-0.9, 0, 0.9]}>
            <M c="#2a2320" s={[0.16, 0.8, 0.16]} p={[0, 0.4, 0]} />
            <mesh ref={gateArm} geometry={G.box} material={red} position={[0, 0.78, 0]} scale={[0.1, 0.1, 0.1]}>
              <mesh geometry={G.box} material={red} position={[6, 0, 0]} scale={[12, 1, 1]} />
            </mesh>
          </group>
          <mesh geometry={G.plane} material={status.material} position={[1.6, 2.6, 0]} scale={[2.9, 1, 1]} />
          <M c="#2a2320" s={[3, 1.1, 0.08]} p={[1.6, 2.6, -0.06]} />
        </group>
        <Npc
          look={{ top: '#f2643d', legs: '#39425e', hair: '#231c1e' }}
          p={[2.3, 0, -1.5]}
          r={-0.6}
          armL={[-1.1, 0, 0]}
          armR={[-1.1, 0, 0]}
          anim={(n, time) => {
            const alarm = live$.current.stage === 1 || live$.current.stage === 2
            const k = alarm ? 22 : 9
            n.armL.rotation.x = -1.1 + Math.sin(time * k) * 0.12
            n.armR.rotation.x = -1.1 + Math.sin(time * k + 1.5) * 0.12
            n.head.rotation.y = alarm ? Math.sin(time * 3) * 0.5 : -0.2
          }}
        >
          <M c="#2a2320" s={[0.7, 0.05, 0.5]} p={[0, 0.98, 0.45]} />
          <M c="#9fd8ff" m={glow('#9fd8ff', 0.6, 1)} s={[0.66, 0.42, 0.04]} p={[0, 1.2, 0.68]} r={[-0.4, 0, 0]} />
        </Npc>
      </Exhibit>

      {/* Razorpay, and the webhook that tries to rescue the payment */}
      <group {...node('vault')}>
        <M c="#9aa3b5" s={[1.2, 1, 1]} p={[0, 0.55, 0]} />
        <M g="cyl" c="#5b5466" s={[0.5, 0.06, 0.5]} p={[0, 0.6, 0.52]} r={[Math.PI / 2, 0, 0]} />
        <Sign text="Razorpay" w={1.1} h={0.3} p={[0, 1.18, 0.1]} r={[-Math.PI / 2, 0, 0]} bg="#3d5a80" fg="#fff8ec" back={false} />
        <mesh ref={coin} geometry={G.cyl} material={glow('#f5c23e', 0.6, 0.8)} scale={[0.4, 0.07, 0.4]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <group ref={hook}>
        <mesh geometry={hookTube} material={hookMat} />
        <mesh ref={hookPulse} geometry={G.sph} material={hookMat} scale={0.28} />
        <Sign text="webhook" w={1} h={0.3} p={[(NODE.vault[0] + NODE.api[0]) / 2, 2.8, (NODE.vault[2] + NODE.api[2]) / 2]} bg="#5b8def" fg="#fff8ec" back={false} />
      </group>

      {/* the pool: seats fill, the clock sweeps, then it ships as one delivery */}
      <group {...node('pool')}>
        <Tap onTap={() => connect('pool')}>
          <M g="cyl" c="#e8e1d0" s={[2.3, 0.3, 2.3]} p={[0, 0.15, 0]} />
          <M g="cyl" c="#2a2320" s={[0.9, 0.12, 0.9]} p={[0, 0.36, 0]} />
          <group ref={hand} position={[0, 0.44, 0]}>
            <M c="#ff6b35" s={[0.06, 0.06, 0.42]} p={[0, 0, 0.21]} />
          </group>
          {[0, 1, 2, 3, 4].map((i) => {
            const ang = (i / 5) * Math.PI * 2
            return <mesh key={i} ref={(m) => { if (m) seats.current[i] = m }} geometry={G.cyl} material={seatOff} position={[Math.sin(ang) * 0.85, 0.42, Math.cos(ang) * 0.85]} scale={[0.32, 0.22, 0.32]} castShadow />
          })}
          <Sign text={'pool\n~ships every 60 s'} w={1.5} h={0.6} p={[0, 0.6, 1.35]} bg="#fff8ec" back="#2a2320" />
        </Tap>
      </group>

      {/* the restaurant */}
      <group {...node('rest')}>
        <Tap onTap={() => connect('rest')}>
          <M c="#c9483f" s={[1.8, 0.9, 1.1]} p={[0, 0.55, 0]} />
          <M c="#efe4cf" s={[1.9, 0.1, 1.2]} p={[0, 1.05, 0]} />
          <M g="cyl" c="#2a2320" s={[0.6, 0.08, 0.6]} p={[0.3, 1.14, 0]} />
          <Puffs p={[0.3, 1.25, 0]} n={3} size={0.12} />
          <Sign text="restaurant" w={1.3} h={0.32} p={[0, 0.6, 0.56]} bg="#fff8ec" back={false} />
        </Tap>
      </group>

      <Pointer at={hint} />
    </At>
  )
}

/* ---------- 3 · the AWS cloud ---------- */

const SERVICES = ['EC2', 'ECS', 'Lambda', 'S3', 'RDS', 'SQS', 'CloudFront', 'IAM']

function AwsCloud() {
  const ref = useRef<THREE.Group>(null!)
  const workers = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    ref.current.position.y = 3.9 + Math.sin(time * 0.8) * 0.18
    // Lambda workers pop up, do a job, and vanish
    workers.current.children.forEach((c, i) => {
      const k = (time * 0.7 + i / 3) % 1
      c.position.y = 1 + k * 1.1
      c.scale.setScalar(Math.sin(k * Math.PI) * 0.9)
    })
  })
  const puffs: [number, number, number, number][] = [[0, 0, 0, 2.6], [1.9, -0.2, 0.3, 1.9], [-2, -0.15, 0.2, 2], [0.9, 0.5, -0.6, 1.8], [-1, 0.45, -0.5, 1.7], [3.4, -0.4, 0, 1.3], [-3.5, -0.35, 0, 1.4]]
  return (
    <At t={eu(CLOUD_U)} side={-6} turn={0.2}>
      <M g="cyl" c="#3b3b4a" s={[0.12, 3.6, 0.12]} p={[0, 1.8, 0]} />
      <Exhibit id="aws" marker={[0, 6.6, 0]}>
        <group ref={ref}>
          {puffs.map(([x, y, z, r], i) => <M key={i} g="sph" c="#fdfbff" s={[r, r * 0.62, r * 0.8]} p={[x, y, z]} />)}
          {SERVICES.map((label, i) => {
            const x = ((i % 4) - 1.5) * 1.35, z = i < 4 ? -0.5 : 0.65
            return (
              <group key={label} position={[x, 0.75, z]}>
                <M c={i % 2 ? '#232f3e' : '#ff9900'} s={[1.15, 0.36, 0.8]} />
                <Sign text={label} w={1.05} h={0.3} p={[0, 0, 0.41]} bg={i % 2 ? '#232f3e' : '#ff9900'} fg="#fff8ec" back={false} lit={0.6} />
              </group>
            )
          })}
          <group ref={workers} position={[0.7, 0.4, 0]}>
            {[0, 1, 2].map((i) => (
              <group key={i} position={[(i - 1) * 1.6, 1, 0.2]}>
                <Sign text="λ" w={0.42} h={0.42} bg="#ff9900" fg="#232f3e" back={false} lit={0.6} />
              </group>
            ))}
          </group>
          <Sign text="AWS" w={1.4} h={0.5} p={[0, 0.2, 1.75]} bg="#232f3e" fg="#ff9900" lit={0.6} back={false} />
        </group>
      </Exhibit>
    </At>
  )
}

export function Engine() {
  return (
    <>
      <Near t={eu(CORE_U)}><ClawMachine /></Near>
      <Near t={eu(ROOM_U)}><EngineRoom /></Near>
      <Near t={eu(CLOUD_U)}><AwsCloud /></Near>
    </>
  )
}
