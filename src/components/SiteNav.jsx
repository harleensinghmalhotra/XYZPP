import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/components/LanguageToggle'

const TIGHT = "'Inter Tight', sans-serif"
const INTER = "'Inter', sans-serif"

// The three product shells share one "What We Print" menu. Labels resolve through
// the nav namespace so the dropdown follows the active language.
const PRODUCTS = [
  { key: 'educationalBooks', to: '/educational-books' },
  { key: 'tradeBooks', to: '/trade-books' },
  { key: 'printOnDemand', to: '/print-on-demand' },
]

// Primary route links that follow the What We Print dropdown.
const LINKS = [
  { key: 'infrastructure', to: '/infrastructure' },
  { key: 'fulfilment', to: '/fulfilment' },
  { key: 'contact', to: '/contact' },
]

// EKTA HEADER — rebuilt to her exact anatomy (qfp-homepage-v17.html):
// a SOLID opaque cream bar, 86px tall, sticky at the top, faint navy hairline +
// soft shadow. No transparency, no glass, no per-route theme-flip — the header is
// the same solid cream chrome on every page (over the dark hero too, exactly as
// she wants). Logo = 48px QF monogram + two-line Inter-Tight-700 wordmark. Nav
// links carry her center-growing gold underline (.qnav-link). CTA = square navy
// ghost button that fills navy on hover.
export default function SiteNav() {
  const { pathname } = useLocation()
  const { t } = useTranslation('nav')
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the What-We-Print dropdown whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <header
      className="sticky top-0 z-[200] border-b border-[#0f2444]/[0.08] bg-[#fdfaf4]"
      style={{ boxShadow: '0 2px 24px rgba(15,36,68,0.06)' }}
    >
      <div
        className="mx-auto flex h-[86px] max-w-page items-center justify-between px-6 sm:px-10 lg:px-14"
        style={{ fontFamily: TIGHT }}
      >
        {/* logo lockup — 48px monogram + two-line wordmark, all navy */}
        <Link to="/" className="focus-ring flex items-center gap-3" aria-label="Quarterfold Printabilities home">
          <img src="/qfp/brand/qfp-mark.png" alt="" aria-hidden="true" width="48" height="48" className="h-12 w-12 shrink-0 object-contain" />
          <span className="hidden flex-col leading-[1.06] text-[#0f2444] sm:flex">
            <span className="text-[16px] font-bold tracking-[0.2px]">Quarterfold</span>
            <span className="text-[16px] font-bold tracking-[0.2px]">Printabilities</span>
          </span>
        </Link>

        {/* center nav */}
        <nav className="hidden items-center gap-9 lg:flex">
          <Link to="/about" className="qnav-link">{t('about')}</Link>

          {/* What We Print — dropdown to the three product shells */}
          <div
            className="relative"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            onFocus={() => setMenuOpen(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false) }}
          >
            <button
              type="button"
              className="qnav-link inline-flex items-center gap-1.5"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {t('whatWePrint')}
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}>
                <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full pt-4">
                {/* solid cream popover, navy hairline, soft shadow — her dropdown */}
                <div className="min-w-[220px] rounded-[var(--radius-md)] border border-[#0f2444]/10 bg-[#fdfaf4] p-2 shadow-[0_16px_48px_rgba(15,36,68,0.14)]">
                  {PRODUCTS.map((p) => (
                    <Link
                      key={p.to}
                      to={p.to}
                      className="focus-ring block rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium text-[#1c2019]/85 transition-[colors,padding] duration-200 hover:bg-[#9b7420]/[0.08] hover:pl-6 hover:text-[#836013]"
                      style={{ fontFamily: INTER }}
                    >
                      {t(p.key)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="qnav-link">{t(l.key)}</Link>
          ))}
        </nav>

        {/* right group: language toggle + square ghost CTA */}
        <div className="flex items-center gap-4">
          <LanguageToggle light />
          {/* Square navy ghost button — fills navy on hover (Ekta's .nav-cta). */}
          <Link
            to="/contact"
            className="btn-nebula btn-nebula--light focus-ring hidden items-center gap-1.5 border-[1.5px] border-[#0f2444] px-[22px] py-[10px] text-[13px] font-medium text-[#0f2444] transition-colors duration-200 hover:bg-[#0f2444] hover:text-[#fdfaf4] sm:inline-flex"
            style={{ fontFamily: INTER, letterSpacing: '0.3px' }}
          >
            {t('requestQuote')}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
