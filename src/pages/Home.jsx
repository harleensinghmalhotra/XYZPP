import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import { SmoothScrollProvider } from '@/lib/smooth-scroll'
import { prefersReduced } from '@/lib/useReducedMotion'
import Hero from '@/sections/Hero'
import TrustStrips from '@/sections/TrustStrips'
import GlobeReach from '@/sections/GlobeReach'
import WhatWePrint from '@/sections/WhatWePrint'
import Marquee from '@/sections/Marquee'
import Promise from '@/sections/Promise'
import Process3D from '@/sections/process3d/Process3D'
import Projects from '@/sections/Projects'
import Infrastructure from '@/sections/Infrastructure'
import Certifications from '@/sections/Certifications'
import Sustainability from '@/sections/Sustainability'
import Awards from '@/sections/Awards'
import Cases from '@/sections/Cases'
import { SHOW_CASE_STUDIES } from '@/lib/compliance'

// ── What We Print anchor scroll ──────────────────────────────────────────────
// The client's exact target: the "Formats and Categories" heading sits flush
// under the sticky nav — section top pinned to the nav's bottom edge, no overshoot
// past the heading, no undershoot showing the section above. The math below is the
// single source of truth; SiteNav uses the IDENTICAL routine for its own re-click
// path so a label click and a cross-route hash always land in the same place.

// Live nav height — measured, not hardcoded (locale/zoom/wrap-proof). Falls back
// to the 86px design height if the header isn't in the DOM yet.
export function wwpNavHeight() {
  const header = document.querySelector('header[role="banner"]')
  return header ? header.getBoundingClientRect().height : 86
}

// Scroll so #what-we-print's top sits exactly under the nav. For a per-card anchor
// (cardId = "wwp-<key>") the VERTICAL position is identical to the label target —
// only the horizontal row is scrolled to bring the card into view (no vertical
// drift, which scrollIntoView(block:'nearest') would introduce). Returns false if
// the section isn't in the DOM yet, so callers can retry.
export function scrollToWwp(cardId, reduced) {
  const section = document.getElementById('what-we-print')
  if (!section) return false

  const behavior = reduced ? 'auto' : 'smooth'
  const navH = wwpNavHeight()
  const y = Math.max(0, window.scrollY + section.getBoundingClientRect().top - navH)

  // Use the page's own Lenis instance when it's running so we cooperate with the
  // smooth-scroll engine; fall back to native scrollTo (reduced-motion / no Lenis).
  const lenis = typeof window !== 'undefined' ? window.__lenis : null
  if (lenis) lenis.scrollTo(y, { immediate: reduced, force: true })
  else window.scrollTo({ top: y, behavior })

  // Horizontal: center the target card in the row without touching page scroll.
  if (cardId) {
    const card = document.getElementById(cardId)
    const vp = document.querySelector('.wwp-viewport')
    if (card && vp) {
      const cardRect = card.getBoundingClientRect()
      const vpRect = vp.getBoundingClientRect()
      const left = Math.max(
        0,
        vp.scrollLeft + cardRect.left - vpRect.left - (vp.clientWidth - cardRect.width) / 2,
      )
      vp.scrollTo({ left, behavior })
    }
  }
  return true
}

// True once the section top has actually settled under the nav (within 2px).
function wwpLanded() {
  const section = document.getElementById('what-we-print')
  if (!section) return false
  const top = section.getBoundingClientRect().top
  const navH = wwpNavHeight()
  return top <= navH + 2 && top >= navH - 2
}

// The homepage owns the entire scroll engine. SmoothScrollProvider (Lenis + GSAP
// ScrollTrigger) lives INSIDE this route only: it boots when "/" mounts and fully
// tears down (Lenis destroy + ScrollTrigger.killAll) when navigating away, so no
// pin ever leaks onto a native-scroll inner page.
//
// Section order (client reorder, lane 7 → 7c → 7d → 9 — LAW):
//   • TrustStrips rides directly under the Hero — the two are a designed PAIR.
//     The hero's open book deliberately overhangs its section bottom and
//     TrustStrips receives it with reserved top padding (ts-band, 115px): the
//     book lands ON the strips. (7c welded them back after lane 7 split them.)
//   • 9 (fresh client meeting): WhatWePrint moves BACK ABOVE GlobeReach —
//     reversing 7d. TrustStrips → WhatWePrint (light band → WWP header, seamless),
//     WhatWePrint → GlobeReach (cream → navy flat edge). This is the final order.
//   • 7e (Harry): the four-stat bar lives INSIDE TrustStrips as its third strip
//     (countries ticker → institutions ticker → stats = one welded unit under the
//     hero). No standalone stats block here.
// HARD CONSTRAINT preserved: Process3D stays immediately before Projects — the
// conveyor's exit melt is tuned to Projects' navy top. Everything else keeps its
// prior relative order.
export default function Home() {
  const { t } = useTranslation('home')
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return

    const scrollTarget = hash.replace('#', '')
    const reduced = prefersReduced()
    const isWwp = scrollTarget === 'what-we-print' || scrollTarget.startsWith('wwp-')

    // Non-WWP anchors keep their plain scrollIntoView (scroll-margin-top on each
    // section clears the nav for those).
    if (!isWwp) {
      const run = () => document.getElementById(scrollTarget)?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      })
      if (reduced) requestAnimationFrame(run)
      else setTimeout(run, 100)
      return
    }

    // WWP anchor: land the heading flush under the nav with exact math. The heavy
    // homepage may not have laid out (cross-route) and images load beneath us, so
    // poll and re-correct until the section top actually settles under the nav,
    // then do one final settle-recheck (~300ms) after fonts/images finish.
    const cardId = scrollTarget === 'what-we-print' ? null : scrollTarget
    let cancelled = false
    let tries = 0
    const timers = []
    const recheck = () => timers.push(setTimeout(() => {
      if (!cancelled) scrollToWwp(cardId, reduced)
    }, reduced ? 0 : 300))

    const step = () => {
      if (cancelled) return
      tries += 1
      if (scrollToWwp(cardId, reduced) && wwpLanded()) {
        recheck()
        return
      }
      if (tries < 12) timers.push(setTimeout(step, reduced ? 40 : 200))
      else recheck()
    }
    timers.push(setTimeout(step, reduced ? 0 : 100))

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [hash])

  return (
    <SmoothScrollProvider>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <main id="main" className="home-palette relative" style={{ '--video-tone': '#0e1b46' }}>
        <span id="top" />
        <Hero />
        <TrustStrips />
        <WhatWePrint />
        <GlobeReach />
        <Promise />
        <Process3D />
        <Projects />
        <Infrastructure />
        <Certifications />
        <Marquee />
        <Sustainability />
        <Awards />
        {/* Cases hidden on client instruction — see SHOW_CASE_STUDIES in
            lib/compliance.js. Component preserved for the Infrastructure rebuild. */}
        {SHOW_CASE_STUDIES && <Cases />}
      </main>
    </SmoothScrollProvider>
  )
}
