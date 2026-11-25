// The two of us walking side by side, and the camera that watches from above.
import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MAX_SIPS, findEgg, get, live, sip, useStore } from '../state'
import { blip } from '../sound'
import { G, Hit, M, Sign, Tap, night } from './kit'
import { Npc, type Look, type NpcParts } from './Stalls'
import { puffTexture } from './textures'
import { ahead, dist, place, smooth } from './path'
import { MACHINE } from '../claw'
import { kitchenAt } from '../engine'

const look = new THREE.Vector3()
const tmp = new THREE.Vector3()

const { damp, clamp, lerp } = THREE.MathUtils
const wrap = (a: number) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI

const SKIN = '#e8b08a'
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Camera sits behind and to the right of the walk, looking down.
const AZIMUTH = 0.72
const PITCH = 0.64

function Steam({ p }: { p: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null!)
  // soft sprites rather than spheres: hard-edged balls read as polka dots on the hoodies
  const m = useMemo(() => new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, opacity: 0.55, depthWrite: false }), [])
  useFrame(({ clock }) => {
    ref.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.45 + i / 3) % 1
      c.position.set(Math.sin(k * 6 + i * 2) * 0.04, k * 0.32, 0)
      c.scale.setScalar(0.06 + k * (1 - k) * 0.5)
    })
  })
  return (
    <group ref={ref} position={p}>
      {[0, 1, 2].map((i) => <sprite key={i} material={m} />)}
    </group>
  )
}

const ARYAN: Look = { top: '#f2643d', trim: '#c94a2a', legs: '#39425e', hair: '#2e2326', skin: SKIN, style: 'swept', hood: true, pocket: true, bag: '#3d5a80' }
// darker trim and jeans, so "you" keeps its shape under the night lamps
const YOU: Look = { top: '#f3ead8', trim: '#c2a87e', legs: '#3f4d6e', hair: '#f5c23e', skin: SKIN, hat: 'beanie', hatColor: '#f5c23e', hood: true, pocket: true }

function Person({ who }: { who: 'aryan' | 'you' }) {
  const me = who === 'aryan'
  const look = me ? ARYAN : YOU
  const { camera } = useThree()
  const cupRef = useRef<THREE.Group>(null!)
  const tag = useRef<THREE.Group>(null!)
  const yaw = useRef(Math.PI)
  const chai = useStore((s) => s.chai)
  const empty = useStore((s) => s.sips >= MAX_SIPS) && !me
  const cup = chai ? { c: '#b8683a', sleeve: '#a0562c', lid: '#c99a6b' } : { c: '#fdf6ea', sleeve: '#9a6a43', lid: '#3a2a22' }
  // Aryan holds the cup on the side that faces "you" and waves with the outside arm, so arms never cross.
  const cupSide = me ? 1 : -1

  const anim = (n: NpcParts, _: number, dt: number) => {
    const time = performance.now() / 1000
    const side = me ? -0.62 : 0.62
    const p = place(ahead(live.t, me ? 0.5 : 0), side)
    const o = place(ahead(live.t, me ? 0 : 0.5), -side)
    n.root.position.set(p.x, 0, p.z)

    // Walking: face the path. Standing: turn to each other, like people do mid-story.
    const idle = live.moving < 0.25
    const toOther = Math.atan2(o.x - p.x, o.z - p.z)
    // (and a little toward the camera, so we see faces rather than backs)
    const toCam = Math.atan2(camera.position.x - p.x, camera.position.z - p.z)
    const stand = toOther + wrap(toCam - toOther) * 0.65
    yaw.current += wrap((idle ? stand : p.yaw) - yaw.current) * (1 - Math.exp(-5 * dt))
    n.root.rotation.y = yaw.current

    const phase = live.phase + (me ? 0 : 0.6)
    const swing = Math.sin(phase) * 0.7 * live.moving
    n.legL.rotation.x = swing
    n.legR.rotation.x = -swing
    n.kneeL.rotation.x = Math.max(0, -swing) * 0.8
    n.kneeR.rotation.x = Math.max(0, swing) * 0.8
    n.body.position.y = Math.abs(Math.sin(phase)) * 0.06 * live.moving + (idle ? Math.sin(time * 2 + (me ? 0 : 1)) * 0.008 : 0)
    n.body.rotation.z = Math.sin(phase) * 0.03 * live.moving

    const [free, freeElbow, hold, holdElbow] = cupSide > 0 ? [n.armR, n.elbowR, n.armL, n.elbowL] : [n.armL, n.elbowL, n.armR, n.elbowR]
    const out = -cupSide // which way "outward" rotates the free arm
    const waving = me && live.t < 0.006
    free.rotation.x = waving ? 0 : swing * 0.8 * cupSide
    free.rotation.z = damp(free.rotation.z, waving ? 1.15 * out : 0.1 * out, 8, dt)
    freeElbow.rotation.z = damp(freeElbow.rotation.z, waving ? (1.6 + Math.sin(time * 7) * 0.35) * out : 0, 8, dt)
    freeElbow.rotation.x = waving ? 0 : -0.2 - 0.25 * live.moving

    // cup held in front with the elbow bent; a sip brings it up to the mouth
    const sipK = me ? 0 : Math.sin(Math.PI * (1 - live.sipAnim)) * (live.sipAnim > 0 ? 1 : 0)
    hold.rotation.x = lerp(-0.3, -1.0, sipK)
    hold.rotation.z = lerp(0.12, -0.45, sipK) * cupSide
    holdElbow.rotation.x = lerp(-1.25, -2.0, sipK)
    cupRef.current.rotation.x = -(hold.rotation.x + holdElbow.rotation.x)
    cupRef.current.rotation.z = -hold.rotation.z

    const rel = wrap(toOther - yaw.current)
    const glance = idle ? clamp(rel, -0.5, 0.5) : Math.sign(rel) * (0.25 + 0.4 * Math.max(0, Math.sin(time * 0.8 + (me ? 0 : 2.4))))
    n.head.rotation.y = damp(n.head.rotation.y, glance, 5, dt)
    n.head.rotation.x = -sipK * 0.3
    n.head.rotation.z = Math.sin(time * 1.3 + (me ? 0 : 1)) * 0.04
    n.mouth.scale.y = me && live.talking ? 0.02 + Math.abs(Math.sin(time * 9)) * 0.06 : 0.022

    // name tags, only at the stall
    const show = 1 - smooth(0.012, 0.035, live.t)
    tag.current.visible = show > 0.01
    tag.current.position.set(p.x, 2.95, p.z)
    tag.current.quaternion.copy(camera.quaternion)
    tag.current.scale.setScalar(show * 0.8)
  }

  const held = (
    <group ref={cupRef} position={[0.09 * -cupSide, -0.03, 0]}>
      <M g="cup" c={cup.c} s={[0.17, 0.22, 0.17]} />
      <M g="cyl" c={cup.sleeve} s={[0.163, 0.09, 0.163]} p={[0, -0.01, 0]} />
      <M g="cyl" c={cup.lid} s={[0.185, 0.03, 0.185]} p={[0, 0.12, 0]} />
      {!empty && <Steam p={[0, 0.15, 0]} />}
    </group>
  )

  return (
    <>
      <Npc look={look} scale={1.35} holdL={cupSide > 0 ? held : undefined} holdR={cupSide < 0 ? held : undefined} anim={anim} />
      <group ref={tag}>
        <Sign text={me ? 'aryan' : 'you'} w={me ? 1.25 : 0.9} h={0.46} hand bg={me ? '#ff6b35' : '#fff8ec'} fg={me ? '#fff8ec' : '#2a2320'} lit={0.5} back="#2a2320" />
      </group>
    </>
  )
}

/** Generous tap area around "you", sized for thumbs. Tap to sip. */
function YouHit() {
  const ref = useRef<THREE.Group>(null!)
  useFrame(() => {
    const p = place(live.t, 0.62)
    ref.current.position.set(p.x, 1.2, p.z)
  })
  return (
    <group ref={ref}>
      <Tap onTap={sip}>
        <Hit s={[1.5, 2.8, 1.5]} />
      </Tap>
    </group>
  )
}

export function Rig() {
  const { camera, gl, size, scene } = useThree()
  const lamp = useRef<THREE.PointLight>(null!)
  const stallLight = useRef<THREE.PointLight>(null!)
  const s = useRef({ claw: 0, insp: 0, inspI: 0, back: 0, step: 0, yaw: Math.PI, yawT: 0, pitchT: 0, drag: false, px: 0, py: 0 })

  // Drag to swing the view around. Vertical swipes still scroll the page (touch-action: pan-y).
  useEffect(() => {
    const el = gl.domElement
    const st = s.current
    const down = (e: PointerEvent) => ((st.drag = !get().claw), (st.px = e.clientX), (st.py = e.clientY))
    const move = (e: PointerEvent) => {
      // The arcade camera owns the view while the claw machine is on.
      if (get().claw) return
      if (st.drag) {
        st.yawT = clamp(st.yawT - (e.clientX - st.px) * 0.006, -1.1, 1.1)
        st.pitchT = clamp(st.pitchT + (e.clientY - st.py) * 0.003, -0.22, 0.3)
        st.px = e.clientX
        st.py = e.clientY
      } else if (e.pointerType === 'mouse') {
        // Not dragging: the view leans a little with the cursor.
        st.yawT = -(e.clientX / window.innerWidth - 0.5) * 0.12
        st.pitchT = (e.clientY / window.innerHeight - 0.5) * 0.05
      }
    }
    const up = (e: PointerEvent) => {
      st.drag = false
      if (e.pointerType !== 'mouse') st.yawT = st.pitchT = 0
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [gl])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const st = s.current
    const portrait = size.width < size.height

    const prev = live.t
    live.t = damp(live.t, live.target, 3.2, dt)
    const speed = (dist(live.t) - dist(prev)) / dt
    live.moving = damp(live.moving, Math.min(1, Math.abs(speed) / 1.2), 6, dt)
    live.phase = dist(live.t) * 2.1

    // Scrolling backwards for a while is, technically, a moonwalk.
    st.back = speed < -1 ? st.back + dt : 0
    if (st.back > 1.6 && !get().eggs.includes('moonwalk')) findEgg('moonwalk', 'oh, we are moonwalking now?')

    const stepNow = Math.floor(live.phase / Math.PI)
    if (stepNow !== st.step && live.moving > 0.3) blip('step')
    st.step = stepNow

    // Close on the two of us at the stall, then pull back into the diorama view as the walk starts.
    const k = smooth(0.003, 0.05, live.t)
    // Lean in a little at the KhaooGully booths, where the small details are.
    const booths =
      smooth(0.5, 0.52, live.t) * (1 - smooth(0.668, 0.685, live.t)) + smooth(0.69, 0.705, live.t) * (1 - smooth(0.81, 0.825, live.t))
    // In the engine room, pull back and lean a little ahead and left so the room fits,
    // while the two of us stay in view above the caption.
    const engine = smooth(0.606, 0.616, live.t) * (1 - smooth(0.656, 0.668, live.t))
    const camDist = (portrait ? lerp(22, 46, k) : lerp(18, 30, k)) * (1 - 0.2 * booths + 0.95 * engine)
    const c = place(
      ahead(live.t, lerp(0.2, 2, k) + engine * 5),
      lerp(0, portrait ? -1.2 : -2.6, k) - booths * (portrait ? 2.8 : 1.6) - engine * (portrait ? 4.2 : 5.4),
    )
    live.cx = c.x
    live.cz = c.z
    st.yaw += wrap(c.yaw - st.yaw) * (1 - Math.exp(-1.6 * dt))
    live.lookYaw = damp(live.lookYaw, st.yawT, st.drag ? 14 : 4, dt)
    live.lookPitch = damp(live.lookPitch, st.pitchT, st.drag ? 14 : 4, dt)
    // At the lookout the camera drops low behind us, to take in the skyline.
    const end = smooth(0.9, 0.99, live.t)
    const a = st.yaw + Math.PI + AZIMUTH + live.lookYaw + (reducedMotion ? 0 : lerp(-0.5, 0, k)) - end * 0.5
    const pitch = lerp(0.42, PITCH, k) + live.lookPitch - end * 0.36
    camera.position.set(c.x + Math.sin(a) * Math.cos(pitch) * camDist, Math.sin(pitch) * camDist, c.z + Math.cos(a) * Math.cos(pitch) * camDist)
    // Aim below the ground a bit so the scene sits above the caption.
    look.set(c.x, lerp(portrait ? 3.6 : 2.8, portrait ? -2.5 : -1.2, k) + end * 3.2 - engine * 1.6, c.z)
    // Playing the claw machine: swing round to face it, up close.
    st.claw = damp(st.claw, get().claw ? 1 : 0, 2.6, dt)
    // and hands it back exactly where the walk left it, with no leftover drag
    if (get().claw) (st.yawT = st.pitchT = 0), (st.drag = false)
    if (st.claw > 0.001) {
      const m = place(MACHINE.t, MACHINE.side)
      const th = m.yaw - Math.PI / 2 - MACHINE.turn
      const far = portrait ? 21 : 13.8
      const f = st.claw * st.claw * (3 - 2 * st.claw)
      camera.position.lerp(tmp.set(m.x + Math.sin(th) * far, portrait ? 10.5 : 7.4, m.z + Math.cos(th) * far), f)
      look.lerp(tmp.set(m.x - Math.cos(th) * (portrait ? 0.4 : 0.6), portrait ? 1.3 : 2.35, m.z + Math.sin(th) * (portrait ? 0.4 : 0.6)), f)
    }
    // Inspecting an engine-room kitchen: push in on it, leaving the right side for the drawer.
    const insp = get().inspect
    if (insp !== null) (st.inspI = insp), (st.yawT = st.pitchT = 0), (st.drag = false)
    st.insp = damp(st.insp, insp !== null ? 1 : 0, 2.6, dt)
    if (st.insp > 0.001) {
      const kt = kitchenAt(st.inspI)
      const fx = Math.sin(kt.th), fz = Math.cos(kt.th) // out of the room's front
      const rx = Math.cos(kt.th), rz = -Math.sin(kt.th) // along the room
      const far = portrait ? 42 : 33
      const f = st.insp * st.insp * (3 - 2 * st.insp)
      camera.position.lerp(tmp.set(kt.x + (fx * 0.72 - rx * 0.25) * far, far * 0.62, kt.z + (fz * 0.72 - rz * 0.25) * far), f)
      const right = portrait ? 0 : 2.4
      look.lerp(tmp.set(kt.x + rx * right, 2, kt.z + rz * right), f)
    }
    camera.lookAt(look)
    // On wide screens the intro card sits on the left, so frame the two of us right of centre.
    const cam = camera as THREE.PerspectiveCamera
    const shift = 0
    if (cam.filmOffset !== shift) {
      cam.filmOffset = shift
      cam.updateProjectionMatrix()
    }
    const fog = scene.fog as THREE.Fog
    fog.near = camDist + 30
    fog.far = camDist + 130

    const p = place(live.t, 0)
    lamp.current.position.set(p.x + 1, 3.4, p.z + 1)
    lamp.current.intensity = night.v * 30
    // At night, a warm light rides along the stalls on the left so their scenes stay readable.
    const stall = place(ahead(live.t, 4), -5.4)
    stallLight.current.position.set(stall.x, 4.5, stall.z)
    stallLight.current.intensity = night.v * 70
  })

  return (
    <>
      <pointLight ref={lamp} color="#ffc98a" distance={18} decay={2} />
      <pointLight ref={stallLight} color="#ffe2b8" distance={20} decay={2} />
      <Person who="aryan" />
      <Person who="you" />
      <YouHit />
    </>
  )
}
