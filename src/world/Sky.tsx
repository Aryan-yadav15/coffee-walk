// Time of day follows the walk: morning at the stall, sunset in the city, night at the lookout.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { live } from '../state'
import { night } from './kit'
import { smooth } from './path'

const KEYS = [
  { t: 0, sky: '#bfe6ff', sun: '#fff1d0', si: 2.7, top: '#e6f5ff', ground: '#b7d389', hi: 1.3, elev: 0.95 },
  { t: 0.4, sky: '#c4e6f7', sun: '#ffe9c0', si: 2.6, top: '#eef6f4', ground: '#b9cf8d', hi: 1.25, elev: 0.75 },
  { t: 0.5, sky: '#ffd3a1', sun: '#ffb877', si: 2.6, top: '#ffe2c2', ground: '#a8938f', hi: 1.05, elev: 0.5 },
  { t: 0.64, sky: '#f5946f', sun: '#ff8850', si: 2.3, top: '#f7b393', ground: '#7d6a7c', hi: 0.9, elev: 0.36 },
  { t: 0.78, sky: '#4b4686', sun: '#93a4ff', si: 0.9, top: '#7f7bc4', ground: '#4a4468', hi: 0.95, elev: 0.6 },
  { t: 1, sky: '#141a3a', sun: '#a9bcff', si: 0.8, top: '#5a64b0', ground: '#2f3555', hi: 1.05, elev: 0.8 },
].map((k) => ({ ...k, sky: new THREE.Color(k.sky), sun: new THREE.Color(k.sun), top: new THREE.Color(k.top), ground: new THREE.Color(k.ground) }))

export function Sky({ shadows }: { shadows: boolean }) {
  const { scene } = useThree()
  const sunLight = useRef<THREE.DirectionalLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const dir = useMemo(() => new THREE.Vector3(), [])

  useMemo(() => {
    scene.background = new THREE.Color()
    scene.fog = new THREE.Fog('#ffffff', 60, 180)
  }, [scene])

  useFrame(() => {
    const t = Math.min(1, Math.max(0, live.t))
    let i = 0
    while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++
    const a = KEYS[i], b = KEYS[i + 1]
    const k = (t - a.t) / (b.t - a.t)
    const n = smooth(0.56, 0.84, t)

    const bg = scene.background as THREE.Color
    bg.lerpColors(a.sky, b.sky, k)
    scene.fog!.color.copy(bg)
    hemi.current.color.lerpColors(a.top, b.top, k)
    hemi.current.groundColor.lerpColors(a.ground, b.ground, k)
    hemi.current.intensity = THREE.MathUtils.lerp(a.hi, b.hi, k)
    sunLight.current.color.lerpColors(a.sun, b.sun, k)
    sunLight.current.intensity = THREE.MathUtils.lerp(a.si, b.si, k)

    // Light comes from the camera's side so the faces we see are lit. It drops
    // toward sunset (long shadows), then the moon takes over from higher up.
    const elev = THREE.MathUtils.lerp(a.elev, b.elev, k)
    dir.set(0.62, Math.tan(elev), -0.4).normalize()
    sunLight.current.position.set(live.cx + dir.x * 90, dir.y * 90, live.cz + dir.z * 90)
    sunLight.current.target.position.set(live.cx, 0, live.cz)
    sunLight.current.target.updateMatrixWorld()

    if (night.v !== n) {
      night.v = n
      for (const f of night.fns) f(n)
    }
  })

  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sunLight}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
        shadow-radius={3}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-near={1}
        shadow-camera-far={240}
      />
    </>
  )
}
