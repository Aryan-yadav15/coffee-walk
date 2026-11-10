// The final pass: draws ink outlines from the depth buffer, then grades the frame like a painted page.
import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const frag = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2 texel;
  uniform float px;
  uniform float near;
  uniform float far;
  #define DEBUG (false)
  varying vec2 vUv;

  // Inverse depth is linear across any flat surface, so its second
  // difference is zero on planes and spikes at silhouettes and creases.
  float inv(vec2 uv) {
    float z = texture2D(tDepth, uv).x;
    return (far - z * (far - near)) / (near * far);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float edgeAt(vec2 uv, vec2 o) {
    float c = inv(uv);
    float a = inv(uv + vec2(o.x, 0.0)) + inv(uv - vec2(o.x, 0.0)) - 2.0 * c;
    float b = inv(uv + vec2(0.0, o.y)) + inv(uv - vec2(0.0, o.y)) - 2.0 * c;
    float d1 = inv(uv + o) + inv(uv - o) - 2.0 * c;
    float d2 = inv(uv + vec2(o.x, -o.y)) + inv(uv - vec2(o.x, -o.y)) - 2.0 * c;
    // one-sided: the line sits just inside the nearer object, so it never doubles up
    float lap = max(max(-a, -b), max(-d1, -d2) * 0.7);
    return smoothstep(0.003, 0.014, lap / c);
  }

  void main() {
    vec2 o = texel * px;
    float e = edgeAt(vUv, o);
    // fade lines out into the distance, so far-off clutter does not turn to scribble
    float depth = 1.0 / inv(vUv);
    e *= 1.0 - smoothstep(110.0, 220.0, depth);

    vec3 col = texture2D(tColor, vUv).rgb;
    // ink takes the hue of what it outlines, deepened, like a coloured pencil line
    vec3 ink = mix(col * vec3(0.2, 0.17, 0.24), vec3(0.05, 0.035, 0.07), 0.6);
    col = mix(col, ink, e);

    // a touch more colour, warm lights and cool shadows
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(l), col, 1.12);
    col += vec3(0.012, 0.004, -0.01) * smoothstep(0.3, 0.9, l) + vec3(-0.008, 0.0, 0.016) * (1.0 - smoothstep(0.0, 0.4, l));

    // paper grain and a soft vignette
    col *= 0.975 + 0.05 * hash(floor(gl_FragCoord.xy / max(1.0, px * 0.8)));
    vec2 v = vUv - 0.5;
    col *= 1.0 - dot(v, v) * 0.45;

    gl_FragColor = vec4(max(col, 0.0), 1.0);
    if (DEBUG) gl_FragColor = vec4(vec3(1.0 - e), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export function Ink({ msaa }: { msaa: boolean }) {
  const { gl, scene, camera, size } = useThree()
  const dpr = useThree((s) => s.viewport.dpr)

  const { target, quad, material } = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: msaa ? 4 : 0 })
    target.depthTexture = new THREE.DepthTexture(1, 1)
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        tColor: { value: target.texture },
        tDepth: { value: target.depthTexture },
        texel: { value: new THREE.Vector2() },
        px: { value: 1 },
        near: { value: 1 },
        far: { value: 600 },
      },
      depthTest: false,
      depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    return { target, quad, material }
  }, [msaa])

  useEffect(() => {
    const w = Math.round(size.width * dpr), h = Math.round(size.height * dpr)
    target.setSize(w, h)
    material.uniforms.texel.value.set(1 / w, 1 / h)
    // about 2.6 CSS pixels wide, whatever the screen density
    material.uniforms.px.value = Math.max(2.6, dpr * 2.6)
  }, [size, dpr, target, material])

  useEffect(() => () => (target.dispose(), material.dispose()), [target, material])

  const quadCam = useMemo(() => new THREE.Camera(), [])
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera
    material.uniforms.near.value = cam.near
    material.uniforms.far.value = cam.far
    gl.setRenderTarget(target)
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.render(quad, quadCam)
  }, 1)

  return null
}
