import { useEffect, useRef, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteNav from '@/components/SiteNav'
import ScrollToTop from '@/components/ScrollToTop'
import CTAFooter from '@/sections/CTAFooter'
import CookieBanner from '@/components/CookieBanner'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import { initAlive } from '@/lib/alive'

// Shared chrome for every route: fixed nav on top, the route's page in the middle,
// and the CTA + footer at the bottom. CTAFooter is now the site-wide footer (it
// used to live inside the homepage stack). Lenis, when mounted by the homepage
// route, drives window scroll, so the footer still scrolls smoothly on "/".
export default function SiteLayout() {
  const { pathname } = useLocation()
  const contentRef = useRef(null)

  // Re-arm the alive runtime once the route's actual content is in the DOM —
  // NOT on every pathname change. Pathname changes the instant navigation
  // starts, before a lazy page's chunk has resolved; the old
  // useEffect(..., [pathname]) + one-rAF-frame delay fired on that same
  // instant, so on a lazy route it queried [data-reveal] against whatever the
  // *previous* page (or nothing) had left in the DOM, found nothing to arm,
  // and nothing ever re-armed it once the real content actually mounted —
  // reveals would have silently never fired on any lazy route. A
  // MutationObserver on the route-content wrapper (mounted once, not keyed to
  // pathname) catches the real signal directly: the DOM actually changed.
  // Debounced onto a single rAF per burst of mutations so a page's own
  // internal re-renders don't re-arm repeatedly.
  useEffect(() => {
    const el = contentRef.current
    if (!el || typeof MutationObserver === 'undefined') return
    let cleanup = () => {}
    let frame = null
    const rearm = () => {
      frame = null
      cleanup()
      cleanup = initAlive()
    }
    const mo = new MutationObserver(() => {
      if (frame == null) frame = requestAnimationFrame(rearm)
    })
    mo.observe(el, { childList: true, subtree: true })
    // Arm immediately too, for the very first paint (covers Home, which is
    // eager and already in the DOM by the time this effect runs).
    frame = requestAnimationFrame(rearm)
    return () => {
      mo.disconnect()
      if (frame != null) cancelAnimationFrame(frame)
      cleanup()
    }
    // Intentionally no deps beyond mount: the observer itself reacts to DOM
    // changes, which is what actually needs to trigger a re-arm — re-running
    // this effect per pathname would just tear down and recreate the same
    // observer on the same never-unmounted element for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <SiteNav />
      {/* Below 1024px the header is position:fixed (it hides on scroll-down / reveals on
          scroll-up — see SiteNav.jsx + MobileNav.css). This spacer reserves its 87px so
          page content starts in the exact same place → zero layout shift. Hidden at
          >=1024px, where the header stays in normal flow. */}
      <div className="site-header-spacer" aria-hidden="true" />
      {/* CTAFooter is INSIDE this boundary with Outlet, not after it — this is
          the fix, not an implementation detail. A first pass with only
          <Outlet/> wrapped reproduced a real ~0.90-0.97 CLS regression on
          every inner route (measured directly, not assumed): the footer,
          left eager, painted immediately assuming zero-height route content
          beneath the nav, then physically jumped down once the lazy page
          chunk resolved and inserted real content above it — CLS penalizes
          exactly that class of already-painted-element movement. Grouping
          footer with the page content means neither renders until both can,
          so the page goes straight from [nav only] to [nav+content+footer]
          in one paint — nothing already visible ever has to move.
          FloatingWhatsApp/CookieBanner stay outside deliberately: they're
          position:fixed (never in document flow, so nothing else has to move
          when they mount) and are shared chrome, not per-route content — see
          the Lane 4 report's explicit "don't lazy-load shared chrome" scope. */}
      <div ref={contentRef}>
        <Suspense fallback={null}>
          <Outlet />
          <CTAFooter />
        </Suspense>
      </div>
      <FloatingWhatsApp />
      <CookieBanner />
    </>
  )
}
