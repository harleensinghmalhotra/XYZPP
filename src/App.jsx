import { Routes, Route } from 'react-router-dom'
import SiteLayout from '@/components/SiteLayout'
import Home from '@/pages/Home'
import ShellPage from '@/pages/ShellPage'

// App is now the routing host, not the scroll stack. Every route renders inside
// <SiteLayout> (nav + footer chrome). The homepage ("/") owns the scroll engine;
// all inner routes are empty brand-System-B shells for now — page designs land later.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />

        <Route path="/about" element={<ShellPage title="About" />} />
        <Route path="/educational-books" element={<ShellPage title="Educational Books" />} />
        <Route path="/trade-books" element={<ShellPage title="Trade Books" />} />
        <Route path="/print-on-demand" element={<ShellPage title="Print on Demand" />} />
        <Route path="/infrastructure" element={<ShellPage title="Infrastructure" />} />
        <Route path="/fulfilment" element={<ShellPage title="Fulfilment" />} />
        <Route path="/contact" element={<ShellPage title="Contact" />} />

        <Route path="/legal/privacy" element={<ShellPage title="Privacy Policy" eyebrow="Legal" />} />
        <Route path="/legal/cookies" element={<ShellPage title="Cookie Policy" eyebrow="Legal" />} />
        <Route path="/legal/terms" element={<ShellPage title="Terms of Use" eyebrow="Legal" />} />
        <Route path="/legal/accessibility" element={<ShellPage title="Accessibility Statement" eyebrow="Legal" />} />

        <Route path="*" element={<ShellPage title="Page Not Found" eyebrow="404" />} />
      </Route>
    </Routes>
  )
}
