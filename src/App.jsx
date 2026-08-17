import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import SiteLayout from '@/components/SiteLayout'
import NotFound from '@/pages/NotFound'

// Every page is route-level code-split, including Home — see
// SEO-ARCH-RECON-2026-08-15.md §4 and the SEO Lane 4 report for why
// (App.jsx statically importing every page shipped the same ~1.16MB bundle
// on every route, including /legal/*). Home was measured both ways (real
// network payloads, not just build-output chunk sizes): lazy costs a
// homepage visit ~0.6KB — noise — because Home's own code still has to be
// fetched either way, just as its own chunk instead of pre-bundled into the
// shared entry; it saves every OTHER route 25-36% (e.g. /contact/: -288KB,
// /legal/privacy/: -401KB), since the shared entry chunk no longer carries
// Home's weight for routes that never render it. Kept lazy — it measured
// better everywhere, not just somewhere. NotFound stays a static import:
// the catch-all shouldn't need a network round-trip.
const Home = lazy(() => import('@/pages/Home'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const OurStory = lazy(() => import('@/pages/OurStory'))
const GlobalMarkets = lazy(() => import('@/pages/GlobalMarkets'))
const PrintOnDemand = lazy(() => import('@/pages/PrintOnDemand'))
const InfrastructurePage = lazy(() => import('@/pages/InfrastructurePage'))
const Newsroom = lazy(() => import('@/pages/Newsroom'))
const NewsroomArticle = lazy(() => import('@/pages/NewsroomArticle'))
const Fulfilment = lazy(() => import('@/pages/Fulfilment'))
const Contact = lazy(() => import('@/pages/Contact'))
// Reconnected in SEO Lane 7/7: both were fully built, current (Phase 3.3
// unified skeleton, same 2026-07-28 SEO/JSON-LD pass as every routed page —
// verified via git log, not assumed), and simply never routed. Previously
// "/educational-books" and "/trade-books" client-redirected to homepage
// anchors; see the Lane 7 report for the shippability assessment.
const EducationalBooks = lazy(() => import('@/pages/EducationalBooks'))
const TradeBooks = lazy(() => import('@/pages/TradeBooks'))

// App is now the routing host, not the scroll stack. Every route renders inside
// <SiteLayout> (nav + footer chrome). The homepage ("/") owns the scroll engine;
// all inner routes are empty brand-System-B shells for now — page designs land later.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />

        <Route path="/about" element={<OurStory />} />
        <Route path="/global-markets" element={<GlobalMarkets />} />
        <Route path="/educational-books" element={<EducationalBooks />} />
        <Route path="/trade-books" element={<TradeBooks />} />
        <Route path="/print-on-demand" element={<PrintOnDemand />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/newsroom" element={<Newsroom />} />
        <Route path="/newsroom/:slug" element={<NewsroomArticle />} />
        <Route path="/fulfilment" element={<Fulfilment />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/legal/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/legal/cookies" element={<LegalPage doc="cookies" />} />
        <Route path="/legal/terms" element={<LegalPage doc="terms" />} />
        <Route path="/legal/accessibility" element={<LegalPage doc="accessibility" />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
