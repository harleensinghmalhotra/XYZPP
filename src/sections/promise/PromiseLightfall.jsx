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
// THE VISIBILITY LAW: the wrapper sits at z0 behind confetti/scrim/glow/text; the
// section's .promise-scrim wells opaque #0A0E14 over the whole text block, so the
// streaks live only at the edges and can never touch the type's contrast. opacity
// is held at 0.8 (0.7–0.85) so the fall stays a warm whisper, not a floodlight.

// Gold rebrand — light gold · deep gold · cream. Nothing else. Module-level so the
// array identity is stable (a fresh array each render would remount the GL context).
const GOLD_THREADS = ['#C9A96A', '#9B7420', '#FDFAF4']

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
          backgroundColor="#0A0E14"
          backgroundGlow={0.25}
          speed={0.35}
          streakCount={3}
          streakWidth={1}
          streakLength={1}
          density={0.5}
          twinkle={0.7}
          zoom={3}
          opacity={0.8}
          mouseInteraction
          mouseStrength={0.3}
          mouseRadius={1}
        />
      )}
    </div>
  )
}
