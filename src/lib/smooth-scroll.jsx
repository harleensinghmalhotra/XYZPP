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
      setLenis(null)
      if (typeof window !== 'undefined') delete window.__lenis
    }
  }, [])

  return <LenisCtx.Provider value={lenis}>{children}</LenisCtx.Provider>
}
