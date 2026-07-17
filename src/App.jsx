import { Routes, Route } from 'react-router-dom'
import SiteLayout from '@/components/SiteLayout'
import Home from '@/pages/Home'
import ShellPage from '@/pages/ShellPage'
import OurStory from '@/pages/OurStory'
import Founder from '@/pages/Founder'
import GlobalMarkets from '@/pages/GlobalMarkets'
import EducationalBooks from '@/pages/EducationalBooks'
import PrintOnDemand from '@/pages/PrintOnDemand'
import TradeBooks from '@/pages/TradeBooks'
import InfrastructurePage from '@/pages/InfrastructurePage'
import Fulfilment from '@/pages/Fulfilment'
import Contact from '@/pages/Contact'
import NotFound from '@/pages/NotFound'

// App is now the routing host, not the scroll stack. Every route renders inside
// <SiteLayout> (nav + footer chrome). The homepage ("/") owns the scroll engine;
// all inner routes are empty brand-System-B shells for now — page designs land later.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />

        <Route path="/about" element={<OurStory />} />
        <Route path="/founder" element={<Founder />} />
        <Route path="/global-markets" element={<GlobalMarkets />} />
        <Route path="/educational-books" element={<EducationalBooks />} />
        <Route path="/trade-books" element={<TradeBooks />} />
        <Route path="/print-on-demand" element={<PrintOnDemand />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/fulfilment" element={<Fulfilment />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/legal/privacy" element={<ShellPage title="Privacy Policy" eyebrow="Legal" />} />
        <Route path="/legal/cookies" element={<ShellPage title="Cookie Policy" eyebrow="Legal" />} />
        <Route path="/legal/terms" element={<ShellPage title="Terms of Use" eyebrow="Legal" />} />
        <Route path="/legal/accessibility" element={<ShellPage title="Accessibility Statement" eyebrow="Legal" />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
