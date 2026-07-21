import { useEffect, useRef, useState } from 'react'
import { Renderer, Program, Triangle, Mesh } from 'ogl'
import { prefersReduced } from '@/lib/useReducedMotion'
import './LightRays.css'

// ── LightRays — React Bits "Light Rays" (ogl/WebGL), reskinned to System B ─────
// Volumetric god-rays raked from the top edge, recoloured to QFP gold #F37031 over
// navy. Complies with our edge-origin beam law by nature (origin sits OUTSIDE the
// top edge, rays travel downward → light-from-above). This is the ONLY WebGL effect
// allowed per viewport.
//
// Deployment laws honoured here, in the component (not the caller):
//   • IntersectionObserver — the GL context + render loop only run while the host
//     section is on-screen; scrolling away pauses the raf immediately.
//   • prefers-reduced-motion — no WebGL at all; a static CSS gold gradient stands
//     in (see .light-rays--static). Kills every moving pixel.
//   • Tab hidden (visibilitychange) also parks the loop.
//   • DPR capped at 1.5 — matches the site's other canvas budgets (WavyBackground).
// Defaults below ARE the brief: gold, top-center, low saturation, slight noise,
// pulsating off. A placement only passes `className` for sizing/opacity tuning.

const DEFAULT_COLOR = '#F37031'

const hexToRgb = (hex) => {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m) return [1, 1, 1]
  return [parseInt(m[0], 16) / 255, parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255]
}

// Anchor sits OUTSIDE the section edge so the rays read as light entering, never a
// glowing point inside the frame. top-center → just above the top edge, aimed down.
const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2
  switch (origin) {
    case 'top-left':
      return { anchor: [0, -outside * h], dir: [0, 1] }
    case 'top-right':
      return { anchor: [w, -outside * h], dir: [0, 1] }
    case 'left':
      return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] }
    case 'right':
      return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] }
    default: // top-center
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] }
  }
}

export default function LightRays({
  raysOrigin = 'top-center',
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 0.5, // low — the brief; keeps the gold from screaming
  noiseAmount = 0.1, // slight — the brief
  distortion = 0,
  className = '',
}) {
  const containerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const reduced = prefersReduced()

  // Only mount the GL context once the section scrolls into view (and keep a flag
  // for pause/resume). One-shot gate: once seen we keep the renderer but the raf is
  // gated by `intersecting` below.
  const uniformsRef = useRef(null)
  const rendererRef = useRef(null)
  const meshRef = useRef(null)
  const rafRef = useRef(0)
  const intersectingRef = useRef(false)
  const cleanupRef = useRef(null)

  // Reveal/pause observer — always active (cheap), independent of GL lifecycle.
  useEffect(() => {
    if (reduced) return
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        intersectingRef.current = e.isIntersecting
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  // GL lifecycle — created lazily after first visibility, torn down on unmount.
  useEffect(() => {
    if (reduced || !visible) return
    const el = containerRef.current
    if (!el) return

    let disposed = false
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      alpha: true,
    })
    rendererRef.current = renderer
    const gl = renderer.gl
    gl.canvas.setAttribute('aria-hidden', 'true')
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    el.appendChild(gl.canvas)

    const vert = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`

    const frag = `precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;

  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);

  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);

  vec4 rays1 = vec4(1.0) *
    rayStrength(rayPos, rayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
    rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);

  vec4 fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;

  gl_FragColor = fragColor;
}`

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      rayPos: { value: [0, 0] },
      rayDir: { value: [0, 1] },
      raysColor: { value: hexToRgb(raysColor) },
      raysSpeed: { value: raysSpeed },
      lightSpread: { value: lightSpread },
      rayLength: { value: rayLength },
      pulsating: { value: pulsating ? 1 : 0 },
      fadeDistance: { value: fadeDistance },
      saturation: { value: saturation },
      noiseAmount: { value: noiseAmount },
      distortion: { value: distortion },
    }
    uniformsRef.current = uniforms

    const geometry = new Triangle(gl)
    const program = new Program(gl, { vertex: vert, fragment: frag, uniforms })
    const mesh = new Mesh(gl, { geometry, program })
    meshRef.current = mesh

    const dpr = renderer.dpr
    const updatePlacement = () => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w, h)
      const wp = w * dpr
      const hp = h * dpr
      uniforms.iResolution.value = [wp, hp]
      const { anchor, dir } = getAnchorAndDir(raysOrigin, wp, hp)
      uniforms.rayPos.value = anchor
      uniforms.rayDir.value = dir
    }

    // MOTIONLESS (Phase 3.3): the client rejected background motion, so the rays
    // render a single settled frame instead of an animated loop — matching the
    // frozen WavyBackground. iTime is pinned to a fixed phase; once the band is
    // on-screen we draw exactly once, then stop the rAF (no ongoing animation).
    uniforms.iTime.value = 0.6
    const loop = () => {
      if (disposed) return
      if (intersectingRef.current && document.visibilityState === 'visible') {
        renderer.render({ scene: mesh })
        return // one static frame — do not reschedule
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    updatePlacement()
    rafRef.current = requestAnimationFrame(loop)

    const onResize = () => updatePlacement()
    window.addEventListener('resize', onResize)

    cleanupRef.current = () => {
      disposed = true
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      } catch {
        /* noop */
      }
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas)
      rendererRef.current = null
      meshRef.current = null
      uniformsRef.current = null
    }
    return () => cleanupRef.current?.()
    // raysColor/origin are deployment-constant; visibility drives (re)creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, visible])

  return (
    <div
      ref={containerRef}
      className={`light-rays${reduced ? ' light-rays--static' : ''} ${className}`}
      aria-hidden="true"
    />
  )
}
