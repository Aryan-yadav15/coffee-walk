// After the KhaooGully booths: the stack as a claw machine, the street lifting to show the
// engine room (three backends as three kitchens, with the lunch rush and the ₹582 bug), and the AWS cloud.
import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { live } from '../state'
import { CLOUD_U, CORE_U, ROOM_SIDE, ROOM_TURN, ROOM_U, eu, roomAt } from '../engine'
import { At, M, Sign } from './kit'
import { Exhibit, Near } from './Exhibit'
import { ClawMachine } from './Claw'
import { Kitchens } from './Kitchens'

/* ---------- 3 · the AWS cloud ---------- */

const SERVICES = ['EC2', 'ECS', 'Lambda', 'S3', 'RDS', 'SQS', 'CloudFront', 'IAM']

function AwsCloud() {
  const ref = useRef<THREE.Group>(null!)
  const workers = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    ref.current.position.y = 3.9 + Math.sin(time * 0.8) * 0.18
    // Lambda workers pop up, do a job, and vanish
    workers.current.children.forEach((c, i) => {
      const k = (time * 0.7 + i / 3) % 1
      c.position.y = 1 + k * 1.1
      c.scale.setScalar(Math.sin(k * Math.PI) * 0.9)
    })
  })
  const puffs: [number, number, number, number][] = [[0, 0, 0, 2.6], [1.9, -0.2, 0.3, 1.9], [-2, -0.15, 0.2, 2], [0.9, 0.5, -0.6, 1.8], [-1, 0.45, -0.5, 1.7], [3.4, -0.4, 0, 1.3], [-3.5, -0.35, 0, 1.4]]
  return (
    <At t={eu(CLOUD_U)} side={-6} turn={0.2}>
      <M g="cyl" c="#3b3b4a" s={[0.12, 3.6, 0.12]} p={[0, 1.8, 0]} />
      <Exhibit id="aws" marker={[0, 6.6, 0]}>
        <group ref={ref}>
          {puffs.map(([x, y, z, r], i) => <M key={i} g="sph" c="#fdfbff" s={[r, r * 0.62, r * 0.8]} p={[x, y, z]} />)}
          {SERVICES.map((label, i) => {
            const x = ((i % 4) - 1.5) * 1.35, z = i < 4 ? -0.5 : 0.65
            return (
              <group key={label} position={[x, 0.75, z]}>
                <M c={i % 2 ? '#232f3e' : '#ff9900'} s={[1.15, 0.36, 0.8]} />
                <Sign text={label} w={1.05} h={0.3} p={[0, 0, 0.41]} bg={i % 2 ? '#232f3e' : '#ff9900'} fg="#fff8ec" back={false} lit={0.6} />
              </group>
            )
          })}
          <group ref={workers} position={[0.7, 0.4, 0]}>
            {[0, 1, 2].map((i) => (
              <group key={i} position={[(i - 1) * 1.6, 1, 0.2]}>
                <Sign text="λ" w={0.42} h={0.42} bg="#ff9900" fg="#232f3e" back={false} lit={0.6} />
              </group>
            ))}
          </group>
          <Sign text="AWS" w={1.4} h={0.5} p={[0, 0.2, 1.75]} bg="#232f3e" fg="#ff9900" lit={0.6} back={false} />
        </group>
      </Exhibit>
    </At>
  )
}

export function Engine() {
  return (
    <>
      <Near t={eu(CORE_U)}><ClawMachine /></Near>
      <Near t={eu(ROOM_U)}>
        <At t={eu(ROOM_U)} side={ROOM_SIDE} turn={ROOM_TURN}>
          <Kitchens at={() => roomAt(live.t)} />
        </At>
      </Near>
      <Near t={eu(CLOUD_U)}><AwsCloud /></Near>
    </>
  )
}
