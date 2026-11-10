// People doing things all along the walk: one small scene per project, plus the ambient life between them.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { findEgg, live } from '../state'
import { blip } from '../sound'
import { At, G, Hit, M, Sign, Tap, glow, mat, type V3 } from './kit'
import { useScreen } from './Flex'
import { Exhibit, Near } from './Exhibit'
import { Booth, Npc, Puffs, type NpcParts } from './Stalls'
import { dist, place, rng, tAt } from './path'

const FONT = '"Bricolage Grotesque", system-ui, sans-serif'
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace'
const near = (t: number, r = 0.05) => Math.abs(live.t - t) < r

type Look = Parameters<typeof Npc>[0]['look']
const r6 = rng(99)
const TOPS = ['#5b8def', '#e8833a', '#3d8f7a', '#d9534f', '#8a5fb5', '#f5c23e', '#f7f3ea', '#3d5a80', '#f08b7d']
const LEGS = ['#2f3a55', '#39425e', '#2f2a33', '#5b6b8c', '#6a4a3a']
const HAIRS = ['#231c1e', '#3a2a22', '#5a3a28', '#231c1e', '#8a5a3c']
const SKINS = ['#e8b08a', '#c98a5e', '#a86b45', '#f0c29b']
const pick = <T,>(a: T[]) => a[Math.floor(r6() * a.length)]
const randomLook = (): Look => ({ top: pick(TOPS), legs: pick(LEGS), hair: pick(HAIRS), skin: pick(SKINS) })

/** Swing the legs and arms for one walking step. */
function stride(n: NpcParts, phase: number, amount = 1) {
  const s = Math.sin(phase) * 0.55 * amount
  n.legL.rotation.x = s
  n.legR.rotation.x = -s
  n.kneeL.rotation.x = Math.max(0, -s) * 0.7
  n.kneeR.rotation.x = Math.max(0, s) * 0.7
  n.armL.rotation.x = -s * 0.7
  n.armR.rotation.x = s * 0.7
}

/* ---------- ambient life ---------- */

type WalkerProps = { from: number; to: number; side: number; speed?: number; start?: number; look?: Look; dog?: boolean }

/** Someone strolling up and down a stretch of the walk, sometimes with a dog. */
function Walker({ from, to, side, speed = 1.1, start = 0, look, dog }: WalkerProps) {
  const span = dist(to) - dist(from)
  const d0 = dist(from)
  const style = useMemo(() => look ?? randomLook(), [look])
  const dogRef = useRef<THREE.Group>(null!)
  const pos = (time: number, lag = 0) => {
    const k = ((time * speed + start * span * 2 - lag) % (2 * span) + 2 * span) % (2 * span)
    const fwd = k < span
    const p = place(tAt(d0 + (fwd ? k : 2 * span - k)), side)
    return { ...p, yaw: fwd ? p.yaw : p.yaw + Math.PI }
  }
  useFrame(({ clock }) => {
    if (!dog || !dogRef.current.visible) return
    const p = pos(clock.elapsedTime, 1.3)
    dogRef.current.position.set(p.x + 0.5, Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.06, p.z)
    dogRef.current.rotation.y = p.yaw
    dogRef.current.children[4].rotation.y = Math.sin(clock.elapsedTime * 14) * 0.6 // tail
  })
  return (
    <Near t={(from + to) / 2} range={span / 2 + 60}>
      <Npc
        look={style}
        anim={(n, time) => {
          const p = pos(time)
          n.root.position.set(p.x, 0, p.z)
          n.root.rotation.y = p.yaw
          stride(n, time * speed * 5.2)
        }}
      />
      {dog && (
        <group ref={dogRef}>
          <M g="sph" c="#c98a5e" s={[0.32, 0.3, 0.6]} p={[0, 0.42, 0]} />
          <M g="sph" c="#c98a5e" s={[0.3, 0.3, 0.32]} p={[0, 0.66, 0.3]} />
          <M g="sph" c="#2a2320" s={0.07} p={[0, 0.66, 0.47]} shadow={false} />
          <M g="sph" c="#8a5a3c" s={[0.1, 0.18, 0.06]} p={[0.13, 0.76, 0.27]} />
          <group position={[0, 0.5, -0.3]}>
            <M c="#c98a5e" s={[0.05, 0.05, 0.26]} p={[0, 0.05, -0.1]} r={[0.6, 0, 0]} />
          </group>
          {[[-0.1, 0.2], [0.1, 0.2], [-0.1, -0.2], [0.1, -0.2]].map(([x, z]) => (
            <M key={`${x}${z}`} c="#a86b45" s={[0.08, 0.3, 0.08]} p={[x, 0.15, z]} />
          ))}
        </group>
      )}
    </Near>
  )
}

/** Two people on a bench, doing a thing. */
function BenchPair({ t, side, what = 'chat', turn = 0.35 }: { t: number; side: number; what?: 'chat' | 'eat' | 'laptop' | 'view'; turn?: number }) {
  const looks = useMemo(() => [randomLook(), randomLook()], [])
  return (
    <Near t={t}>
      <At t={t} side={side} turn={turn}>
        <M c="#a8703f" s={[1.8, 0.1, 0.55]} p={[0, 0.48, 0]} />
        <M c="#a8703f" s={[1.8, 0.45, 0.08]} p={[0, 0.82, -0.27]} r={[-0.15, 0, 0]} />
        <M c="#3b3b4a" s={[0.08, 0.46, 0.45]} p={[-0.8, 0.23, 0]} />
        <M c="#3b3b4a" s={[0.08, 0.46, 0.45]} p={[0.8, 0.23, 0]} />
        {[-0.45, 0.45].map((x, i) => (
          <Npc
            key={x}
            look={looks[i]}
            p={[x, 0, -0.02]}
            r={what === 'chat' ? (i ? -0.5 : 0.5) : 0}
            sit
            armL={what === 'chat' && i === 0 ? [-0.3, 0, 0.4] : [-1.1, 0, -0.4]}
            armR={what === 'chat' && i === 1 ? [-0.3, 0, -0.4] : [-1.1, 0, 0.4]}
            anim={(n, time) => {
              if (what === 'chat') {
                n.head.rotation.y = Math.sin(time * 0.9 + i) * 0.2
                if (i === 0) n.armL.rotation.z = 0.4 + Math.sin(time * 4) * 0.25
                else n.armR.rotation.z = -0.4 - Math.max(0, Math.sin(time * 3.4)) * 0.3
              } else if (what === 'eat') {
                const bite = Math.max(0, Math.sin(time * 2.2 + i * 1.7))
                n.armR.rotation.x = -1.1 - bite * 0.9
                n.head.rotation.x = 0.25
              } else if (what === 'laptop') {
                n.armL.rotation.x = -1.1 + Math.max(0, Math.sin(time * 9 + i)) * 0.07
                n.armR.rotation.x = -1.1 + Math.max(0, Math.sin(time * 9 + 2 + i)) * 0.07
                n.head.rotation.x = 0.35
              } else n.head.rotation.y = Math.sin(time * 0.3 + i) * 0.15
            }}
          >
            {what === 'eat' && (
              <group position={[0, 1.02, 0.42]}>
                <M c="#ff6b35" s={[0.32, 0.2, 0.26]} />
                <M c="#fff8ec" s={[0.33, 0.04, 0.27]} p={[0, 0.06, 0]} shadow={false} />
              </group>
            )}
            {what === 'laptop' && (
              <group position={[0, 0.98, 0.42]}>
                <M c="#c7ccd6" s={[0.42, 0.03, 0.3]} />
                <M m={glow('#9fd8ff', 0.8, 1)} s={[0.42, 0.28, 0.02]} p={[0, 0.15, -0.14]} r={[-0.3, 0, 0]} shadow={false} />
              </group>
            )}
          </Npc>
        ))}
      </At>
    </Near>
  )
}

/* ---------- the stall: a barista ---------- */

export function Barista() {
  return (
    <Npc
      look={{ top: '#2a2320', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[1], hat: 'cap', hatColor: '#e8833a', apron: '#e8833a' }}
      p={[-0.2, 0, -1.05]}
      armL={[-1.1, 0, -0.2]}
      armR={[-0.6, 0, 0.2]}
      anim={(n, time) => {
        const pour = (time % 5) / 5
        n.armL.rotation.x = -1.1 - Math.sin(pour * Math.PI) * 0.4
        n.head.rotation.x = 0.25
        n.head.rotation.y = Math.sin(time * 0.6) * 0.3
      }}
    />
  )
}

/* ---------- design lane: someone painting ---------- */

export function Painter() {
  return (
    <Npc
      look={{ top: '#f7f3ea', legs: '#3d5a80', hair: '#3a2a22', skin: SKINS[0], hat: 'cap', hatColor: '#ff6b35', apron: '#f08b7d' }}
      p={[1.15, 0, 0.75]}
      r={-2.15}
      armL={[0, 0, 0.1]}
      armR={[-1.6, 0, 0.1]}
      anim={(n, time) => {
        n.armR.rotation.x = -1.6 + Math.sin(time * 3) * 0.25
        n.armR.rotation.z = Math.cos(time * 3) * 0.2
        n.head.rotation.x = Math.sin(time * 0.7) * 0.08
      }}
    >
      <M g="cyl" c="#c99a6b" s={[0.32, 0.03, 0.24]} p={[0.42, 0.9, 0.2]} r={[0, 0, -0.3]} />
      {['#ff6b35', '#3d5a80', '#f5c23e'].map((c, i) => (
        <M key={c} g="sph" c={c} s={0.06} p={[0.36 + i * 0.07, 0.94, 0.18 + (i % 2) * 0.06]} shadow={false} />
      ))}
    </Npc>
  )
}

/* ---------- campus: CampusBuzz check-in, and a cricket match ---------- */

function CampusBuzzScene() {
  const tag = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.252)) return
    const k = (clock.elapsedTime * 0.4) % 1
    tag.current.position.y = 2.5 + k * 0.6
    tag.current.scale.setScalar(Math.sin(k * Math.PI) * 0.9)
  })
  return (
    <>
      {/* check-in table */}
      <M c="#3d5a80" s={[1.6, 0.06, 0.6]} p={[-0.2, 0.78, -0.35]} />
      <M c="#3d5a80" s={[1.5, 0.7, 0.05]} p={[-0.2, 0.42, -0.08]} />
      <Sign text="CampusBuzz · check-in" w={1.3} h={0.26} p={[-0.2, 0.55, -0.05]} back={false} bg="#3d5a80" fg="#fff8ec" />
      <group position={[-0.5, 0.82, -0.45]} rotation={[0, 0.3, 0]}>
        <M c="#c7ccd6" s={[0.42, 0.03, 0.3]} />
        <M m={glow('#ff6b35', 0.7, 1)} s={[0.42, 0.28, 0.02]} p={[0, 0.15, -0.15]} r={[-0.25, 0, 0]} shadow={false} />
      </group>
      <Npc
        look={{ top: '#ff6b35', legs: '#2f3a55', hair: '#231c1e', skin: SKINS[2] }}
        p={[-0.35, 0, -0.95]}
        armL={[-1.2, 0, -0.3]}
        armR={[-0.5, 0, 0.2]}
        anim={(n, time) => {
          n.armL.rotation.x = -1.2 + Math.max(0, Math.sin(time * 8)) * 0.06
          n.head.rotation.y = Math.sin(time * 0.8) * 0.35
        }}
      />
      {/* students in the queue, the first one showing a ticket on their phone */}
      {[0, 1].map((i) => (
        <Npc
          key={i}
          look={i ? { top: '#8a5fb5', legs: '#39425e', hair: '#5a3a28', skin: SKINS[3] } : { top: '#3ddc97', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[0] }}
          p={[0.25 + i * 0.75, 0, 0.45 + i * 0.35]}
          r={Math.PI - 0.6}
          armR={i ? [0, 0, -0.1] : [-1.4, 0, 0.1]}
          anim={(n, time) => {
            if (i) n.head.rotation.y = Math.sin(time * 0.5) * 0.4
            else n.head.rotation.x = 0.1
          }}
        >
          {i === 0 && (
            <group position={[-0.36, 1.25, 0.48]} rotation={[-0.2, 0, 0]}>
              <M c="#1f1a1c" s={[0.15, 0.27, 0.03]} />
              <M m={glow('#ffffff', 1, 0.6)} s={[0.11, 0.11, 0.01]} p={[0, 0.02, 0.018]} shadow={false} />
            </group>
          )}
        </Npc>
      ))}
      <group ref={tag} position={[0.25, 2.5, 0.45]}>
        <Sign text="enrolled ✓" w={1.1} h={0.36} bg="#3ddc97" fg="#14322a" lit={0.6} back="#14322a" />
      </group>
      {/* event standee */}
      <group position={[1.35, 0, -0.9]} rotation={[0, -0.3, 0]}>
        <M c="#2a2320" s={[0.06, 1.9, 0.06]} p={[0, 0.95, -0.1]} r={[0.15, 0, 0]} />
        <Sign text={'TECH FEST\n~sat · main audi'} w={1} h={1.4} p={[0, 1.4, 0]} bg="#ff6b35" fg="#fff8ec" />
      </group>
    </>
  )
}

/** A gully-cricket match on the campus lawn. Tap it and someone hits a six. */
function Cricket() {
  const ball = useRef<THREE.Group>(null!)
  const six = useRef(0)
  const T = 0.264
  const cycle = 3.2
  const ballAt = (k: number, out: THREE.Vector3) => {
    // bowled down the pitch, then hit back past the bowler (or into orbit, after a tap)
    if (k < 0.45) {
      const f = k / 0.45
      out.set(0.1, 1.6 - f * 1.4 + Math.sin(f * Math.PI) * 0.2 + (f > 0.8 ? (f - 0.8) * 2 : 0), 3.2 - f * 6.2)
    } else {
      const f = (k - 0.45) / 0.55
      const h = six.current > 0 ? 9 : 1.5
      out.set(0.1 + f * (six.current > 0 ? 6 : 2), 0.6 + Math.sin(f * Math.PI) * h, -3 + f * (six.current > 0 ? 18 : 9))
    }
  }
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }, dt) => {
    if (!near(T, 0.07)) return
    six.current = Math.max(0, six.current - dt)
    ballAt((clock.elapsedTime % cycle) / cycle, tmp)
    ball.current.position.copy(tmp)
  })
  const swing = (n: NpcParts, time: number) => {
    const k = (time % cycle) / cycle
    const s = k > 0.38 && k < 0.55 ? Math.sin(((k - 0.38) / 0.17) * Math.PI) : 0
    n.armL.rotation.x = -0.6 - s * 1.2
    n.armR.rotation.x = -0.6 - s * 1.2
    n.body.rotation.y = s * 1.1
  }
  return (
    <Near t={T}>
      <At t={T} side={6.8} face={false}>
        <Tap
          onTap={() => {
            six.current = cycle * 1.2
            blip('egg')
            findEgg('six', "SIX! gully cricket rules: that's out AND six.")
          }}
        >
          <Hit s={[4, 3, 8]} p={[0, 1, 0]} />
          <M c="#d8c79a" s={[1.2, 0.03, 7]} p={[0, 0.03, 0]} shadow={false} />
          {[-3, 3].map((z) => (
            <group key={z} position={[0, 0, z]}>
              {[-0.1, 0, 0.1].map((x) => <M key={x} g="cyl" c="#f3e3c3" s={[0.04, 0.7, 0.04]} p={[x, 0.35, 0]} />)}
              <M c="#f3e3c3" s={[0.26, 0.03, 0.04]} p={[0, 0.71, 0]} shadow={false} />
            </group>
          ))}
          {/* batter */}
          <Npc look={{ top: '#f7f3ea', legs: '#f7f3ea', hair: '#231c1e', skin: SKINS[1], hat: 'cap', hatColor: '#3d5a80' }} p={[-0.35, 0, -2.6]} r={0.5} armL={[-0.6, 0, -0.4]} armR={[-0.6, 0, 0.4]} anim={swing}>
            <group position={[0, 0.9, 0.5]} rotation={[0.6, 0, 0]}>
              <M c="#e6c99a" s={[0.12, 0.7, 0.05]} p={[0, -0.2, 0]} />
              <M c="#2a2320" s={[0.06, 0.25, 0.06]} p={[0, 0.25, 0]} />
            </group>
          </Npc>
          {/* bowler, running in */}
          <Npc
            look={{ top: '#3ddc97', legs: '#2f2a33', hair: '#3a2a22', skin: SKINS[2] }}
            p={[0.3, 0, 3.6]}
            r={Math.PI}
            anim={(n, time) => {
              const k = (time % cycle) / cycle
              n.root.position.z = 3.6 + Math.max(0, 0.3 - k) * 4 - (k < 0.3 ? 1.2 : 0)
              if (k < 0.3) stride(n, time * 9)
              else {
                n.armR.rotation.x = k < 0.38 ? -3 + (k - 0.3) * 20 : 0
                n.legL.rotation.x = n.legR.rotation.x = 0
              }
            }}
          />
          {/* fielder, hopeful */}
          <Npc
            look={{ top: '#d9534f', legs: '#39425e', hair: '#231c1e', skin: SKINS[0] }}
            p={[2.4, 0, 1.5]}
            r={-2.2}
            armL={[-0.4, 0, -0.5]}
            armR={[-0.4, 0, 0.5]}
            anim={(n, time) => {
              n.body.position.y = Math.abs(Math.sin(time * 3)) * 0.05
            }}
          />
          <group ref={ball}>
            <M g="sph" c="#c9302c" s={0.13} shadow={false} />
          </group>
        </Tap>
      </At>
    </Near>
  )
}

/* ---------- the win: the team celebrating ---------- */

export function Team() {
  const looks: Look[] = [
    { top: '#3d5a80', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[1] },
    { top: '#f5c23e', legs: '#39425e', hair: '#5a3a28', skin: SKINS[3] },
    { top: '#3ddc97', legs: '#2f3a55', hair: '#231c1e', skin: SKINS[2] },
  ]
  const spots: [V3, number][] = [[[-3.05, 0.4, 0.9], 0.4], [[3.05, 0.4, 0.9], -0.4], [[2.9, 0.4, -0.3], -0.6]]
  return (
    <>
      {spots.map(([p, r], i) => (
        <Npc
          key={i}
          look={looks[i]}
          p={p}
          r={r}
          armL={[0, 0, 2.6]}
          armR={[0, 0, -2.6]}
          anim={(n, time) => {
            const j = Math.abs(Math.sin(time * 4 + i * 1.3))
            n.root.position.y = 0.4 + j * 0.3
            n.armL.rotation.z = 2.5 + Math.sin(time * 8 + i) * 0.3
            n.armR.rotation.z = -2.5 - Math.sin(time * 8 + i + 1) * 0.3
            n.legL.rotation.x = n.legR.rotation.x = -j * 0.3
            n.kneeL.rotation.x = n.kneeR.rotation.x = j * 0.6
          }}
        />
      ))}
    </>
  )
}

/* ---------- hackathon tent: hackers, a sleeper, a mentor ---------- */

export function Hackers() {
  const zzz = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.42)) return
    const k = (clock.elapsedTime * 0.5) % 1
    zzz.current.position.y = 1.7 + k * 0.6
    zzz.current.scale.setScalar(Math.sin(k * Math.PI) * 0.8)
  })
  const coders: [number, number][] = [[-1.45, 0.2], [-0.75, -0.2], [0.75, 0.1]]
  return (
    <>
      {coders.map(([x, r], i) => (
        <group key={x}>
          <M g="cyl" c="#3b3b4a" s={[0.36, 0.48, 0.36]} p={[x, 0.24, -0.78]} />
          <Npc
            look={randomLook()}
            p={[x, 0, -0.78]}
            r={r}
            sit
            armL={[-1.35, 0, -0.2]}
            armR={[-1.35, 0, 0.2]}
            anim={(n, time) => {
              n.armL.rotation.x = -1.35 + Math.max(0, Math.sin(time * 10 + i)) * 0.08
              n.armR.rotation.x = -1.35 + Math.max(0, Math.sin(time * 10 + 2 + i)) * 0.08
              n.head.rotation.x = 0.3
              n.head.rotation.y = Math.sin(time * 0.4 + i) * 0.2
            }}
          />
        </group>
      ))}
      {/* asleep on the keyboard */}
      <M g="cyl" c="#3b3b4a" s={[0.36, 0.48, 0.36]} p={[1.45, 0.24, -0.78]} />
      <Npc
        look={{ top: '#8a5fb5', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[0] }}
        p={[1.45, 0, -0.78]}
        sit
        armL={[-1.5, 0, -0.5]}
        armR={[-1.5, 0, 0.5]}
        anim={(n, time) => {
          n.body.rotation.x = 0.55
          n.head.rotation.x = 0.6
          n.body.position.y = -0.12 + Math.sin(time * 1.2) * 0.015
        }}
      />
      <group ref={zzz} position={[1.6, 1.7, -0.5]}>
        <Sign text="z z Z" w={0.7} h={0.3} back={false} bg="#fff8ec" hand />
      </group>
      {/* a mentor doing laps with a coffee */}
      <Npc
        look={{ top: '#2a2320', legs: '#5b6b8c', hair: '#8a5a3c', skin: SKINS[3] }}
        armR={[-1.2, 0, 0.1]}
        anim={(n, time) => {
          const k = (time * 0.16) % 2
          const f = k < 1 ? k : 2 - k
          n.root.position.set(-1.9 + f * 3.8, 0, 1.2)
          n.root.rotation.y = k < 1 ? Math.PI / 2 : -Math.PI / 2
          stride(n, time * 5)
          n.armR.rotation.x = -1.2
        }}
      >
        <M g="cup" c="#fdf6ea" s={[0.14, 0.18, 0.14]} p={[-0.36, 1.08, 0.5]} />
      </Npc>
    </>
  )
}

/* ---------- KhaoGully: life between the booths ---------- */

function ChaiCart({ t }: { t: number }) {
  return (
    <Near t={t}>
      <At t={t} side={-5.2} turn={0.35}>
        <M c="#3d8f7a" s={[1.6, 0.8, 0.8]} p={[0, 0.65, 0]} />
        <M c="#efe9dc" s={[1.7, 0.06, 0.9]} p={[0, 1.08, 0]} />
        {[-0.6, 0.6].map((x) => <M key={x} g="cyl" c="#2a2320" s={[0.44, 0.1, 0.44]} p={[x, 0.22, 0.42]} r={[Math.PI / 2, 0, 0]} />)}
        <M g="cup" c="#c7ccd6" s={[0.3, 0.32, 0.3]} p={[-0.35, 1.27, 0]} r={[Math.PI, 0, 0]} />
        <Puffs p={[-0.35, 1.45, 0]} n={3} size={0.08} />
        {[0.15, 0.35, 0.55].map((x) => <M key={x} g="cup" c="#b8683a" s={[0.1, 0.13, 0.1]} p={[x, 1.17, 0.2]} />)}
        <M c="#6a4a3a" s={[0.06, 1.3, 0.06]} p={[0.75, 1.75, -0.3]} />
        <Sign text={'CHAI ☕\n~₹10'} w={0.9} h={0.55} p={[0.75, 2.55, -0.3]} bg="#f5c23e" />
        <Npc look={{ top: '#f7f3ea', legs: '#6a4a3a', hair: '#231c1e', skin: SKINS[2] }} p={[-0.2, 0, -0.75]} armL={[-1.1, 0, -0.3]}
          anim={(n, time) => { n.armL.rotation.x = -1.1 - Math.max(0, Math.sin(time * 1.5)) * 0.5 }} />
        <Npc look={randomLook()} p={[0.45, 0, 0.95]} r={Math.PI - 0.3} armR={[-1.3, 0, 0.1]}
          anim={(n, time) => { n.armR.rotation.x = -1.3 - Math.max(0, Math.sin(time * 1.1)) * 0.5 }}>
          <M g="cup" c="#b8683a" s={[0.1, 0.13, 0.1]} p={[-0.36, 1.12, 0.5]} />
        </Npc>
      </At>
    </Near>
  )
}

function PickupPoint({ t }: { t: number }) {
  return (
    <Near t={t}>
      <At t={t} side={-5.2} turn={0.35}>
        <M c="#efe9dc" s={[1.4, 0.8, 0.6]} p={[0, 0.4, -0.2]} />
        <Sign text="PICKUP" w={1} h={0.3} p={[0, 0.55, 0.11]} back={false} bg="#efe9dc" />
        {[-0.4, 0, 0.4].map((x, i) => (
          <group key={x} position={[x, 0.95, -0.2]}>
            <M c="#ff6b35" s={[0.32, 0.26, 0.3]} />
            <M c="#fff8ec" s={[0.33, 0.04, 0.31]} p={[0, 0.06 - i * 0.02, 0]} shadow={false} />
          </group>
        ))}
        <Npc look={{ top: '#3d5a80', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[1], hat: 'helmet', hatColor: '#ff6b35' }} p={[0.9, 0, 0.6]} r={-0.8}
          armL={[-1.4, 0, -0.6]} anim={(n, time) => { n.head.rotation.x = 0.35 + Math.sin(time) * 0.05 }} />
      </At>
    </Near>
  )
}

function Bikes({ t }: { t: number }) {
  return (
    <Near t={t}>
      <At t={t} side={-5.4} turn={0.35}>
        <M g="cup" c="#c9735a" s={[0.9, 0.7, 0.9]} p={[-0.7, 0.35, 0]} />
        <M g="ico" c="#6fae5c" s={[1.3, 1.4, 1.3]} p={[-0.7, 1.2, 0]} />
        <M g="ico" c="#86c06a" s={[0.9, 1, 0.9]} p={[-0.45, 1.75, 0.2]} />
        {[0.3, 0.9].map((x, i) => (
          <group key={x} position={[x, 0, 0]} rotation={[0, 0.15 * i, 0]}>
            {[-0.35, 0.35].map((z) => <M key={z} g="cyl" c="#2a2320" s={[0.55, 0.05, 0.55]} p={[0, 0.3, z]} r={[0, 0, Math.PI / 2]} />)}
            <M c={i ? '#5b8def' : '#f5c23e'} s={[0.05, 0.05, 0.75]} p={[0, 0.5, 0]} r={[0.2, 0, 0]} />
            <M c="#2a2320" s={[0.2, 0.05, 0.12]} p={[0, 0.68, -0.25]} />
            <M c="#2a2320" s={[0.4, 0.04, 0.04]} p={[0, 0.72, 0.32]} />
          </group>
        ))}
      </At>
    </Near>
  )
}

/* ---------- AI lab ---------- */

function DocRagScene() {
  const { g, tex, material } = useScreen(400, 260)
  useMemo(() => {
    g.fillStyle = '#1e1e2a'
    g.fillRect(0, 0, 400, 260)
    g.fillStyle = '#2a2a3a'
    g.fillRect(0, 0, 60, 260)
    const colors = ['#c9b6f2', '#9fd8ff', '#f7a8c4', '#3ddc97', '#f5c23e']
    for (let i = 0; i < 9; i++) {
      g.fillStyle = colors[i % 5]
      g.fillRect(76 + (i % 3) * 12, 22 + i * 18, 60 + ((i * 37) % 140), 8)
    }
    g.fillStyle = '#ff6b35'
    g.beginPath()
    g.roundRect(76, 190, 160, 30, 15)
    g.fill()
    g.fillStyle = '#fff'
    g.font = `700 16px ${MONO}`
    g.textBaseline = 'middle'
    g.fillText('#docrag ✓', 92, 206)
    g.fillStyle = '#ff6b35'
    g.fillRect(0, 240, 400, 20)
    g.fillStyle = '#fff'
    g.font = `600 12px ${MONO}`
    g.fillText('DocRAG: 41 chunks indexed', 70, 251)
    tex.needsUpdate = true
  }, [g, tex])
  const pages = useRef<THREE.Group>(null!)
  const from = useMemo(() => new THREE.Vector3(-1.1, 1.6, -1), [])
  const to = useMemo(() => new THREE.Vector3(0.35, 1.3, -0.45), [])
  useFrame(({ clock }) => {
    if (!near(0.714)) return
    pages.current.children.forEach((p, i) => {
      const k = (clock.elapsedTime * 0.45 + i / 5) % 1
      p.position.lerpVectors(from, to, k)
      p.position.y += Math.sin(k * Math.PI) * 1.1
      p.rotation.set(k * 6 + i, k * 4, 0)
      p.scale.setScalar(Math.sin(k * Math.PI) + 0.1)
    })
  })
  return (
    <>
      {/* the docs, as a bookshelf */}
      <group position={[-1, 0, -1.05]}>
        {[-0.6, 0.6].map((x) => <M key={x} c="#6a4a3a" s={[0.08, 2.2, 0.45]} p={[x, 1.1, 0]} />)}
        {[0.5, 1.2, 1.9].map((y, row) => (
          <group key={y}>
            <M c="#6a4a3a" s={[1.25, 0.06, 0.45]} p={[0, y - 0.03, 0]} />
            {Array.from({ length: 7 }, (_, i) => (
              <M key={i} c={['#d9534f', '#3d5a80', '#f5c23e', '#3d8f7a', '#8a5fb5', '#e8833a', '#f7f3ea'][(i + row * 3) % 7]}
                s={[0.13, 0.42 + ((i * 7 + row) % 3) * 0.06, 0.32]} p={[-0.45 + i * 0.15, y + 0.22, 0]} r={[0, 0, i === 3 ? 0.2 : 0]} />
            ))}
          </group>
        ))}
      </group>
      <group ref={pages}>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i}>
            <M c="#fff8ec" s={[0.22, 0.3, 0.01]} shadow={false} />
            <M c="#9aa0ad" s={[0.16, 0.02, 0.012]} p={[0, 0.06, 0]} shadow={false} />
            <M c="#9aa0ad" s={[0.16, 0.02, 0.012]} p={[0, 0, 0]} shadow={false} />
          </group>
        ))}
      </group>
      {/* desk, monitor, dev */}
      <M c="#efe9dc" s={[1.5, 0.07, 0.7]} p={[0.3, 0.78, -0.3]} />
      {[[-0.38, -0.58], [0.98, -0.58], [-0.38, -0.02], [0.98, -0.02]].map(([x, z]) => <M key={`${x}${z}`} c="#3b3b4a" s={[0.06, 0.75, 0.06]} p={[x, 0.38, z]} />)}
      <M c="#3b3b4a" s={[0.08, 0.3, 0.08]} p={[0.45, 0.96, -0.5]} />
      <group position={[0.45, 1.36, -0.48]} rotation={[0, -0.4, 0]}>
        <M c="#1f1a1c" s={[1.02, 0.68, 0.05]} />
        <mesh geometry={G.plane} material={material} scale={[0.94, 0.6, 1]} position={[0, 0, 0.028]} />
      </group>
      <M c="#8a5fb5" s={[0.5, 0.08, 0.5]} p={[-0.45, 0.5, 0.35]} />
      <Npc
        look={{ top: '#3d8f7a', legs: '#2f3a55', hair: '#231c1e', skin: SKINS[1] }}
        p={[-0.45, 0, 0.37]}
        r={Math.PI - 0.7}
        sit
        armL={[-1.3, 0, -0.2]}
        armR={[-1.3, 0, 0.2]}
        anim={(n, time) => {
          n.armL.rotation.x = -1.3 + Math.max(0, Math.sin(time * 9)) * 0.08
          n.armR.rotation.x = -1.3 + Math.max(0, Math.sin(time * 9 + 2)) * 0.08
        }}
      />
    </>
  )
}

const FORM_Q: [string, string][] = [
  ['Full name', 'Aryan Yadav'],
  ['College', 'KIIT University'],
  ['What do you build?', 'Full-stack + AI'],
  ['Available to start?', 'Next week'],
  ['Why you?', 'see this website'],
]

function FormScene() {
  const { g, tex, material } = useScreen(400, 520)
  const shown = useRef(-1)
  const draw = (k: number) => {
    g.fillStyle = '#efe7f7'
    g.fillRect(0, 0, 400, 520)
    g.fillStyle = '#8a5fb5'
    g.fillRect(0, 0, 400, 14)
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.roundRect(16, 26, 368, 70, 10)
    g.fill()
    g.fillStyle = '#2a2320'
    g.font = `800 24px ${FONT}`
    g.textBaseline = 'middle'
    g.fillText('Internship application', 32, 60)
    FORM_Q.forEach(([q, a], i) => {
      const y = 110 + i * 80
      g.fillStyle = '#ffffff'
      g.beginPath()
      g.roundRect(16, y, 368, 70, 10)
      g.fill()
      g.fillStyle = '#5a5060'
      g.font = `600 15px ${FONT}`
      g.fillText(q, 32, y + 20)
      const typed = Math.max(0, Math.min(a.length, Math.round((k * 5 - i) * a.length)))
      g.fillStyle = '#2a2320'
      g.font = `700 18px ${FONT}`
      g.fillText(a.slice(0, typed) + (typed > 0 && typed < a.length ? '▌' : ''), 32, y + 46)
      g.fillStyle = '#c9b6f2'
      g.fillRect(32, y + 58, 300, 2)
      if (typed === a.length) {
        g.fillStyle = '#3ddc97'
        g.font = `800 22px ${FONT}`
        g.fillText('✓', 350, y + 40)
      }
    })
    tex.needsUpdate = true
  }
  const spark = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.741)) return
    const k = Math.min(1, (clock.elapsedTime * 0.12) % 1.3)
    const step = Math.round(k * 120)
    if (step !== shown.current) (shown.current = step), draw(k)
    spark.current.rotation.z = clock.elapsedTime * 2
    spark.current.position.y = 2.75 + Math.sin(clock.elapsedTime * 2) * 0.1
  })
  return (
    <>
      {/* the form, on an easel */}
      <group position={[-0.55, 0, -0.85]} rotation={[0, 0.25, 0]}>
        <M c="#6a4a3a" s={[0.07, 2.4, 0.07]} p={[-0.6, 1.15, 0.05]} r={[0.1, 0, 0.08]} />
        <M c="#6a4a3a" s={[0.07, 2.4, 0.07]} p={[0.6, 1.15, 0.05]} r={[0.1, 0, -0.08]} />
        <M c="#2a2320" s={[1.4, 1.8, 0.06]} p={[0, 1.55, 0.12]} r={[-0.08, 0, 0]} />
        <mesh geometry={G.plane} material={material} scale={[1.3, 1.69, 1]} position={[0, 1.55, 0.16]} rotation={[-0.08, 0, 0]} />
      </group>
      <group ref={spark} position={[0.35, 2.75, -0.7]}>
        <Sign text="✨ Gemini" w={1.1} h={0.36} bg="#2a2340" fg="#e6f5ff" lit={0.6} back="#c9b6f2" />
      </group>
      {/* meanwhile, the human */}
      <group position={[0.75, 0, 0.35]} rotation={[0, -0.5, 0]}>
        <M c="#f08b7d" s={[0.6, 0.06, 0.9]} p={[0, 0.35, 0]} r={[-0.15, 0, 0]} />
        <M c="#f08b7d" s={[0.6, 0.06, 0.8]} p={[0, 0.65, -0.6]} r={[-1.0, 0, 0]} />
        {[[-0.28, 0.4], [0.28, 0.4], [-0.28, -0.4], [0.28, -0.4]].map(([x, z]) => <M key={`${x}${z}`} c="#c7ccd6" s={[0.04, 0.35, 0.04]} p={[x, 0.17, z]} />)}
        <Npc
          look={{ top: '#f5c23e', legs: '#3d5a80', hair: '#231c1e', skin: SKINS[0] }}
          p={[0, 0.02, -0.15]}
          sit
          armL={[0.2, 0, 2.2]}
          armR={[-1.3, 0, 0.3]}
          anim={(n, time) => {
            n.body.rotation.x = -0.45
            n.head.rotation.x = -0.15
            n.armR.rotation.x = -1.3 - Math.max(0, Math.sin(time * 0.9)) * 0.5
          }}
        >
          <M c="#1f1a1c" s={[0.36, 0.08, 0.04]} p={[0, 1.78, 0.27]} shadow={false} />
          <M g="cup" c="#b8683a" s={[0.12, 0.16, 0.12]} p={[-0.38, 1.1, 0.5]} />
        </Npc>
      </group>
    </>
  )
}

const SQL_STEPS = ['Generating SQL…', 'Executing query…', 'Interpreting results…']
const CHINOOK: [string, string][] = [['Helena Holý', '49.62'], ['Richard Cunningham', '47.62'], ['Luis Rojas', '46.62'], ['Ladislav Kovács', '45.62'], ["Hugh O'Reilly", '45.62']]

function SqlScene() {
  const { g, tex, material } = useScreen(420, 300)
  const shown = useRef(-1)
  const draw = (s: number) => {
    g.fillStyle = '#14322a'
    g.fillRect(0, 0, 420, 300)
    g.textBaseline = 'middle'
    g.fillStyle = '#3ddc97'
    g.font = `700 16px ${MONO}`
    g.fillText(s < 3 ? `● ${SQL_STEPS[s]}` : '✓ done · 312 tokens', 18, 22)
    if (s >= 1) {
      g.fillStyle = '#e6f5ff'
      g.font = `600 13px ${MONO}`
      ;['SELECT c.first_name, SUM(i.total)', 'FROM customer c JOIN invoice i', 'GROUP BY c.customer_id', 'ORDER BY 2 DESC LIMIT 5;'].forEach((l, i) =>
        g.fillText(l, 18, 54 + i * 18),
      )
    }
    if (s >= 2) {
      CHINOOK.forEach(([n, v], i) => {
        const y = 140 + i * 26
        g.fillStyle = i % 2 ? '#1c4034' : '#20493b'
        g.fillRect(14, y - 12, 392, 24)
        g.fillStyle = '#f4efdf'
        g.font = `600 14px ${FONT}`
        g.fillText(n, 24, y)
        g.textAlign = 'right'
        g.fillText('$' + v, 396, y)
        g.textAlign = 'left'
      })
    }
    tex.needsUpdate = true
  }
  const bits = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.767)) return
    const s = Math.floor(clock.elapsedTime / 1.6) % 5
    const step = Math.min(3, s)
    if (step !== shown.current) (shown.current = step), draw(step)
    bits.current.children.forEach((b, i) => {
      const k = (clock.elapsedTime * 0.6 + i / 6) % 1
      b.position.set(-0.1 + k * 1.1, 1 + k * 1.1, -0.8 + k * 0.2)
      b.scale.setScalar(Math.sin(k * Math.PI) * 0.1)
    })
  })
  return (
    <>
      <Npc
        look={{ top: '#d9534f', legs: '#2f2a33', hair: '#5a3a28', skin: SKINS[3] }}
        p={[-1.2, 0, 0.35]}
        r={0.45}
        armL={[-0.9, 0, -0.3]}
        anim={(n, time) => {
          n.armL.rotation.z = -0.3 + Math.sin(time * 3) * 0.25
          n.head.rotation.y = 0.3
        }}
      />
      <group position={[-1.05, 2.95, 0.3]}>
        <M g="sph" c="#ffffff" s={[1.55, 0.7, 0.3]} />
        <M g="sph" c="#ffffff" s={0.14} p={[-0.25, -0.45, 0]} />
        <Sign text={'top 5 customers\nby spend?'} w={1.15} h={0.46} p={[0, 0, 0.16]} back={false} bg="#ffffff" />
      </group>
      {/* the database */}
      <group position={[-0.25, 0, -0.85]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.3 + i * 0.5, 0]}>
            <M g="cyl" c="#3d5a80" s={[0.9, 0.42, 0.9]} />
            <M g="cyl" m={glow('#9fd8ff', 0.8, 1)} s={[0.92, 0.04, 0.92]} p={[0, 0.22, 0]} shadow={false} />
          </group>
        ))}
      </group>
      <group ref={bits}>
        {Array.from({ length: 6 }, (_, i) => <M key={i} m={glow('#3ddc97', 1.2, 1)} s={1} shadow={false} />)}
      </group>
      {/* the answer */}
      <group position={[0.85, 2.15, -0.75]} rotation={[-0.1, -0.35, 0]}>
        <M c="#2a2320" s={[1.75, 1.3, 0.05]} />
        <mesh geometry={G.plane} material={material} scale={[1.65, 1.2, 1]} position={[0, 0, 0.028]} />
      </group>
      <M c="#2a2320" s={[0.06, 1.5, 0.06]} p={[0.85, 0.75, -0.8]} />
    </>
  )
}

/* ---------- more builds ---------- */

function ThriftScene() {
  const { g, tex, material } = useScreen(320, 200)
  const shown = useRef(-1)
  const mail = useRef<THREE.Group>(null!)
  const draw = (dropped: boolean) => {
    g.fillStyle = '#fff8ec'
    g.fillRect(0, 0, 320, 200)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = dropped ? '#9aa0ad' : '#2a2320'
    g.font = `800 ${dropped ? 34 : 54}px ${FONT}`
    g.fillText('₹2,499', 160, dropped ? 50 : 95)
    if (dropped) {
      g.strokeStyle = '#d9534f'
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(95, 50)
      g.lineTo(225, 50)
      g.stroke()
      g.fillStyle = '#3d8f7a'
      g.font = `800 56px ${FONT}`
      g.fillText('₹1,799', 160, 112)
      g.font = `700 22px ${FONT}`
      g.fillText('↓ 28% · price dropped', 160, 165)
    }
    tex.needsUpdate = true
  }
  useFrame(({ clock }) => {
    if (!near(0.778)) return
    const k = (clock.elapsedTime * 0.3) % 1
    const d = k > 0.4 ? 1 : 0
    if (d !== shown.current) (shown.current = d), draw(!!d)
    const f = Math.max(0, (k - 0.45) / 0.55)
    mail.current.visible = d === 1
    mail.current.position.set(-0.1 - f * 1.0, 2.3 - f * 0.9 + Math.sin(f * Math.PI) * 0.5, -0.5 + f * 0.9)
    mail.current.rotation.z = Math.sin(f * 12) * 0.2
  })
  return (
    <>
      {/* a giant price tag */}
      <group position={[0.2, 2, -0.75]} rotation={[0, -0.2, 0.08]}>
        <M c="#f5c23e" s={[1.75, 1.15, 0.06]} />
        <M g="cyl" c="#2a2320" s={[0.12, 0.08, 0.12]} p={[-0.72, 0.4, 0]} r={[Math.PI / 2, 0, 0]} />
        <mesh geometry={G.plane} material={material} scale={[1.45, 0.9, 1]} position={[0.08, -0.05, 0.035]} />
      </group>
      <M c="#2a2320" s={[0.02, 1.4, 0.02]} p={[-0.45, 0.85, -0.8]} r={[0, 0, -0.2]} />
      {/* price history */}
      <group position={[1.25, 0, -0.95]}>
        <M c="#efe9dc" s={[0.9, 1.2, 0.05]} p={[0, 0.9, 0]} />
        {[0.8, 1.0, 0.9, 1.1, 0.6, 0.45].map((h, i) => (
          <M key={i} c={i > 3 ? '#3d8f7a' : '#d9534f'} s={[0.1, h * 0.7, 0.03]} p={[-0.32 + i * 0.13, 0.35 + h * 0.35, 0.05]} shadow={false} />
        ))}
      </group>
      <group ref={mail}>
        <M c="#fff8ec" s={[0.42, 0.28, 0.04]} />
        <M c="#d9534f" s={[0.3, 0.03, 0.045]} p={[0, 0.03, 0]} r={[0, 0, 0.5]} shadow={false} />
        <M c="#d9534f" s={[0.3, 0.03, 0.045]} p={[0, 0.03, 0]} r={[0, 0, -0.5]} shadow={false} />
      </group>
      <Npc
        look={{ top: '#f08b7d', legs: '#2f3a55', hair: '#231c1e', skin: SKINS[2] }}
        p={[-1, 0, 0.45]}
        r={0.6}
        armL={[0, 0, 0.2]}
        armR={[0, 0, -0.2]}
        anim={(n, time) => {
          n.head.rotation.x = -0.25
          n.body.position.y += Math.max(0, Math.sin(time * 1.9)) * 0.04
        }}
      >
        <M c="#8a5fb5" s={[0.3, 0.36, 0.14]} p={[0.48, 0.72, 0]} />
        <M c="#3ddc97" s={[0.26, 0.3, 0.14]} p={[-0.48, 0.74, 0]} />
      </Npc>
    </>
  )
}

const HELLOS: [string, string][] = [['hello! 👋', 'नमस्ते! 🙏'], ['¿qué tal?', 'all good!'], ['bonjour', 'kaise ho?']]

function ChatScene() {
  const bubbles = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.794)) return
    const k = clock.elapsedTime * 0.5
    const turn = Math.floor(k) % 6
    bubbles.current.children.forEach((b, i) => (b.visible = i === turn))
    bubbles.current.position.y = Math.sin(clock.elapsedTime * 2) * 0.04
  })
  return (
    <>
      <M g="cyl" c="#efe9dc" s={[0.8, 0.06, 0.8]} p={[0, 0.75, -0.1]} />
      <M g="cyl" c="#3b3b4a" s={[0.08, 0.72, 0.08]} p={[0, 0.37, -0.1]} />
      {[-1, 1].map((sgn) => (
        <group key={sgn}>
          <M g="cyl" c="#3b3b4a" s={[0.4, 0.48, 0.4]} p={[sgn * 0.85, 0.24, -0.1]} />
          <Npc
            look={sgn < 0 ? { top: '#5b8def', legs: '#2f2a33', hair: '#231c1e', skin: SKINS[3] } : { top: '#e8833a', legs: '#39425e', hair: '#231c1e', skin: SKINS[2] }}
            p={[sgn * 0.85, 0, -0.1]}
            r={-sgn * 1.25}
            sit
            armL={[-0.9, 0, -0.2]}
            armR={[-0.9, 0, 0.2]}
            anim={(n, time) => {
              const talking = Math.floor(time * 0.5) % 2 === (sgn < 0 ? 0 : 1)
              n.armL.rotation.z = talking ? -0.2 + Math.sin(time * 5) * 0.3 : -0.2
              n.head.rotation.z = talking ? Math.sin(time * 3) * 0.08 : 0
            }}
          />
        </group>
      ))}
      <Sign text="⇄" w={0.5} h={0.4} p={[0, 1.95, -0.1]} back={false} bg="#fff8ec" />
      <group ref={bubbles}>
        {HELLOS.flatMap(([a, b]) => [a, b]).map((s, i) => (
          <group key={s} position={[i % 2 ? 0.9 : -0.9, 3.05, -0.1]}>
            <M g="sph" c={i % 2 ? '#e8833a' : '#5b8def'} s={[1.3, 0.55, 0.25]} />
            <Sign text={s} w={1} h={0.34} p={[0, 0, 0.14]} back={false} bg={i % 2 ? '#e8833a' : '#5b8def'} fg="#ffffff" />
          </group>
        ))}
      </group>
    </>
  )
}

/* ---------- 3D: someone scanning the splat ---------- */

export function Scanner() {
  return (
    <Npc
      look={{ top: '#2a2320', legs: '#39425e', hair: '#231c1e', skin: SKINS[1] }}
      armL={[-1.5, 0, -0.35]}
      armR={[-1.5, 0, 0.35]}
      anim={(n, time) => {
        const a = time * 0.35
        n.root.position.set(Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1)
        n.root.rotation.y = -a - Math.PI / 2
        stride(n, time * 4, 0.6)
        n.armL.rotation.x = n.armR.rotation.x = -1.5
        n.head.rotation.x = -0.1
      }}
    >
      <group position={[0, 1.42, 0.5]}>
        <M c="#2a2320" s={[0.3, 0.22, 0.12]} />
        <M g="cyl" c="#3b3b4a" s={[0.12, 0.1, 0.12]} p={[0, 0, 0.1]} r={[Math.PI / 2, 0, 0]} />
        <M g="sph" m={glow('#ff4d3d', 1, 1)} s={0.04} p={[0.1, 0.08, 0.06]} shadow={false} />
      </group>
    </Npc>
  )
}

/* ---------- everything, placed ---------- */

export function Scenes() {
  return (
    <>
      <Booth t={0.252} side={-6} id="campusbuzz" label="🎟️ CampusBuzz" c="#3d5a80"><CampusBuzzScene /></Booth>
      <Cricket />
      <BenchPair t={0.318} side={-4.2} what="laptop" />

      <ChaiCart t={0.537} />
      <BenchPair t={0.5515} side={-5.2} what="eat" />
      <Bikes t={0.566} />
      <PickupPoint t={0.5805} />

      <Booth t={0.714} id="docrag" label="📚 DocRAG" c="#3d8f7a"><DocRagScene /></Booth>
      <Booth t={0.741} id="formfiller" label="📝 AI Form Filler" c="#8a5fb5"><FormScene /></Booth>
      <Booth t={0.767} id="nlpsql" label="🗄️ NLP → SQL" c="#d98a6f"><SqlScene /></Booth>
      <Booth t={0.778} side={5.9} id="thrift" label="🏷️ Thrift Track" c="#f5c23e"><ThriftScene /></Booth>
      <Booth t={0.794} id="multilang" label="💬 MultiLang Chat" c="#5b8def"><ChatScene /></Booth>

      <BenchPair t={1.02} side={2.6} what="view" turn={0} />

      {/* people out for a walk */}
      <Walker from={0.02} to={0.17} side={2.6} speed={0.9} start={0.2} dog />
      <Walker from={0.06} to={0.2} side={-2.7} speed={1.2} start={0.6} />
      <Walker from={0.19} to={0.3} side={2.5} speed={1} start={0.1} />
      <Walker from={0.2} to={0.29} side={-2.6} speed={1.3} start={0.5} />
      <Walker from={0.21} to={0.3} side={-2.6} speed={0.8} start={0.9} />
      <Walker from={0.3} to={0.45} side={2.7} speed={1.1} start={0.35} />
      <Walker from={0.46} to={0.62} side={3.2} speed={1} start={0.15} />
      <Walker from={0.46} to={0.62} side={3.4} speed={1.3} start={0.65} dog />
      <Walker from={0.5} to={0.61} side={-2.9} speed={0.9} start={0.4} />
      <Walker from={0.62} to={0.8} side={3.2} speed={1.2} start={0.25} />
      <Walker from={0.66} to={0.8} side={-2.8} speed={1} start={0.75} />
      <Walker from={0.8} to={0.95} side={3} speed={0.9} start={0.5} dog />
    </>
  )
}
