import { SmoothScrollProvider } from '@/lib/smooth-scroll'
import SiteNav from '@/components/SiteNav'
import Hero from '@/sections/Hero'
import TrustStrips from '@/sections/TrustStrips'
import PrintingServices from '@/sections/PrintingServices'
import Marquee from '@/sections/Marquee'
import BookFan from '@/sections/BookFan'
import PrintPath from '@/sections/PrintPath'
import Quote from '@/sections/Quote'
import Proof from '@/sections/Proof'
import CTAFooter from '@/sections/CTAFooter'

export default function App() {
  return (
    <SmoothScrollProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="relative" style={{ '--video-tone': '#2d2926' }}>
        <span id="top" />
        <Hero />
        <TrustStrips />
        <PrintingServices />
        <Marquee />
        <BookFan />
        <PrintPath />
        <Quote />
        <Proof />
        <CTAFooter />
      </main>
    </SmoothScrollProvider>
  )
}
