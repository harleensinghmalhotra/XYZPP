import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import { SmoothScrollProvider } from '@/lib/smooth-scroll'
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
