// Tiny synthesized sound effects, so there are no audio files to load.
import { get } from './state'

let ctx: AudioContext | null = null

function tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
  const c = ctx!
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur)
}

function noise(dur: number, vol: number, freq: number) {
  const c = ctx!
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.value = vol
  src.connect(f).connect(g).connect(c.destination)
  src.start()
}

export type Blip = 'step' | 'sip' | 'egg' | 'bruh' | 'honk' | 'pop'

export function blip(kind: Blip) {
  if (!get().sound) return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  if (kind === 'step') noise(0.06, 0.08, 420)
  if (kind === 'sip') (noise(0.28, 0.07, 1800), tone(320, 620, 0.25, 'sine', 0.04))
  if (kind === 'egg') (tone(660, 660, 0.12, 'triangle', 0.09), tone(990, 990, 0.2, 'triangle', 0.09, 0.1))
  if (kind === 'bruh') tone(120, 62, 0.5, 'sawtooth', 0.09)
  if (kind === 'honk') (tone(440, 440, 0.1, 'square', 0.05), tone(440, 440, 0.16, 'square', 0.05, 0.16))
  if (kind === 'pop') tone(420, 860, 0.12, 'sine', 0.09)
}
