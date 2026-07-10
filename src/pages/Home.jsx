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

// The homepage owns the entire scroll engine. SmoothScrollProvider (Lenis + GSAP
// ScrollTrigger) lives INSIDE this route only: it boots when "/" mounts and fully
// tears down (Lenis destroy + ScrollTrigger.killAll) when navigating away, so no
// pin ever leaks onto a native-scroll inner page. Section order is unchanged from
// the pre-router stack; only CTAFooter moved up to SiteLayout as the site footer.
export default function Home() {
  const { t } = useTranslation('home')
  return (
    <SmoothScrollProvider>
      <Seo title={t('seo.title')} description={t('seo.description')} />
      <main id="main" className="relative" style={{ '--video-tone': '#12294c' }}>
        <span id="top" />
        <Hero />
        <TrustStrips />
        <GlobeReach />
        <WhatWePrint />
        <Promise />
        <Process3D />
        <Projects />
        <Infrastructure />
        <Certifications />
        <Marquee />
        <Sustainability />
        <Awards />
        <Cases />
      </main>
    </SmoothScrollProvider>
  )
}
