// Hand-painted surfaces: the ground gets brush blotches and grass strokes, paved parts get flagstones.
import * as THREE from 'three'
import { rng } from './path'
import { toon } from './kit'

const S = 512

/** Draws `f` at every wrap offset so the canvas tiles seamlessly. */
function wrapped(f: (dx: number, dy: number) => void) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) f(dx, dy)
}

/**
 * Grey around 50%, so the shader can brighten and darken: soft paint blotches,
 * then hundreds of short grass strokes.
 */
function grassCanvas() {
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const r = rng(5)
  g.fillStyle = 'rgb(128,128,128)'
  g.fillRect(0, 0, S, S)
  for (let i = 0; i < 70; i++) {
    const x = r() * S, y = r() * S, rad = 20 + r() * 70
    const v = r() < 0.5 ? 100 + r() * 20 : 140 + r() * 18
    wrapped((dx, dy) => {
      const grd = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad)
      grd.addColorStop(0, `rgba(${v},${v},${v},0.55)`)
      grd.addColorStop(1, `rgba(${v},${v},${v},0)`)
      g.fillStyle = grd
      g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
    })
  }
  g.lineCap = 'round'
  for (let i = 0; i < 1500; i++) {
    const x = r() * S, y = r() * S, len = 5 + r() * 9
    const a = -Math.PI / 2 + (r() - 0.5) * 1.1
    const v = r() < 0.55 ? 88 + r() * 25 : 160 + r() * 30
    g.strokeStyle = `rgba(${v},${v},${v},${0.5 + r() * 0.4})`
    g.lineWidth = 1.2 + r() * 1.6
    const bend = (r() - 0.5) * 5
    wrapped((dx, dy) => {
      g.beginPath()
      g.moveTo(x + dx, y + dy)
      g.quadraticCurveTo(x + dx + bend, y + dy - len * 0.6, x + dx + Math.cos(a) * len + bend, y + dy + Math.sin(a) * len)
      g.stroke()
    })
  }
  return c
}

/** Uneven flagstones with darker mortar, plus speckle for dirt paths. */
function stoneCanvas() {
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  const r = rng(8)
  g.fillStyle = 'rgb(96,96,96)'
  g.fillRect(0, 0, S, S)
  const rows = 8
  const h = S / rows
  for (let j = 0; j < rows; j++) {
    let x = (j % 2) * h * 0.6
    const start = x
    while (x < start + S) {
      const w = h * (0.9 + r() * 0.9)
      const v = 124 + r() * 22
      g.fillStyle = `rgb(${v},${v},${v})`
      for (const dx of [-S, 0]) {
        g.beginPath()
        g.roundRect(x + dx + 3, j * h + 3, w - 6, h - 6, 9)
        g.fill()
      }
      x += w
    }
  }
  for (let i = 0; i < 2500; i++) {
    const v = r() < 0.5 ? 90 : 170
    g.fillStyle = `rgba(${v},${v},${v},0.35)`
    g.fillRect(r() * S, r() * S, 1.5 + r() * 2, 1.5 + r() * 2)
  }
  return c
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

let grass: THREE.Texture, stone: THREE.Texture

/**
 * Vertex-coloured ground with paint on top, in world space so it never
 * stretches. Green areas get grass strokes, grey areas get flagstones and
 * sandy ones get speckle. `stones` forces flagstones (for paved paths).
 */
export function paintedGround({ stones = false } = {}) {
  grass ??= tex(grassCanvas())
  stone ??= tex(stoneCanvas())
  const m = toon({ vertexColors: true })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tGrass = { value: grass }
    sh.uniforms.tStone = { value: stone }
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xz;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWorld;\nuniform sampler2D tGrass;\nuniform sampler2D tStone;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float green = smoothstep(0.02, 0.1, c.g - max(c.r, c.b));
          float grey = 1.0 - smoothstep(0.09, 0.16, max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)));
          ${stones ? 'grey = 1.0; green = 0.0;' : ''}
          float big = texture2D(tGrass, vWorld / 61.0).r * 2.0 - 1.0;
          float fine = texture2D(tGrass, vWorld / 11.0).r * 2.0 - 1.0;
          float flag = texture2D(tStone, vWorld / 9.0).r * 2.0 - 1.0;
          float k = big * 0.3 + mix(fine * 0.14, fine * 0.45, green);
          k = mix(k, flag * 0.5 + big * 0.08, grey * (1.0 - green));
          // blotches lean warm when lighter and cool when darker, like paint
          diffuseColor.rgb = c * (1.0 + k) + vec3(0.03, 0.015, -0.03) * k;
        }`,
      )
  }
  return m
}
