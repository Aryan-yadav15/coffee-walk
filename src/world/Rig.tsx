// The two of us walking side by side, and the camera that watches from above.
import * as THREE from 'three'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MAX_SIPS, findEgg, get, live, sip, useStore } from '../state'
import { blip } from '../sound'
import { G, Hit, M, Sign, Tap, capsule, mat, night } from './kit'
import { ahead, dist, place, smooth } from './path'
import { MACHINE } from '../claw'

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
  const m = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }), [])
  useFrame(({ clock }) => {
    ref.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.45 + i / 3) % 1
      c.position.set(Math.sin(k * 6 + i * 2) * 0.04, k * 0.4, 0)
      c.scale.setScalar(0.05 + k * (1 - k) * 0.28)
    })
  })
  return (
    <group ref={ref} position={p}>
      {[0, 1, 2].map((i) => <mesh key={i} geometry={G.sph} material={m} />)}
    </group>
  )
}

type Look = { top: string; trim: string; legs: string; hair: string }
const ARYAN: Look = { top: '#f2643d', trim: '#d9532f', legs: '#39425e', hair: '#231c1e' }
const YOU: Look = { top: '#f3ead8', trim: '#d8cdb6', legs: '#5b6b8c', hair: '#f5c23e' }

function Person({ who }: { who: 'aryan' | 'you' }) {
  const me = who === 'aryan'
  const look = me ? ARYAN : YOU
  const { camera } = useThree()
  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const mouth = useRef<THREE.Mesh>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const arm = useRef<THREE.Group>(null!)
  const cupArm = useRef<THREE.Group>(null!)
  const tag = useRef<THREE.Group>(null!)
  const yaw = useRef(Math.PI)
  const chai = useStore((s) => s.chai)
  const empty = useStore((s) => s.sips >= MAX_SIPS) && !me
  const cup = chai ? { c: '#b8683a', sleeve: '#a0562c', lid: '#c99a6b' } : { c: '#fdf6ea', sleeve: '#9a6a43', lid: '#3a2a22' }

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const time = clock.elapsedTime
    const side = me ? -0.62 : 0.62
    const p = place(ahead(live.t, me ? 0.5 : 0), side)
    const o = place(ahead(live.t, me ? 0 : 0.5), -side)
    root.current.position.set(p.x, 0, p.z)

    // Walking: face the path. Standing: turn to each other, like people do mid-story.
    const idle = live.moving < 0.25
    const toOther = Math.atan2(o.x - p.x, o.z - p.z)
    // (and a little toward the camera, so we see faces rather than backs)
    const toCam = Math.atan2(camera.position.x - p.x, camera.position.z - p.z)
    const stand = toOther + wrap(toCam - toOther) * 0.65
    yaw.current += wrap((idle ? stand : p.yaw) - yaw.current) * (1 - Math.exp(-5 * dt))
    root.current.rotation.y = yaw.current

    const phase = live.phase + (me ? 0 : 0.6)
    const swing = Math.sin(phase) * 0.7 * live.moving
    legL.current.rotation.x = swing
    legR.current.rotation.x = -swing
    body.current.position.y = Math.abs(Math.sin(phase)) * 0.06 * live.moving + (idle ? Math.sin(time * 2 + (me ? 0 : 1)) * 0.008 : 0)
    body.current.rotation.z = Math.sin(phase) * 0.03 * live.moving

    const waving = me && live.t < 0.006
    arm.current.rotation.x = waving ? 0 : -swing * 0.8
    arm.current.rotation.z = damp(arm.current.rotation.z, waving ? 2.5 + Math.sin(time * 7) * 0.3 : 0.1, 8, dt)

    const sipK = me ? 0 : Math.sin(Math.PI * (1 - live.sipAnim)) * (live.sipAnim > 0 ? 1 : 0)
    cupArm.current.rotation.x = lerp(-1.0, -2.25, sipK)
    cupArm.current.rotation.z = lerp(-0.1, 0.45, sipK)

    const rel = wrap(toOther - yaw.current)
    const glance = idle ? clamp(rel, -0.5, 0.5) : Math.sign(rel) * (0.25 + 0.4 * Math.max(0, Math.sin(time * 0.8 + (me ? 0 : 2.4))))
    head.current.rotation.y = damp(head.current.rotation.y, glance, 5, dt)
    head.current.rotation.x = -sipK * 0.3
    head.current.rotation.z = Math.sin(time * 1.3 + (me ? 0 : 1)) * 0.04
    mouth.current.scale.y = me && live.talking ? 0.02 + Math.abs(Math.sin(time * 9)) * 0.06 : 0.022

    // name tags, only at the stall
    const show = 1 - smooth(0.012, 0.035, live.t)
    tag.current.visible = show > 0.01
    tag.current.position.set(p.x, 2.95, p.z)
    tag.current.quaternion.copy(camera.quaternion)
    tag.current.scale.setScalar(show * 0.8)
  })

  const leg = (ref: RefObject<THREE.Group>, x: number) => (
    <group ref={ref} position={[x, 0.66, 0]}>
      <M geo={capsule(0.1, 0.4)} c={look.legs} p={[0, -0.3, 0]} />
      <M c="#f7f3ea" s={[0.22, 0.14, 0.36]} p={[0, -0.59, 0.06]} />
    </group>
  )

  return (
    <>
      <group ref={root} scale={1.35}>
        <group ref={body}>
          {leg(legL, 0.13)}
          {leg(legR, -0.13)}
          {/* hoodie */}
          <M geo={capsule(0.29, 0.3)} c={look.top} p={[0, 1.02, 0]} s={[1, 1, 0.82]} />
          <M g="sph" c={look.trim} s={[0.44, 0.24, 0.3]} p={[0, 1.4, -0.14]} />
          <M c={look.trim} s={[0.3, 0.16, 0.06]} p={[0, 0.9, 0.23]} />
          {me && <M c="#3d5a80" s={[0.4, 0.46, 0.2]} p={[0, 1.06, -0.3]} />}
          {/* free arm: swings, and Aryan waves with it at the start */}
          <group ref={arm} position={[0.36, 1.32, 0]}>
            <M geo={capsule(0.085, 0.32)} c={look.top} p={[0, -0.22, 0]} />
            <M g="sph" c={SKIN} s={0.17} p={[0, -0.49, 0]} />
          </group>
          {/* cup arm */}
          <group ref={cupArm} position={[-0.36, 1.32, 0]} rotation={[-1.0, 0, -0.1]}>
            <M geo={capsule(0.085, 0.32)} c={look.top} p={[0, -0.22, 0]} />
            <M g="sph" c={SKIN} s={0.17} p={[0, -0.49, 0]} />
            <group position={[0, -0.56, -0.12]} rotation={[1.0, 0, 0]}>
              <M g="cup" c={cup.c} s={[0.17, 0.22, 0.17]} />
              <M g="cyl" c={cup.sleeve} s={[0.163, 0.09, 0.163]} p={[0, -0.01, 0]} />
              <M g="cyl" c={cup.lid} s={[0.185, 0.03, 0.185]} p={[0, 0.12, 0]} />
              {!empty && <Steam p={[0, 0.16, 0]} />}
            </group>
          </group>
          {/* head */}
          <group ref={head} position={[0, 1.5, 0]}>
            <M g="sph" c={SKIN} s={[0.54, 0.52, 0.52]} p={[0, 0.27, 0]} />
            <M g="dome" c={look.hair} s={[0.6, 0.58, 0.6]} p={[0, 0.26, -0.02]} r={[-0.22, 0, 0]} />
            {me ? (
              <M g="sph" c={look.hair} s={[0.36, 0.14, 0.2]} p={[0.04, 0.5, 0.17]} r={[0.2, 0, -0.15]} />
            ) : (
              <>
                <M g="cyl" c="#e8a92c" s={[0.6, 0.09, 0.6]} p={[0, 0.3, -0.01]} r={[-0.22, 0, 0]} />
                <M g="sph" c="#fff8ec" s={0.16} p={[0, 0.6, -0.08]} />
              </>
            )}
            {[0.11, -0.11].map((x) => (
              <group key={x} position={[x, 0.26, 0.24]}>
              <M g="sph" c="#ffffff" s={[0.13, 0.16, 0.06]} shadow={false} />
              <M g="sph" c="#231c1e" s={[0.075, 0.095, 0.05]} p={[0, -0.012, 0.022]} shadow={false} />
              <M g="sph" c="#ffffff" s={0.032} p={[0.02, 0.022, 0.048]} shadow={false} />
              </group>
            ))}
            <M g="sph" c="#f0907a" s={[0.1, 0.06, 0.03]} p={[0.18, 0.17, 0.21]} shadow={false} />
            <M g="sph" c="#f0907a" s={[0.1, 0.06, 0.03]} p={[-0.18, 0.17, 0.21]} shadow={false} />
            <mesh ref={mouth} geometry={G.sph} material={mat('#8a4034')} position={[0, 0.14, 0.255]} scale={[0.09, 0.022, 0.03]} />
          </group>
        </group>
      </group>
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
  const s = useRef({ claw: 0, back: 0, step: 0, yaw: Math.PI, yawT: 0, pitchT: 0, drag: false, px: 0, py: 0 })

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
    // Lean in a little at the KhaoGully booths, where the small details are.
    const booths =
      smooth(0.5, 0.52, live.t) * (1 - smooth(0.668, 0.685, live.t)) + smooth(0.69, 0.705, live.t) * (1 - smooth(0.81, 0.825, live.t))
    // In the engine room, pull back and lean a little ahead and left so the room fits,
    // while the two of us stay in view above the caption.
    const engine = smooth(0.606, 0.616, live.t) * (1 - smooth(0.656, 0.668, live.t))
    const camDist = (portrait ? lerp(22, 46, k) : lerp(18, 30, k)) * (1 - 0.2 * booths + 0.75 * engine)
    const c = place(
      ahead(live.t, lerp(0.2, 2, k) + engine * 5),
      lerp(0, portrait ? -1.2 : -2.6, k) - booths * (portrait ? 2.8 : 1.6) - engine * (portrait ? 3 : 3.8),
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
    look.set(c.x, lerp(portrait ? 3.6 : 2.8, portrait ? -2.5 : -1.2, k) + end * 3.2 - engine * 3, c.z)
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
