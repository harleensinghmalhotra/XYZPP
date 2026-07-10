import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Native-scroll routes should start at the top on every navigation. The homepage
// (Lenis) is destroyed before this fires when leaving "/", and mounts fresh at 0
// when entering "/", so a plain window scroll reset is correct for every route.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useLayoutEffect(() => {
    // A hash means the target wants to land on an in-page anchor (e.g. the hub
    // links to /#certifications), so leave scroll positioning to the browser.
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
