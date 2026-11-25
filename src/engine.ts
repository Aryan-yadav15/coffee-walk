// Where the engine room sits on the walk, and what the visitor has done in it.
// Positions are in world units from the start of the stretch, so story beats,
// the 3D scene and the skip button all agree.
import { ahead, dist, place, tAt } from './world/path'

export const ENGINE = { from: 0.61, to: 0.668 }
const E0 = dist(ENGINE.from)

/** `t` at `u` units into the engine-room stretch. */
export const eu = (u: number) => tAt(E0 + u)

export const CORE_U = 7 // the stack core sample
export const ROOM_U = 25 // centre of the engine room
export const CLOUD_U = 38 // the AWS cloud

/** How the room sits beside the walk: its centre's distance to the left, and its turn toward the camera. */
export const ROOM_SIDE = -9.6
export const ROOM_TURN = 0.12

/** Each kitchen's x along the room, in the room's own frame. */
export const KITCHEN_X = [-2.4, 1.6, 5.6]
export const KITCHEN_Z = -1.2

/** Where kitchen `i` is in the world, and which way the room faces (its +z). */
export function kitchenAt(i: number) {
  const p = place(eu(ROOM_U), ROOM_SIDE)
  const th = p.yaw - Math.PI / 2 - ROOM_TURN
  const lx = KITCHEN_X[i], lz = KITCHEN_Z
  return { x: p.x + lx * Math.cos(th) + lz * Math.sin(th), z: p.z - lx * Math.sin(th) + lz * Math.cos(th), th }
}

/**
 * How far the story has got through the room, in units from its centre.
 * Uses the same 6-unit lookahead as the captions, so what you read and what
 * the machines do line up.
 */
export const roomAt = (t: number) => dist(ahead(t, 6)) - (E0 + ROOM_U)

/** The steps, in `roomAt` units. Each step also starts early if the visitor taps. */
export const STEPS = {
  rushAuto: 0.5,
  fixAuto: 3.6,
  incident: [5, 7.4, 9.8],
  done: 12,
}

/** Taps made inside the room. Scrolling away does not undo them. */
export const eng = { rush: false, fixed: false }

/** Skip lands just past the AWS cloud, where the AI lab begins. */
export const SKIP_TO = eu(45)
