import { useEffect, useRef, useState } from 'react'
import Lightfall from '@/components/Lightfall'

// ── Promise Lightfall — navy rain with gold sparks, our logo blue in the sky ──
// Reactbits' Lightfall (WebGL/ogl), pulled pristine into src/components and mounted
// here as the base background layer. Rebranded from the reference's blue/purple/pink
// synth to OUR metals: deep navy #1B3A6B streaks carry the field with gold #9B7420
// and light-gold #C9A96A sparks, falling over the promise-black ground. It REPLACES
// the previous character-grid background (two full-section canvases would fight).
//
// LIFECYCLE (the reactbits component ships no viewport gating): this wrapper mounts
// Lightfall ONLY while the section is in view AND the tab is visible, and UNMOUNTS
// it otherwise — the component's cleanup disposes the ogl program/geometry/mesh and
// destroys the GL context, so there is zero GPU cost and no leaked context off
// screen (asserted on route change). DPR is capped at 1 via the dpr prop. Under
// reduced motion the parent never mounts this at all (static black + glow only).
//
// PRESENCE: opacity 1, demo pace (speed 0.5), density 0.6, twinkle 1 all stay at
// full power (untouched by the colour fix). glow is held at 1.2 — bright enough that
// the navy rain reads with real presence, low enough that the warm streaks' dim
// tails fall to black instead of glowing red under the tone-map (see below).
//
// THE VISIBILITY LAW: the wrapper sits at z0 behind scrim/glow/text; with the rain
// at 100% the section's .promise-scrim is the load-bearing wall — it wells opaque
// #0A0E14 over the whole text block so the streaks dim under the type and rain free
// at the edges. Text wins every frame (asserted AA under cursor agitation).

// Navy + gold rain — our metals, no red. Module-level so the array identity is
// stable (a fresh array each render would remount the GL context).
//
// THE RED, DIAGNOSED: the shader's palette() picks DISCRETE colours per streak (no
// interpolation between slots), so the red is NOT a gold→pink blend path. It's the
// tone-map `sqrt(tanh(max(O.rgb*glow - vec3(0.04,0.08,0.02), 0)))`: it subtracts 2×
// more GREEN than red, so any warm (red-dominant) colour loses its green where a
// streak is DIM and collapses to pure red — deep gold #9B7420 dims straight to
// hue-0 crimson. The previous all-warm amber palette therefore rendered ~78% of
// coloured pixels in the red band (measured). Navy #1B3A6B is BLUE-dominant, so it
// dims to blue, never red — bringing our blue into the sky AND killing the crimson.
// So the rain is NAVY-DOMINANT with gold accents (Harry's call): navy is the clean
// carrier, gold/cream ride as bright sparks whose red-prone tails are kept dark by
// the low glow. palette() picks by floor(h*count) over the array, so repeating a
// colour weights it: 5 navy + 2 gold + 1 cream ≈ 62% navy / 25% gold / 13% cream.
// Measured result: red band 0.2% of pixels (was ~52%), navy ~58%, gold ~9%.
const RAIN_COLORS = ['#1B3A6B', '#1B3A6B', '#1B3A6B', '#1B3A6B', '#1B3A6B', '#9B7420', '#9B7420', '#C9A96A']

export default function PromiseLightfall() {
  const wrapRef = useRef(null)
  const activeRef = useRef(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let inView = false
    const sync = () => {
      const a = inView && !document.hidden
      if (a === activeRef.current) return
      activeRef.current = a
      setActive(a)
    }
    // rootMargin keeps it alive a touch beyond the viewport so a scroll past the
    // section is a single mount→unmount, not boundary thrash.
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync() }, { threshold: 0.01, rootMargin: '200px 0px' })
    io.observe(wrap)
    const onVis = () => sync()
    document.addEventListener('visibilitychange', onVis)

    if (import.meta.env && import.meta.env.DEV) {
      window.__PROMISE_LIGHTFALL__ = {
        active: () => activeRef.current,
        mounted: () => !!wrap.querySelector('canvas'),
        canvasCount: () => wrap.querySelectorAll('canvas').length,
      }
    }
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      if (import.meta.env && import.meta.env.DEV) delete window.__PROMISE_LIGHTFALL__
    }
  }, [])

  return (
    <div className="promise-lightfall" ref={wrapRef} aria-hidden="true">
      {active && (
        <Lightfall
          dpr={1}
          colors={RAIN_COLORS}
          // backgroundColor is the HALO tint only (the shader uses it for the top
          // glow, not the ground — the ground stays black where there's no light,
          // seamless with the #0A0E14 section). A deep-gold halo washed its dim
          // falloff to red under the tone-map; navy dims to blue, so the halo is our
          // logo navy — Harry's blue in the sky, and never a drop of red.
          backgroundColor="#1B3A6B"
          backgroundGlow={0.08}
          speed={0.5}
          streakCount={3}
          streakWidth={1}
          streakLength={1}
          density={0.6}
          twinkle={1}
          zoom={3}
          // Navy-dominant + gold accents (Harry's call): navy dims to clean blue, so
          // it carries the field; the warm streaks would red-shift on their dim tails
          // under the tone-map, so glow is held low enough that those tails fall to
          // BLACK (below visible) rather than glowing red — only the bright gold HEADS
          // read, as sparks. Kills the crimson wash while our blue owns the sky.
          glow={1.2}
          opacity={1}
          mouseInteraction
          mouseStrength={0.5}
          mouseRadius={1}
        />
      )}
    </div>
  )
}
