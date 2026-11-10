// The show-off pieces: the Deloitte win, KhaoGully's numbers, and the AI lab.
import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { findEgg, live } from '../state'
import { Exhibit } from './Exhibit'
import type { ReactNode } from 'react'
import { blip } from '../sound'
import { At, G, Halo, Hit, M, Sign, Tap, glow, mat, toon, type V3 } from './kit'
import { place, rng, smooth } from './path'

const FONT = '"Bricolage Grotesque", system-ui, sans-serif'
const near = (t: number, r = 0.08) => Math.abs(live.t - t) < r

/** A canvas you repaint yourself, shown as a self-lit screen. */
export function useScreen(w: number, h: number) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    const material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    return { g: c.getContext('2d')!, tex, material }
  }, [w, h])
}

/* ---------- the Deloitte win ---------- */

const gold = toon({ color: '#f4b93a', emissive: '#8a5c00', emissiveIntensity: 0.45, side: THREE.DoubleSide })
const cupGeo = new THREE.LatheGeometry(
  [[0, 0], [0.6, 0], [0.6, 0.14], [0.34, 0.24], [0.2, 0.4], [0.13, 0.75], [0.16, 0.9], [0.34, 1], [0.58, 1.2],
    [0.7, 1.55], [0.72, 1.85], [0.64, 1.85], [0.6, 1.6], [0.5, 1.3], [0, 1.25]].map(([x, y]) => new THREE.Vector2(x, y)),
  40,
)
const handleGeo = new THREE.TorusGeometry(0.28, 0.065, 12, 24, Math.PI * 1.2)
const confettiGeo = new THREE.PlaneGeometry(0.16, 0.09)
const confettiMat = toon({ side: THREE.DoubleSide })
const CONFETTI = ['#ff6b35', '#f5c23e', '#5b8def', '#3ddc97', '#f7a8c4', '#ffffff']

/** Cone of light from `from` toward `to`, for stage spotlights. */
export function Beam({ from, to, r = 1.1 }: { from: V3; to: V3; r?: number }) {
  const { geo, q } = useMemo(() => {
    const d = new THREE.Vector3(...to).sub(new THREE.Vector3(...from))
    const h = d.length()
    const geo = new THREE.ConeGeometry(r, h, 24, 1, true)
    geo.translate(0, -h / 2, 0) // apex at the lamp
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.normalize())
    return { geo, q }
  }, [from, to, r])
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff2c4', transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [])
  return <mesh geometry={geo} material={m} position={from} quaternion={q} />
}

export function TrophyStage({ children }: { children?: ReactNode }) {
  const trophy = useRef<THREE.Group>(null!)
  const conf = useRef<THREE.InstancedMesh>(null!)
  const parts = useMemo(() => {
    const r = rng(31)
    return Array.from({ length: 180 }, () => ({
      p: new THREE.Vector3((r() - 0.5) * 7, r() * 8, (r() - 0.5) * 4),
      v: new THREE.Vector3(0, -(0.6 + r() * 0.8), 0),
      rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
      spin: 2 + r() * 5,
      burst: false,
    }))
  }, [])
  const o = useMemo(() => new THREE.Object3D(), [])

  useLayoutEffect(() => {
    const c = new THREE.Color()
    parts.forEach((_, i) => conf.current.setColorAt(i, c.set(CONFETTI[i % CONFETTI.length])))
    conf.current.instanceColor!.needsUpdate = true
  }, [parts])

  useFrame(({ clock }, rawDt) => {
    if (!near(0.373, 0.1)) return
    const dt = Math.min(rawDt, 0.05)
    const time = clock.elapsedTime
    trophy.current.rotation.y = time * 0.7
    trophy.current.position.y = 1.62 + Math.sin(time * 1.6) * 0.05
    parts.forEach((q, i) => {
      if (q.burst) {
        q.v.y -= 9 * dt
        q.v.multiplyScalar(1 - 0.7 * dt)
        if (q.v.y < -1.2) q.burst = false
      }
      q.p.addScaledVector(q.v, dt)
      q.p.x += Math.sin(time * 2 + i) * 0.3 * dt
      if (q.p.y < 0.4) {
        q.p.set((Math.random() - 0.5) * 7, 8, (Math.random() - 0.5) * 4)
        q.v.set(0, -(0.6 + Math.random() * 0.8), 0)
      }
      q.rot.x += q.spin * dt
      q.rot.y += q.spin * 0.7 * dt
      o.position.copy(q.p)
      o.rotation.copy(q.rot)
      o.updateMatrix()
      conf.current.setMatrixAt(i, o.matrix)
    })
    conf.current.instanceMatrix.needsUpdate = true
  })

  const burst = () => {
    for (const q of parts) {
      q.burst = true
      q.p.set((Math.random() - 0.5) * 0.6, 3.6, 0.6 + (Math.random() - 0.5) * 0.6)
      q.v.set((Math.random() - 0.5) * 7, 6 + Math.random() * 7, (Math.random() - 0.5) * 5)
    }
    blip('egg')
    findEgg('trophy', 'confetti cannon. every win gets one.')
  }

  return (
    <At t={0.373} side={-7} turn={0.35}>
      <Exhibit id="mailmesh" marker={[-2.4, 3.4, 1]} hit={[7.6, 3, 4.4]} hitAt={[0, 1.2, 0]}>
      {children}
      <M c="#2a2340" s={[7.5, 0.4, 4.2]} p={[0, 0.2, 0]} />
      <M c="#f5c23e" s={[7.6, 0.06, 0.1]} p={[0, 0.42, 2.08]} shadow={false} />
      {/* podium */}
      <M c="#f7f3ea" s={[1.6, 1.2, 1.4]} p={[0, 1, 0.6]} />
      <M c="#e9e1cf" s={[1.5, 0.8, 1.3]} p={[-1.6, 0.8, 0.6]} />
      <M c="#e9e1cf" s={[1.5, 0.5, 1.3]} p={[1.6, 0.65, 0.6]} />
      <Sign text="1" w={0.6} h={0.6} p={[0, 1, 1.31]} back={false} bg="#f7f3ea" fg="#e8a92c" />
      <Sign text="2" w={0.45} h={0.45} p={[-1.6, 0.8, 1.26]} back={false} bg="#e9e1cf" fg="#9aa0ad" />
      <Sign text="3" w={0.34} h={0.34} p={[1.6, 0.65, 1.26]} back={false} bg="#e9e1cf" fg="#b9774a" />
      {/* the trophy: tap it */}
      <Tap onTap={burst} position={[0, 0, 0.6]}>
        <Hit s={[2, 3, 2]} p={[0, 2.6, 0]} />
        <group ref={trophy} position={[0, 1.62, 0]}>
          <M c="#2a2320" s={[0.9, 0.3, 0.9]} p={[0, 0.15, 0]} />
          <mesh geometry={cupGeo} material={gold} position={[0, 0.3, 0]} castShadow />
          <mesh geometry={handleGeo} material={gold} position={[0.66, 1.75, 0]} rotation={[0, 0, -0.6 * Math.PI]} castShadow />
          <mesh geometry={handleGeo} material={gold} position={[-0.66, 1.75, 0]} rotation={[0, 0, 0.4 * Math.PI]} castShadow />
        </group>
      </Tap>
      <Halo p={[0, 2.8, 0.6]} s={5} />
      {/* banner and lights */}
      <M g="cyl" c="#2a2320" s={[0.18, 5.6, 0.18]} p={[-3.4, 3.2, -1.6]} />
      <M g="cyl" c="#2a2320" s={[0.18, 5.6, 0.18]} p={[3.4, 3.2, -1.6]} />
      <Sign text={'1st PLACE\n~Deloitte hackathon · MailMesh'} w={6.2} h={1.7} p={[0, 4.7, -1.6]} bg="#2a2320" fg="#f5c23e" lit={0.55} back="#f5c23e" />
      <M g="sph" m={glow('#fff2c4', 1, 1)} s={0.36} p={[-3.4, 6.05, -1.4]} shadow={false} />
      <M g="sph" m={glow('#fff2c4', 1, 1)} s={0.36} p={[3.4, 6.05, -1.4]} shadow={false} />
      <Beam from={[-3.4, 6, -1.4]} to={[0, 1.4, 0.6]} />
      <Beam from={[3.4, 6, -1.4]} to={[0, 1.4, 0.6]} />
      <instancedMesh ref={conf} args={[confettiGeo, confettiMat, parts.length]} frustumCulled={false} />
      </Exhibit>
    </At>
  )
}

export function InternshipDoor() {
  const badge = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    if (!near(0.4)) return
    badge.current.rotation.y = Math.sin(clock.elapsedTime * 0.9) * 0.9
    badge.current.position.y = 1.9 + Math.sin(clock.elapsedTime * 1.8) * 0.08
  })
  return (
    <At t={0.4} side={-5.6} turn={0.35}>
      <Exhibit id="mailmesh" marker={false}>
      <M c="#e9e1cf" s={[3.4, 0.25, 1.6]} p={[0, 0.12, 0.2]} />
      <M c="#2a2320" s={[0.35, 3.7, 0.45]} p={[-1.3, 2.05, 0]} />
      <M c="#2a2320" s={[0.35, 3.7, 0.45]} p={[1.3, 2.05, 0]} />
      <M c="#2a2320" s={[2.95, 0.4, 0.45]} p={[0, 3.9, 0]} />
      <M m={glow('#c8f7dc', 1.1, 0.8)} s={[2.25, 3.5, 0.08]} p={[0, 2, 0]} shadow={false} />
      <Halo p={[0, 2, 0.4]} s={6} />
      <Sign text={'INTERNSHIP\nUNLOCKED'} w={2.7} h={0.95} p={[0, 4.75, 0]} bg="#3ddc97" fg="#14322a" lit={0.5} back="#2a2320" />
      {/* a floating intern badge */}
      <group ref={badge} position={[0, 1.9, 1.15]}>
        <M c="#2a2320" s={[0.04, 0.6, 0.02]} p={[0, 0.85, 0]} shadow={false} />
        <Sign text={'INTERN\n~Deloitte · Aryan Yadav'} w={1.05} h={0.75} lit={0.5} back="#3ddc97" />
      </group>
      </Exhibit>
    </At>
  )
}

/** The other hackathons, as medals on a board. */
export function MedalWall() {
  const medals: [string, string, string][] = [['WALMART\n~hackathon', '#3d5a80', 'walmart'], ['WOODPECKER\n~StockSmart', '#3d8f7a', 'stocksmart']]
  return (
    <At t={0.428} side={-10.5} turn={0.35}>
      <M c="#6a4a3a" s={[0.14, 2.6, 0.14]} p={[-2.3, 1.3, 0]} />
      <M c="#6a4a3a" s={[0.14, 2.6, 0.14]} p={[2.3, 1.3, 0]} />
      <M c="#b98a5e" s={[4.9, 2, 0.12]} p={[0, 1.9, 0]} />
      {medals.map(([label, c, id], i) => (
        <group key={label} position={[i ? 1.15 : -1.15, 0, 0.08]}>
          <Exhibit id={id} marker={[0, 3.3, 0]} hit={[1.9, 2.4, 0.6]} hitAt={[0, 1.9, 0]}>
          <M c={c} s={[0.26, 0.6, 0.02]} p={[-0.12, 2.5, 0]} r={[0, 0, 0.3]} shadow={false} />
          <M c={c} s={[0.26, 0.6, 0.02]} p={[0.12, 2.5, 0]} r={[0, 0, -0.3]} shadow={false} />
          <M g="cyl" m={gold} s={[0.5, 0.08, 0.5]} p={[0, 2.12, 0.02]} r={[Math.PI / 2, 0, 0]} />
          <Sign text={label} w={1.9} h={0.6} p={[0, 1.4, 0.02]} bg={c} fg="#fff8ec" back={false} />
          </Exhibit>
        </group>
      ))}
    </At>
  )
}

/* ---------- KhaoGully: the numbers ---------- */

/** Billboard that counts installs up as you walk toward it. */
export function InstallCounter() {
  const { g, tex, material } = useScreen(1024, 480)
  const shown = useRef(-1)
  const draw = (v: number) => {
    const W = 1024, H = 480
    g.fillStyle = '#2a2320'
    g.fillRect(0, 0, W, H)
    g.fillStyle = '#3ddc97'
    g.beginPath()
    g.arc(58, 58, 14, 0, Math.PI * 2)
    g.fill()
    g.font = `700 34px ${FONT}`
    g.textBaseline = 'middle'
    g.fillStyle = '#f4efdf'
    g.textAlign = 'left'
    g.fillText('LIVE', 84, 60)
    g.textAlign = 'right'
    g.fillText('KhaoGully', W - 44, 60)
    g.textAlign = 'center'
    g.fillStyle = '#ff6b35'
    g.font = `800 230px ${FONT}`
    g.fillText(v.toLocaleString('en-US') + (v >= 5000 ? '+' : ''), W / 2, 250)
    g.fillStyle = '#f4efdf'
    g.font = `600 52px ${FONT}`
    g.fillText('installs across platforms', W / 2, 410)
    tex.needsUpdate = true
  }
  useFrame(() => {
    const v = Math.round((smooth(0.448, 0.482, live.t) * 5000) / 50) * 50
    if (v !== shown.current) (shown.current = v), draw(v)
  })
  return (
    <At t={0.49} side={-6.6} turn={0.35}>
      <M g="cyl" c="#3b3b4a" s={[0.22, 3.4, 0.22]} p={[-2.2, 1.7, -0.1]} />
      <M g="cyl" c="#3b3b4a" s={[0.22, 3.4, 0.22]} p={[2.2, 1.7, -0.1]} />
      <Exhibit id="khaogully" marker={false}>
        <M c="#3b3b4a" s={[5.9, 2.9, 0.22]} p={[0, 4.4, -0.1]} />
        <mesh geometry={G.plane} material={material} scale={[5.6, 2.62, 1]} position={[0, 4.4, 0.02]} />
      </Exhibit>
      <Halo p={[0, 4.4, 0.6]} s={8} />
    </At>
  )
}

const ORDER_STEPS = ['Order placed ✓', 'Preparing 🍳', 'Rider on the way 🛵', 'Delivered 🎉']
const phoneGeo = new RoundedBoxGeometry(3.4, 6.6, 0.4, 5, 0.45)

/** A giant phone running the customer app, cycling through a live order. */
export function PhoneBillboard() {
  const { g, tex, material } = useScreen(540, 1100)
  const step = useRef(-1)
  const pops = useRef<THREE.Group>(null!)
  const draw = (s: number) => {
    const W = 540
    const pill = (x: number, y: number, w: number, h: number, r: number, c: string) => {
      g.fillStyle = c
      g.beginPath()
      g.roundRect(x, y, w, h, r)
      g.fill()
    }
    g.fillStyle = '#fff8ec'
    g.fillRect(0, 0, W, 1100)
    g.textBaseline = 'middle'
    g.textAlign = 'left'
    g.fillStyle = '#2a2320'
    g.font = `700 24px ${FONT}`
    g.fillText('9:41', 40, 44)
    g.font = `800 58px ${FONT}`
    g.fillStyle = '#ff6b35'
    g.fillText('KhaoGully', 40, 132)
    g.fillStyle = '#7a6f66'
    g.font = `600 24px ${FONT}`
    g.fillText('what are we eating today?', 42, 184)
    pill(40, 220, W - 80, 64, 32, '#efe6d6')
    g.fillStyle = '#9a8f86'
    g.fillText('🔍  search biryani, momos…', 66, 253)
    ;['🍛', '🥟', '🍕', '🍔', '🧋'].forEach((e, i) => {
      pill(40 + i * 94, 310, 80, 80, 24, ['#ffe1cc', '#e3f1dd', '#fde7b0', '#f7d9e3', '#dfe7f7'][i])
      g.font = '44px sans-serif'
      g.textAlign = 'center'
      g.fillText(e, 80 + i * 94, 352)
    })
    g.textAlign = 'left'
    ;[['🍛', 'Biryani House', '★ 4.6 · 25 min', '#ffb37a'], ['🥟', 'Momo Point', '★ 4.5 · 18 min', '#9fd3a8']].forEach(([e, name, meta, c], i) => {
      const y = 420 + i * 190
      pill(40, y, W - 80, 170, 26, '#ffffff')
      pill(56, y + 16, 138, 138, 20, c)
      g.font = '84px sans-serif'
      g.textAlign = 'center'
      g.fillText(e, 125, y + 88)
      g.textAlign = 'left'
      g.fillStyle = '#2a2320'
      g.font = `800 34px ${FONT}`
      g.fillText(name, 216, y + 62)
      g.fillStyle = '#7a6f66'
      g.font = `600 24px ${FONT}`
      g.fillText(meta, 216, y + 108)
    })
    // live order card
    pill(30, 820, W - 60, 220, 30, '#2a2320')
    g.fillStyle = '#f4efdf'
    g.font = `600 22px ${FONT}`
    g.fillText('YOUR ORDER', 62, 862)
    g.fillStyle = '#ffffff'
    g.font = `800 40px ${FONT}`
    g.fillText(ORDER_STEPS[s], 62, 920)
    for (let i = 0; i < 4; i++) pill(62 + i * 106, 972, 94, 14, 7, i <= s ? '#ff6b35' : '#4a413c')
    tex.needsUpdate = true
  }
  useFrame(({ clock }) => {
    if (!near(0.505)) return
    const s = Math.floor(clock.elapsedTime / 1.6) % 4
    if (s !== step.current) (step.current = s), draw(s)
    // "+1 order" tags float up off the top of the phone
    pops.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.35 + i / 3) % 1
      c.position.set(Math.sin(i * 2.1) * 1.2, 7 + k * 2.6, 0.3)
      c.scale.setScalar(Math.sin(k * Math.PI) * 0.9)
    })
  })
  return (
    <At t={0.505} side={-9.2} turn={0.3}>
      <M c="#3b3b4a" s={[4.2, 0.4, 1.8]} p={[0, 0.2, 0]} />
      <group position={[0, 3.75, 0]} rotation={[-0.08, 0, 0]}>
        <Exhibit id="kg-customer" marker={[2.2, 2.6, 0]}>
        <mesh geometry={phoneGeo} material={mat('#1f1a1c')} castShadow receiveShadow />
        <mesh geometry={G.plane} material={material} scale={[3.04, 6.2, 1]} position={[0, 0, 0.205]} />
        <M c="#1f1a1c" s={[0.8, 0.2, 0.02]} p={[0, 2.88, 0.215]} shadow={false} />
        </Exhibit>
      </group>
      <group ref={pops}>
        {[0, 1, 2].map((i) => (
          <Sign key={i} text="+1 order" w={1.5} h={0.48} bg="#3ddc97" fg="#14322a" lit={0.6} back="#14322a" />
        ))}
      </group>
      <Halo p={[0, 3.8, 0.8]} s={7} />
    </At>
  )
}

/** Delivery pins over the city, with orders flowing to them from the KhaoGully arch. */
export function DeliveryPins() {
  const { pins, arcs } = useMemo(() => {
    const r = rng(55)
    const hub = place(0.455, 0)
    const from = new THREE.Vector3(hub.x, 6, hub.z)
    const pins = Array.from({ length: 14 }, (_, i) => {
      const t = 0.475 + (i / 14) * 0.15 + r() * 0.008
      const side = -(11 + r() * 7)
      const p = place(t, side)
      return { pos: new THREE.Vector3(p.x, 13 + r() * 5, p.z), phase: r() * 6 }
    })
    const arcs = pins.map(({ pos }) => {
      const mid = from.clone().lerp(pos, 0.5)
      mid.y = Math.max(from.y, pos.y) + 6
      return new THREE.QuadraticBezierCurve3(from, mid, pos)
    })
    return { pins, arcs }
  }, [])
  const lines = useMemo(() => arcs.map((a) => new THREE.BufferGeometry().setFromPoints(a.getPoints(40))), [arcs])
  const lineMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#ff6b35', transparent: true, opacity: 0.35 }), [])
  const heads = useRef<THREE.Group>(null!)
  const dots = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const on = live.t > 0.42 && live.t < 0.605
    heads.current.visible = dots.current.visible = on
    if (!on) return
    const time = clock.elapsedTime
    heads.current.children.forEach((h, i) => {
      h.position.copy(pins[i].pos)
      h.position.y += Math.sin(time * 1.5 + pins[i].phase) * 0.3
      h.rotation.y = time * 0.8 + pins[i].phase
    })
    dots.current.children.forEach((d, i) => {
      const k = (time * 0.22 + (i % 2) * 0.5 + pins[i >> 1].phase) % 1
      arcs[i >> 1].getPoint(k, d.position)
    })
  })
  return (
    <>
      {lines.map((l, i) => (
        <primitive key={i} object={new THREE.Line(l, lineMat)} />
      ))}
      <group ref={heads}>
        {pins.map((_, i) => (
          <group key={i} scale={1.3}>
            <M g="sph" c="#ff6b35" s={0.9} p={[0, 0.9, 0]} />
            <M g="cone" c="#ff6b35" s={[0.62, 1, 0.62]} p={[0, 0.25, 0]} r={[Math.PI, 0, 0]} />
            <M g="sph" c="#fff8ec" s={0.4} p={[0, 0.9, 0.3]} shadow={false} />
            <M g="sph" c="#fff8ec" s={0.4} p={[0, 0.9, -0.3]} shadow={false} />
          </group>
        ))}
      </group>
      <group ref={dots}>
        {arcs.flatMap((_, i) => [0, 1].map((j) => <M key={`${i}${j}`} g="sph" m={glow('#ffd166', 1, 1)} s={0.32} shadow={false} />))}
      </group>
    </>
  )
}

/* ---------- the AI lab ---------- */

const LAYERS = [3, 5, 5, 3]
const LAYER_COLORS = ['#9fd8ff', '#c9b6f2', '#f7a8c4', '#3ddc97']

export function NeuralNet() {
  const { nodes, edges } = useMemo(() => {
    const nodes = LAYERS.map((n, l) => Array.from({ length: n }, (_, i) => new THREE.Vector3((l - 1.5) * 1.7, (i - (n - 1) / 2) * 0.95, 0)))
    const pts: THREE.Vector3[] = []
    for (let l = 0; l < LAYERS.length - 1; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) pts.push(a, b)
    return { nodes, edges: new THREE.BufferGeometry().setFromPoints(pts) }
  }, [])
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.3 }), [])
  const net = useRef<THREE.Group>(null!)
  const pulses = useRef<THREE.Group>(null!)
  // Each pulse runs input to output through one node per layer, then picks a new route.
  const routes = useMemo(() => Array.from({ length: 10 }, (_, i) => ({ path: [] as number[], cycle: -1, start: i * 0.31 })), [])
  useFrame(({ clock }) => {
    if (!near(0.69, 0.1)) return
    const time = clock.elapsedTime
    net.current.rotation.y = Math.sin(time * 0.4) * 0.35
    net.current.position.y = 4.4 + Math.sin(time * 0.9) * 0.12
    pulses.current.children.forEach((p, i) => {
      const r = routes[i]
      const run = time * 0.5 + r.start
      if (Math.floor(run) !== r.cycle) {
        r.cycle = Math.floor(run)
        r.path = LAYERS.map((n) => Math.floor(Math.random() * n))
      }
      const k = (run % 1) * (LAYERS.length - 1)
      const seg = Math.floor(k)
      p.position.lerpVectors(nodes[seg][r.path[seg]], nodes[seg + 1][r.path[seg + 1]], k - seg)
    })
  })
  return (
    <At t={0.69} side={-9.5} turn={0.3}>
      <M g="cyl" c="#2a2340" s={[2.4, 0.5, 2.4]} p={[0, 0.25, 0]} />
      <M g="cyl" m={glow('#9fd8ff', 0.8, 1)} s={[1.6, 0.08, 1.6]} p={[0, 0.54, 0]} shadow={false} />
      <Sign text={'the AI lab\n~retrieval · embeddings · agents'} w={3.6} h={0.85} p={[0, 0.5, 1.3]} r={[-0.3, 0, 0]} bg="#2a2340" fg="#e6f5ff" lit={0.5} />
      <group ref={net} position={[0, 4.4, 0]}>
        <lineSegments geometry={edges} material={edgeMat} />
        {nodes.flatMap((layer, l) =>
          layer.map((p, i) => <M key={`${l}${i}`} g="sph" m={glow(LAYER_COLORS[l], 0.7, 1.2)} s={0.34} p={[p.x, p.y, p.z]} shadow={false} />),
        )}
        <group ref={pulses}>
          {routes.map((_, i) => <M key={i} g="sph" m={glow('#ffffff', 1.5, 1)} s={0.16} shadow={false} />)}
        </group>
      </group>
      <Halo p={[0, 4.4, 0]} s={8} />
    </At>
  )
}
