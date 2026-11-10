// KhaoGully's five products, each acted out on one order: hungry customer → kitchen → rider → stock → margins.
import * as THREE from 'three'
import { useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { live } from '../state'
import { At, G, Halo, M, Sign, capsule, glow, mat, type V3 } from './kit'
import { Beam, useScreen } from './Flex'
import { place, rng } from './path'
import { Exhibit, Near } from './Exhibit'

const FONT = '"Bricolage Grotesque", system-ui, sans-serif'
const SKINS = ['#e8b08a', '#c98a5e', '#a86b45', '#f0c29b']
const near = (t: number, r = 0.06) => Math.abs(live.t - t) < r

/** Where each booth sits on the walk. The story beats in src/story.ts line up with these. */
export const BOOTHS = [0.53, 0.544, 0.558, 0.572, 0.586]
export const SIDE = -5.6

/* ---------- people ---------- */

export type NpcParts = {
  root: THREE.Group; body: THREE.Group; head: THREE.Group; eyes: THREE.Group
  armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group; kneeL: THREE.Group; kneeR: THREE.Group
}
type Look = { top: string; legs: string; hair: string; skin?: string; hat?: 'chef' | 'helmet' | 'cap'; hatColor?: string; apron?: string }
type NpcProps = {
  look: Look
  p?: V3
  r?: number
  sit?: boolean
  armL?: V3
  armR?: V3
  /** Runs every frame after the idle breathing and blinking. */
  anim?: (n: NpcParts, time: number) => void
  children?: ReactNode
}

/**
 * A townsperson in the same rounded style as the two of us. Faces +z.
 * armL is the arm on +x (their left), armR on -x.
 */
export function Npc({ look, p, r = 0, sit, armL = [0, 0, 0.1], armR = [0, 0, -0.1], anim, children }: NpcProps) {
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const eyes = useRef<THREE.Group>(null!)
  const aL = useRef<THREE.Group>(null!)
  const aR = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const kneeL = useRef<THREE.Group>(null!)
  const kneeR = useRef<THREE.Group>(null!)
  const seed = useMemo(() => Math.random() * 10, [])
  const skin = look.skin ?? SKINS[0]
  const base = sit ? -0.12 : 0

  useFrame(({ clock }) => {
    const time = clock.elapsedTime + seed
    body.current.position.y = base + Math.sin(time * 2) * 0.01
    eyes.current.scale.y = time % 3.7 < 0.12 ? 0.1 : 1
    anim?.(
      { root: root.current, body: body.current, head: head.current, eyes: eyes.current, armL: aL.current, armR: aR.current,
        legL: legL.current, legR: legR.current, kneeL: kneeL.current, kneeR: kneeR.current },
      time,
    )
  })

  const leg = (hip: RefObject<THREE.Group>, knee: RefObject<THREE.Group>, x: number) => (
    <group ref={hip} position={[x, 0.66, 0]} rotation={[sit ? -Math.PI / 2 : 0, 0, 0]}>
      <M geo={capsule(0.1, 0.14)} c={look.legs} p={[0, -0.17, 0]} />
      <group ref={knee} position={[0, -0.33, 0]} rotation={[sit ? Math.PI / 2 : 0, 0, 0]}>
        <M geo={capsule(0.095, 0.12)} c={look.legs} p={[0, -0.13, 0]} />
        <M c="#f7f3ea" s={[0.22, 0.14, 0.36]} p={[0, -0.27, 0.06]} />
      </group>
    </group>
  )
  const arm = (ref: RefObject<THREE.Group>, x: number, rot: V3) => (
    <group ref={ref} position={[x, 1.32, 0]} rotation={rot}>
      <M geo={capsule(0.085, 0.32)} c={look.top} p={[0, -0.22, 0]} />
      <M g="sph" c={skin} s={0.17} p={[0, -0.49, 0]} />
    </group>
  )

  return (
    <group ref={root} position={p} rotation={[0, r, 0]} scale={1.2}>
      <group ref={body}>
        {leg(legL, kneeL, 0.13)}
        {leg(legR, kneeR, -0.13)}
        <M geo={capsule(0.29, 0.3)} c={look.top} p={[0, 1.02, 0]} s={[1, 1, 0.82]} />
        {look.apron && <M c={look.apron} s={[0.46, 0.52, 0.06]} p={[0, 0.94, 0.22]} />}
        {arm(aL, 0.36, armL)}
        {arm(aR, -0.36, armR)}
        <group ref={head} position={[0, 1.5, 0]}>
          <M g="sph" c={skin} s={[0.54, 0.52, 0.52]} p={[0, 0.27, 0]} />
          {look.hat === 'helmet' ? (
            <>
              <M g="dome" c={look.hatColor ?? '#ff6b35'} s={[0.66, 0.64, 0.66]} p={[0, 0.25, -0.02]} r={[-0.12, 0, 0]} />
              <M c="#2a2320" s={[0.46, 0.1, 0.06]} p={[0, 0.42, 0.29]} r={[-0.3, 0, 0]} shadow={false} />
            </>
          ) : (
            <M g="dome" c={look.hair} s={[0.6, 0.58, 0.6]} p={[0, 0.26, -0.02]} r={[-0.22, 0, 0]} />
          )}
          {look.hat === 'chef' && (
            <>
              <M g="cyl" c="#ffffff" s={[0.48, 0.3, 0.48]} p={[0, 0.62, -0.03]} />
              <M g="sph" c="#ffffff" s={0.34} p={[0.12, 0.84, -0.03]} />
              <M g="sph" c="#ffffff" s={0.34} p={[-0.12, 0.84, -0.03]} />
              <M g="sph" c="#ffffff" s={0.36} p={[0, 0.92, -0.05]} />
            </>
          )}
          {look.hat === 'cap' && (
            <>
              <M g="dome" c={look.hatColor ?? '#3d5a80'} s={[0.62, 0.6, 0.62]} p={[0, 0.27, -0.02]} r={[-0.16, 0, 0]} />
              <M c={look.hatColor ?? '#3d5a80'} s={[0.4, 0.04, 0.26]} p={[0, 0.47, 0.3]} />
            </>
          )}
          <group ref={eyes} position={[0, 0.26, 0.24]}>
            {[0.11, -0.11].map((x) => (
              <group key={x} position={[x, 0, 0]}>
              <M g="sph" c="#ffffff" s={[0.13, 0.16, 0.06]} shadow={false} />
              <M g="sph" c="#231c1e" s={[0.075, 0.095, 0.05]} p={[0, -0.012, 0.022]} shadow={false} />
              <M g="sph" c="#ffffff" s={0.032} p={[0.02, 0.022, 0.048]} shadow={false} />
              </group>
            ))}
          </group>
          <M g="sph" c="#f0907a" s={[0.1, 0.06, 0.03]} p={[0.18, 0.17, 0.21]} shadow={false} />
          <M g="sph" c="#f0907a" s={[0.1, 0.06, 0.03]} p={[-0.18, 0.17, 0.21]} shadow={false} />
          <M g="sph" c="#8a4034" s={[0.09, 0.022, 0.03]} p={[0, 0.14, 0.255]} shadow={false} />
        </group>
        {children}
      </group>
    </group>
  )
}

/** Soft puffs drifting up, for steam. */
export function Puffs({ p, n = 4, size = 0.14 }: { p: V3; n?: number; size?: number }) {
  const ref = useRef<THREE.Group>(null!)
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false }), [])
  useFrame(({ clock }) => {
    ref.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.5 + i / n) % 1
      c.position.set(Math.sin(k * 5 + i * 2) * 0.1, k * 0.9, Math.cos(i * 3) * 0.05)
      c.scale.setScalar(size * (0.4 + k) * Math.sin(k * Math.PI) * 2)
    })
  })
  return (
    <group ref={ref} position={p}>
      {Array.from({ length: n }, (_, i) => <mesh key={i} geometry={G.sph} material={m} />)}
    </group>
  )
}

/* ---------- the booths ---------- */

type BoothProps = { t: number; side?: number; n?: string; label: string; c: string; id: string; children: ReactNode }

/** A little stage for one project: a platform, a label at the front, a scene on top. Tap it to open the project. */
export function Booth({ t, side = SIDE, n, label, c, id, children }: BoothProps) {
  return (
    <Near t={t}>
    <At t={t} side={side} turn={0.35}>
      <Exhibit id={id} marker={[1.35, 3.3, -0.6]} hit={[4, 3.4, 3.4]} hitAt={[0, 1.5, 0]}>
      <M c={c} s={[3.9, 0.12, 3.3]} p={[0, 0.06, 0]} />
      <M c="#fff8ec" s={[3.6, 0.04, 3]} p={[0, 0.13, 0]} shadow={false} />
      {/* museum-style label at the front, low so it never blocks the scene */}
      <group position={[0, 0.42, 1.55]} rotation={[-0.6, 0, 0]}>
        <M c="#2a2320" s={[3.3, 0.62, 0.08]} />
        {n && <M g="cyl" c={c} s={[0.48, 0.1, 0.48]} p={[-1.32, 0, 0.05]} r={[Math.PI / 2, 0, 0]} />}
        {n && <Sign text={n} w={0.32} h={0.32} p={[-1.32, 0, 0.11]} back={false} bg={c} fg="#fff8ec" />}
        <Sign text={label} w={n ? 2.6 : 3.1} h={0.5} p={[n ? 0.22 : 0, 0, 0.05]} back={false} bg="#2a2320" fg="#ffe9c7" lit={0.45} />
      </group>
      <Halo p={[0, 1.6, 0]} s={4} />
      <group position={[0, 0.15, 0]}>{children}</group>
      </Exhibit>
    </At>
    </Near>
  )
}

/* 1 · customer app: someone hungry, scrolling, deciding */

function CustomerScene() {
  const bubble = useRef<THREE.Group>(null!)
  const thoughts = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(BOOTHS[0])) return
    const time = clock.elapsedTime
    const pick = Math.floor(time / 1.3) % 4
    thoughts.current.children.forEach((c, j) => (c.visible = j === pick))
    bubble.current.position.y = 2.85 + Math.sin(time * 1.5) * 0.06
  })
  return (
    <>
      {/* bench */}
      <M c="#a8703f" s={[1.5, 0.1, 0.55]} p={[-0.35, 0.48, -0.2]} />
      <M c="#a8703f" s={[1.5, 0.45, 0.08]} p={[-0.35, 0.82, -0.47]} r={[-0.15, 0, 0]} />
      <M c="#3b3b4a" s={[0.08, 0.46, 0.45]} p={[-1, 0.23, -0.2]} />
      <M c="#3b3b4a" s={[0.08, 0.46, 0.45]} p={[0.3, 0.23, -0.2]} />
      <Npc
        look={{ top: '#5b8def', legs: '#2f3a55', hair: '#3a2a22', skin: SKINS[1] }}
        p={[-0.45, 0, -0.22]}
        sit
        armL={[-1.15, 0, -0.45]}
        armR={[-1.15, 0, 0.45]}
        anim={(n, time) => {
          n.head.rotation.x = 0.38 + Math.sin(time * 0.7) * 0.04
          n.head.rotation.z = Math.sin(time * 0.5) * 0.06
          n.armR.rotation.x = -1.15 + Math.max(0, Math.sin(time * 5)) * 0.07 // thumb scrolling
          n.legL.rotation.x = -Math.PI / 2 + Math.max(0, Math.sin(time * 3)) * 0.08 // foot tapping, hungry
        }}
      >
        <group position={[0, 1.12, 0.42]} rotation={[-0.6, 0, 0]}>
          <M c="#1f1a1c" s={[0.15, 0.27, 0.03]} />
          <M m={glow('#bfe6ff', 0.9, 0.6)} s={[0.13, 0.23, 0.01]} p={[0, 0, -0.017]} shadow={false} />
        </group>
      </Npc>
      {/* what's on their mind */}
      <group ref={bubble} position={[0.5, 2.85, -0.2]}>
        <M g="sph" c="#ffffff" s={[1.3, 0.9, 0.5]} />
        <M g="sph" c="#ffffff" s={[0.65, 0.55, 0.42]} p={[-0.5, 0.26, 0]} />
        <M g="sph" c="#ffffff" s={[0.6, 0.5, 0.42]} p={[0.5, 0.24, 0]} />
        <M g="sph" c="#ffffff" s={0.2} p={[-0.7, -0.55, 0.05]} />
        <M g="sph" c="#ffffff" s={0.11} p={[-0.86, -0.74, 0.08]} />
        <group ref={thoughts} position={[0, 0.03, 0.27]}>
          {['🍛\n~biryani?', '🥟\n~momos?', '🍕\n~pizza?', '🛒\n~biryani it is ✓'].map((s) => (
            <Sign key={s} text={s} w={0.95} h={0.62} back={false} bg="#ffffff" />
          ))}
        </group>
      </group>
      {/* side table with a chai, and a plant */}
      <M g="cyl" c="#e9e1cf" s={[0.55, 0.06, 0.55]} p={[0.85, 0.62, -0.05]} />
      <M g="cyl" c="#3b3b4a" s={[0.06, 0.6, 0.06]} p={[0.85, 0.31, -0.05]} />
      <M g="cyl" c="#3b3b4a" s={[0.35, 0.03, 0.35]} p={[0.85, 0.02, -0.05]} />
      <M g="cup" c="#b8683a" s={[0.12, 0.15, 0.12]} p={[0.8, 0.73, 0]} />
      <Puffs p={[0.8, 0.82, 0]} n={3} size={0.06} />
      <M g="cup" c="#c9735a" s={[0.42, 0.42, 0.42]} p={[1.3, 0.21, -1.05]} />
      <M g="ico" c="#6fae5c" s={[0.6, 0.62, 0.6]} p={[1.3, 0.66, -1.05]} />
      <M g="ico" c="#86c06a" s={[0.42, 0.46, 0.42]} p={[1.12, 0.92, -0.95]} />
      <M g="ico" c="#79b866" s={[0.36, 0.4, 0.36]} p={[1.46, 0.98, -1.12]} />
    </>
  )
}

/* 2 · restaurant dashboard: the order pings, the kitchen accepts and cooks */

function KitchenScene() {
  const { g, tex, material } = useScreen(320, 220)
  const food = useRef<THREE.Group>(null!)
  const tickets = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const shown = useRef(-1)
  const draw = (fresh: boolean) => {
    g.fillStyle = fresh ? '#ff6b35' : '#2f8f6a'
    g.fillRect(0, 0, 320, 220)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#ffffff'
    g.font = `800 34px ${FONT}`
    g.fillText(fresh ? '🔔 NEW ORDER' : 'ACCEPTED ✓', 160, 52)
    g.font = `600 24px ${FONT}`
    g.fillText(fresh ? '1× Chicken Biryani' : 'cooking · rider assigned', 160, 104)
    if (fresh) {
      g.beginPath()
      g.roundRect(70, 140, 180, 52, 26)
      g.fill()
      g.fillStyle = '#ff6b35'
      g.font = `800 26px ${FONT}`
      g.fillText('ACCEPT', 160, 167)
    } else {
      g.fillStyle = 'rgba(255,255,255,0.3)'
      g.fillRect(40, 160, 240, 12)
      g.fillStyle = '#ffffff'
      g.fillRect(40, 160, 150, 12)
    }
    tex.needsUpdate = true
  }
  const fresh = () => Math.floor(performance.now() / 2600) % 2 === 0
  useFrame(({ clock }) => {
    if (!near(BOOTHS[1])) return
    const time = clock.elapsedTime
    const f = fresh() ? 1 : 0
    if (f !== shown.current) (shown.current = f), draw(!!f)
    food.current.children.forEach((c, i) => (c.position.y = 0.07 + Math.abs(Math.sin(time * 5 + i * 1.3)) * (f ? 0.05 : 0.2)))
    tickets.current.children.forEach((c, i) => (c.rotation.z = Math.sin(time * 2 + i) * 0.12))
    ring.current.scale.setScalar(f ? 1 + ((time * 1.5) % 1) * 0.6 : 0.001)
  })
  return (
    <>
      <Npc
        look={{ top: '#f7f3ea', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[2], hat: 'chef', apron: '#d9534f' }}
        p={[-0.3, 0, -0.45]}
        armL={[-0.9, 0, 0.1]}
        armR={[-1.05, 0, 0.25]}
        anim={(n, time) => {
          const f = fresh()
          // stir with the right hand; glance at the tablet when it pings
          n.armR.rotation.x = -1.05 + Math.sin(time * 4) * 0.14
          n.armR.rotation.y = Math.cos(time * 4) * 0.25
          n.head.rotation.y += ((f ? 0.65 : -0.1) - n.head.rotation.y) * 0.08
          n.armL.rotation.x += ((f ? -1.25 : -0.4) - n.armL.rotation.x) * 0.08
          n.armL.rotation.z += ((f ? -0.15 : 0.1) - n.armL.rotation.z) * 0.08
        }}
      />
      {/* counter */}
      <M c="#c7ccd6" s={[2.9, 0.95, 0.9]} p={[0, 0.475, 0.45]} />
      <M c="#efe9dc" s={[3, 0.07, 1]} p={[0, 0.98, 0.45]} />
      <M c="#d9534f" s={[2.9, 0.16, 0.03]} p={[0, 0.75, 0.91]} shadow={false} />
      {[-0.9, 0, 0.9].map((x) => <M key={x} c="#aab0bb" s={[0.7, 0.5, 0.03]} p={[x, 0.42, 0.91]} shadow={false} />)}
      {/* stove, pan, sizzling food */}
      <M g="cyl" c="#2f2a33" s={[0.66, 0.04, 0.66]} p={[-0.55, 1.02, 0.4]} />
      <M g="cyl" m={glow('#ff6b35', 0.9, 1.5)} s={[0.5, 0.02, 0.5]} p={[-0.55, 1.04, 0.4]} shadow={false} />
      <M g="cyl" c="#2f2a33" s={[0.6, 0.1, 0.6]} p={[-0.55, 1.1, 0.4]} />
      <M c="#2f2a33" s={[0.5, 0.05, 0.08]} p={[-1.08, 1.13, 0.4]} />
      <group ref={food} position={[-0.55, 1.12, 0.4]}>
        {['#f5c23e', '#e8833a', '#fff3c4', '#d9534f', '#f5c23e', '#8fc468'].map((c, i) => (
          <M key={i} g="sph" c={c} s={0.1} p={[Math.cos(i * 1.1) * 0.16, 0.07, Math.sin(i * 1.1) * 0.16]} shadow={false} />
        ))}
      </group>
      <Puffs p={[-0.55, 1.25, 0.4]} n={4} size={0.13} />
      {/* order tablet */}
      <M c="#3b3b4a" s={[0.08, 0.26, 0.08]} p={[0.75, 1.12, 0.35]} />
      <group position={[0.75, 1.36, 0.4]} rotation={[-0.35, -0.25, 0]}>
        <M c="#1f1a1c" s={[0.66, 0.48, 0.04]} />
        <mesh geometry={G.plane} material={material} scale={[0.6, 0.42, 1]} position={[0, 0, 0.022]} />
        <mesh ref={ring} geometry={G.plane} position={[0, 0, 0.01]} scale={0.001}>
          <meshBasicMaterial color="#ff6b35" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      {/* ticket rail */}
      <M g="cyl" c="#3b3b4a" s={[0.06, 2.2, 0.06]} p={[1.45, 1.1, -0.55]} />
      <M c="#3b3b4a" s={[0.9, 0.04, 0.04]} p={[1.05, 2.15, -0.55]} />
      <group ref={tickets}>
        {[0.75, 1.0, 1.25].map((x) => (
          <group key={x} position={[x, 2.13, -0.53]}>
            <M c="#fff8ec" s={[0.2, 0.3, 0.012]} p={[0, -0.16, 0]} shadow={false} />
            <M c="#d9534f" s={[0.14, 0.02, 0.014]} p={[0, -0.08, 0]} shadow={false} />
          </group>
        ))}
      </group>
      {/* spice shelf */}
      <M c="#a8703f" s={[2.2, 0.06, 0.35]} p={[-0.2, 1.75, -1.25]} />
      {['#d9534f', '#f5c23e', '#e8833a', '#8fc468', '#f7f3ea', '#a86b45', '#d9534f'].map((c, i) => (
        <group key={i} position={[-1.1 + i * 0.3, 1.88, -1.25]}>
          <M g="cyl" c="#e6f0f5" s={[0.16, 0.2, 0.16]} />
          <M g="cyl" c={c} s={[0.14, 0.12, 0.14]} p={[0, -0.03, 0]} shadow={false} />
          <M g="cyl" c="#2f2a33" s={[0.17, 0.04, 0.17]} p={[0, 0.11, 0]} />
        </group>
      ))}
    </>
  )
}

/* 3 · delivery navigator: a rider gets the route and a live ETA */

const ROUTE: [number, number][] = [[64, 290], [64, 210], [210, 210], [210, 120], [370, 120], [370, 66], [452, 66]]
const ROUTE_LEN = ROUTE.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]), 0)

function RiderScene() {
  const { g, tex, material } = useScreen(512, 340)
  const shown = useRef(-1)
  const draw = (k: number) => {
    g.fillStyle = '#14322a'
    g.fillRect(0, 0, 512, 340)
    g.strokeStyle = '#2b5d4c'
    g.lineWidth = 16
    g.lineCap = 'round'
    for (const x of [64, 210, 370, 452]) (g.beginPath(), g.moveTo(x, 30), g.lineTo(x, 320), g.stroke())
    for (const y of [66, 120, 210, 290]) (g.beginPath(), g.moveTo(30, y), g.lineTo(490, y), g.stroke())
    // the route: done part solid, rest dashed
    let left = k * ROUTE_LEN
    let dot: [number, number] = ROUTE[0]
    g.lineWidth = 9
    g.strokeStyle = '#ff6b35'
    g.beginPath()
    g.moveTo(...ROUTE[0])
    for (let i = 1; i < ROUTE.length && left > 0; i++) {
      const [ax, ay] = ROUTE[i - 1], [bx, by] = ROUTE[i]
      const len = Math.hypot(bx - ax, by - ay)
      const f = Math.min(1, left / len)
      dot = [ax + (bx - ax) * f, ay + (by - ay) * f]
      g.lineTo(...dot)
      left -= len
    }
    g.stroke()
    g.setLineDash([10, 12])
    g.strokeStyle = 'rgba(255,255,255,0.45)'
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(...ROUTE[0])
    ROUTE.forEach((p) => g.lineTo(...p))
    g.stroke()
    g.setLineDash([])
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = '30px sans-serif'
    g.fillText('🍳', ROUTE[0][0], ROUTE[0][1])
    g.fillText('🏠', ...ROUTE[ROUTE.length - 1])
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(dot[0], dot[1], 13, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ff6b35'
    g.beginPath()
    g.arc(dot[0], dot[1], 8, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(0,0,0,0.45)'
    g.beginPath()
    g.roundRect(18, 248, 200, 70, 18)
    g.fill()
    g.fillStyle = '#ffffff'
    g.textAlign = 'left'
    g.font = `800 34px ${FONT}`
    g.fillText(k > 0.97 ? 'arrived 🎉' : `ETA ${Math.max(1, Math.ceil(12 * (1 - k)))} min`, 34, 284)
    tex.needsUpdate = true
  }
  useFrame(({ clock }) => {
    if (!near(BOOTHS[2])) return
    const k = Math.min(1, ((clock.elapsedTime * 0.1) % 1.15))
    const step = Math.round(k * 80)
    if (step !== shown.current) (shown.current = step), draw(step / 80)
  })
  useMemo(() => {
    material.transparent = true
    material.opacity = 0.93
  }, [material])
  return (
    <>
      <Npc
        look={{ top: '#3d5a80', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[0], hat: 'helmet', hatColor: '#ff6b35' }}
        p={[-0.55, 0, 0.15]}
        r={0.35}
        armL={[0, 0, 0.12]}
        armR={[-1.3, 0, 0.3]}
        anim={(n, time) => {
          n.head.rotation.x = 0.3
          n.head.rotation.y = Math.sin(time * 0.6) * 0.15
          n.armL.rotation.z = 0.12 + Math.sin(time * 1.2) * 0.04
        }}
      >
        <group position={[-0.16, 1.18, 0.45]} rotation={[-0.5, 0.3, 0]}>
          <M c="#1f1a1c" s={[0.15, 0.27, 0.03]} />
          <M m={glow('#3ddc97', 0.9, 0.6)} s={[0.13, 0.23, 0.01]} p={[0, 0, -0.017]} shadow={false} />
        </group>
      </Npc>
      {/* the route, projected big */}
      <group position={[0.25, 2.55, -0.85]} rotation={[-0.12, 0, 0]}>
        <mesh geometry={G.plane} material={material} scale={[2.5, 1.66, 1]} />
        {([[0, 0.86, 2.6, 0.05], [0, -0.86, 2.6, 0.05], [1.28, 0, 0.05, 1.76], [-1.28, 0, 0.05, 1.76]] as const).map(([x, y, w, h], i) => (
          <M key={i} m={glow('#3ddc97', 1.2, 0.8)} s={[w, h, 0.04]} p={[x, y, 0]} shadow={false} />
        ))}
      </group>
      <Beam from={[-0.75, 1.65, 0.6]} to={[0.25, 1.9, -0.85]} r={0.55} />
      {/* parked scooter */}
      <group position={[0.75, 0, 0.35]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
        <M g="cyl" c="#1f1a1c" s={[0.5, 0.14, 0.5]} p={[0, 0.25, 0.62]} r={[0, 0, Math.PI / 2]} />
        <M g="cyl" c="#1f1a1c" s={[0.5, 0.14, 0.5]} p={[0, 0.25, -0.62]} r={[0, 0, Math.PI / 2]} />
        <M g="cyl" c="#c7ccd6" s={[0.26, 0.16, 0.26]} p={[0, 0.25, 0.62]} r={[0, 0, Math.PI / 2]} shadow={false} />
        <M g="cyl" c="#c7ccd6" s={[0.26, 0.16, 0.26]} p={[0, 0.25, -0.62]} r={[0, 0, Math.PI / 2]} shadow={false} />
        <M c="#ff6b35" s={[0.42, 0.3, 1.35]} p={[0, 0.45, 0]} />
        <M c="#2a2320" s={[0.4, 0.1, 0.6]} p={[0, 0.66, -0.2]} />
        <M c="#ff6b35" s={[0.38, 0.75, 0.16]} p={[0, 0.82, 0.58]} r={[-0.25, 0, 0]} />
        <M c="#2f2a33" s={[0.8, 0.06, 0.06]} p={[0, 1.2, 0.52]} />
        <M g="sph" m={glow('#fff3c4', 0.6, 2)} s={0.16} p={[0, 1.02, 0.72]} shadow={false} />
        <M c="#2a2320" s={[0.62, 0.62, 0.62]} p={[0, 1.02, -0.55]} />
        <Sign text="KG" w={0.5} h={0.5} p={[0.32, 1.02, -0.55]} r={[0, Math.PI / 2, 0]} bg="#ff6b35" fg="#fff8ec" back={false} />
        <Sign text="KG" w={0.5} h={0.5} p={[-0.32, 1.02, -0.55]} r={[0, -Math.PI / 2, 0]} bg="#ff6b35" fg="#fff8ec" back={false} />
      </group>
      {/* traffic cone and a waiting parcel */}
      <M g="cone" c="#ff6b35" s={[0.32, 0.55, 0.32]} p={[-1.45, 0.28, 0.95]} />
      <M g="cyl" c="#ffffff" s={[0.2, 0.08, 0.2]} p={[-1.45, 0.32, 0.95]} shadow={false} />
      <M c="#3b3b4a" s={[0.42, 0.04, 0.42]} p={[-1.45, 0.02, 0.95]} />
      <M c="#c99a6b" s={[0.38, 0.3, 0.38]} p={[1.45, 0.15, -1.1]} />
      <M c="#ff6b35" s={[0.39, 0.06, 0.39]} p={[1.45, 0.24, -1.1]} shadow={false} />
    </>
  )
}

/* 4 · inventory: stock moves, and the system knows */

type Item = { kind: 'crate' | 'sack' | 'jar' | 'can'; x: number; c: string }

function Shelf() {
  const rows = useMemo(() => {
    const r = rng(14)
    const kinds: Item['kind'][] = ['crate', 'sack', 'jar', 'can']
    return [0.48, 1.18, 1.88].map(() => {
      const items: Item[] = []
      for (let x = -1.2; x < 1.25; x += 0.4) {
        items.push({ kind: kinds[Math.floor(r() * 4)], x, c: ['#d9534f', '#f5c23e', '#8fc468', '#e8833a', '#5b8def'][Math.floor(r() * 5)] })
      }
      return items
    })
  }, [])
  const ys = [0.48, 1.18, 1.88]
  return (
    <group position={[0, 0, -1]}>
      {[-1.45, 1.45].flatMap((x) => [-0.28, 0.28].map((z) => <M key={`${x}${z}`} c="#3d5a80" s={[0.07, 2.35, 0.07]} p={[x, 1.17, z]} />))}
      {ys.map((y) => <M key={y} c="#c7ccd6" s={[3, 0.06, 0.66]} p={[0, y - 0.03, 0]} />)}
      {rows.map((items, ri) =>
        items.map((it, i) => {
          const y = ys[ri]
          const k = `${ri}${i}`
          if (it.kind === 'crate')
            return (
              <group key={k} position={[it.x, y + 0.15, 0]}>
                <M c="#c99a6b" s={[0.34, 0.3, 0.42]} />
                <M c="#a87c52" s={[0.35, 0.05, 0.43]} shadow={false} />
              </group>
            )
          if (it.kind === 'sack')
            return (
              <group key={k} position={[it.x, y + 0.16, 0]}>
                <M g="sph" c="#e6d3b3" s={[0.36, 0.34, 0.34]} />
                <M g="sph" c="#c9b48f" s={0.1} p={[0, 0.18, 0]} />
              </group>
            )
          if (it.kind === 'jar')
            return (
              <group key={k} position={[it.x, y, 0]}>
                {[-0.08, 0.08].map((dx) => (
                  <group key={dx} position={[dx, 0.11, dx]}>
                    <M g="cyl" c="#e6f0f5" s={[0.13, 0.22, 0.13]} />
                    <M g="cyl" c={it.c} s={[0.11, 0.14, 0.11]} p={[0, -0.03, 0]} shadow={false} />
                    <M g="cyl" c="#2f2a33" s={[0.14, 0.04, 0.14]} p={[0, 0.12, 0]} />
                  </group>
                ))}
              </group>
            )
          return (
            <group key={k} position={[it.x, y + 0.14, 0]}>
              <M g="cyl" c="#f5c23e" s={[0.22, 0.28, 0.22]} />
              <M g="cyl" c={it.c} s={[0.225, 0.1, 0.225]} shadow={false} />
            </group>
          )
        }),
      )}
      {['RICE', 'OIL', 'SPICES'].map((s, i) => (
        <Sign key={s} text={s} w={0.5} h={0.16} p={[-0.8 + i * 0.8, ys[i] - 0.09, 0.34]} back={false} bg="#fff8ec" />
      ))}
    </group>
  )
}

function InventoryScene() {
  const box = useRef<THREE.Group>(null!)
  const beam = useRef<THREE.Mesh>(null!)
  return (
    <>
      <Shelf />
      <Sign text={'stock synced ✓\n~rice ■■■■□   oil ■■■□□'} w={2.2} h={0.6} p={[0, 2.85, -1]} bg="#3ddc97" fg="#14322a" lit={0.5} back="#14322a" />
      {/* pallet of incoming stock */}
      <group position={[-1.2, 0, 0.85]}>
        {[-0.3, 0, 0.3].map((z) => <M key={z} c="#b98a5e" s={[0.9, 0.06, 0.18]} p={[0, 0.03, z]} />)}
        <M c="#b98a5e" s={[0.9, 0.06, 0.9]} p={[0, 0.12, 0]} />
        <M c="#c99a6b" s={[0.4, 0.34, 0.4]} p={[-0.2, 0.32, -0.2]} />
        <M c="#c99a6b" s={[0.4, 0.34, 0.4]} p={[0.2, 0.32, 0.2]} />
        <M c="#d6ab7c" s={[0.4, 0.34, 0.4]} p={[0.18, 0.32, -0.22]} />
        <M c="#c99a6b" s={[0.4, 0.34, 0.4]} p={[0, 0.66, 0]} r={[0, 0.3, 0]} />
      </group>
      {/* the stocker, carrying a box between pallet and shelf */}
      <Npc
        look={{ top: '#5b6b8c', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[3], hat: 'cap', hatColor: '#3d5a80', apron: '#f5c23e' }}
        armL={[-1.2, 0, -0.42]}
        armR={[-1.2, 0, 0.42]}
        anim={(n, time) => {
          const k = (time * 0.22) % 2
          const going = k < 1
          const f = going ? k : 2 - k
          const e = f * f * (3 - 2 * f)
          n.root.position.set(-0.6 + e * 1.5, 0, 0.15 - e * 0.35)
          const moving = Math.sin(f * Math.PI) > 0.15
          n.root.rotation.y = going ? 1.75 : -1.4
          const swing = moving ? Math.sin(time * 7) * 0.5 : 0
          n.legL.rotation.x = swing
          n.legR.rotation.x = -swing
          n.kneeL.rotation.x = Math.max(0, -swing) * 0.6
          n.kneeR.rotation.x = Math.max(0, swing) * 0.6
          box.current.visible = going
          beam.current.visible = !moving && f > 0.5
        }}
      >
        <group ref={box} position={[0, 1.08, 0.45]}>
          <M c="#c99a6b" s={[0.42, 0.34, 0.36]} />
          <M c="#a87c52" s={[0.43, 0.05, 0.37]} shadow={false} />
        </group>
        <mesh ref={beam} geometry={G.box} position={[0.2, 1.3, 0.9]} scale={[0.015, 0.015, 0.9]}>
          <meshBasicMaterial color="#ff3b3b" />
        </mesh>
      </Npc>
    </>
  )
}

/* 5 · economics: margins on every order, live */

function EconomicsScene() {
  const { g, tex, material } = useScreen(320, 200)
  const bars = useRef<THREE.Group>(null!)
  const coins = useRef<THREE.Group>(null!)
  const shown = useRef(-1)
  const draw = (k: number) => {
    g.fillStyle = '#1f2440'
    g.fillRect(0, 0, 320, 200)
    g.fillStyle = '#e6f5ff'
    g.font = `700 20px ${FONT}`
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    g.fillText('unit economics', 18, 24)
    g.fillStyle = '#3ddc97'
    g.textAlign = 'right'
    g.fillText('▲ per order', 302, 24)
    g.strokeStyle = 'rgba(255,255,255,0.15)'
    g.lineWidth = 1
    for (let y = 60; y < 190; y += 32) (g.beginPath(), g.moveTo(18, y), g.lineTo(302, y), g.stroke())
    g.strokeStyle = '#3ddc97'
    g.lineWidth = 4
    g.beginPath()
    const n = Math.max(2, Math.round(k * 24))
    for (let i = 0; i < n; i++) {
      const x = 18 + (i / 23) * 284
      const y = 175 - (i / 23) * 105 - Math.sin(i * 1.7) * 10
      i ? g.lineTo(x, y) : g.moveTo(x, y)
    }
    g.stroke()
    tex.needsUpdate = true
  }
  useFrame(({ clock }) => {
    if (!near(BOOTHS[4])) return
    const time = clock.elapsedTime
    const k = Math.min(1, (time * 0.25) % 1.3)
    const step = Math.round(k * 24)
    if (step !== shown.current) (shown.current = step), draw(k)
    bars.current.children.forEach((b, i) => {
      const h = (0.45 + i * 0.28) * (0.85 + 0.15 * Math.sin(time * 1.3 + i))
      b.scale.y = h
      b.position.y = h / 2
    })
    coins.current.children.forEach((c, i) => {
      const k2 = (time * 0.4 + i / 3) % 1
      c.position.set(0, 0.5 + k2 * 1.6, 0)
      c.rotation.y = time * 4 + i
      c.scale.setScalar(Math.sin(k2 * Math.PI))
    })
  })
  return (
    <>
      {/* desk, monitor, chair */}
      <M c="#efe9dc" s={[1.6, 0.07, 0.75]} p={[-0.55, 0.78, -0.55]} />
      {[[-1.28, -0.85], [0.18, -0.85], [-1.28, -0.25], [0.18, -0.25]].map(([x, z]) => (
        <M key={`${x}${z}`} c="#3b3b4a" s={[0.06, 0.75, 0.06]} p={[x, 0.38, z]} />
      ))}
      <M c="#3b3b4a" s={[0.08, 0.3, 0.08]} p={[-0.1, 0.96, -0.75]} />
      <group position={[-0.1, 1.38, -0.72]} rotation={[0, -0.45, 0]}>
        <M c="#1f1a1c" s={[1.02, 0.66, 0.05]} />
        <mesh geometry={G.plane} material={material} scale={[0.94, 0.58, 1]} position={[0, 0, 0.028]} />
      </group>
      <M c="#3b3b4a" s={[0.5, 0.03, 0.16]} p={[-0.85, 0.83, -0.35]} />
      <M g="cup" c="#fdf6ea" s={[0.12, 0.15, 0.12]} p={[0.05, 0.89, -0.4]} />
      <Puffs p={[0.05, 0.98, -0.4]} n={3} size={0.05} />
      <M c="#8a5fb5" s={[0.52, 0.08, 0.5]} p={[-1.15, 0.5, 0.1]} />
      <M c="#8a5fb5" s={[0.52, 0.55, 0.07]} p={[-1.15, 0.82, 0.37]} />
      <M g="cyl" c="#3b3b4a" s={[0.08, 0.45, 0.08]} p={[-1.15, 0.24, 0.1]} />
      <Npc
        look={{ top: '#8a5fb5', legs: '#2f3a55', hair: '#3a2a22', skin: SKINS[1] }}
        p={[-1.15, 0, 0.12]}
        r={Math.PI - 0.55}
        sit
        armL={[-1.3, 0, -0.2]}
        armR={[-1.3, 0, 0.2]}
        anim={(n, time) => {
          n.armL.rotation.x = -1.3 + Math.max(0, Math.sin(time * 9)) * 0.08
          n.armR.rotation.x = -1.3 + Math.max(0, Math.sin(time * 9 + 2)) * 0.08
          n.head.rotation.y = Math.sin(time * 0.5) * 0.12
        }}
      />
      {/* the numbers, as objects */}
      <group ref={bars} position={[0.75, 0, 0.1]}>
        {['#c9b6f2', '#b49be8', '#8a5fb5', '#5bb98c', '#3ddc97'].map((c, i) => (
          <mesh key={c} geometry={G.box} material={mat(c)} position={[(i - 2) * 0.3, 0.5, -i * 0.05]} scale={[0.24, 1, 0.24]} castShadow />
        ))}
      </group>
      <M c="#2a2320" s={[1.7, 0.04, 0.5]} p={[0.75, 0.02, 0]} />
      <Sign text="📈" w={0.5} h={0.5} p={[1.35, 2.25, 0]} back={false} bg="#fff8ec" />
      <group position={[1.4, 0, 0.95]}>
        {Array.from({ length: 6 }, (_, i) => (
          <M key={i} g="cyl" c="#f4b93a" s={[0.32, 0.06, 0.32]} p={[Math.sin(i) * 0.02, 0.04 + i * 0.065, 0]} />
        ))}
        <group ref={coins}>
          {[0, 1, 2].map((i) => (
            <group key={i}>
              <M g="cyl" c="#f4b93a" s={[0.3, 0.05, 0.3]} r={[Math.PI / 2, 0, 0]} shadow={false} />
            </group>
          ))}
        </group>
      </group>
    </>
  )
}

/* ---------- one order, hopping booth to booth ---------- */

function OrderFlow() {
  const token = useRef<THREE.Group>(null!)
  const stops = useMemo(() => BOOTHS.map((t) => {
    const p = place(t, SIDE + 2.4)
    return new THREE.Vector3(p.x, 2.2, p.z)
  }), [])
  const trail = useMemo(() => {
    const out: V3[] = []
    for (let t = BOOTHS[0]; t <= BOOTHS[4]; t += 0.0022) {
      const p = place(t, SIDE + 2.4)
      out.push([p.x, 0.05, p.z])
    }
    return out
  }, [])
  useFrame(({ clock }) => {
    if (live.t < 0.48 || live.t > 0.64) return void (token.current.visible = false)
    const k = (clock.elapsedTime * 0.4) % 4.6
    const i = Math.min(3, Math.floor(k))
    const f = Math.min(1, (k - i) / 0.75) // hop, then rest at the booth
    const e = f * f * (3 - 2 * f)
    token.current.position.lerpVectors(stops[i], stops[i + 1], e)
    token.current.position.y += Math.sin(e * Math.PI) * 1.4
    token.current.rotation.y = clock.elapsedTime * 2
    token.current.visible = k < 4.4
  })
  return (
    <>
      {trail.map((p, i) => <M key={i} g="cyl" c="#ff6b35" s={[0.22, 0.02, 0.22]} p={p} shadow={false} />)}
      <group ref={token}>
        <M c="#ff6b35" s={[0.46, 0.4, 0.46]} />
        <M c="#fff8ec" s={[0.48, 0.08, 0.1]} shadow={false} />
        <M c="#fff8ec" s={[0.1, 0.08, 0.48]} shadow={false} />
        <Halo s={2.2} />
      </group>
    </>
  )
}

export function KhaoStalls() {
  return (
    <>
      <Booth t={BOOTHS[0]} n="1" id="kg-customer" label="🛒 Customer App" c="#e8833a"><CustomerScene /></Booth>
      <Booth t={BOOTHS[1]} n="2" id="kg-restaurant" label="🍳 Restaurant Dashboard" c="#d9534f"><KitchenScene /></Booth>
      <Booth t={BOOTHS[2]} n="3" id="kg-navigator" label="🛵 Delivery Navigator" c="#3d8f7a"><RiderScene /></Booth>
      <Booth t={BOOTHS[3]} n="4" id="kg-inventory" label="📦 Inventory" c="#3d5a80"><InventoryScene /></Booth>
      <Booth t={BOOTHS[4]} n="5" id="kg-economics" label="📈 Economics" c="#8a5fb5"><EconomicsScene /></Booth>
      <OrderFlow />
    </>
  )
}
