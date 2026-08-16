import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import { CARDS as WWP_CARDS } from '@/sections/WhatWePrint'
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
// legal name, public contact point, live social profiles. No ratings, prices, or
// staff counts.
//
// Address: this is the SANPADA "Head Office" — the address shown on /contact and
// in the footer's visible address block, with its own Google Maps link, i.e. the
// one an actual visitor or a Google Business Profile would use. It deliberately
// does NOT match the registered/legal office (Vashi, CIN U74999MH2020PTC337494),
// which stays exactly where it's legally required to be: the footer's statutory
// entity line (CTAFooter.jsx) and the legal-policy pages. Prior to SEO Lane 6 this
// schema block carried the Vashi address instead — a real NAP mismatch flagged in
// SEO-RECON-2026-08-15.md §9 and independently confirmed by the claude-seo audit
// (seo-local). See LANE6-SCHEMA-ROBOTS-SITEMAP report for the before/after.
// No `geo` (GeoCoordinates): the only coordinates in the repo (GlobeFlyTo.jsx's
// map markers) are approximate decorative globe-marker positions, are labelled
// for a DIFFERENT location (Vashi, not Sanpada), and don't meet the 5-decimal
// precision a real geo claim needs — inventing one was ruled out on purpose.
// No `telephone`/`geo`-equivalent added beyond what's already below: the phone
// number here is the same one displayed on /contact.
const ORG_ID = 'https://quarterfoldltd.com/#organization'
const HOME_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Quarterfold Printabilities Private Limited',
    alternateName: 'Quarterfold Printabilities',
    url: 'https://quarterfoldltd.com/',
    logo: 'https://quarterfoldltd.com/qfp/brand/qfp-logo.png',
    description:
      'Large scale educational and trade book printing, binding and fulfillment company based in Navi Mumbai, India, exporting to publishers, ministries and NGOs across 25+ countries.',
    foundingDate: '2014',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Plot No. 31, Sector 22, Sanpada',
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
    // Both live, footer-linked accounts (CTAFooter.jsx `socials`) — LinkedIn and
    // Facebook are deliberately absent site-wide, so they're absent here too.
    sameAs: [
      'https://www.instagram.com/quarterfold_printabilities/',
      'https://www.youtube.com/@quarterfoldprintabilities6000',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Quarterfold Printabilities',
    url: 'https://quarterfoldltd.com/',
    inLanguage: ['en', 'fr', 'es'],
    // @id reference, not a second disconnected Organization stub -- lets Google
    // merge this into the one Organization node above instead of two entities.
    publisher: { '@id': ORG_ID },
  },
]

// ── Service entities for the ten named print categories (WhatWePrint.jsx's own
// CARDS list, "Content is LAW" per that file) — every name/description below is
// that same component's own copy via the homeWwp namespace, read live so the
// schema always matches whatever language is actually on screen (the same
// pattern Contact.jsx's FAQPage block already uses). No invented claims: no
// areaServed beyond what a category's own line already states, no pricing (a
// quote-based B2B business has none to state), no serviceType beyond the plain,
// obviously-true category of business this whole site describes.
function wwpServicesJsonLd(t) {
  return WWP_CARDS.map(({ key }) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Book printing and manufacturing',
    name: t(`cards.${key}.name`, { ns: 'homeWwp' }),
    description: t(`cards.${key}.line`, { ns: 'homeWwp' }),
    provider: { '@id': ORG_ID },
  }))
}

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
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={[...HOME_JSONLD, ...wwpServicesJsonLd(t)]} />
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
