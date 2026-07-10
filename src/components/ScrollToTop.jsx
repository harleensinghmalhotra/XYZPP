import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { prefersReduced } from '@/lib/useReducedMotion'

const NAV_OFFSET = 86 // fixed SiteNav height — land the anchor just below it

// Native-scroll routes should start at the top on every navigation. In-page
// anchors (e.g. /#process from the "See our process" links) must be driven
// ourselves: the homepage runs on Lenis, which suppresses the browser's native
// hash scroll, so a plain hash never lands. We wait for the target + Lenis to be
// ready, then scroll via Lenis (or natively under reduced motion / inner routes).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const wantsLenis = !prefersReduced()
      let tries = 0
      let raf = 0
      const tick = () => {
        const el = document.getElementById(id)
        if (!el) { if (tries++ < 120) raf = requestAnimationFrame(tick); return }
        const lenis = typeof window !== 'undefined' ? window.__lenis : null
        if (wantsLenis && lenis) { lenis.scrollTo(el, { offset: -NAV_OFFSET }); return }
        if (wantsLenis && tries++ < 90) { raf = requestAnimationFrame(tick); return }
        // reduced-motion, or Lenis never mounted → jump natively
        const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
        window.scrollTo(0, Math.max(0, y))
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
