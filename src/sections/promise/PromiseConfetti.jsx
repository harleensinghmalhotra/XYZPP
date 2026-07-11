import { useEffect, useRef } from 'react'

// ── Promise Confetti — two-layer celebration, bazen-energy tune ───────────────
// Architecture lifted (frame-by-frame) from a Dribbble celebration effect and
// rebranded: a PERSISTENT ambient wallpaper of chunky confetti that barely drifts
// (~3px/second — the slowness is the premium), plus a ONE-TIME entry burst whose
// pieces radiate out then SETTLE INTO that same lazy drift (no despawn pop).
//
// R2 punch tune vs the bazen reference: bigger chunkier pieces (10–18px, variance
// for depth), ~40% more of them, FULL-strength colour (opacity 1), a palette mix
// where cream + light-gold carry ~half the pieces (our white-on-purple pop), and
// three shape variants — chips, thin slivers, and gradient "streaks" (motion-blur
// echo). The centre-sparse safe zone is now the RENDERED text rect + a tight
// margin, so confetti lives right up around the words instead of a fat dead disc.
//
// One canvas, one rAF, DPR capped at 1, a pre-allocated piece pool (zero
// allocation per frame). The canvas sits ABOVE the ether and BELOW the scrim, so
// the scrim's opaque core hides any piece behind the type — contrast is never
// touched. Palette is gold/cream/olive/light-gold only. Reduced motion: a single
// frozen scatter, no drift, no burst.

const PALETTE = ['#9B7420', '#FDFAF4', '#6B7A2A', '#C9A96A'] // gold · cream · olive · light-gold
// weighted so cream + light-gold carry ~half the pieces — the bright pop on black
const WEIGHTS = [0.27, 0.28, 0.22, 0.23] // gold · cream · olive · light-gold  (cream+lg ≈ 0.51)
const AMBIENT = 210
const BURST = 54
const TOTAL = AMBIENT + BURST
const SAFE_MARGIN = 60 // px around the rendered text rect kept sparse
const DEV = !!(import.meta.env && import.meta.env.DEV)

function pickCI() {
  let r = Math.random()
  for (let i = 0; i < WEIGHTS.length; i++) { r -= WEIGHTS[i]; if (r <= 0) return i }
  return WEIGHTS.length - 1
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }

export default function PromiseConfetti({ reduced = false }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    const rand = (a, b) => a + Math.random() * (b - a)

    // pre-allocated pool — reused forever, never re-created in the frame loop
    const pool = new Array(TOTAL)
    for (let i = 0; i < TOTAL; i++) {
      pool[i] = { x: 0, y: 0, vx: 0, vy: 0, dx: 0, dy: 0, rot: 0, vrot: 0, w: 0, h: 0, shape: 0, ci: 0, color: '#fff', alpha: 1, active: false }
    }

    // one reusable length-gradient per colour (transparent → solid → transparent),
    // defined in unit local space so every streak of that colour shares it.
    const grads = PALETTE.map((hex) => {
      const [r, g, b] = hexRgb(hex)
      const gr = ctx.createLinearGradient(-0.5, 0, 0.5, 0)
      gr.addColorStop(0, `rgba(${r},${g},${b},0)`)
      gr.addColorStop(0.5, `rgba(${r},${g},${b},1)`)
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
      return gr
    })

    let W = 0, H = 0, cx = 0, cy = 0
    let safeL = 0, safeT = 0, safeR = 0, safeB = 0

    // shape 2 (streaks) draw with the gradient; chips + slivers are solid
    const solidB = [[], [], [], []]
    const streakB = [[], [], [], []]
    function rebuildBuckets() {
      for (let ci = 0; ci < 4; ci++) { solidB[ci].length = 0; streakB[ci].length = 0 }
      for (let i = 0; i < TOTAL; i++) { const pc = pool[i]; if (!pc.active) continue; (pc.shape === 2 ? streakB : solidB)[pc.ci].push(pc) }
    }

    function initPiece(pc) {
      const s = Math.random()
      pc.shape = s < 0.5 ? 0 : s < 0.8 ? 1 : 2 // ~50 chip · 30 sliver · 20 streak
      if (pc.shape === 0) { // chunky chip — most 12–14, a few 18px heroes
        const sz = 10 + Math.pow(Math.random(), 1.6) * 8
        pc.w = sz; pc.h = sz * rand(0.6, 1)
      } else if (pc.shape === 1) { // sliver
        pc.w = rand(10, 16); pc.h = rand(2, 3)
      } else { // streak (motion-blurred)
        pc.w = rand(15, 26); pc.h = rand(2, 3.5)
      }
      pc.ci = pickCI(); pc.color = PALETTE[pc.ci]
      pc.alpha = 1 // full strength; streaks fade only along their length gradient
      pc.rot = rand(0, Math.PI * 2)
      pc.vrot = (Math.PI * 2 / rand(60, 90)) * (Math.random() < 0.5 ? -1 : 1) // one rev / 60–90s
      const speed = rand(2.5, 3.5) // px/second — the lazy drift (UNCHANGED)
      const a = rand(0, Math.PI * 2)
      pc.dx = Math.cos(a) * speed; pc.dy = Math.sin(a) * speed
      pc.vx = pc.dx; pc.vy = pc.dy
    }

    // Sparse ONLY inside the rendered text rect + margin; dense everywhere else,
    // right up to the words. Fallback lands on a guaranteed-outside frame band.
    function scatter(pc) {
      for (let tries = 0; tries < 14; tries++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const inside = x > safeL && x < safeR && y > safeT && y < safeB
        if (!inside) { pc.x = x; pc.y = y; return }
        if (Math.random() < 0.05) { pc.x = x; pc.y = y; return } // rare sprinkle
      }
      placeOutside(pc)
    }
    function placeOutside(pc) {
      const bands = []
      if (safeT > 2) bands.push(0)
      if (H - safeB > 2) bands.push(1)
      if (safeL > 2) bands.push(2)
      if (W - safeR > 2) bands.push(3)
      if (!bands.length) { pc.x = Math.random() * W; pc.y = Math.random() * H; return }
      const bnd = bands[(Math.random() * bands.length) | 0]
      if (bnd === 0) { pc.x = Math.random() * W; pc.y = Math.random() * safeT }
      else if (bnd === 1) { pc.x = Math.random() * W; pc.y = safeB + Math.random() * (H - safeB) }
      else if (bnd === 2) { pc.x = Math.random() * safeL; pc.y = Math.random() * H }
      else { pc.x = safeR + Math.random() * (W - safeR); pc.y = Math.random() * H }
    }

    function measure() {
      const rect = wrap.getBoundingClientRect()
      W = Math.max(1, Math.floor(rect.width))
      H = Math.max(1, Math.floor(rect.height))
      cx = W / 2; cy = H / 2
      canvas.width = W // DPR capped at 1
      canvas.height = H
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
    }

    // safe zone recomputed from the ACTUAL rendered text block (not a fixed radius)
    function computeSafe() {
      const sec = wrap.getBoundingClientRect()
      const inner = wrap.parentElement && wrap.parentElement.querySelector('.promise-inner')
      let l, t, r, b
      if (inner) { const ir = inner.getBoundingClientRect(); l = ir.left - sec.left; t = ir.top - sec.top; r = ir.right - sec.left; b = ir.bottom - sec.top }
      else { l = W * 0.22; t = H * 0.28; r = W * 0.78; b = H * 0.72 }
      safeL = Math.max(0, l - SAFE_MARGIN)
      safeT = Math.max(0, t - SAFE_MARGIN)
      safeR = Math.min(W, r + SAFE_MARGIN)
      safeB = Math.min(H, b + SAFE_MARGIN)
    }

    function seedAmbient() {
      computeSafe()
      for (let i = 0; i < AMBIENT; i++) { const pc = pool[i]; initPiece(pc); scatter(pc); pc.active = true }
      for (let i = AMBIENT; i < TOTAL; i++) pool[i].active = false
      rebuildBuckets()
    }

    // one-time entry burst — launch from a ring around the text, radiate out,
    // decelerate into the ambient drift with no snap.
    function fireBurst() {
      for (let i = AMBIENT; i < TOTAL; i++) {
        const pc = pool[i]
        initPiece(pc)
        const a = rand(0, Math.PI * 2)
        const originR = rand(0.4, 0.62)
        pc.x = cx + Math.cos(a) * (W / 2) * originR
        pc.y = cy + Math.sin(a) * (H / 2) * originR
        const burstSpeed = rand(120, 240)
        pc.vx = Math.cos(a) * burstSpeed
        pc.vy = Math.sin(a) * burstSpeed
        const driftA = a + rand(-0.6, 0.6)
        const driftS = rand(2.5, 3.5)
        pc.dx = Math.cos(driftA) * driftS
        pc.dy = Math.sin(driftA) * driftS
        pc.active = true
      }
      rebuildBuckets()
    }

    // Every piece drawn in unit space: the scale (w,h) is folded into the affine
    // matrix, so streaks reuse a single length-gradient per colour. No save/
    // restore, no path — a setTransform + fillRect per piece.
    function drawBucket(bucket) {
      for (let j = 0; j < bucket.length; j++) {
        const pc = bucket[j]
        const c = Math.cos(pc.rot), s = Math.sin(pc.rot)
        ctx.setTransform(c * pc.w, s * pc.w, -s * pc.h, c * pc.h, pc.x, pc.y)
        ctx.globalAlpha = pc.alpha
        ctx.fillRect(-0.5, -0.5, 1, 1)
      }
    }
    function render() {
      ctx.clearRect(0, 0, W, H)
      for (let ci = 0; ci < 4; ci++) { if (!solidB[ci].length) continue; ctx.fillStyle = PALETTE[ci]; drawBucket(solidB[ci]) }
      for (let ci = 0; ci < 4; ci++) { if (!streakB[ci].length) continue; ctx.fillStyle = grads[ci]; drawBucket(streakB[ci]) }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
    }

    function step(dt) {
      const k = 2.6 // velocity → drift approach (burst decel; ambient is a no-op)
      const m = 20
      for (let i = 0; i < TOTAL; i++) {
        const pc = pool[i]
        if (!pc.active) continue
        const kk = Math.min(1, k * dt)
        pc.vx += (pc.dx - pc.vx) * kk
        pc.vy += (pc.dy - pc.vy) * kk
        pc.x += pc.vx * dt
        pc.y += pc.vy * dt
        pc.rot += pc.vrot * dt
        if (pc.x < -m) pc.x = W + m; else if (pc.x > W + m) pc.x = -m
        if (pc.y < -m) pc.y = H + m; else if (pc.y > H + m) pc.y = -m
      }
    }

    const devHook = (extra) => ({
      dims: () => ({ W, H }),
      safeRect: () => ({ l: safeL, t: safeT, r: safeR, b: safeB }),
      sample: () => pool.map((p, i) => ({ x: p.x, y: p.y, active: p.active, color: p.color, ambient: i < AMBIENT, shape: p.shape, w: p.w, h: p.h })),
      colors: () => pool.map((p) => p.color),
      palette: () => PALETTE.slice(),
      activeCount: () => pool.reduce((n, p) => n + (p.active ? 1 : 0), 0),
      ...extra,
    })

    measure()
    seedAmbient()

    // Reduced motion → one frozen scatter, no rAF, no burst.
    if (reduced) {
      render()
      const onResize = () => { measure(); seedAmbient(); render() }
      window.addEventListener('resize', onResize)
      if (DEV) window.__PROMISE_CONFETTI__ = devHook({ burstFired: () => false })
      return () => { window.removeEventListener('resize', onResize); if (DEV) delete window.__PROMISE_CONFETTI__ }
    }

    let raf = 0, last = 0, running = false, burstFired = false
    const loop = (now) => {
      if (!running) return
      if (!last) last = now
      let dt = (now - last) / 1000
      last = now
      if (dt > 0.05) dt = 0.05 // clamp big gaps (tab refocus)
      step(dt)
      render()
      if (DEV) window.__PROMISE_CONFETTI_TICKS__ = (window.__PROMISE_CONFETTI_TICKS__ || 0) + 1
      raf = requestAnimationFrame(loop)
    }
    const start = () => { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop) }
    const stop = () => { if (!running) return; running = false; cancelAnimationFrame(raf); raf = 0 }

    const inView = () => { const r = wrap.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!burstFired) { burstFired = true; fireBurst() } // once per page load
        if (!document.hidden) start()
      } else {
        stop()
      }
    }, { threshold: 0.01 })
    io.observe(wrap)

    const onVis = () => { if (document.hidden) stop(); else if (inView()) start() }
    document.addEventListener('visibilitychange', onVis)
    const onResize = () => { measure() } // keep pieces; just resize the surface
    window.addEventListener('resize', onResize)

    if (DEV) {
      window.__PROMISE_CONFETTI__ = devHook({
        burstFired: () => burstFired,
        refireBurst: () => { for (let i = AMBIENT; i < TOTAL; i++) pool[i].active = false; fireBurst() },
      })
    }

    return () => {
      stop()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      if (DEV) delete window.__PROMISE_CONFETTI__
    }
  }, [reduced])

  return (
    <div className="promise-confetti" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="promise-confetti-canvas" />
    </div>
  )
}
