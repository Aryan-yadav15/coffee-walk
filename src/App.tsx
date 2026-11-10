import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { chaiMode, live } from './state'
import { Hud } from './ui/Hud'
import { Rig } from './world/Rig'
import { Ink } from './world/Ink'
import { Sky } from './world/Sky'
import { World } from './world/World'
import { LENGTH, TOTAL, dist, tAt } from './world/path'

// Phones skip shadows and render at a lower pixel ratio to stay smooth.
const phone = window.matchMedia('(pointer: coarse)').matches

export function App() {
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      live.target = max > 0 ? tAt((window.scrollY / max) * TOTAL) : 0
    }
    // Deep link: /#t=0.5 opens halfway through the walk.
    const start = Number(location.hash.match(/t=([\d.]+)/)?.[1])
    if (start > 0) {
      window.scrollTo(0, (dist(start) / TOTAL) * (document.documentElement.scrollHeight - window.innerHeight))
      live.t = Math.min(1, start)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    // Type "chai" anywhere.
    let typed = ''
    const onKey = (e: KeyboardEvent) => {
      typed = (typed + e.key.toLowerCase()).slice(-4)
      if (typed === 'chai') chaiMode()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <>
      <div className={phone ? 'stage' : 'stage tilt'}>
        <Canvas
          shadows={!phone}
          dpr={[1, phone ? 1.5 : 2]}
          camera={{ fov: 24, near: 1, far: 600, position: [20, 20, 20] }}
          style={{ touchAction: 'pan-y' }}
        >
          <Sky shadows={!phone} />
          <World />
          <Rig />
          <Ink msaa={!phone} />
        </Canvas>
      </div>
      <div className="track" style={{ height: `${Math.round((1500 * TOTAL) / LENGTH)}vh` }} aria-hidden />
      <Hud />
    </>
  )
}
