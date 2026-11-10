import * as THREE from 'three'
import { rng } from './path'

const DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif'
const HAND = '"Caveat", "Bricolage Grotesque", cursive'

// Signs are drawn before the web fonts arrive, so they get redrawn once fonts load.
const redraws: (() => void)[] = []
export const refreshSigns = () => redraws.forEach((f) => f())

export type SignOpts = { w: number; h: number; bg?: string; fg?: string; hand?: boolean }

/** Text on a board. Lines starting with "~" are drawn small. */
export function signTexture(text: string, { w, h, bg = '#fff8ec', fg = '#2a2320', hand }: SignOpts) {
  const ppu = Math.min(170, 1024 / Math.max(w, h))
  const c = document.createElement('canvas')
  c.width = Math.round(w * ppu)
  c.height = Math.round(h * ppu)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4

  const draw = () => {
    const g = c.getContext('2d')!
    const W = c.width, H = c.height
    g.fillStyle = bg
    g.fillRect(0, 0, W, H)
    const lines = text.split('\n').map((l) => (l.startsWith('~') ? { s: l.slice(1), k: 0.5 } : { s: l, k: 1 }))
    const family = hand ? HAND : DISPLAY
    const font = (px: number, k: number) => `${k < 1 ? 600 : 800} ${px * k}px ${family}`
    // Largest size where every line fits in both directions.
    let size = (H * 0.8) / lines.reduce((a, l) => a + l.k * 1.15, 0)
    for (const l of lines) {
      g.font = font(size, l.k)
      const tw = g.measureText(l.s).width
      if (tw > W * 0.88) size *= (W * 0.88) / tw
    }
    const total = lines.reduce((a, l) => a + l.k * size * 1.15, 0)
    let y = (H - total) / 2
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const l of lines) {
      const lh = l.k * size * 1.15
      g.font = font(size, l.k)
      g.globalAlpha = l.k < 1 ? 0.75 : 1
      g.fillStyle = fg
      g.fillText(l.s, W / 2, y + lh / 2)
      y += lh
    }
    g.globalAlpha = 1
    tex.needsUpdate = true
  }
  draw()
  redraws.push(draw)
  return tex
}

/** White wall with a window grid, plus a matching map of which windows are lit. */
export function buildingTextures(cols: number, rows: number, seed: number) {
  const r = rng(seed)
  const cw = 32, ch = 36
  const make = () => {
    const c = document.createElement('canvas')
    c.width = cols * cw
    c.height = rows * ch
    return c
  }
  const a = make(), b = make()
  const ga = a.getContext('2d')!, gb = b.getContext('2d')!
  ga.fillStyle = '#fff'
  ga.fillRect(0, 0, a.width, a.height)
  gb.fillStyle = '#000'
  gb.fillRect(0, 0, b.width, b.height)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = i * cw + 8, y = j * ch + 8
      ga.fillStyle = '#8496b3'
      ga.fillRect(x, y, cw - 16, ch - 16)
      if (r() < 0.6) {
        gb.fillStyle = r() < 0.2 ? '#bfe0ff' : '#ffd08a'
        gb.fillRect(x, y, cw - 16, ch - 16)
      }
    }
  const map = new THREE.CanvasTexture(a)
  const emissiveMap = new THREE.CanvasTexture(b)
  map.colorSpace = emissiveMap.colorSpace = THREE.SRGBColorSpace
  map.magFilter = emissiveMap.magFilter = THREE.NearestFilter
  return { map, emissiveMap }
}

let glowTex: THREE.CanvasTexture | null = null
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,225,160,1)')
  grad.addColorStop(0.25, 'rgba(255,200,120,0.45)')
  grad.addColorStop(1, 'rgba(255,180,90,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return (glowTex = new THREE.CanvasTexture(c))
}
