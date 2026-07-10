import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const TIGHT = "'Inter Tight', sans-serif"

// The three product shells share one "What We Print" menu.
const PRODUCTS = [
  { label: 'Educational Books', to: '/educational-books' },
  { label: 'Trade Books', to: '/trade-books' },
  { label: 'Print on Demand', to: '/print-on-demand' },
]

// Primary route links that follow the What We Print dropdown.
const LINKS = [
  { label: 'Infrastructure', to: '/infrastructure' },
  { label: 'Fulfilment', to: '/fulfilment' },
  { label: 'Contact', to: '/contact' },
]

// The nav floats over sections of both tones. On the homepage it reads the theme
// of whichever section sits under it (IntersectionObserver on [data-theme]) and
// flips ink/paper so it never disappears. On inner pages it defaults light (cream
// System-B ground). The observer is re-armed on every route change so it always
// watches the current page's sections.
export default function SiteNav() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [solid, setSolid] = useState(false)
  const [theme, setTheme] = useState(isHome ? 'dark' : 'light')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    setTheme(isHome ? 'dark' : 'light')

    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setTheme(e.target.dataset.theme || 'dark')
        })
      },
      { rootMargin: '-64px 0px -92% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-theme]').forEach((el) => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [pathname, isHome])

  const light = theme === 'light'
  const fg = light ? 'text-ink' : 'text-white'
  const link = light ? 'text-ink-500 hover:text-ink' : 'text-white/90 hover:text-white'
  const bar = solid ? (light ? 'bg-paper/70 py-3 backdrop-blur-[3px]' : 'bg-[#0f2444]/70 py-3 backdrop-blur-[3px]') : 'py-5'

  const linkCls = `focus-ring text-[16px] font-medium transition-colors duration-300 ${link}`

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto flex max-w-page items-center justify-between px-6 transition-[padding,background-color] duration-300 ease-out ${bar}`}
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
            <Link to="/about" className={linkCls}>About</Link>

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
                What We Print
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
                        {p.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={linkCls}>{l.label}</Link>
            ))}
          </nav>
        </div>

        {/* right group: primary CTA */}
        <div className="flex items-center gap-5">
          <Link
            to="/contact"
            className="focus-ring inline-flex h-[42px] items-center justify-center rounded-full bg-[#c89a3c] px-6 text-[15px] font-semibold text-[#0f2444] transition-all duration-300 hover:bg-[#e6bd6a] hover:scale-[1.02] active:scale-[0.98]"
            style={{ letterSpacing: '0.1px' }}
          >
            Request a Quote
          </Link>
        </div>
      </div>
    </header>
  )
}
