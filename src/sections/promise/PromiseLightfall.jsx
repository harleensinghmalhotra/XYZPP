import { useEffect, useRef, useState } from 'react'
import Lightfall from '@/components/Lightfall'

// ── Promise Lightfall — molten foil threads falling through a printer's night ──
// Reactbits' Lightfall (WebGL/ogl), pulled pristine into src/components and mounted
// here as the base background layer. Rebranded from the reference's blue/purple/pink
// synth to gold-on-night: light gold, deep gold and cream streaks falling like foil
// threads coming off a press, over the promise-black ground. It REPLACES the
// previous character-grid background (two full-section canvases would fight).
//
// LIFECYCLE (the reactbits component ships no viewport gating): this wrapper mounts
// Lightfall ONLY while the section is in view AND the tab is visible, and UNMOUNTS
// it otherwise — the component's cleanup disposes the ogl program/geometry/mesh and
// destroys the GL context, so there is zero GPU cost and no leaked context off
// screen (asserted on route change). DPR is capped at 1 via the dpr prop. Under
// reduced motion the parent never mounts this at all (static black + glow only).
//
// FULL POWER (matches the reference demo's presence, our colours): opacity 1, the
// demo's top-glow halo (backgroundGlow 0.5) and demo pace (speed 0.5) so the gold
// streaks visibly RAIN, dense from the top with bright heads and long glowing tails.
// The demo's blue/purple/pink becomes molten gold rain on night — same energy.
//
// THE VISIBILITY LAW: the wrapper sits at z0 behind scrim/glow/text; with the rain
// at 100% the section's .promise-scrim is the load-bearing wall — it wells opaque
// #0A0E14 over the whole text block so the streaks dim under the type and rain free
// at the edges. Text wins every frame (asserted AA under cursor agitation).

// Molten-gold rain — bright amber head · light gold · deep gold. Module-level so
// the array identity is stable (a fresh array each render would remount the GL
// context). NOTE: these are the WARM, low-blue tuning of the brief's gold trio
// (#C9A96A / #9B7420 / #FDFAF4). The reference shader tone-maps with a green
// subtraction (`- vec3(0.04,0.08,0.02)`), so any colour carrying blue turns
// magenta/purple where a streak is dim — the brief's cream and light-gold both did
// this on their tails. Pulling the palette to red-dominant amber keeps the rain
// gold at EVERY brightness — "our colours, nothing else" (no blue, no purple).
const GOLD_THREADS = ['#F4C25A', '#C9A24A', '#9B7420']

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
          colors={GOLD_THREADS}
          // backgroundColor is the HALO tint (the shader only uses it for the top
          // glow, not the ground). The brief wants "the demo's top-glow halo, ours
          // in warm gold instead of blue" — but #0A0E14 tone-maps to blue-lavender.
          // So the halo is set to our deep gold (a brief colour): a warm gold halo,
          // ground stays black (seamless with the #0A0E14 section) since the shader
          // outputs black where there is no light.
          backgroundColor="#9B7420"
          backgroundGlow={0.5}
          speed={0.5}
          streakCount={3}
          streakWidth={1}
          streakLength={1}
          density={0.6}
          twinkle={1}
          zoom={3}
          // glow 1 (demo) left the tails dim enough to purple under the tone-map and
          // the rain reading thin; 1.6 keeps streaks bright gold with hot heads and
          // long glowing tails — the demo's full-volume presence, our metal.
          glow={1.6}
          opacity={1}
          mouseInteraction
          mouseStrength={0.5}
          mouseRadius={1}
        />
      )}
    </div>
  )
}
