// The tech claw machine: a glass box full of plush logos. Everything here is plain data
// and a per-frame `step`, so the 3D scene draws it and the HUD drives it.
import { CORE_U, eu } from './engine'
import { blip } from './sound'
import { findEgg, get, say, set } from './state'

/** Where the machine stands on the walk. */
export const MACHINE = { t: eu(CORE_U), side: -6.6, turn: 0.25 }

export type Tech = { name: string; glyph: string; body: string; badge: string; ink: string; used: string; project: string }

// Every plush is a tool, and the card it comes with says where I actually used it.
export const TECH: Tech[] = [
  { name: 'React', glyph: '⚛', body: '#7fd8f0', badge: '#20232a', ink: '#61dafb', used: 'KhaoGully customer and restaurant apps, the AI Form Filler, and this walk.', project: 'kg-customer' },
  { name: 'TypeScript', glyph: 'TS', body: '#5b8fd6', badge: '#3178c6', ink: '#ffffff', used: 'Almost everything I write for the web: DocRAG, the Form Filler, KhaoGully.', project: 'docrag' },
  { name: 'Next.js', glyph: 'N', body: '#4a4458', badge: '#111111', ink: '#ffffff', used: 'CampusBuzz, StockSmart, Thrift Track, MailMesh and most hackathon builds.', project: 'campusbuzz' },
  { name: 'Tailwind', glyph: '≈', body: '#8ad8f5', badge: '#0f172a', ink: '#38bdf8', used: 'The styling on most of my frontends.', project: 'kg-customer' },
  { name: 'Python', glyph: 'Py', body: '#ffd65c', badge: '#3776ab', ink: '#ffd43b', used: "KhaoGully's backend, NLP → SQL and the 3D tours pipeline.", project: 'nlpsql' },
  { name: 'FastAPI', glyph: '⚡', body: '#4fc3a8', badge: '#05998b', ink: '#ffffff', used: "The whole KhaoGully backend: orders, pools, payments, delivery.", project: 'engine' },
  { name: 'Node.js', glyph: 'JS', body: '#86c56b', badge: '#3c873a', ink: '#ffffff', used: 'Express backends, like BitsToBugs.', project: 'bitstobugs' },
  { name: 'PostgreSQL', glyph: 'PG', body: '#7d9fc9', badge: '#336791', ink: '#ffffff', used: 'KhaoGully, NLP → SQL and StockSmart. My default database.', project: 'engine' },
  { name: 'Supabase', glyph: '⚡', body: '#6fdba8', badge: '#1c1c1c', ink: '#3ecf8e', used: "KhaoGully's database and auth, and the inventory system.", project: 'kg-inventory' },
  { name: 'PostGIS', glyph: '⌖', body: '#a7c4e0', badge: '#336791', ink: '#ffd43b', used: "KhaoGully's delivery zones and distance checks.", project: 'engine' },
  { name: 'MongoDB', glyph: '❦', body: '#8fd17a', badge: '#13aa52', ink: '#ffffff', used: 'CampusBuzz and Thrift Track.', project: 'thrift' },
  { name: 'React Native', glyph: '⚛', body: '#b39ddb', badge: '#20232a', ink: '#61dafb', used: 'The KhaoGully delivery navigator, built with Expo.', project: 'kg-navigator' },
  { name: 'Kotlin', glyph: 'K', body: '#a58cf5', badge: '#7f52ff', ink: '#ffffff', used: 'Native Android with Jetpack Compose, Hilt and Room.', project: 'about' },
  { name: 'Gemini', glyph: '✦', body: '#9fb6f5', badge: '#4b6fe0', ink: '#ffffff', used: 'The AI Form Filler, StockSmart and NLP → SQL.', project: 'formfiller' },
  { name: 'LangChain', glyph: '⛓', body: '#7fc4b4', badge: '#1c3c3c', ink: '#ffffff', used: 'NLP → SQL: questions in English, answers from Postgres.', project: 'nlpsql' },
  { name: 'Transformers.js', glyph: '🤗', body: '#ffd166', badge: '#2a2320', ink: '#ffd166', used: 'DocRAG: embeddings running right inside VS Code.', project: 'docrag' },
  { name: 'Three.js', glyph: '△', body: '#e9e4f2', badge: '#111111', ink: '#ffffff', used: 'This whole walk, and the 3D property tours.', project: '3d' },
  { name: 'Blender', glyph: '◉', body: '#f5a25d', badge: '#e87d0d', ink: '#ffffff', used: 'Modelling and cleanup for 3D work.', project: '3d' },
  { name: 'Figma', glyph: 'F', body: '#f58b7a', badge: '#1e1e1e', ink: '#a259ff', used: 'Every design, before any code.', project: 'design' },
  { name: 'Razorpay', glyph: 'R', body: '#6f8fe0', badge: '#0c2451', ink: '#3395ff', used: 'KhaoGully payments. Also starring in the ₹582 bug.', project: 'kg-incident' },
  { name: 'AWS', glyph: 'aws', body: '#ffb84d', badge: '#232f3e', ink: '#ff9900', used: 'Hands-on: EC2, ECS, Lambda, S3, RDS, SQS, CloudFront.', project: 'aws' },
  { name: 'Docker', glyph: '🐳', body: '#6cb4f0', badge: '#2496ed', ink: '#ffffff', used: 'Containers for backends, shipped to the cloud.', project: 'aws' },
  { name: 'GitHub Actions', glyph: '▶', body: '#9ab8e6', badge: '#2088ff', ink: '#ffffff', used: 'CI/CD and scheduled jobs.', project: 'toolkit' },
  { name: 'Firebase', glyph: '🔥', body: '#ffcf5c', badge: '#ffa000', ink: '#ffffff', used: 'MultiLang Chat: sign-in and chat history.', project: 'multilang' },
  { name: 'Playwright', glyph: '🎭', body: '#7fd18a', badge: '#2ead33', ink: '#ffffff', used: 'Browser automation and scraping.', project: 'toolkit' },
  { name: 'Drizzle', glyph: '💧', body: '#c8f07a', badge: '#121212', ink: '#c5f74f', used: 'StockSmart and hackathon builds on Neon.', project: 'stocksmart' },
  { name: 'React Flow', glyph: '⇄', body: '#f7a8c4', badge: '#ff0072', ink: '#ffffff', used: 'MailMesh: drag-and-drop email workflows.', project: 'mailmesh' },
  { name: 'Gaussian splats', glyph: '✺', body: '#d9a8f0', badge: '#3a3348', ink: '#f7a8c4', used: 'Photoreal 3D tours from a phone video.', project: '3d' },
]

/* ---------- the box, in the machine's own units ---------- */

export const BOX = {
  X: 1.3, // the pit runs from -X to X across
  Z: 1.0, // and from -Z (back) to Z (front)
  FLOOR: 1.5,
  TOP: 4.25, // the claw hub when it is all the way up
  R: 0.24, // a plush's radius
  CHUTE: [0.9, 0.62] as [number, number],
  CHUTE_R: 0.36,
  REACH: 0.45, // hub to prong tips
}
const SPEED = 1.5
export const AIM_TIME = 20

export type Toy = { tech: number; x: number; y: number; z: number; vy: number; rx: number; ry: number; rz: number; held: boolean; won: boolean; gone: boolean }

const inChute = (x: number, z: number, pad = 0) => Math.abs(x - BOX.CHUTE[0]) < BOX.CHUTE_R + pad && Math.abs(z - BOX.CHUTE[1]) < BOX.CHUTE_R + pad

// Every tool once, plus spares of the ones I use most, so the box is properly stuffed.
const SPARES = ['React', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'Supabase', 'Next.js', 'React Native', 'Gemini', 'AWS', 'Docker', 'Figma', 'Three.js', 'Kotlin', 'Node.js', 'Tailwind']
const KINDS = [...TECH.keys(), ...SPARES.map((n) => TECH.findIndex((t) => t.name === n))]

/** A loose pile: a bottom layer on a grid, the rest dropped on top, all clear of the chute. */
function pile(): Toy[] {
  let seed = 7
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const spots: [number, number][] = []
  for (let layer = 0; spots.length < KINDS.length; layer++) {
    const off = layer % 2 ? 0.23 : 0
    for (let x = -BOX.X + 0.26 + off; x < BOX.X - 0.22; x += 0.46)
      for (let z = -BOX.Z + 0.25 + off; z < BOX.Z - 0.22; z += 0.46)
        if (!inChute(x, z, 0.26) && spots.length < KINDS.length) spots.push([x + (r() - 0.5) * 0.12, z + (r() - 0.5) * 0.12])
  }
  // shuffle, so spares don't all sit on top
  const kinds = KINDS.map((k) => [k, r()] as const).sort((a, b) => a[1] - b[1]).map(([k]) => k)
  return spots.map(([x, z], i) => ({
    tech: kinds[i], x, z, y: BOX.FLOOR + 0.6 + i * 0.12, vy: 0,
    rx: -0.15 - r() * 0.35, ry: (r() - 0.5) * 0.6, rz: (r() - 0.5) * 0.4,
    held: false, won: false, gone: false,
  }))
}

export const toys = pile()

type Phase = 'aim' | 'drop' | 'grab' | 'rise' | 'carry' | 'release' | 'rest'

export const claw = {
  x: BOX.CHUTE[0], z: BOX.CHUTE[1], y: BOX.TOP,
  open: 1, // prongs: 1 open, 0 shut
  phase: 'rest' as Phase,
  wait: 0,
  timer: AIM_TIME,
  dx: 0, dz: 0, // held direction from the controls
  held: -1,
  slipAt: -1, // height at which a bad grip lets go
  misses: 0,
  wins: [] as number[],
  grip: 0,
}

/* ---------- controls ---------- */

export function startClaw() {
  if (get().claw) return
  Object.assign(claw, { phase: 'aim', timer: AIM_TIME, dx: 0, dz: 0 })
  set({ claw: true, prize: null })
  blip('pop')
}

export function stopClaw() {
  claw.dx = claw.dz = 0
  if (claw.phase === 'aim') claw.phase = 'rest'
  set({ claw: false, prize: null })
}

export function drop() {
  if (claw.phase !== 'aim') return
  claw.phase = 'drop'
  claw.dx = claw.dz = 0
  blip('step')
}

export function again() {
  set({ prize: null })
  if (claw.phase === 'rest') Object.assign(claw, { phase: 'aim', timer: AIM_TIME })
}

/* ---------- the machine ---------- */

const under = (x: number, z: number, r: number) => {
  let best = -1, bd = r
  toys.forEach((t, i) => {
    if (t.gone || t.won || t.held) return
    const d = Math.hypot(t.x - x, t.z - z)
    if (d < bd || (best >= 0 && d < r && t.y > toys[best].y + 0.2)) (best = i), (bd = d)
  })
  return best
}

function settle(dt: number) {
  const D = BOX.R * 2
  toys.forEach((t, i) => {
    if (t.held || t.gone) return
    let rest = BOX.FLOOR + BOX.R * 0.85
    if (t.won || inChute(t.x, t.z)) {
      // down the chute and out into the tray
      rest = 0.55
      if (!t.won && t.y < BOX.FLOOR - 0.2) win(i)
    } else {
      for (let j = 0; j < toys.length; j++) {
        const o = toys[j]
        if (j === i || o.held || o.gone || o.won || o.y >= t.y) continue
        const d = Math.hypot(o.x - t.x, o.z - t.z)
        if (d < D * 0.92) rest = Math.max(rest, o.y + Math.sqrt(D * D - d * d) * 0.8)
      }
    }
    if (t.y > rest + 0.001) {
      t.vy -= 14 * dt
      t.y = Math.max(rest, t.y + t.vy * dt)
      if (t.y === rest) t.vy = 0
    } else (t.y = rest), (t.vy = 0)
  })
}

function win(i: number) {
  const t = toys[i]
  t.won = true
  t.x = BOX.CHUTE[0]
  t.z = 1.55 // it pops out of the flap at the front
  // earlier prizes move to the shelf beside the machine
  claw.wins.forEach((w, k) => Object.assign(toys[w], { x: -2.15 - Math.floor(k / 5) * 0.56, z: 1 - (k % 5) * 0.5, y: 0.9, vy: 0, rx: 0, rz: 0, ry: 0.3 }))
  claw.wins.push(i)
  claw.misses = 0
  blip('egg')
  set({ prize: i })
  if (claw.wins.length === 1) findEgg('claw', 'you beat the claw machine. nobody beats the claw machine.')
}

const MISSES = [
  'so close. the claw is rigged, like every arcade.',
  'i guess bro.',
  'it slipped. very realistic arcade physics.',
  'skill issue. (it is the claw. try again.)',
]

export function step(dt: number) {
  const c = claw
  const toward = (v: number, to: number, s: number) => (Math.abs(to - v) <= s ? to : v + Math.sign(to - v) * s)
  switch (c.phase) {
    case 'aim': {
      c.x = Math.max(-BOX.X + 0.25, Math.min(BOX.X - 0.25, c.x + c.dx * SPEED * dt))
      c.z = Math.max(-BOX.Z + 0.25, Math.min(BOX.Z - 0.25, c.z + c.dz * SPEED * dt))
      c.open = toward(c.open, 1, dt * 3)
      if (get().claw && get().prize === null) c.timer -= dt
      if (c.timer <= 0) drop()
      break
    }
    case 'drop': {
      const i = under(c.x, c.z, 0.38)
      const floor = BOX.FLOOR + BOX.REACH - 0.05
      const target = i >= 0 ? Math.max(floor, toys[i].y + BOX.REACH - BOX.R * 0.7) : floor
      c.y = toward(c.y, target, dt * 2.4)
      if (c.y === target) (c.phase = 'grab'), (c.wait = 0.5)
      break
    }
    case 'grab': {
      c.open = toward(c.open, 0, dt * 2.4)
      c.wait -= dt
      if (c.wait > 0) break
      const i = under(c.x, c.z, 0.42)
      if (i >= 0 && toys[i].y > c.y - BOX.REACH - BOX.R) {
        const d = Math.hypot(toys[i].x - c.x, toys[i].z - c.z)
        // A centred grab nearly always holds; the pity rule makes sure the third miss in a row is the last.
        const holds = c.misses >= 2 || Math.random() < (d < 0.16 ? 0.85 : 0.55 - d)
        c.held = i
        toys[i].held = true
        c.grip = d
        c.slipAt = holds ? -1 : BOX.FLOOR + 1 + Math.random() * 1.4
      }
      c.phase = 'rise'
      break
    }
    case 'rise': {
      c.y = toward(c.y, BOX.TOP, dt * 1.6)
      if (c.held >= 0 && c.slipAt > 0 && c.y > c.slipAt) letGo(true)
      if (c.y === BOX.TOP) {
        if (c.held >= 0) c.phase = 'carry'
        else miss()
      }
      break
    }
    case 'carry': {
      c.x = toward(c.x, BOX.CHUTE[0], dt * 1.2)
      c.z = toward(c.z, BOX.CHUTE[1], dt * 1.2)
      if (c.x === BOX.CHUTE[0] && c.z === BOX.CHUTE[1]) (c.phase = 'release'), (c.wait = 1.1)
      break
    }
    case 'release': {
      c.open = toward(c.open, 1, dt * 3)
      if (c.held >= 0) letGo(false)
      c.wait -= dt
      // after a miss, go straight back to aiming; after a win, wait for the prize card
      if (c.wait <= 0) Object.assign(c, get().claw && get().prize === null ? { phase: 'aim', timer: AIM_TIME } : { phase: 'rest' })
      break
    }
    case 'rest':
      c.open = toward(c.open, 1, dt * 3)
      break
  }
  if (c.held >= 0) {
    const t = toys[c.held]
    const sway = c.phase === 'rise' || c.phase === 'carry' ? Math.sin(performance.now() / 160) * 0.05 * (1 + c.grip * 4) : 0
    t.x = c.x + sway
    t.z = c.z
    t.y = c.y - BOX.REACH + 0.05
  }
  settle(dt)
}

function letGo(slip: boolean) {
  const t = toys[claw.held]
  t.held = false
  t.vy = 0
  claw.held = -1
  if (slip) {
    claw.open = 0.6
    // back into the pile, never straight into the chute
    if (inChute(t.x, t.z, 0.1)) t.x -= 0.6
    blip('bruh')
  }
}

function miss() {
  claw.misses++
  say(MISSES[(claw.misses + claw.wins.length) % MISSES.length])
  claw.phase = 'carry' // the claw still goes home, empty-handed
}

/** After a win or a miss, the claw is home and ready again. */
export const ready = () => claw.phase === 'rest' || claw.phase === 'aim'
