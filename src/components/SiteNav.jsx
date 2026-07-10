import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/components/LanguageToggle'

const TIGHT = "'Inter Tight', sans-serif"

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

// The nav floats over sections of both tones. On the homepage it reads the theme
// of whichever section sits under it (IntersectionObserver on [data-theme]) and
// flips ink/paper so it never disappears. On inner pages it defaults light (cream
// System-B ground). The observer is re-armed on every route change so it always
// watches the current page's sections.
// The nav now scrolls away with the page (position: absolute, not fixed), so it
// only ever sits over each route's FIRST section. That makes the theme a pure
// per-route default keyed to that first section's tone — no scroll-flip observer
// and no scroll-triggered solid bar needed. Update this map if a page's first
// section changes tone.
const THEME_BY_ROUTE = {
  '/': 'dark',
  '/about': 'dark',
  '/educational-books': 'light',
  '/trade-books': 'light',
  '/print-on-demand': 'light',
  '/infrastructure': 'dark',
  '/fulfilment': 'dark',
  '/contact': 'dark',
}

export default function SiteNav() {
  const { pathname } = useLocation()
  const { t } = useTranslation('nav')
  const theme = THEME_BY_ROUTE[pathname] || 'light' // legal / shell routes are cream
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the What-We-Print dropdown whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const light = theme === 'light'
  const fg = light ? 'text-ink' : 'text-white'
  const link = light ? 'text-ink-500 hover:text-ink' : 'text-white/90 hover:text-white'

  const linkCls = `focus-ring nav-link text-[16px] font-medium transition-colors duration-300 ${link}`

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div
        className="mx-auto flex max-w-page items-center justify-between px-6 py-8"
        style={{ fontFamily: TIGHT }}
      >
        {/* left group: logo + primary links */}
        <div className="flex items-center gap-10">
          <Link to="/" className={`focus-ring flex items-center transition-colors duration-300 ${fg}`} aria-label="Quarterfold Printabilities home">
            {/* On light sections the logo sits bare; on dark sections it rides a
                cream chip so every letterform stays readable. */}
            {light ? (
              <img src="/qfp/brand/qfp-logo.png" alt="Quarterfold Printabilities" className="h-auto w-[150px]" />
            ) : (
              <span className="inline-flex items-center rounded-[10px] bg-[#fdfaf4] px-3 py-[7px] shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
                <img src="/qfp/brand/qfp-logo.png" alt="Quarterfold Printabilities" className="h-auto w-[132px]" />
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/about" className={linkCls}>{t('about')}</Link>

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
                className={`${linkCls} inline-flex items-center gap-1.5`}
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
                <div className="absolute left-0 top-full pt-3">
                  <div className="min-w-[220px] rounded-2xl bg-[#fdfaf4] p-2 shadow-[0_12px_40px_rgba(15,36,68,0.22)] ring-1 ring-[#0f2444]/10">
                    {PRODUCTS.map((p) => (
                      <Link
                        key={p.to}
                        to={p.to}
                        className="focus-ring block rounded-xl px-4 py-2.5 text-[15px] font-medium text-[#1c2019]/85 transition-colors hover:bg-[#0f2444]/[0.05] hover:text-[#836013]"
                      >
                        {t(p.key)}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={linkCls}>{t(l.key)}</Link>
            ))}
          </nav>
        </div>

        {/* right group: language toggle + primary CTA */}
        <div className="flex items-center gap-4">
          <LanguageToggle light={light} />
          {/* Metallic gold pill: foil gradient + inset highlight + warm glow, with a
              light sheen that sweeps across on hover (luxury, not loud). */}
          <Link
            to="/contact"
            className="focus-ring group relative inline-flex h-[42px] items-center justify-center overflow-hidden rounded-full px-6 text-[15px] font-semibold text-[#0f2444] transition-[transform,box-shadow] duration-300 ease-out hover:scale-[1.03] hover:shadow-[inset_0_1px_0_rgba(255,247,224,0.85),inset_0_-2px_3px_rgba(120,85,20,0.45),0_8px_22px_-4px_rgba(200,154,60,0.7)] active:scale-[0.98]"
            style={{
              letterSpacing: '0.1px',
              background: 'linear-gradient(180deg,#f0cd82 0%,#d8a94a 46%,#c89a3c 72%,#a97e28 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,247,224,0.7), inset 0 -2px 3px rgba(120,85,20,0.4), 0 4px 14px -3px rgba(200,154,60,0.55)',
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -translate-x-[220%] skew-x-[-20deg] transition-transform duration-700 ease-out group-hover:translate-x-[520%]"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,250,235,0.65),transparent)' }}
            />
            <span className="relative">{t('requestQuote')}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
