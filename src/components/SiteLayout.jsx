import { Outlet } from 'react-router-dom'
import SiteNav from '@/components/SiteNav'
import ScrollToTop from '@/components/ScrollToTop'
import CTAFooter from '@/sections/CTAFooter'

// Shared chrome for every route: fixed nav on top, the route's page in the middle,
// and the CTA + footer at the bottom. CTAFooter is now the site-wide footer (it
// used to live inside the homepage stack). Lenis, when mounted by the homepage
// route, drives window scroll, so the footer still scrolls smoothly on "/".
export default function SiteLayout() {
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
