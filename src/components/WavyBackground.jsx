import { useEffect, useRef } from 'react'

// ── WavyBackground — flowing simplex-noise canvas waves (Aceternity-style) ────
// Recreated in plain React + canvas (no "use client", no dependency). Brand-only
// palette: deep navy base with navy2 / muted-gold / soft-cream wave bands, drawn
// wide + blurred for a slow premium drift. Perf: DPR capped, paused when offscreen,
// reduced-motion → a single static frame (no loop).

// Compact 3D simplex noise (Ashima/Gustavson public-domain algorithm).
function makeNoise3D() {
  const grad3 = [1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  // deterministic shuffle (fixed seed → stable waves across reloads)
  let seed = 1337
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  for (let i = 255; i > 0; i--) { const n = Math.floor(rnd() * (i + 1));[p[i], p[n]] = [p[n], p[i]] }
  const perm = new Uint8Array(512)
  const permMod12 = new Uint8Array(512)
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; permMod12[i] = perm[i] % 12 }
  const F3 = 1 / 3, G3 = 1 / 6
  return function (xin, yin, zin) {
    let n0, n1, n2, n3
    const s = (xin + yin + zin) * F3
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s)
    const t = (i + j + k) * G3
    const X0 = i - t, Y0 = j - t, Z0 = k - t
    const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0
    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3
    const ii = i & 255, jj = j & 255, kk = k & 255
    const dot = (gi, x, y, z) => grad3[gi] * x + grad3[gi + 1] * y + grad3[gi + 2] * z
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
    if (t0 < 0) n0 = 0; else { t0 *= t0; n0 = t0 * t0 * dot(permMod12[ii + perm[jj + perm[kk]]] * 3, x0, y0, z0) }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
    if (t1 < 0) n1 = 0; else { t1 *= t1; n1 = t1 * t1 * dot(permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3, x1, y1, z1) }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
    if (t2 < 0) n2 = 0; else { t2 *= t2; n2 = t2 * t2 * dot(permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3, x2, y2, z2) }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
    if (t3 < 0) n3 = 0; else { t3 *= t3; n3 = t3 * t3 * dot(permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3, x3, y3, z3) }
    return 32 * (n0 + n1 + n2 + n3)
  }
}

// brand-only wave bands (bottom → top drawn order)
// waves over a near-black base — deep navy + muted gold + faint cream
const WAVES = [
  { color: '#16345f', alpha: 0.85 },             // deep navy
  { color: 'rgba(243, 112, 49,0.4)', alpha: 1 },   // muted gold
  { color: '#122a4d', alpha: 0.7 },
  { color: 'rgba(253,250,244,0.1)', alpha: 1 },  // faint cream
  { color: 'rgba(243, 112, 49,0.24)', alpha: 1 },
]

export default function WavyBackground({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const noise = makeNoise3D()
    const DPR = Math.min(window.devicePixelRatio || 1, 1.25) // cap canvas DPR
    // MOTIONLESS: the client rejected background motion, so the waves render as a
    // single settled static frame everywhere (was: slow drifting loop). nt is a
    // fixed phase so the wave shape is stable and deterministic.
    let w = 0, h = 0
    const nt = 0.35

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width); h = Math.max(1, r.height)
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    const drawWave = (i, color, alpha) => {
      ctx.globalAlpha = alpha
      ctx.strokeStyle = color
      ctx.lineWidth = 46
      ctx.beginPath()
      for (let x = 0; x <= w; x += 6) {
        const y = noise(x / 900, i * 0.35, nt) * 92
        ctx.lineTo(x, y + h * 0.5)
      }
      ctx.stroke()
    }
    const paint = () => {
      ctx.globalAlpha = 1
      ctx.filter = 'none'
      ctx.fillStyle = '#0a0e14'
      ctx.fillRect(0, 0, w, h)
      ctx.filter = 'blur(11px)'
      WAVES.forEach((wv, i) => drawWave(i + 1, wv.color, wv.alpha))
      ctx.filter = 'none'
      ctx.globalAlpha = 1
    }
    resize()
    paint() // one static frame — no animation loop, no IntersectionObserver
    const onResize = () => { resize(); paint() }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize) }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
