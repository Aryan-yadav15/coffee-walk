// The engine room: KhaooGully's three backends as three kitchens. Each is an open-fronted
// building with its service at the back and its database in a server rack, and they talk
// through glass event capsules in a pneumatic tube over the roofs. The lunch rush and the
// ₹582 bug play out in the customer kitchen. Tap a kitchen to inspect it.
import * as THREE from 'three'
import { useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { get, set } from '../state'
import { blip } from '../sound'
import { KITCHEN_X, KITCHEN_Z, STEPS, eng } from '../engine'
import { G, Halo, Hit, M, Sign, Tap, capsule, glow, mat, toon, torus, type V3 } from './kit'
import { smooth } from './path'

const W = 20, D = 9.2, TOP = 0.3
type Curve = THREE.Curve<THREE.Vector3>

const v = (x: number, z: number, y = 0.4) => new THREE.Vector3(x, TOP + y, z)
function arc(a: THREE.Vector3, b: THREE.Vector3, lift = 0.6) {
  const m = a.clone().lerp(b, 0.5)
  m.y += lift
  return new THREE.CatmullRomCurve3([a, m, b])
}
const path = (...pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal')
const LEN = new Map<Curve, number>()
const len = (c: Curve) => LEN.get(c) ?? (LEN.set(c, c.getLength()), LEN.get(c)!)

/** What the room is doing right now, shared by everything in it. */
type Story = { a: number; rush: boolean; fixed: boolean; clog: boolean; stage: number; queue: number }

/* ---------- crisp monospace screens ---------- */

const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace'
const INK = '#121419'
const WHITE = '#e8f1ff'
const AMBER = '#ffb547'
const GREEN = '#7dffb0'
const RED = '#ff6b6b'
const PPU = 220 // canvas pixels per world unit

type Line = { t: string; c?: string; s?: number }
type Screen = { g: CanvasRenderingContext2D; tex: THREE.CanvasTexture; material: THREE.MeshBasicMaterial; w: number; h: number }

function makeScreen(w: number, h: number): Screen {
  const c = document.createElement('canvas')
  c.width = Math.round(w * PPU)
  c.height = Math.round(h * PPU)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { g: c.getContext('2d')!, tex, material: new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), w: c.width, h: c.height }
}

/** Dark panel, hairline border, optional colour stripe on top, lines of monospace text. */
function paint(s: Screen, lines: Line[], stripe?: string) {
  const { g, w, h } = s
  g.fillStyle = INK
  g.fillRect(0, 0, w, h)
  const pad = Math.min(w, h) * 0.1
  let y = pad
  if (stripe) {
    g.fillStyle = stripe
    g.fillRect(0, 0, w, h * 0.09)
    y += h * 0.07
  }
  g.strokeStyle = 'rgba(232,241,255,0.45)'
  g.lineWidth = 3
  g.strokeRect(5, 5, w - 10, h - 10)
  const total = lines.reduce((a, l) => a + (l.s ?? 1), 0)
  const unit = (h - y - pad) / total
  g.textBaseline = 'middle'
  for (const l of lines) {
    const weight = (l.s ?? 1) > 1.2 ? 700 : 500
    let size = unit * (l.s ?? 1) * 0.78
    g.font = `${weight} ${size}px ${MONO}`
    while (g.measureText(l.t).width > w - pad * 2 && size > 8) {
      size *= 0.92
      g.font = `${weight} ${size}px ${MONO}`
    }
    g.fillStyle = l.c ?? WHITE
    g.fillText(l.t, pad, y + (unit * (l.s ?? 1)) / 2)
    y += unit * (l.s ?? 1)
  }
  s.tex.needsUpdate = true
}

const fontReady = document.fonts.load(`500 20px "JetBrains Mono"`).catch(() => {})

/** A static monospace label. Leaned back to face the high camera unless told otherwise. */
function Mono({ lines, w, h, p, r = [-0.55, 0, 0], stripe }: { lines: Line[]; w: number; h: number; p: V3; r?: V3; stripe?: string }) {
  const key = lines.map((l) => l.t).join()
  const s = useMemo(() => {
    const s = makeScreen(w, h)
    paint(s, lines, stripe)
    fontReady.then(() => paint(s, lines, stripe))
    return s
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, stripe, key])
  return (
    <group position={p} rotation={r}>
      <M c={INK} s={[w + 0.06, h + 0.06, 0.05]} />
      <mesh geometry={G.plane} material={s.material} scale={[w, h, 1]} position={[0, 0, 0.03]} />
    </group>
  )
}

/** A monospace screen that repaints itself twice a second from `read`. */
function Live({ read, w, h, p, r = [-0.15, 0, 0] }: { read: (time: number) => { lines: Line[]; stripe?: string }; w: number; h: number; p: V3; r?: V3 }) {
  const s = useMemo(() => makeScreen(w, h), [w, h])
  const next = useRef(0)
  useFrame(({ clock }) => {
    if (clock.elapsedTime < next.current) return
    next.current = clock.elapsedTime + 0.5
    const { lines, stripe } = read(clock.elapsedTime)
    paint(s, lines, stripe)
  })
  return (
    <group position={p} rotation={r}>
      <M c={INK} s={[w + 0.08, h + 0.08, 0.06]} />
      <mesh geometry={G.plane} material={s.material} scale={[w, h, 1]} position={[0, 0, 0.035]} />
    </group>
  )
}

/* ---------- moving things ---------- */

/** Packets running along routes (each a chain of curves). `every` seconds apart; Infinity pauses it. */
function Flow({ routes, every, color, size = [0.24, 0.18, 0.24], speed = 3, max = 60, round, onArrive }: { routes: Curve[][]; every: () => number; color: string; size?: V3; speed?: number; max?: number; round?: boolean; onArrive?: (route: number) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const live = useRef<{ r: Curve[]; i: number; seg: number; k: number }[]>([])
  const clock = useRef(Math.random())
  const geo = useMemo(() => (round ? new THREE.SphereGeometry(0.5, 14, 10) : new THREE.BoxGeometry(1, 1, 1)), [round])
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    clock.current -= dt
    if (clock.current <= 0 && live.current.length < max) {
      const i = Math.floor(Math.random() * routes.length)
      const gap = every()
      if (Number.isFinite(gap)) live.current.push({ r: routes[i], i, seg: 0, k: 0 })
      clock.current = Number.isFinite(gap) ? gap : 0.5
    }
    const o = new THREE.Object3D()
    let n = 0
    live.current = live.current.filter((p) => {
      p.k += (dt * speed) / len(p.r[p.seg])
      if (p.k >= 1) {
        if (p.seg + 1 >= p.r.length) {
          onArrive?.(p.i)
          return false
        }
        p.seg++
        p.k = 0
      }
      p.r[p.seg].getPoint(p.k, o.position)
      o.rotation.set(0, p.k * 4, 0)
      o.scale.set(...size)
      o.updateMatrix()
      ref.current.setMatrixAt(n++, o.matrix)
      return true
    })
    ref.current.count = n
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, glow(color, 0.35, 0.9), max]} castShadow frustumCulled={false} />
}

/** A bouncing arrow over whatever can be tapped next. */
function Pointer({ at }: { at: () => V3 | null }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const p = at()
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

/* ---------- layout ---------- */

const SHOPS = [
  { name: 'customer', uri: 'svc://customer.internal', db: 'db://customer-pg-01', c: '#ff6b35', mods: ['payments', 'promos'] },
  { name: 'restaurant', uri: 'svc://restaurant.internal', db: 'db://restaurant-pg-01', c: '#c9483f', mods: ['menu', 'orders'] },
  { name: 'driver · admin', uri: 'svc://driver-admin.internal', db: 'db://driver-pg-01', c: '#3ddc97', mods: ['pooling', 'dispatch'] },
].map((s, i) => ({ ...s, x: KITCHEN_X[i] }))
const SHOP_Z = KITCHEN_Z
const CUST = 0
const STREET_Z = 2.6, TUBE_Y = 5.1, SD = 3.2, SW = 3.4

const DEVICES = [
  { label: 'customer app', c: '#ff6b35', w: 0.62, z: -3.7, shop: 0 },
  { label: 'partner API', c: '#f5c23e', w: 0.95, z: -2.4, shop: 0 },
  { label: 'restaurant', c: '#c9483f', w: 0.95, z: -0.5, shop: 1 },
  { label: 'rider', c: '#3ddc97', w: 0.62, z: 1.3, shop: 2 },
  { label: 'admin', c: '#5b8def', w: 1.05, z: 2.7, shop: 2 },
]

function Device({ label, c, w, z }: (typeof DEVICES)[number]) {
  return (
    <group position={[-7.7, TOP, z]}>
      <M c="#5b5466" s={[w * 0.6, 0.14, 0.4]} p={[0, 0.07, -0.05]} />
      <group position={[0, 0.5, 0]} rotation={[-0.75, 0, 0]}>
        <M c="#2a2320" s={[w + 0.12, 0.78, 0.1]} />
        <Sign text={label} w={w} h={0.64} p={[0, 0, 0.01]} bg={c} fg="#fff8ec" lit={0.7} back={false} />
      </group>
    </group>
  )
}

/* ---------- what the telemetry boards say ---------- */

const jitter = (base: number, amp: number, t: number, f = 1) => Math.round(base + amp * (Math.sin(t * 1.7 * f) * 0.6 + Math.sin(t * 4.1 * f + 1) * 0.4))
const READOUTS: ((t: number) => string)[] = [
  (t) => `REQ/s ${jitter(140, 14, t)} | p95 ${jitter(380, 30, t, 0.7)}ms`,
  (t) => `LOCKS ${Math.sin(t * 2.3) > 0.85 ? 1 : 0} | POOL ${jitter(14, 2, t, 0.4)}/20`,
  (t) => `DISPATCH BATCH 60s | T-${String(59 - (Math.floor(t) % 60)).padStart(2, '0')}s`,
]

/** The customer board tells the stories as they happen. */
function customerStatus(s: Story, t: number): { t: string; c: string } | null {
  if (s.clog) return { t: `✕ p95 12.3s | loop blocked | ${s.queue} waiting`, c: RED }
  if (s.stage === 1) return { t: '✕ ₹582 paid | no order | check ✕', c: RED }
  if (s.stage === 2) return { t: '↻ webhook retry | flagged, not lost', c: AMBER }
  if (s.stage === 3 && s.a < STEPS.done + 4) return { t: '✓ fixed | schema checked on boot', c: GREEN }
  if (s.fixed && s.a < STEPS.incident[0]) return { t: `✓ p95 1.4s | threadpool | ${jitter(140, 14, t)} req/s`, c: GREEN }
  return null
}

/* ---------- a kitchen ---------- */

const ledOn = glow(GREEN, 0.9, 1), ledAmber = glow(AMBER, 0.9, 1), ledRed = glow('#ff4d4d', 0.9, 1), ledOff = mat('#2c3038')

/** The database: a server rack with drive bays whose lights flicker with activity, and go red on an alarm. */
function Rack({ activity, i, alarm }: { activity: RefObject<number[]>; i: number; alarm: () => boolean }) {
  const leds = useRef<THREE.Mesh[]>([])
  const next = useRef(0)
  useFrame(({ clock }, dt) => {
    const a = activity.current
    a[i] = Math.max(0, a[i] - dt * 1.4)
    if (clock.elapsedTime < next.current) return
    next.current = clock.elapsedTime + 0.07
    const red = alarm()
    const rate = red ? 0.6 : 0.2 + Math.min(1, a[i]) * 0.65
    leds.current.forEach((m, k) => (m.material = Math.random() < rate ? (red ? ledRed : k % 3 === 2 ? ledAmber : ledOn) : ledOff))
  })
  return (
    <group>
      <M c="#23252d" s={[1.15, 1.75, 1.0]} p={[0, 0.875, 0]} />
      <M c="#3a3d48" s={[1.2, 0.08, 1.05]} p={[0, 1.76, 0]} />
      {[0, 1, 2, 3, 4, 5].map((b) => (
        <group key={b} position={[0, 0.2 + b * 0.25, 0.5]}>
          <M c="#3a3d48" s={[0.95, 0.17, 0.04]} />
          {[0, 1, 2].map((k) => (
            <mesh key={k} ref={(m) => { if (m) leds.current[b * 3 + k] = m }} geometry={G.box} material={ledOff} position={[0.2 + k * 0.11, 0, 0.03]} scale={[0.075, 0.075, 0.03]} />
          ))}
          {[-0.3, -0.18, -0.06].map((x) => <M key={x} c="#2a2c34" s={[0.08, 0.1, 0.02]} p={[x, 0, 0.025]} shadow={false} />)}
        </group>
      ))}
    </group>
  )
}

const rimMat = glow(AMBER, 1.2, 1)

function Shop({ shop, i, activity, story, hopper, children }: { shop: (typeof SHOPS)[number]; i: number; activity: RefObject<number[]>; story: RefObject<Story>; hopper?: boolean; children?: ReactNode }) {
  const lift = useRef<THREE.Group>(null!)
  const rim = useRef<THREE.Group>(null!)
  useFrame(({ clock }, dt) => {
    const on = get().inspect === i
    lift.current.position.y = THREE.MathUtils.damp(lift.current.position.y, TOP + (on ? 0.4 : 0), 6, dt)
    rim.current.visible = on
    if (on) rimMat.emissiveIntensity = 1 + Math.sin(clock.elapsedTime * 4) * 0.4
  })
  const { name, uri, db, c, x, mods } = shop
  const wall = '#efe4cf'
  const read = useMemo(() => {
    const f = READOUTS[i]
    return (t: number) => {
      const st = i === CUST ? customerStatus(story.current, t) : null
      const bad = st?.c === RED
      return {
        lines: [{ t: name, s: 1.5 }, { t: uri, c: AMBER, s: 0.8 }, st ? { t: st.t, c: st.c, s: 0.9 } : { t: `● ${f(t)}`, c: GREEN, s: 0.9 }],
        stripe: bad ? '#ff4d4d' : c,
      }
    }
  }, [i, name, uri, c, story])
  const alarm = useMemo(() => () => i === CUST && (story.current.stage === 1 || story.current.stage === 2), [i, story])
  return (
    <Tap onTap={() => set({ inspect: i })}>
      <group ref={lift} position={[x, TOP, SHOP_Z]}>
        <group ref={rim} visible={false}>
          {[-SD / 2 - 0.05, SD / 2 + 0.05].map((pz) => <M key={pz} m={rimMat} s={[SW + 0.2, 0.1, 0.1]} p={[0, 0.08, pz]} shadow={false} />)}
          {[-1, 1].map((sd) => <M key={sd} m={rimMat} s={[0.1, 0.1, SD + 0.2]} p={[(sd * (SW + 0.1)) / 2, 0.08, 0]} shadow={false} />)}
          {[-1, 1].map((sd) => <M key={`t${sd}`} m={rimMat} s={[0.3, 0.06, 1.25]} p={[(sd * SW) / 2, 3.03, -SD / 2 + 0.6]} shadow={false} />)}
          <M m={rimMat} s={[SW + 0.05, 0.06, 0.3]} p={[0, 3.03, -SD / 2]} shadow={false} />
        </group>
        <Hit s={[SW + 0.4, 4, SD + 0.4]} p={[0, 1.6, 0]} />
        {/* floor, back wall, side walls stepping down toward us */}
        <M c="#c8b89d" s={[SW, 0.12, SD]} p={[0, 0.06, 0]} />
        <M c={wall} s={[SW, 3.0, 0.25]} p={[0, 1.5, -SD / 2]} />
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <M c={wall} s={[0.25, 3.0, 1.2]} p={[(sd * SW) / 2, 1.5, -SD / 2 + 0.6]} />
            <M c={wall} s={[0.25, 1.1, SD - 1.2]} p={[(sd * SW) / 2, 0.55, 0.6]} />
          </group>
        ))}
        {[...Array(6)].map((_, k) => <M key={k} c={k % 2 ? '#fff8ec' : c} s={[SW / 6, 0.14, 0.9]} p={[-SW / 2 + SW / 12 + (k * SW) / 6, 2.95, -SD / 2 + 0.55]} r={[0.35, 0, 0]} />)}

        {/* the signboard is a live telemetry display */}
        <M c="#2a2320" s={[0.1, 0.9, 0.1]} p={[-1.2, 3.35, -SD / 2 + 0.05]} />
        <M c="#2a2320" s={[0.1, 0.9, 0.1]} p={[1.2, 3.35, -SD / 2 + 0.05]} />
        <Live read={read} w={3.1} h={1.15} p={[0, 4.15, -SD / 2 + 0.1]} />

        {/* the service: a big machine against the back wall */}
        <group position={[-0.8, 0, -1.0]}>
          <M c="#3d5a80" s={[1.3, 1.4, 0.9]} p={[0, 0.7, 0]} />
          {[-0.35, 0, 0.35].map((px) => <M key={px} m={glow('#ffd08a', 0.5, 1)} s={[0.2, 0.55, 0.05]} p={[px, 0.75, 0.46]} />)}
          <M g="cyl" c="#9aa3b5" s={[0.2, 0.7, 0.2]} p={[0.4, 1.75, -0.2]} />
          <Mono lines={[{ t: 'fastapi :8000' }]} w={1.3} h={0.26} p={[0, 1.6, 0.5]} />
        </group>

        {/* two stations on the counter: what this backend does */}
        {mods.map((m, k) => (
          <group key={m} position={[-1.05 + k * 1.0, 0, 0.55]}>
            <M c="#8a6a4a" s={[0.85, 0.55, 0.6]} p={[0, 0.28, 0]} />
            <M c={c} s={[0.9, 0.07, 0.65]} p={[0, 0.58, 0]} />
            <Mono lines={[{ t: m, c: AMBER }]} w={0.9} h={0.24} p={[0, 0.82, 0.33]} />
            {hopper && (
              // event queue hoppers: capsules drop in here
              <group position={[0, 1.55, 0]}>
                <M g="cone" m={toon({ color: '#dff3ff', transparent: true, opacity: 0.55 })} s={[0.62, 0.5, 0.62]} r={[Math.PI, 0, 0]} />
                <M g="cyl" c="#9aa3b5" s={[0.66, 0.06, 0.66]} p={[0, 0.25, 0]} />
                <M g="cyl" c="#9aa3b5" s={[0.12, 0.4, 0.12]} p={[0, -0.45, 0]} />
              </group>
            )}
          </group>
        ))}

        {/* its own database, in a server rack */}
        <group position={[0.95, 0, -0.55]}>
          <Rack activity={activity} i={i} alarm={alarm} />
          <Mono lines={[{ t: db, c: '#9fd8ff' }]} w={1.55} h={0.26} p={[0, 2.05, 0.5]} />
        </group>

        {/* the chimney the event tube plugs into */}
        <M g="cyl" c="#9aa3b5" s={[0.42, TUBE_Y, 0.42]} p={[1.3, TUBE_Y / 2, -SD / 2 - 0.4]} />
        <M g="cyl" c="#c9a45c" s={[0.6, 0.16, 0.6]} p={[1.3, TUBE_Y - 0.05, -SD / 2 - 0.4]} />
        {children}
      </group>
    </Tap>
  )
}

/* ---------- the two stories, inside the customer kitchen ---------- */

const MACHINE: V3 = [-0.8, 0, -1.0]
const RACK: V3 = [0.95, 0, -0.55]
const FIX_BTN: V3 = [1.15, 0, 1.05]
const bounceCurve = arc(new THREE.Vector3(MACHINE[0] + 0.5, 0.8, MACHINE[2] + 0.55), new THREE.Vector3(RACK[0] - 0.6, 0.8, RACK[2] + 0.3), 0.5)

function CustomerStory({ story }: { story: RefObject<Story> }) {
  const hot = useRef<THREE.Mesh>(null!)
  const btn = useRef<THREE.Mesh>(null!)
  const btnGroup = useRef<THREE.Group>(null!)
  const fixSign = useRef<THREE.Group>(null!)
  const pool = useRef<THREE.Group>(null!)
  const bounce = useRef<THREE.Mesh>(null!)
  const beacon = useRef<THREE.Group>(null!)
  const shield = useRef<THREE.Group>(null!)
  const red = glow('#ff4d4d', 0.8, 1), green = glow('#3ddc97', 0.7, 1)
  useFrame(({ clock }) => {
    const s = story.current, time = clock.elapsedTime
    hot.current.visible = s.clog && Math.sin(time * 8) > 0
    btnGroup.current.visible = s.rush && s.a < STEPS.incident[0]
    btn.current.material = s.fixed ? green : red
    btn.current.scale.y = s.clog ? 0.22 + Math.abs(Math.sin(time * 6)) * 0.08 : 0.22
    fixSign.current.visible = s.clog
    pool.current.visible = s.fixed && s.a < STEPS.incident[0] + 1
    // the bad insert: out to the database, bounced back
    const bad = s.stage === 1 || s.stage === 2
    bounce.current.visible = bad
    if (bad) {
      const k = (time * 0.7) % 1
      bounceCurve.getPoint(k < 0.6 ? k / 0.6 : 1 - (k - 0.6) / 0.4, bounce.current.position)
      bounce.current.material = k < 0.6 ? glow('#ff6b35', 0.5, 0.9) : red
    }
    beacon.current.visible = bad
    beacon.current.rotation.y = time * 5
    shield.current.visible = s.stage === 3
  })
  return (
    <>
      <mesh ref={hot} geometry={G.box} material={red} position={[MACHINE[0], 0.72, MACHINE[2]]} scale={[1.4, 1.5, 1.0]} />
      {/* move the db calls off the event loop */}
      <group ref={btnGroup} position={FIX_BTN}>
        <Tap onTap={() => { if (story.current.rush) { eng.fixed = true; blip('pop') } }}>
          <M c="#5b5466" s={[0.4, 0.45, 0.4]} p={[0, 0.22, 0]} />
          <mesh ref={btn} geometry={G.cyl} material={red} position={[0, 0.5, 0]} scale={[0.32, 0.22, 0.32]} />
          <Hit s={1.4} p={[0, 0.5, 0]} />
        </Tap>
      </group>
      <group ref={fixSign}>
        <Sign text="unblock the loop" w={1.7} h={0.38} p={[FIX_BTN[0] - 0.2, 1.25, FIX_BTN[2] + 0.3]} r={[-0.4, 0, 0]} bg="#ff6b35" fg="#fff8ec" hand lit={0.6} back={false} />
      </group>
      {/* after the fix: the db calls run on a pool of worker threads */}
      <group ref={pool}>
        {[0.45, 0.7, 0.95, 1.2].map((y) => <M key={y} m={glow(GREEN, 0.7, 1)} s={[0.62, 0.06, 0.06]} p={[0.07, y, -0.75]} shadow={false} />)}
        <Mono lines={[{ t: 'threadpool ×4', c: GREEN }]} w={1.3} h={0.26} p={[0.05, 1.6, -0.3]} />
      </group>
      <mesh ref={bounce} geometry={parcelGeo} scale={1.4} />
      <group ref={beacon} position={[RACK[0], 2.45, RACK[2]]}>
        <M g="sph" m={red} s={0.3} />
        <Halo s={2.2} />
      </group>
      <group ref={shield} position={[RACK[0] - 0.5, 2.5, RACK[2] + 0.3]}>
        <M g="cyl" m={green} s={[0.5, 0.12, 0.5]} r={[Math.PI / 2 - 0.4, 0, 0]} />
        <Sign text="✓" w={0.3} h={0.3} p={[0, 0.02, 0.08]} r={[-0.4, 0, 0]} bg="#3ddc97" fg="#fff8ec" back={false} />
      </group>
    </>
  )
}

/* ---------- events: glass capsules with a payload ---------- */

const EVENTS = [
  { from: 0, to: 1, name: 'order.created' },
  { from: 1, to: 2, name: 'order.ready' },
  { from: 2, to: 0, name: 'order.delivered' },
]
const hex = () => Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
const PILLS = 4

function Capsules({ hop, branches, activity }: { hop: (a: number, b: number) => Curve; branches: Curve[]; activity: RefObject<number[]> }) {
  const { camera } = useThree()
  const caps = useRef<THREE.Group[]>([])
  const pills = useRef<THREE.Group[]>([])
  const screens = useMemo(() => [...Array(PILLS)].map(() => makeScreen(1.7, 0.5)), [])
  const state = useRef([...Array(PILLS)].map(() => ({ on: false, route: [] as Curve[], seg: 0, k: 0, to: 0 })))
  const clock = useRef(0.3)
  const next = useRef(0)
  const tan = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    clock.current -= dt
    if (clock.current <= 0) {
      const slot = state.current.findIndex((s) => !s.on)
      if (slot >= 0) {
        const e = EVENTS[next.current++ % EVENTS.length]
        const route = e.from === 2 ? [hop(2, 1), hop(1, 0)] : e.to === 2 ? [hop(e.from, 2), branches[0], branches[1 + Math.floor(Math.random() * 2)]] : [hop(e.from, e.to)]
        Object.assign(state.current[slot], { on: true, route, seg: 0, k: 0, to: e.to })
        paint(screens[slot], [{ t: `event: ${e.name}`, c: AMBER }, { t: `id: ${hex()} · src: ${SHOPS[e.from].name.split(' ')[0]}`, c: WHITE, s: 0.8 }])
        activity.current[e.from] += 0.6
      }
      clock.current = 1.4
    }
    state.current.forEach((s, i) => {
      const cap = caps.current[i], pill = pills.current[i]
      cap.visible = pill.visible = s.on
      if (!s.on) return
      s.k += (dt * 4.2) / len(s.route[s.seg])
      if (s.k >= 1) {
        if (s.seg + 1 < s.route.length) {
          s.seg++
          s.k = 0
        } else {
          s.on = false
          activity.current[s.to] += 1.2
          return
        }
      }
      const cur = s.route[s.seg]
      cur.getPoint(s.k, cap.position)
      cur.getTangent(s.k, tan)
      cap.quaternion.setFromUnitVectors(up, tan)
      pill.position.copy(cap.position).y += 0.6
      pill.quaternion.copy(camera.quaternion)
    })
  })

  const glass = useMemo(() => toon({ color: '#eaf6ff', transparent: true, opacity: 0.8 }), [])
  return (
    <>
      {screens.map((s, i) => (
        <group key={i}>
          <group ref={(g) => { if (g) caps.current[i] = g }} visible={false}>
            <mesh geometry={capsule(0.15, 0.36)} material={glass} />
            <mesh geometry={capsule(0.08, 0.22)} material={glow(AMBER, 0.8, 1)} />
            {[-0.2, 0.2].map((y) => <mesh key={y} geometry={G.cyl} material={mat('#c9a45c')} position={[0, y, 0]} scale={[0.32, 0.05, 0.32]} />)}
          </group>
          <group ref={(g) => { if (g) pills.current[i] = g }} visible={false}>
            <mesh geometry={G.plane} material={s.material} scale={[1.7, 0.5, 1]} />
          </group>
        </group>
      ))}
    </>
  )
}

/** Glass that stays see-through in the middle and lights up at its edges (a fresnel rim). */
function glassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { rim: { value: new THREE.Color('#8fe6ff') }, tint: { value: new THREE.Color('#eaf8ff') } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 rim; uniform vec3 tint;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        vec3 c = mix(tint, rim, smoothstep(0.25, 0.9, f));
        gl_FragColor = vec4(c * (1.0 + f * 0.8), 0.06 + f * 0.85);
      }`,
  })
}

/* ---------- the room ---------- */

const parcelGeo = new THREE.BoxGeometry(0.24, 0.18, 0.24)
const QUEUE_MAX = 15
const LEVER: V3 = [-8.9, TOP, 3.85]

/** The engine room. `at` is how far the story has got, in units from the room's centre. */
export function Kitchens({ at }: { at: () => number }) {
  const rise = useRef<THREE.Group>(null!)
  const activity = useRef([0, 0, 0])
  const story = useRef<Story>({ a: -99, rush: false, fixed: false, clog: false, stage: 0, queue: 0 })
  const pile = useRef<THREE.InstancedMesh>(null!)
  const lever = useRef<THREE.Group>(null!)
  const hook = useRef<THREE.Group>(null!)
  const drain = useRef(0)
  const glassTube = useMemo(glassMaterial, [])

  const geo = useMemo(() => {
    const chim = (s: number) => new THREE.Vector3(SHOPS[s].x + 1.3, TOP + TUBE_Y, SHOP_Z - SD / 2 - 0.4)
    const door = (s: number) => v(SHOPS[s].x - 0.8, SHOP_Z - 0.4, 0.5)
    const toGate = (d: (typeof DEVICES)[number]) => arc(v(-7.2, d.z), v(-5.6, STREET_Z), 0.5)
    const toFront = (s: number) => path(v(-5.6, STREET_Z), v(-4.7, STREET_Z), v(SHOPS[s].x - 0.8, STREET_Z), v(SHOPS[s].x - 0.8, SHOP_Z + 1.3))
    const orders = DEVICES.map((d) => [toGate(d), toFront(d.shop), arc(v(SHOPS[d.shop].x - 0.8, SHOP_Z + 1.3), door(d.shop), 0.3)])
    // the lunch rush: customers only, and they stop at the door while the API is choking
    const rush = DEVICES.filter((d) => d.shop === CUST).map((d) => [toGate(d), toFront(CUST)])
    // over the roofs, chimney to chimney, rising a little in between
    const hops = new Map<string, Curve>()
    const hop = (a: number, b: number) => {
      const key = `${a}${b}`
      if (!hops.has(key)) {
        const pa = chim(a), pb = chim(b)
        hops.set(key, path(pa, pa.clone().lerp(pb, 0.5).setY(TOP + TUBE_Y + 0.5), pb))
      }
      return hops.get(key)!
    }
    const tube = path(chim(0), chim(0).lerp(chim(1), 0.5).setY(TOP + TUBE_Y + 0.5), chim(1), chim(1).lerp(chim(2), 0.5).setY(TOP + TUBE_Y + 0.5), chim(2))
    // at driver · admin the tube comes down and splits into the pooling and dispatch hoppers
    const d = SHOPS[2], c2 = chim(2)
    const junction = new THREE.Vector3(d.x - 0.55, TOP + 3.2, SHOP_Z + 0.35)
    const trunk = path(c2, new THREE.Vector3(d.x + SW / 2 + 0.45, TOP + TUBE_Y - 0.1, c2.z + 0.2), new THREE.Vector3(d.x + SW / 2 + 0.45, TOP + 3.7, SHOP_Z - 0.4), new THREE.Vector3(d.x + 1.1, TOP + 3.45, SHOP_Z + 0.2), junction)
    const hopperTop = (k: number) => new THREE.Vector3(d.x - 1.05 + k, TOP + 1.85, SHOP_Z + 0.55)
    const branch = (k: number) => path(junction, junction.clone().lerp(hopperTop(k), 0.5).setY(TOP + 3.1), hopperTop(k))
    const bank = new THREE.Vector3(8.7, TOP + 2.3, -1.6)
    const payTube = path(bank, new THREE.Vector3(8.9, TOP + TUBE_Y + 0.6, -2.8), new THREE.Vector3(4, TOP + TUBE_Y + 1.1, -3.3), chim(0))
    return { orders, rush, hop, tube, branches: [trunk, branch(0), branch(1)], payTube }
  }, [])
  const tubes = useMemo(() => [geo.tube, ...geo.branches, geo.payTube].map((c, i) => new THREE.TubeGeometry(c, 48, i === 0 ? 0.24 : 0.17, 12)), [geo])
  // brass collars along the glass, so the tube reads as a tube
  const collars = useMemo(() => {
    const out: { p: THREE.Vector3; q: THREE.Quaternion; r: number }[] = []
    const z = new THREE.Vector3(0, 0, 1)
    ;[geo.tube, ...geo.branches, geo.payTube].forEach((c, i) => {
      const n = Math.max(1, Math.round(len(c) / 2.6))
      for (let k = 0; k <= n; k++) {
        const u = k / n
        out.push({ p: c.getPointAt(u), q: new THREE.Quaternion().setFromUnitVectors(z, c.getTangentAt(u)), r: i === 0 ? 0.26 : 0.19 })
      }
    })
    return out
  }, [geo])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const a = at()
    const s = story.current
    s.a = a

    // the street opens and the kitchens rise out of it
    const k = smooth(-17, -13, a)
    rise.current.position.y = -3.6 * (1 - k) + Math.sin(k * Math.PI) * 0.25
    rise.current.visible = k > 0.001

    // what has happened, by scroll position or by tap, whichever came first
    s.rush = (eng.rush && a > -13) || a > STEPS.rushAuto
    s.fixed = s.rush && (eng.fixed || a > STEPS.fixAuto)
    s.clog = s.rush && !s.fixed
    const [i1, i2, i3] = STEPS.incident
    s.stage = a < i1 ? 0 : a < i2 ? 1 : a < i3 ? 2 : 3
    if (!s.clog && s.queue > 0) {
      drain.current -= dt
      if (drain.current <= 0) {
        s.queue--
        activity.current[CUST] += 0.3
        drain.current = 0.1
      }
    }
    if (!s.rush) s.queue = 0

    // the pile-up outside the customer kitchen
    const o = new THREE.Object3D()
    for (let q = 0; q < s.queue; q++) {
      o.position.set(SHOPS[CUST].x - 1.6 + (q % 5) * 0.3, TOP + 0.12 + Math.floor(q / 5) * 0.2, SHOP_Z + 2.05 + (q % 2) * 0.12)
      o.rotation.set(0, q * 0.7, 0)
      o.updateMatrix()
      pile.current.setMatrixAt(q, o.matrix)
    }
    pile.current.count = s.queue
    pile.current.instanceMatrix.needsUpdate = true

    lever.current.rotation.z = THREE.MathUtils.damp(lever.current.rotation.z, s.rush ? -0.7 : 0.7, 8, dt)
    hook.current.visible = s.stage === 2
  })

  const hint = () => {
    const s = story.current
    if (s.a < -8 || s.a > STEPS.incident[0]) return null
    if (!s.rush) return [LEVER[0], 2.2, LEVER[2]] as V3
    if (s.clog) return [SHOPS[CUST].x + FIX_BTN[0], TOP + 1.9, SHOP_Z + FIX_BTN[2]] as V3
    return null
  }

  return (
    <group>
      <Sign text={'ENGINE ROOM\n~what actually runs KhaooGully'} w={4.6} h={1.1} p={[-W / 2 + 2.6, 1.0, D / 2 + 0.9]} r={[-0.3, 0, 0]} bg="#2a2320" fg="#fff8ec" lit={0.5} back="#ff6b35" />
      <group ref={rise}>
        {/* the block: pavement, and a street running past the shop fronts */}
        <M c="#d9cfc0" s={[W, TOP, D]} p={[0, TOP / 2, 0]} />
        <M c="#4a4458" s={[13.2, 0.04, 1.3]} p={[0.7, TOP + 0.02, STREET_Z]} />
        {[...Array(8)].map((_, i) => <M key={i} m={mat('#fff8ec')} s={[0.6, 0.02, 0.08]} p={[-4.5 + i * 1.6, TOP + 0.05, STREET_Z]} shadow={false} />)}
        <M c="#2a2320" s={[W, 3.6, D]} p={[0, -1.8, 0]} />

        {/* the apps, at a row of kiosks */}
        <M c="#ffd7bf" s={[3.4, 0.08, 8.4]} p={[-7.9, TOP + 0.04, -0.2]} />
        {DEVICES.map((d) => <Device key={d.label} {...d} />)}
        <Mono lines={[{ t: 'clients/', s: 1.3 }, { t: 'each app → its own backend', c: AMBER, s: 0.8 }]} w={2.9} h={0.7} p={[-7.9, TOP + 1.15, -4.45]} r={[-0.45, 0, 0]} stripe="#ff6b35" />
        {/* the lunch-rush lever */}
        <Tap onTap={() => { eng.rush = true; blip('pop') }}>
          <group position={LEVER}>
            <M c="#5b5466" s={[0.5, 0.26, 0.4]} p={[0, 0.13, 0]} />
            <group ref={lever} position={[0, 0.26, 0]}>
              <M c="#9aa3b5" s={[0.07, 0.8, 0.07]} p={[0, 0.4, 0]} />
              <M g="sph" c="#ff4d4d" s={0.24} p={[0, 0.82, 0]} />
            </group>
            <Sign text="1 PM rush" w={1} h={0.32} p={[0.8, 0.3, 0.05]} r={[-0.55, 0, 0]} bg="#f5c23e" hand back={false} lit={0.5} />
            <Hit s={1.4} p={[0, 0.5, 0]} />
          </group>
        </Tap>

        {/* the edge: a gatehouse on the street */}
        <group position={[-5.1, TOP, STREET_Z]}>
          {[-0.85, 0.85].map((z) => <M key={z} c="#e8e1d0" s={[0.6, 2.2, 0.5]} p={[0, 1.1, z]} />)}
          <M c="#2a2320" s={[0.75, 0.4, 2.3]} p={[0, 2.3, 0]} />
          <Mono lines={[{ t: 'edge://gateway', s: 1.1 }, { t: 'jwt + rate-limit', c: AMBER, s: 0.9 }]} w={2.0} h={0.55} p={[0, 3.05, 0.6]} stripe="#9fd8ff" />
        </group>

        {SHOPS.map((s, i) => (
          <Shop key={s.name} shop={s} i={i} activity={activity} story={story} hopper={i === 2}>
            {i === CUST && <CustomerStory story={story} />}
          </Shop>
        ))}
        <instancedMesh ref={pile} args={[parcelGeo, glow('#ff6b35', 0.35, 0.9), QUEUE_MAX]} castShadow frustumCulled={false} />

        {/* the event broker: a glass pneumatic tube over the roofs, branching into the driver's queues */}
        {tubes.map((g, i) => <mesh key={i} geometry={g} material={glassTube} />)}
        {collars.map((c, i) => <mesh key={i} geometry={torus(c.r, 0.045)} material={mat('#c9a45c')} position={c.p} quaternion={c.q} />)}
        <Mono lines={[{ t: 'broker://events', s: 1.1 }, { t: 'order.created → ready → delivered', c: AMBER, s: 0.85 }]} w={3.4} h={0.56} p={[-0.4, TOP + TUBE_Y + 0.75, SHOP_Z - SD / 2 - 1.3]} r={[-0.25, 0, 0]} stripe="#9fd8ff" />
        <Capsules hop={geo.hop} branches={geo.branches} activity={activity} />

        {/* Razorpay, the bank next door, with its own tube in */}
        <group position={[8.7, TOP, -1.4]} rotation={[0, -0.35, 0]}>
          <M c="#efe4cf" s={[1.9, 0.2, 2.2]} p={[0, 0.1, 0]} />
          {[-0.6, -0.2, 0.2, 0.6].map((x) => <M key={x} g="cyl" c="#fff8ec" s={[0.2, 1.6, 0.2]} p={[x, 1.0, 0.8]} />)}
          <M c="#c8b89d" s={[1.7, 1.8, 1.4]} p={[0, 1.0, -0.2]} />
          <M c="#3d5a80" s={[2.1, 0.3, 1.9]} p={[0, 2.05, 0.1]} />
          <Mono lines={[{ t: 'ext://razorpay', c: AMBER }]} w={1.7} h={0.3} p={[0, 2.6, 0.7]} />
        </group>
        <group ref={hook}>
          <Mono lines={[{ t: 'webhook: payment.captured', c: '#9fd8ff' }, { t: 'retrying the order…', c: AMBER, s: 0.85 }]} w={2.6} h={0.5} p={[8.3, TOP + 2.2, 1.0]} r={[-0.45, 0, 0]} stripe="#5b8def" />
        </group>
        <group position={[8.6, TOP, 2.7]} rotation={[0, -0.35, 0]}>
          <M c="#3ddc97" s={[0.9, 0.6, 0.6]} p={[0, 0.3, 0]} />
          <Mono lines={[{ t: 'ext://supabase-auth', c: AMBER }]} w={2.0} h={0.3} p={[0, 0.95, 0.3]} />
        </group>

        <Flow routes={geo.orders} every={() => 0.45} color="#ff6b35" onArrive={(r) => (activity.current[DEVICES[r].shop] += 0.35)} />
        <Flow
          routes={geo.rush}
          every={() => (story.current.rush && story.current.a < STEPS.incident[0] ? 0.13 : Infinity)}
          color="#ff6b35"
          max={40}
          onArrive={() => {
            if (story.current.clog) story.current.queue = Math.min(QUEUE_MAX, story.current.queue + 1)
            else activity.current[CUST] += 0.3
          }}
        />
        {/* payments in from Razorpay, and during the bug, the webhook retrying */}
        <Flow routes={[[geo.payTube]]} every={() => (story.current.stage === 1 ? 1.2 : 2.6)} color="#f5c23e" size={[0.32, 0.32, 0.32]} speed={4} round onArrive={() => (activity.current[CUST] += 0.8)} />
        <Flow routes={[[geo.payTube]]} every={() => (story.current.stage === 2 ? 1.3 : Infinity)} color="#5b8def" size={[0.36, 0.36, 0.36]} speed={4.5} round />
      </group>
      <Pointer at={hint} />
    </group>
  )
}
