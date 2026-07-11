import { useRef, useEffect } from 'react'

// ── Promise Type Wall — the compositor's case, set in the dark ────────────────
// Reactbits' LetterGlitch, rebranded from hacker-matrix to letterpress. A canvas
// grid of glitching characters becomes a living wall of type: a compositor's case
// where letters flicker as they are set. This REPLACES the old fluid background —
// two full-section canvases would fight, so the ether came out clean and this is
// the single base background layer (absolute inset 0, behind confetti/glow/text).
//
// The rebrand, point by point:
//  · INK ON NIGHT — glitchColors are strictly in-family: deep navy, muted navy,
//    dark gold, and a RARE brighter gold as the occasional "hot" letter caught in
//    lamplight (weighted ~1-in-12, so most of the wall whispers).
//  · SET IN OUR TYPE — fontFamily is 'DM Mono' (the site's own mono), ~15px, so the
//    wall is literally set in the site's face.
//  · LETTERPRESS PACE — glitchSpeed slowed from the reference's frantic 50ms to
//    ~200ms with smooth colour transitions: a compositor swapping sorts, one letter
//    at a time — you can watch a letter change, not see rain.
//  · TEXT PROTECTED — centerVignette (the component's shipped radial dark-centre
//    overlay) keeps the wall living at the EDGES and fading under the type; the
//    section's .promise-scrim wells opaque black over the whole text block above.
//
// Rules honoured beyond the reference: the rAF pauses off-viewport (Intersection
// Observer) and on hidden tab (visibilitychange); DPR is capped at 1; resize is
// debounced. Reduced motion renders ONE static grid frame — no glitching, no rAF.
// Clean unmount cancels the rAF and removes every listener.

// Strictly in-family — deep navy · muted navy · dark gold · rare hot gold.
const GLITCH_COLORS = ['#16233d', '#1B3A6B', '#5c4514', '#9B7420']
// Weighted so bright gold #9B7420 is the rare lamplit letter (~1-in-12); the rest
// of the wall stays in the muted navies and dark gold — it whispers.
const COLOR_WEIGHTS = [0.4, 0.32, 0.2, 0.08] // navy · muted navy · dark gold · hot gold
const GLITCH_SPEED = 200 // ms — letterpress pace (reference is 50ms matrix rain)
const SMOOTH = true
const FONT_SIZE = 15
const CHAR_WIDTH = 10
const CHAR_HEIGHT = 20
// A compositor's case: letters, figures, and a few typographic sorts.
const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&$#@%*!?—§¶·:;'.split('')
const DEV = !!(import.meta.env && import.meta.env.DEV)

function pickColorIndex() {
  let r = Math.random()
  for (let i = 0; i < COLOR_WEIGHTS.length; i++) { r -= COLOR_WEIGHTS[i]; if (r <= 0) return i }
  return COLOR_WEIGHTS.length - 1
}
function randomChar() { return CHARS[(Math.random() * CHARS.length) | 0] }
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
function interpolateColor(a, b, f) {
  return {
    r: Math.round(a.r + (b.r - a.r) * f),
    g: Math.round(a.g + (b.g - a.g) * f),
    b: Math.round(a.b + (b.b - a.b) * f),
  }
}
const rgbStr = (c) => `rgb(${c.r},${c.g},${c.b})`

export default function PromiseTypeWall({ reduced = false, centerVignette = true }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')

    let letters = []
    let columns = 0, rows = 0

    function measure() {
      const rect = wrap.getBoundingClientRect()
      const W = Math.max(1, Math.floor(rect.width))
      const H = Math.max(1, Math.floor(rect.height))
      canvas.width = W // DPR capped at 1 — the wall is texture, not detail
      canvas.height = H
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      columns = Math.ceil(W / CHAR_WIDTH)
      rows = Math.ceil(H / CHAR_HEIGHT)
    }

    function initLetters() {
      const total = columns * rows
      letters = new Array(total)
      for (let i = 0; i < total; i++) {
        const color = GLITCH_COLORS[pickColorIndex()]
        letters[i] = { char: randomChar(), color, target: color, progress: 1 }
      }
    }

    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${FONT_SIZE}px 'DM Mono', ui-monospace, monospace`
      ctx.textBaseline = 'top'
      for (let i = 0; i < letters.length; i++) {
        const l = letters[i]
        const x = (i % columns) * CHAR_WIDTH
        const y = ((i / columns) | 0) * CHAR_HEIGHT
        ctx.fillStyle = l.color
        ctx.fillText(l.char, x, y)
      }
    }

    // Swap a small share of sorts each glitch tick — a compositor lifting a few
    // letters from the case at a time, never the whole wall at once.
    function updateLetters() {
      if (!letters.length) return
      const n = Math.max(1, Math.floor(letters.length * 0.05))
      for (let k = 0; k < n; k++) {
        const i = (Math.random() * letters.length) | 0
        const l = letters[i]
        l.char = randomChar()
        const next = GLITCH_COLORS[pickColorIndex()]
        if (SMOOTH) { l.target = next; l.progress = 0 }
        else { l.color = next }
      }
    }

    // Smooth navy↔gold crossfades so a letter eases into its new ink rather than
    // snapping — the contemplative half of the letterpress feel.
    function advanceSmooth() {
      let touched = false
      for (let i = 0; i < letters.length; i++) {
        const l = letters[i]
        if (l.progress >= 1) continue
        l.progress = Math.min(1, l.progress + 0.05)
        const from = hexToRgb(l.color.startsWith('#') ? l.color : GLITCH_COLORS[0])
        const to = hexToRgb(l.target)
        l.color = rgbStr(interpolateColor(from, to, l.progress))
        if (l.progress >= 1) l.color = l.target
        touched = true
      }
      return touched
    }

    measure()
    initLetters()
    draw()
    // Redraw once DM Mono is actually ready so the wall is set in our type, not a
    // fallback face on the very first paint.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (canvasRef.current) draw() }).catch(() => {})
    }

    // Reduced motion → one static frame of set type. No rAF, no glitch.
    if (reduced) {
      let rt = 0
      const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { measure(); initLetters(); draw() }, 100) }
      window.addEventListener('resize', onResize)
      if (DEV) window.__PROMISE_TYPEWALL__ = devHook(() => false)
      return () => { clearTimeout(rt); window.removeEventListener('resize', onResize); if (DEV) delete window.__PROMISE_TYPEWALL__ }
    }

    let raf = 0, running = false, lastGlitch = 0
    const loop = (now) => {
      if (!running) return
      if (now - lastGlitch >= GLITCH_SPEED) {
        updateLetters()
        lastGlitch = now
        if (!SMOOTH) draw()
      }
      if (SMOOTH) { if (advanceSmooth()) draw() }
      if (DEV) window.__PROMISE_TYPEWALL_TICKS__ = (window.__PROMISE_TYPEWALL_TICKS__ || 0) + 1
      raf = requestAnimationFrame(loop)
    }
    const start = () => { if (running) return; running = true; lastGlitch = 0; raf = requestAnimationFrame(loop) }
    const stop = () => { if (!running) return; running = false; cancelAnimationFrame(raf); raf = 0 }

    const inView = () => { const r = wrap.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !document.hidden) start()
      else stop()
    }, { threshold: 0.01 })
    io.observe(wrap)

    const onVis = () => { if (document.hidden) stop(); else if (inView()) start() }
    document.addEventListener('visibilitychange', onVis)

    let rt = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = setTimeout(() => { measure(); initLetters(); draw() }, 100)
    }
    window.addEventListener('resize', onResize)

    function devHook(isRunning) {
      return {
        running: isRunning,
        dims: () => ({ columns, rows, count: letters.length }),
        palette: () => GLITCH_COLORS.slice(),
        colors: () => letters.map((l) => l.color),
        chars: () => letters.map((l) => l.char).join(''),
        hotShare: () => {
          const hot = GLITCH_COLORS[3]
          const targets = letters.filter((l) => l.target === hot).length
          return targets / Math.max(1, letters.length)
        },
      }
    }
    if (DEV) window.__PROMISE_TYPEWALL__ = devHook(() => running)

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      clearTimeout(rt)
      if (DEV) delete window.__PROMISE_TYPEWALL__
    }
  }, [reduced])

  return (
    <div className="promise-typewall" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="promise-typewall-canvas" />
      {centerVignette && <div className="promise-typewall-vignette" />}
    </div>
  )
}
