// Anything wrapped in an Exhibit opens its project on the retro TV when tapped.
import * as THREE from 'three'
import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { live, openProject } from '../state'
import { dist } from './path'
import { Hit, M, Tap, glow, type V3 } from './kit'

/** A tiny floating TV: the cue that something can be opened. */
function MiniTv({ p }: { p: V3 }) {
  const ref = useRef<THREE.Group>(null!)
  const seed = useRef(Math.random() * 6)
  useFrame(({ clock }) => {
    const time = clock.elapsedTime + seed.current
    ref.current.position.y = p[1] + Math.sin(time * 2) * 0.12
    ref.current.rotation.y = Math.sin(time * 0.8) * 0.5
  })
  return (
    <group ref={ref} position={p}>
      <M c="#ff6b35" s={[0.62, 0.48, 0.34]} />
      <M m={glow('#3ddc97', 0.9, 1)} s={[0.42, 0.32, 0.02]} p={[-0.05, 0, 0.17]} shadow={false} />
      <M g="sph" c="#2a2320" s={0.06} p={[0.23, 0.08, 0.17]} shadow={false} />
      <M g="sph" c="#2a2320" s={0.06} p={[0.23, -0.08, 0.17]} shadow={false} />
      <M c="#2a2320" s={[0.025, 0.36, 0.025]} p={[-0.1, 0.38, 0]} r={[0, 0, 0.45]} shadow={false} />
      <M c="#2a2320" s={[0.025, 0.36, 0.025]} p={[0.1, 0.38, 0]} r={[0, 0, -0.45]} shadow={false} />
      <M c="#2a2320" s={[0.08, 0.1, 0.08]} p={[-0.18, -0.29, 0]} shadow={false} />
      <M c="#2a2320" s={[0.08, 0.1, 0.08]} p={[0.18, -0.29, 0]} shadow={false} />
    </group>
  )
}

type Props = {
  id: string
  /** Where the little TV floats. */
  marker?: V3 | false
  /** Invisible tap area, so the whole stall is easy to hit. */
  hit?: V3
  hitAt?: V3
  children?: ReactNode
}

export function Exhibit({ id, marker = [0, 3.4, 0], hit, hitAt, children }: Props) {
  return (
    <Tap onTap={() => openProject(id)}>
      {hit && <Hit s={hit} p={hitAt} />}
      {children}
      {marker && <MiniTv p={marker} />}
    </Tap>
  )
}

/** Hides its children when the walk is far away, so busy scenes cost nothing off screen. */
export function Near({ t, range = 70, children }: { t: number; range?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!)
  const d = dist(t)
  useFrame(() => {
    ref.current.visible = Math.abs(dist(live.t) - d) < range
  })
  return <group ref={ref}>{children}</group>
}
