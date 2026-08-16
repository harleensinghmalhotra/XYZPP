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
import ProcessVideo from '@/sections/ProcessVideo'
import TrustBelt from '@/sections/TrustBelt'
import Projects from '@/sections/Projects'
import Infrastructure from '@/sections/Infrastructure'
import Certifications from '@/sections/Certifications'
import Sustainability from '@/sections/Sustainability'
import Awards from '@/sections/Awards'
import Cases from '@/sections/Cases'
import { SHOW_CASE_STUDIES } from '@/lib/compliance'
import { wwpNavHeight, scrollToWwp } from '@/lib/wwp-scroll'

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
// Section order (approved layout):
//   • TrustStrips rides directly under the Hero — the two are a designed PAIR.
//     The hero's open book deliberately overhangs its section bottom and
//     TrustStrips receives it with reserved top padding (ts-band, 115px): the
//     book lands ON the strips.
//   • WhatWePrint sits above GlobeReach. TrustStrips → WhatWePrint (light band →
//     WWP header, seamless), WhatWePrint → GlobeReach (cream → navy flat edge).
//   • The four-stat bar lives INSIDE TrustStrips as its third strip (countries
//     ticker → institutions ticker → stats = one welded unit under the hero).
//     No standalone stats block here.
// The "How We Work" video (ProcessVideo) sits just after Certifications, near the
// closing CTA/footer, and its 7-step illustrated exhibit is hidden
// (SHOW_PROCESS_EXHIBIT in ProcessVideo.jsx) so only the heading + video remain.

// ── Site-level JSON-LD (Organization + WebSite) — emitted on the homepage only,
// the single canonical Organization node for the whole site. Language-independent,
// so it lives at module scope. Every value here is true on the page / of record:
// legal name, registered office, public contact point. No ratings, prices, staff
// counts or unverified social profiles (the footer's social icons are placeholders).
const HOME_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Quarterfold Printabilities Private Limited',
    alternateName: 'Quarterfold Printabilities',
    url: 'https://quarterfoldltd.com/',
    logo: 'https://quarterfoldltd.com/qfp/brand/qfp-logo.png',
    description:
      'Large scale educational and trade book printing, binding and fulfillment company based in Navi Mumbai, India, exporting to publishers, ministries and NGOs across 25+ countries.',
    foundingDate: '2014',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Office No 1207, Plot No 4 & 6, Sector 30A, Cyber One IT Park, Vashi',
      addressLocality: 'Navi Mumbai',
      addressRegion: 'Maharashtra',
      postalCode: '400703',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-82-9199-9922',
      email: 'info@quarterfoldltd.com',
      contactType: 'sales',
      availableLanguage: ['English', 'French', 'Spanish'],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Quarterfold Printabilities',
    url: 'https://quarterfoldltd.com/',
    inLanguage: ['en', 'fr', 'es'],
    publisher: { '@type': 'Organization', name: 'Quarterfold Printabilities Private Limited' },
  },
]

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
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={HOME_JSONLD} />
      <main id="main" className="home-palette relative" style={{ '--video-tone': '#030C31' }}>
        <span id="top" />
        <Hero />
        <TrustStrips />
        <WhatWePrint />
        <GlobeReach />
        <Promise />
        <Projects />
        <Infrastructure />
        {/* flatBottom: the navy sweep-arc is suppressed because the "How We Work" video
            (a cream section) now follows Certifications instead of the navy Marquee. */}
        <Certifications flatBottom />
        {/* HOW WE WORK video — sits after the Certifications section, near the
            closing CTA/footer. */}
        <ProcessVideo />
        <TrustBelt />
        <Marquee />
        <Sustainability />
        <Awards />
        {/* Cases gated off — see SHOW_CASE_STUDIES in
            lib/compliance.js. Component preserved for reuse in Infrastructure. */}
        {SHOW_CASE_STUDIES && <Cases />}
      </main>
    </SmoothScrollProvider>
  )
}
