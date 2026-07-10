import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteNav from '@/components/SiteNav'
import ScrollToTop from '@/components/ScrollToTop'
import CTAFooter from '@/sections/CTAFooter'
import { initAlive } from '@/lib/alive'

// Shared chrome for every route: fixed nav on top, the route's page in the middle,
// and the CTA + footer at the bottom. CTAFooter is now the site-wide footer (it
// used to live inside the homepage stack). Lenis, when mounted by the homepage
// route, drives window scroll, so the footer still scrolls smoothly on "/".
export default function SiteLayout() {
  const { pathname } = useLocation()
  // Re-arm the alive runtime after each route swaps its content in. A frame's
  // delay lets the new page mount before we query [data-reveal]/[data-textreveal].
  useEffect(() => {
    let cleanup = () => {}
    const id = requestAnimationFrame(() => { cleanup = initAlive() })
    return () => { cancelAnimationFrame(id); cleanup() }
  }, [pathname])

  return (
    <>
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <SiteNav />
      <Outlet />
      <CTAFooter />
    </>
  )
}
