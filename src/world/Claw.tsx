// The tech claw machine: a pink arcade cabinet full of plush logos. Tap it to play.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { live, useStore } from '../state'
import { BOX, MACHINE, TECH, claw, startClaw, step, toys } from '../claw'
import { At, G, M, Sign, Tap, glow, toon, type V3 } from './kit'
import { Exhibit } from './Exhibit'

const FONT = '"Bricolage Grotesque", system-ui, sans-serif'

// Drawn rather than typed where a font would make the logo too small to read.
function atom(g: CanvasRenderingContext2D, color: string) {
  g.strokeStyle = color
  g.lineWidth = 11
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
    g.beginPath()
    g.ellipse(128, 128, 84, 32, a, 0, Math.PI * 2)
    g.stroke()
  }
  g.fillStyle = color
  g.beginPath()
  g.arc(128, 128, 17, 0, Math.PI * 2)
  g.fill()
}

function badgeTexture(t: (typeof TECH)[number]) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  // a stitched patch: cream rim, dashed seam, logo on the brand colour
  g.fillStyle = '#fff8ec'
  g.beginPath()
  g.arc(128, 128, 127, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = t.badge
  g.beginPath()
  g.arc(128, 128, 114, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = 'rgba(255,248,236,0.55)'
  g.lineWidth = 4
  g.setLineDash([10, 8])
  g.beginPath()
  g.arc(128, 128, 104, 0, Math.PI * 2)
  g.stroke()
  g.setLineDash([])
  if (t.glyph === '⚛') atom(g, t.ink)
  else {
    g.fillStyle = t.ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const emoji = /\p{Extended_Pictographic}/u.test(t.glyph) && t.glyph !== '⚡' && t.glyph !== '✦'
    const size = emoji ? 130 : t.glyph.length > 2 ? 92 : t.glyph.length > 1 ? 112 : 150
    g.font = `800 ${size}px ${FONT}, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`
    g.fillText(t.glyph, 128, 138)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

const circle = new THREE.CircleGeometry(0.5, 28)
const eyeMat = toon({ color: '#2a2320' })
const blushMat = toon({ color: '#ff8fa3' })

/** One plush. Three body shapes, all with a face and the logo stitched on the belly. */
function Plush({ i, set }: { i: number; set: (g: THREE.Group | null) => void }) {
  const t = TECH[toys[i].tech]
  const shape = (toys[i].tech + (i >= TECH.length ? 1 : 0)) % 3
  const badge = useMemo(() => {
    const tex = badgeTexture(t)
    // unlit, so the logo stays crisp in the shade of the pile and behind the glass
    return new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5 })
  }, [t])
  const front = shape === 1 ? 0.235 : shape === 0 ? 0.25 : 0.225
  return (
    <group ref={set} scale={0.88}>
      {shape === 0 && (
        <>
          <M g="sph" c={t.body} s={[0.56, 0.5, 0.5]} />
          <M g="sph" c={t.body} s={0.17} p={[-0.17, 0.22, 0]} />
          <M g="sph" c={t.body} s={0.17} p={[0.17, 0.22, 0]} />
        </>
      )}
      {shape === 1 && (
        <>
          <M c={t.body} s={[0.48, 0.46, 0.46]} />
          <M g="sph" c={t.body} s={[0.12, 0.2, 0.12]} p={[-0.27, -0.04, 0.05]} r={[0, 0, 0.5]} />
          <M g="sph" c={t.body} s={[0.12, 0.2, 0.12]} p={[0.27, -0.04, 0.05]} r={[0, 0, -0.5]} />
        </>
      )}
      {shape === 2 && (
        <>
          <M g="sph" c={t.body} s={[0.46, 0.6, 0.44]} />
          <M g="cone" c={t.body} s={[0.12, 0.16, 0.12]} p={[-0.12, 0.31, 0]} r={[0, 0, 0.3]} />
          <M g="cone" c={t.body} s={[0.12, 0.16, 0.12]} p={[0.12, 0.31, 0]} r={[0, 0, -0.3]} />
        </>
      )}
      <mesh geometry={G.sph} material={eyeMat} scale={0.06} position={[-0.08, 0.15, front - 0.03]} />
      <mesh geometry={G.sph} material={eyeMat} scale={0.06} position={[0.08, 0.15, front - 0.03]} />
      <mesh geometry={G.sph} material={blushMat} scale={[0.06, 0.035, 0.02]} position={[-0.155, 0.1, front - 0.04]} />
      <mesh geometry={G.sph} material={blushMat} scale={[0.06, 0.035, 0.02]} position={[0.155, 0.1, front - 0.04]} />
      <mesh geometry={circle} material={badge} scale={0.3} position={[0, -0.07, front + 0.02]} />
    </group>
  )
}

const glass = toon({ color: '#d8f3ff', transparent: true, opacity: 0.08, depthWrite: false })
const acrylic = toon({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false })
const bulbA = glow('#ffd166', 0.3, 1.2)
const bulbB = glow('#ffd166', 0.3, 1.2)
const button = glow('#ff3b3b', 0.5, 1)

/** Small lights around the marquee, chasing each other. */
function Bulbs() {
  const pts = useMemo(() => {
    const out: V3[] = []
    for (let k = 0; k <= 10; k++) out.push([-1.5 + k * 0.3, 5.62, 1.38], [-1.5 + k * 0.3, 4.92, 1.38])
    return out
  }, [])
  useFrame(({ clock }) => {
    const on = Math.floor(clock.elapsedTime * 4) % 2
    bulbA.emissiveIntensity = on ? 1.6 : 0.2
    bulbB.emissiveIntensity = on ? 0.2 : 1.6
    button.emissiveIntensity = claw.phase === 'aim' ? 0.6 + Math.abs(Math.sin(clock.elapsedTime * 5)) * 1.2 : 0.4
  })
  return pts.map((p, k) => <M key={k} g="sph" m={(k >> 1) % 2 ? bulbA : bulbB} s={0.1} p={p} shadow={false} />)
}

function Prong({ a, open }: { a: number; open: React.RefObject<THREE.Group[]> }) {
  return (
    <group rotation={[0, a, 0]}>
      <group position={[0, -0.08, 0.1]} ref={(g) => void (g && !open.current.includes(g) && open.current.push(g))}>
        <M c="#ffd166" s={[0.09, 0.44, 0.09]} p={[0, -0.2, 0]} />
        <M c="#ffd166" s={[0.09, 0.2, 0.09]} p={[0, -0.43, -0.07]} r={[0.8, 0, 0]} />
      </group>
    </group>
  )
}

export function ClawMachine() {
  const playing = useStore((s) => s.claw)
  const plush = useRef<(THREE.Group | null)[]>([])
  const gantry = useRef<THREE.Group>(null!)
  const carriage = useRef<THREE.Group>(null!)
  const cable = useRef<THREE.Mesh>(null!)
  const hub = useRef<THREE.Group>(null!)
  const prongs = useRef<THREE.Group[]>([])
  const hint = useRef<THREE.Group>(null!)
  const RAIL = 4.45

  useFrame(({ clock }, rawDt) => {
    step(Math.min(rawDt, 0.05))
    toys.forEach((t, i) => {
      const g = plush.current[i]
      if (!g) return
      g.visible = !t.gone
      g.position.set(t.x, t.y, t.z)
      const swing = t.held ? Math.sin(clock.elapsedTime * 6 + i) * 0.12 : 0
      g.rotation.set(t.held ? swing : t.rx, t.ry, t.held ? 0 : t.rz)
    })
    gantry.current.position.z = claw.z
    carriage.current.position.set(claw.x, RAIL, claw.z)
    const len = RAIL - claw.y - 0.12
    cable.current.scale.set(0.05, len, 0.05)
    cable.current.position.y = -len / 2
    hub.current.position.y = -(RAIL - claw.y)
    for (const p of prongs.current) p.rotation.x = 0.2 - claw.open * 0.8
    const near = Math.abs(live.t - MACHINE.t) < 0.016
    hint.current.visible = near && !playing && claw.wins.length === 0
    hint.current.position.y = 2.1 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.3
  })

  const W = 3.2, Dp = 2.6
  return (
    <At t={MACHINE.t} side={MACHINE.side} turn={MACHINE.turn}>
      <Tap onTap={startClaw}>
        {/* cabinet */}
        <M c="#e0457b" s={[W, 1.45, Dp]} p={[0, 0.725, 0]} />
        <M c="#ffd166" s={[W + 0.04, 0.12, Dp + 0.04]} p={[0, 1.0, 0]} shadow={false} />
        <M c="#2a2340" s={[W - 0.2, 0.06, Dp - 0.2]} p={[0, 1.47, 0]} />
        {/* control panel: joystick, the big button, coin slot */}
        <M c="#c2366a" s={[W, 0.24, 0.6]} p={[0, 1.32, 1.45]} r={[0.35, 0, 0]} />
        <M g="cyl" c="#2a2320" s={[0.06, 0.34, 0.06]} p={[-0.8, 1.6, 1.42]} r={[0.25, 0, 0]} />
        <M g="sph" c="#ff3b3b" s={0.2} p={[-0.8, 1.78, 1.47]} />
        <M g="dome" m={button} s={[0.36, 0.22, 0.36]} p={[0.05, 1.46, 1.5]} r={[0.35, 0, 0]} />
        <M c="#2a2320" s={[0.36, 0.5, 0.06]} p={[-1.2, 0.75, 1.31]} />
        <M c="#ffd166" s={[0.04, 0.24, 0.04]} p={[-1.2, 0.82, 1.35]} shadow={false} />
        {/* prize flap and tray under the chute */}
        <M c="#2a2320" s={[0.72, 0.62, 0.06]} p={[BOX.CHUTE[0], 0.55, 1.31]} />
        <M c="#ffd166" s={[0.9, 0.12, 0.55]} p={[BOX.CHUTE[0], 0.24, 1.55]} />
        <Sign text="PUSH" w={0.5} h={0.18} p={[BOX.CHUTE[0], 0.74, 1.35]} bg="#ffd166" fg="#2a2320" back={false} lit={0.5} />
        {/* glass box, its corner posts and the chute */}
        <mesh geometry={G.box} material={glass} scale={[W - 0.2, 3.0, Dp - 0.2]} position={[0, 2.97, 0]} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
          <M key={`${x}${z}`} c="#3a2a4a" s={[0.14, 3.0, 0.14]} p={[x * (W / 2 - 0.1), 2.97, z * (Dp / 2 - 0.1)]} />
        ))}
        <mesh geometry={G.box} material={acrylic} scale={[0.78, 0.5, 0.78]} position={[BOX.CHUTE[0], 1.75, BOX.CHUTE[1]]} />
        <M c="#ff9f1c" s={[0.82, 0.05, 0.82]} p={[BOX.CHUTE[0], 2.0, BOX.CHUTE[1]]} shadow={false} />
        <M c="#0e0b16" s={[0.7, 0.02, 0.7]} p={[BOX.CHUTE[0], 1.51, BOX.CHUTE[1]]} shadow={false} />
        {/* roof and marquee */}
        <M c="#e0457b" s={[W + 0.1, 0.36, Dp + 0.1]} p={[0, 4.62, 0]} />
        <M c="#2a2340" s={[W + 0.1, 0.9, 0.2]} p={[0, 5.27, 1.22]} />
        <Sign text={'CLAW·SOME STACK'} w={2.8} h={0.5} p={[0, 5.27, 1.33]} bg="#2a2340" fg="#ffd166" lit={0.9} back={false} />
        <Bulbs />
      </Tap>

      {/* the rails, the gantry and the claw */}
      <M c="#9aa3b5" s={[0.08, 0.08, Dp - 0.3]} p={[-1.35, RAIL, 0]} shadow={false} />
      <M c="#9aa3b5" s={[0.08, 0.08, Dp - 0.3]} p={[1.35, RAIL, 0]} shadow={false} />
      <group ref={gantry}>
        <M c="#9aa3b5" s={[W - 0.4, 0.08, 0.1]} p={[0, RAIL, 0]} shadow={false} />
      </group>
      <group ref={carriage}>
        <M c="#ffd166" s={[0.3, 0.14, 0.3]} />
        <mesh ref={cable} geometry={G.cyl} material={eyeMat} />
        <group ref={hub}>
          <M g="cyl" c="#ff9f1c" s={[0.34, 0.2, 0.34]} />
          <M g="sph" c="#ff3b3b" s={0.12} p={[0, -0.12, 0]} />
          {[0, 2.094, 4.189].map((a) => <Prong key={a} a={a} open={prongs} />)}
        </group>
      </group>

      {toys.map((_, i) => (
        <Plush key={i} i={i} set={(g) => void (plush.current[i] = g)} />
      ))}

      {/* where your winnings go */}
      <M c="#c2366a" s={[1.3, 0.3, 2.7]} p={[-2.4, 0.15, 0.05]} />
      <Sign text={'your prizes'} w={1.1} h={0.3} p={[-2.4, 0.5, 1.45]} bg="#fff8ec" hand back="#2a2320" lit={0.4} />

      <group ref={hint} position={[0.05, 2.1, 1.6]}>
        <M g="cone" m={glow('#ff6b35', 0.6, 1)} s={[0.36, 0.5, 0.36]} r={[Math.PI, 0, 0]} p={[0, 0.25, 0]} />
        <Sign text="play" w={0.7} h={0.32} p={[0, 0.8, 0]} bg="#ff6b35" fg="#fff8ec" hand lit={0.6} back={false} />
      </group>
      <Exhibit id="toolkit" marker={[1.9, 5.6, 0]} />
    </At>
  )
}
