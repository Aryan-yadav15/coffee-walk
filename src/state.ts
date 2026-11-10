import { useSyncExternalStore } from 'react'
import type { MemeId } from './story'
import { blip } from './sound'
import { TOTAL, dist } from './world/path'

// Per-frame values. Mutated directly, never triggers React.
export const live = {
  t: 0, // smoothed position on the walk, 0..1
  target: 0, // where the scroll bar says we should be
  lookYaw: 0,
  lookPitch: 0,
  sipAnim: 0,
  talking: false,
  phase: 0, // walk cycle, advances with distance
  moving: 0, // 0 standing still, 1 walking
  cx: 0, // what the camera is looking at
  cz: 0,
}

export const EGGS = {
  sip: 'first sip',
  chai: 'chai mode',
  rabbit: 'the rabbit hole',
  button: 'the button that started it all',
  pigeon: 'pigeons, spooked',
  cat: 'wet cat',
  scooter: 'the delivery guy',
  moonwalk: 'moonwalk',
  trophy: 'confetti cannon',
  tv: 'channel surfer',
  six: 'hit a six',
  claw: 'claw machine champ',
}
export type EggId = keyof typeof EGGS
export const EGG_TOTAL = Object.keys(EGGS).length
export const MAX_SIPS = 6

type State = {
  eggs: EggId[]
  toast: { id: number; text: string } | null
  meme: MemeId | null
  chai: boolean
  sound: boolean
  sips: number
  plain: boolean
  /** Project id showing on the retro TV, if it's on. */
  tv: string | null
  seen: string[]
  /** Playing the tech claw machine. */
  claw: boolean
  /** Index of the plush just won, while its card is showing. */
  prize: number | null
}

let state: State = { eggs: [], toast: null, meme: null, chai: false, sound: false, sips: 0, plain: false, tv: null, seen: [], claw: false, prize: null }
const subs = new Set<() => void>()
const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f))

export const get = () => state
export function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  subs.forEach((f) => f())
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state))
}

let toastId = 0
export function say(text: string) {
  set({ toast: { id: ++toastId, text } })
}

export function findEgg(id: EggId, line: string) {
  if (state.eggs.includes(id)) return say(line)
  const eggs = [...state.eggs, id]
  set({ eggs })
  blip('egg')
  say(
    eggs.length === EGG_TOTAL
      ? `🥚 ${EGG_TOTAL}/${EGG_TOTAL} · you found everything. we should definitely work together.`
      : `🥚 ${eggs.length}/${EGG_TOTAL} · ${line}`,
  )
}

export function sip() {
  if (state.sips >= MAX_SIPS) return say("it's empty. the kettle at the stall does refills.")
  live.sipAnim = 1
  blip('sip')
  const sips = state.sips + 1
  set({ sips })
  if (sips === 1) findEgg('sip', 'first sip. tap yourself whenever.')
  else if (sips === 4) say('easy. we still have a long walk.')
  else if (sips === MAX_SIPS) say('and it\'s gone. try typing "chai".')
}

export function chaiMode() {
  const chai = !state.chai
  set({ chai, sips: 0 })
  blip('pop')
  findEgg('chai', chai ? 'chai mode. cutting chai > coffee, honestly.' : 'back to coffee. refilled.')
}

export function jumpTo(t: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: (dist(t) / TOTAL) * max, behavior: 'smooth' })
}

/** Turn the retro TV on to a project's channel. */
export function openProject(id: string) {
  const seen = state.seen.includes(id) ? state.seen : [...state.seen, id]
  set({ tv: id, seen })
  blip('pop')
  if (seen.length === 5) findEgg('tv', 'five channels. you actually read the docs.')
}
