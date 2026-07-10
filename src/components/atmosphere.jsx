import { useEffect, useRef } from 'react'
import { prefersReduced } from '@/lib/useReducedMotion'
export { default as WavyBackground } from '@/components/WavyBackground'

/* Ambient, content-always-wins backgrounds for inner-page sections. Every canvas
   here caps DPR, pauses via IntersectionObserver when off-screen, and renders a
   single static frame under prefers-reduced-motion. All are aria-hidden and
   absolutely positioned — drop into a `relative overflow-hidden` section behind
   content (content gets a higher z-index). No layout reads in the loop → no thrash. */

const TONES = {
  navy: ['rgba(200,154,60,0.55)', 'rgba(253,250,244,0.28)'], // gold + faint cream dots on navy
  warm: ['rgba(155,116,32,0.30)', 'rgba(15,36,68,0.12)'],    // gold + faint navy dots on cream/beige
}

// DotField — a slow-drifting grid of dots that gently pulse. The "calm" living
// variant for navy sections that are not the hero, and a faint texture for
// cream/beige sections (tone="warm").
export function DotField({ tone = 'navy', gap = 34, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const DPR = Math.min(window.devicePixelRatio || 1, 1.25)
    const [c1, c2] = TONES[tone] || TONES.navy
    let w = 0, h = 0, t = 0, raf = 0, running = false
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width); h = Math.max(1, r.height)
      canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    const paint = () => {
      ctx.clearRect(0, 0, w, h)
      const cols = Math.ceil(w / gap) + 1, rowsN = Math.ceil(h / gap) + 1
      for (let iy = 0; iy < rowsN; iy++) {
        for (let ix = 0; ix < cols; ix++) {
          const px = ix * gap + Math.sin(t * 0.6 + iy * 0.5) * 3
          const py = iy * gap + Math.cos(t * 0.5 + ix * 0.5) * 3
          const pulse = 0.5 + 0.5 * Math.sin(t + (ix + iy) * 0.35)
          ctx.fillStyle = (ix + iy) % 7 === 0 ? c1 : c2
          ctx.globalAlpha = 0.25 + pulse * 0.75
          ctx.beginPath()
          ctx.arc(px, py, (ix + iy) % 7 === 0 ? 1.6 : 1.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }
    const render = () => { t += 0.01; paint(); if (running) raf = requestAnimationFrame(render) }
    resize()
    if (prefersReduced()) { paint(); return () => {} }
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(render) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 })
    io.observe(canvas)
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    paint()
    return () => { stop(); io.disconnect(); window.removeEventListener('resize', onResize) }
  }, [tone, gap])
  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden="true" />
}

// EdgeGlow — static, zero-cost radial glows anchored at the edges (never straight
// interior lines). The calmest navy variant; also a warm option for cream.
export function EdgeGlow({ tone = 'navy', className = '' }) {
  const g = tone === 'warm'
    ? 'radial-gradient(680px 460px at 8% 0%, rgba(200,154,60,0.10), transparent 60%), radial-gradient(760px 520px at 100% 100%, rgba(15,36,68,0.06), transparent 62%)'
    : 'radial-gradient(760px 520px at 4% 6%, rgba(200,154,60,0.14), transparent 60%), radial-gradient(820px 560px at 100% 96%, rgba(27,58,107,0.5), transparent 62%)'
  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`} style={{ background: g }} />
}

// PaperGrain — a fixed, ultra-subtle print-grain texture for cream/beige sections
// so they never read as a dead flat fill. Static SVG turbulence, no animation.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
export function PaperGrain({ opacity = 0.04, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ backgroundImage: GRAIN, backgroundSize: '180px 180px', opacity, mixBlendMode: 'multiply' }}
    />
  )
}
