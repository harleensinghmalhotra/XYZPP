import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── Our Promise ──────────────────────────────────────────────────────────────
// Replaces the Mandela video quote. A quiet, cinematic pull-quote on deep navy.
// "Fluid Motion" kinetic reveal: as the section scrolls in, the quote reveals
// word-by-word — each word rises + fades + blur→sharp, staggered L→R, SCRUBBED
// to scroll position. Monochrome cream; emphasis is WEIGHT only (light 300 vs
// bold 700), never colour. Weights are STATIC — only opacity/transform/filter
// animate (animating font-weight would reflow). Gold appears ONLY on the small
// eyebrow + attribution labels, never on the quote.
//
// Read-the-bold-alone test: bold words = "mission is education. ensure nothing gets in its way."

// Split translated segments into per-word tokens for the kinetic L→R reveal.
// Emphasis (bold vs light) is carried per segment; word order comes from the
// active language so the "read-the-bold-alone" line survives translation.
function segmentsToWords(segments) {
  return segments.flatMap((seg, si) =>
    seg.text.split(' ').map((w, wi) => ({ w, bold: seg.bold, key: `${si}-${wi}` })),
  )
}

// ── Promise globe — abstract gold wireframe, orthographic canvas 2D ───────────
// Ekta rejected the wavy background; Harry's replacement is a slow-spinning
// wireframe globe filling the empty right. It is deliberately NOT the realistic
// react-globe.gl Earth (that jewel lives in Projects). This one is pure line-art:
// a low-opacity gold graticule sphere with a handful of great-circle arcs that
// draw on + fade (the shipping-routes echo) and tiny gold nodes where they land.
// Canvas 2D over Three.js on purpose — the homepage already carries heavy WebGL
// (Projects' Earth, the R3F conveyor, the hero), so this section stays near-free.
// Reduced motion → one static frame, frozen mid-arc, no rAF loop, no rotation.

const GOLD = '155, 116, 32'    // #9B7420 — graticule
const GOLD_HI = '200, 154, 60' // #C89A3C — brighter arc + node highlight
const TILT = (20 * Math.PI) / 180 // gentle axial tilt so it isn't a flat globe
const SPIN = 82                   // seconds per revolution (barely perceptible)
const ARC_PERIOD = 9.5            // seconds for one draw→hold→fade→gap cycle

// deterministic arc endpoints [lat, lon] in degrees — evokes routes, not geography
const ARCS = [
  { a: [22, -8], b: [-28, 66], delay: 0.0 },
  { a: [48, 42], b: [8, -74], delay: 2.1 },
  { a: [-16, -58], b: [40, 98], delay: 4.0 },
  { a: [34, 118], b: [-44, 12], delay: 6.2 },
]

function latLonToVec(latDeg, lonDeg) {
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  const cl = Math.cos(lat)
  return { x: cl * Math.sin(lon), y: Math.sin(lat), z: cl * Math.cos(lon) }
}

// rotate a base unit vector about the up-axis by theta, then apply the fixed tilt,
// scaling by r (arcs ride slightly above the surface, so r > 1 for them).
function applyView(v, theta, r = 1) {
  const c = Math.cos(theta), s = Math.sin(theta)
  const x = v.x * c + v.z * s
  const z = -v.x * s + v.z * c
  const y = v.y
  const ct = Math.cos(TILT), st = Math.sin(TILT)
  return { x: x * r, y: (y * ct - z * st) * r, z: (y * st + z * ct) * r }
}

function buildGraticule() {
  const merid = [], par = []
  const STEP = 6
  for (let lon = -180; lon < 180; lon += 30) {
    const line = []
    for (let lat = -90; lat <= 90; lat += STEP) line.push(latLonToVec(lat, lon))
    merid.push(line)
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const line = []
    for (let lon = -180; lon <= 180; lon += STEP) line.push(latLonToVec(lat, lon))
    par.push(line)
  }
  return { merid, par }
}

// stroke a projected polyline, batching consecutive same-hemisphere runs so the
// whole graticule is only a few dozen stroke() calls per frame (front bright,
// back faint → a see-through wireframe with real depth).
function drawLine(ctx, tp, cx, cy, R, frontA, backA) {
  let i = 0
  while (i < tp.length - 1) {
    const front = (tp[i].z + tp[i + 1].z) / 2 >= 0
    ctx.globalAlpha = front ? frontA : backA
    ctx.beginPath()
    ctx.moveTo(cx + R * tp[i].x, cy - R * tp[i].y)
    let j = i + 1
    ctx.lineTo(cx + R * tp[j].x, cy - R * tp[j].y)
    while (j < tp.length - 1) {
      const f2 = (tp[j].z + tp[j + 1].z) / 2 >= 0
      if (f2 !== front) break
      j++
      ctx.lineTo(cx + R * tp[j].x, cy - R * tp[j].y)
    }
    ctx.stroke()
    i = j
  }
}

function PromiseGlobe({ reduced }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    const { merid, par } = buildGraticule()

    // precompute each arc's great-circle geometry (endpoints as base unit vectors
    // + the angle between them) once — per frame we only slerp + project.
    const arcs = ARCS.map((arc) => {
      const a = latLonToVec(arc.a[0], arc.a[1])
      const b = latLonToVec(arc.b[0], arc.b[1])
      const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))
      const omega = Math.acos(dot)
      return { a, b, omega, sinO: Math.sin(omega) || 1e-6, delay: arc.delay }
    })

    let w = 0, h = 0, cx = 0, cy = 0, R = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, rect.width); h = Math.max(1, rect.height)
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      cx = w / 2; cy = h / 2
      R = (Math.min(w, h) / 2) * 0.9
    }

    const drawArc = (arc, theta, phase) => {
      // lifecycle across the cycle: draw (grow head) → hold → fade → gap
      const head = Math.min(phase / 0.4, 1)
      let alpha
      if (phase < 0.6) alpha = 1
      else if (phase < 0.85) alpha = (0.85 - phase) / 0.25
      else return
      if (head <= 0) return

      const N = 48
      const pts = []
      for (let s = 0; s <= N; s++) {
        const t = (s / N) * head
        const k0 = Math.sin((1 - t) * arc.omega) / arc.sinO
        const k1 = Math.sin(t * arc.omega) / arc.sinO
        const v = {
          x: arc.a.x * k0 + arc.b.x * k1,
          y: arc.a.y * k0 + arc.b.y * k1,
          z: arc.a.z * k0 + arc.b.z * k1,
        }
        const lift = 1 + 0.17 * Math.sin(Math.PI * t) // route bulge above surface
        pts.push(applyView(v, theta, lift))
      }
      ctx.lineWidth = 1.4
      ctx.strokeStyle = `rgba(${GOLD_HI}, ${0.9 * alpha})`
      // draw only front-facing runs so arcs don't ghost through the back of the globe
      let i = 0
      while (i < pts.length - 1) {
        if (pts[i].z < -0.02) { i++; continue }
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.moveTo(cx + R * pts[i].x, cy - R * pts[i].y)
        let j = i + 1
        ctx.lineTo(cx + R * pts[j].x, cy - R * pts[j].y)
        while (j < pts.length - 1 && pts[j].z >= -0.02) {
          j++
          ctx.lineTo(cx + R * pts[j].x, cy - R * pts[j].y)
        }
        ctx.stroke()
        i = j
      }

      // nodes: origin appears as the arc launches, destination as the head lands
      const node = (v, on) => {
        if (!on) return
        const p = applyView(v, theta, 1.0)
        if (p.z < 0) return
        ctx.globalAlpha = 1
        ctx.fillStyle = `rgba(${GOLD_HI}, ${0.95 * alpha})`
        ctx.beginPath()
        ctx.arc(cx + R * p.x, cy - R * p.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      node(arc.a, phase > 0.02)
      node(arc.b, head >= 0.999)
    }

    const render = (theta, arcPhase) => {
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // graticule
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgb(${GOLD})`
      for (const line of merid) {
        const tp = line.map((v) => applyView(v, theta))
        drawLine(ctx, tp, cx, cy, R, 0.32, 0.11)
      }
      for (let pi = 0; pi < par.length; pi++) {
        const tp = par[pi].map((v) => applyView(v, theta))
        const isEquator = pi === 2
        drawLine(ctx, tp, cx, cy, R, isEquator ? 0.4 : 0.3, isEquator ? 0.14 : 0.1)
      }
      // faint limb ring so the sphere reads as a whole even where lines thin out
      ctx.globalAlpha = 0.22
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgb(${GOLD})`
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()
      // arcs
      for (const arc of arcs) {
        const p = arcPhase(arc.delay)
        drawArc(arc, theta, p)
      }
      ctx.globalAlpha = 1
    }

    resize()

    if (reduced) {
      // one static frame: a pleasant fixed angle, arcs frozen mid-draw
      const theta = 0.65
      render(theta, () => 0.42)
      const onResize = () => { resize(); render(theta, () => 0.42) }
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let raf = 0
    let running = false
    const start = performance.now()
    const loop = (now) => {
      const el = (now - start) / 1000
      const theta = (el / SPIN) * Math.PI * 2
      const phaseFor = (delay) => ((el + delay) % ARC_PERIOD) / ARC_PERIOD
      render(theta, phaseFor)
      raf = requestAnimationFrame(loop)
    }
    const play = () => { if (!running) { running = true; raf = requestAnimationFrame(loop) } }
    const stop = () => { if (running) { running = false; cancelAnimationFrame(raf) } }

    // only spin while the section is on screen
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? play() : stop()),
      { threshold: 0.01 },
    )
    io.observe(canvas)
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    return () => {
      io.disconnect()
      stop()
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  return <canvas ref={ref} className="promise-globe" aria-hidden="true" />
}

export default function PromiseSection() {
  const { t } = useTranslation('home')
  const root = useRef(null)
  const bg = useRef(null)
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const WORDS = segmentsToWords(Array.isArray(segments) ? segments : [])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const words = q('.pq-w')

      // Hidden initial state set in a layout effect (no flash). CSS resting state
      // is the FINAL state, so reduced-motion / no-JS shows the quote instantly.
      gsap.set(q('.promise-eyebrow'), { autoAlpha: 0, y: 12 })
      gsap.set(words, { autoAlpha: 0, yPercent: 70, filter: 'blur(9px)' })
      gsap.set([q('.promise-support'), q('.promise-attr')], { autoAlpha: 0, y: 16 })

      // Scrubbed timeline — the playhead tracks scroll position; the word stagger
      // becomes a left-to-right progressive reveal as the section rises into view.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top 82%', end: 'top 24%', scrub: 0.6 },
      })
      tl.to(q('.promise-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5 })
        .to(words, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.5 }, 0.25)
        .to(q('.promise-support'), { autoAlpha: 1, y: 0, duration: 0.5 }, '>-0.15')
        .to(q('.promise-attr'), { autoAlpha: 1, y: 0, duration: 0.5 }, '>-0.25')

      // faint depth layer drifts on a parallax offset
      gsap.to(bg.current, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="promise" ref={root} data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      <div className="promise-bg" ref={bg} aria-hidden="true" />
      <PromiseGlobe reduced={reduced} />
      <div className="promise-inner">
        <p className="promise-eyebrow">{t('promise.eyebrow')}</p>
        <blockquote className="promise-quote">
          {WORDS.map(({ w, bold, key }) => (
            <span key={key} className={`pq-w ${bold ? 'pq-bold' : 'pq-light'}`}>{w}</span>
          ))}
        </blockquote>
        <p className="promise-support">{t('promise.support')}</p>
        <p className="promise-attr">{t('promise.attribution')}</p>
      </div>
    </section>
  )
}
