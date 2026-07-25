import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from './useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

const LenisCtx = createContext(null)
export const useSmoothScroll = () => useContext(LenisCtx)

// Lenis drives scroll; GSAP's ticker drives Lenis; ScrollTrigger updates on
// every Lenis frame. One rAF loop, no competing scroll systems (zero-jank rule).
export function SmoothScrollProvider({ children }) {
  const [lenis, setLenis] = useState(null)
  const raf = useRef(null)

  // Reset scroll to the top BEFORE this provider's children (the homepage sections)
  // render and create their ScrollTriggers. When an SPA navigation enters the homepage
  // from an inner page, the window keeps the previous page's scroll position (e.g. the
  // footer, near the bottom) until ScrollToTop re-scrolls. If the sections mount at
  // that large offset, every `once:true` trigger is created already "past" its start,
  // fires and self-kills mid-creation, and leaves an undefined hole in GSAP's global
  // trigger list — the next trigger to refresh then reads `.end` off that hole and
  // crashes, blanking the app (seen on footer/nav links to /#certifications etc.).
  // Starting sections at scroll 0 keeps the trigger list intact; ScrollToTop then
  // scrolls to the hash target. Guarded to once per mount; a no-op on a fresh load
  // (already at top). Also clears any triggers stranded by the page we came from.
  const prepared = useRef(false)
  if (!prepared.current) {
    prepared.current = true
    if (typeof window !== 'undefined' && window.scrollY > 0) window.scrollTo(0, 0)
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }

  useEffect(() => {
    if (prefersReduced()) {
      ScrollTrigger.refresh()
      return
    }
    const l = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    })
    l.on('scroll', ScrollTrigger.update)
    const tick = (time) => l.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    raf.current = tick
    setLenis(l)
    if (typeof window !== 'undefined') window.__lenis = l // for screenshot tooling

    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
      // Leaving the homepage route unmounts this provider. Each section already
      // reverts its own gsap.context on unmount, but killAll() is a hard backstop
      // so no pinned ScrollTrigger can survive onto a native-scroll inner page.
      ScrollTrigger.killAll()
      setLenis(null)
      if (typeof window !== 'undefined') delete window.__lenis
    }
  }, [])

  return <LenisCtx.Provider value={lenis}>{children}</LenisCtx.Provider>
}
