import { useEffect, useRef } from 'react'

// ── Promise Confetti — two-layer celebration, whisper mode ────────────────────
// Architecture lifted (frame-by-frame) from a Dribbble celebration effect and
// rebranded: a PERSISTENT ambient wallpaper of chunky confetti that barely drifts
// (~3px/second — the slowness is the premium), plus a ONE-TIME entry burst whose
// pieces radiate out then SETTLE INTO that same lazy drift (no despawn pop —
// they become permanent wallpaper citizens). One soft moment of arrival, then
// stillness that drifts.
//
// One canvas, one rAF, DPR capped at 1, a pre-allocated piece pool (zero
// allocation per frame). Density is biased to the section's edges and thinned
// behind the text centre (radial rejection). The canvas sits ABOVE the liquid
// ether and BELOW the scrim, so the scrim's opaque core hides any centre piece —
// text contrast can never be touched. Palette is gold/cream/olive/light-gold only.
// Reduced motion: a single frozen scatter, no drift, no burst.

const PALETTE = ['#9B7420', '#FDFAF4', '#6B7A2A', '#C9A96A'] // gold · cream · olive · light-gold
const AMBIENT = 150
const BURST = 50
const TOTAL = AMBIENT + BURST
const DEV = !!(import.meta.env && import.meta.env.DEV)

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
      pool[i] = { x: 0, y: 0, vx: 0, vy: 0, dx: 0, dy: 0, rot: 0, vrot: 0, w: 0, h: 0, r: 0, color: '#fff', alpha: 1, active: false }
    }

    let W = 0, H = 0, cx = 0, cy = 0

    // pieces bucketed by colour index so render sets fillStyle 4×/frame, not 200×
    const buckets = [[], [], [], []]
    function rebuildBuckets() {
      for (let ci = 0; ci < 4; ci++) buckets[ci].length = 0
      for (let i = 0; i < TOTAL; i++) { const pc = pool[i]; if (pc.active) buckets[pc.ci].push(pc) }
    }

    function initPiece(pc) {
      pc.w = rand(6, 14)
      pc.h = pc.w * rand(0.55, 1) // chips a touch rectangular
      pc.ci = (Math.random() * PALETTE.length) | 0
      pc.color = PALETTE[pc.ci]
      pc.alpha = rand(0.5, 0.8) // ≤ 0.8 max
      pc.rot = rand(0, Math.PI * 2)
      pc.vrot = (Math.PI * 2 / rand(60, 90)) * (Math.random() < 0.5 ? -1 : 1) // one rev / 60–90s
      const speed = rand(2.5, 3.5) // px/second — the lazy drift
      const a = rand(0, Math.PI * 2)
      pc.dx = Math.cos(a) * speed
      pc.dy = Math.sin(a) * speed
      pc.vx = pc.dx
      pc.vy = pc.dy
    }

    // centre-sparse radial rejection → biased to the edges, quiet behind the type.
    // If no try is accepted, fall back to the MOST-OUTWARD candidate (never a
    // centre point), so the centre stays reliably sparse.
    function scatter(pc) {
      let bx = cx, by = cy, br = -1
      for (let tries = 0; tries < 10; tries++) {
        const x = Math.random() * W
        const y = Math.random() * H
        const nx = (x - cx) / (W / 2)
        const ny = (y - cy) / (H / 2)
        const r = Math.hypot(nx, ny) // 0 centre → ~1.41 corner
        if (r > br) { br = r; bx = x; by = y }
        if (Math.random() < Math.min(1, r / 1.05)) { pc.x = x; pc.y = y; return }
      }
      pc.x = bx
      pc.y = by
    }

    function measure() {
      const rect = wrap.getBoundingClientRect()
      W = Math.max(1, Math.floor(rect.width))
      H = Math.max(1, Math.floor(rect.height))
      cx = W / 2
      cy = H / 2
      canvas.width = W // DPR capped at 1
      canvas.height = H
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
    }

    function seedAmbient() {
      for (let i = 0; i < AMBIENT; i++) { const pc = pool[i]; initPiece(pc); scatter(pc); pc.active = true }
      for (let i = AMBIENT; i < TOTAL; i++) pool[i].active = false
      rebuildBuckets()
    }

    // the one-time entry burst — pieces launch from a ring AROUND the text block
    // (origin already near the visible zone so the celebration reads), radiate
    // outward, and decelerate into the ambient drift with no snap.
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
        pc.dx = Math.cos(driftA) * driftS // settles to a gentle, mostly-outward drift
        pc.dy = Math.sin(driftA) * driftS
        pc.active = true
      }
      rebuildBuckets()
    }

    // Cheapest possible rotated chip: a direct affine setTransform + fillRect —
    // no save/restore, no path construction. Sharp chunky chips (the Dribbble
    // reference's pieces are rects); rounded paths cost ~15fps at this count.
    function render() {
      ctx.clearRect(0, 0, W, H)
      for (let ci = 0; ci < 4; ci++) {
        const bucket = buckets[ci]
        if (!bucket.length) continue
        ctx.fillStyle = PALETTE[ci] // one string assignment per colour, not per piece
        for (let j = 0; j < bucket.length; j++) {
          const pc = bucket[j]
          const c = Math.cos(pc.rot), s = Math.sin(pc.rot)
          ctx.setTransform(c, s, -s, c, pc.x, pc.y)
          ctx.globalAlpha = pc.alpha
          ctx.fillRect(-pc.w * 0.5, -pc.h * 0.5, pc.w, pc.h)
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1
    }

    function step(dt) {
      const k = 2.6 // velocity → drift approach (burst decel; ambient is a no-op)
      const m = 18
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

    measure()
    seedAmbient()

    // Reduced motion → one frozen scatter, no rAF, no burst.
    if (reduced) {
      render()
      const onResize = () => { measure(); seedAmbient(); render() }
      window.addEventListener('resize', onResize)
      if (DEV) {
        window.__PROMISE_CONFETTI__ = {
          dims: () => ({ W, H }),
          burstFired: () => false,
          sample: () => pool.map((p, i) => ({ x: p.x, y: p.y, active: p.active, color: p.color, ambient: i < AMBIENT })),
          colors: () => pool.map((p) => p.color),
          palette: () => PALETTE.slice(),
          activeCount: () => pool.reduce((n, p) => n + (p.active ? 1 : 0), 0),
        }
      }
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

    // DEV-only hook for the verify harness (stripped from prod builds)
    if (DEV) {
      window.__PROMISE_CONFETTI__ = {
        dims: () => ({ W, H }),
        burstFired: () => burstFired,
        refireBurst: () => { for (let i = AMBIENT; i < TOTAL; i++) pool[i].active = false; fireBurst() },
        sample: () => pool.map((p, i) => ({ x: p.x, y: p.y, active: p.active, color: p.color, ambient: i < AMBIENT })),
        colors: () => pool.map((p) => p.color),
        palette: () => PALETTE.slice(),
        activeCount: () => pool.reduce((n, p) => n + (p.active ? 1 : 0), 0),
      }
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
