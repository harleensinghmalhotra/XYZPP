import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/components/LanguageToggle'
import { prefersReduced } from '@/lib/useReducedMotion'
import { scrollToWwp } from '@/pages/Home'

const TIGHT = "'Inter Tight', sans-serif"
const INTER = "'Inter', sans-serif"

// Home.jsx owns the hash → scroll effect and fires whenever the hash CHANGES
// (cross-route mount, or same-page navigation to a new hash) — landing the WWP
// heading flush under the nav via scrollToWwp(). The one case its effect can't
// see is a re-click of the anchor we're ALREADY on (hash unchanged → the effect
// doesn't refire), so we run the IDENTICAL scroll routine here for exactly that
// case, with one settle-recheck after images/fonts.
function reScrollWwp(cardId) {
  const reduced = prefersReduced()
  const run = () => scrollToWwp(cardId, reduced)
  run()
  if (!reduced) setTimeout(run, 320)
}

// 9-item What We Print dropdown: all anchor to homepage WWP section.
const PRODUCTS = [
  { key: 'educationalBooks', cardKey: 'educational' },
  { key: 'counterbookStationery', cardKey: 'trade' },
  { key: 'tradeBooks', cardKey: 'coffee' },
  { key: 'generalBooks', cardKey: 'general' },
  { key: 'childrenBooks', cardKey: 'children' },
  { key: 'learningKits', cardKey: 'kits' },
  { key: 'corporateBanks', cardKey: 'corporate' },
  { key: 'religiousBooks', cardKey: 'religious' },
  { key: 'packagingGifting', cardKey: 'packaging' },
]

// Primary route links: Print on Demand (standalone), then Infrastructure, Newsroom, Contact.
const LINKS = [
  { key: 'printOnDemand', to: '/print-on-demand' },
  { key: 'infrastructure', to: '/infrastructure' },
  { key: 'newsroom', to: '/newsroom' },
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
  const navigate = useNavigate()
  const { t } = useTranslation('nav')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(-1)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const itemsRef = useRef([])
  // true only when activeItem moved by keyboard → the effect below pulls real DOM
  // focus onto that item. Mouse hover leaves it false so hovering never steals focus.
  const focusIntent = useRef(false)

  useEffect(() => {
    setMenuOpen(false)
    setActiveItem(-1)
  }, [pathname])

  // Keyboard roving focus: when arrow keys move the highlight, move real focus too,
  // so a focused item's native Enter/Space selects it. Mouse hover is highlight-only.
  useEffect(() => {
    if (menuOpen && activeItem >= 0 && focusIntent.current) {
      itemsRef.current[activeItem]?.focus()
    }
    focusIntent.current = false
  }, [menuOpen, activeItem])

  // The WWP LABEL itself navigates to the homepage WWP section (from any page) —
  // Home.jsx's hash-scroll effect scrolls #what-we-print into view on arrival.
  const goToWWP = () => {
    const alreadyThere = pathname === '/' && window.location.hash === '#what-we-print'
    navigate('/#what-we-print')
    setMenuOpen(false)
    setActiveItem(-1)
    if (alreadyThere) reScrollWwp(null)
  }

  const handleProductClick = (product) => {
    const id = `wwp-${product.cardKey}`
    const alreadyThere = pathname === '/' && window.location.hash === `#${id}`
    navigate(`/#${id}`)
    setMenuOpen(false)
    setActiveItem(-1)
    if (alreadyThere) reScrollWwp(id)
  }

  // TRIGGER keys: Enter/Space navigate (same as a click); ArrowDown/Up open the menu
  // and drop focus onto the first/last item; Escape closes.
  const onTriggerKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goToWWP()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusIntent.current = true
      setMenuOpen(true)
      setActiveItem(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusIntent.current = true
      setMenuOpen(true)
      setActiveItem(PRODUCTS.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMenuOpen(false)
      setActiveItem(-1)
    }
  }

  // ITEM keys: arrows rove (Up from the first returns to the trigger); Escape closes
  // and restores focus to the trigger. Enter/Space fall through to the native onClick.
  const onItemKey = (e, idx) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusIntent.current = true
      setActiveItem(idx < PRODUCTS.length - 1 ? idx + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx > 0) {
        focusIntent.current = true
        setActiveItem(idx - 1)
      } else {
        setMenuOpen(false)
        setActiveItem(-1)
        triggerRef.current?.focus()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMenuOpen(false)
      setActiveItem(-1)
      triggerRef.current?.focus()
    }
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-[200] border-b border-[#0f2444]/[0.08] bg-[#fdfaf4]"
      style={{ boxShadow: '0 2px 24px rgba(15,36,68,0.06)' }}
    >
      <div
        className="mx-auto flex h-[86px] max-w-page items-center gap-8 px-6 sm:px-10 lg:px-14"
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
        <nav className="hidden items-center gap-5 lg:flex">
          {/* Home — first, explicit; the logo also links home but she wants a named
              item. aria-current marks it on "/" (no other link carries an active
              treatment, so we match that: same qnav-link, semantics only). */}
          <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className="qnav-link">{t('home')}</Link>
          <Link to="/about" className="qnav-link">{t('about')}</Link>

          {/* What We Print — 10-item dropdown */}
          <div
            className="relative"
            ref={menuRef}
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
            onFocus={() => setMenuOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false)
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className="qnav-link inline-flex items-center gap-1.5"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="wwp-dropdown"
              onClick={goToWWP}
              onKeyDown={onTriggerKey}
            >
              {t('whatWePrint')}
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                style={{
                  transition: 'transform 200ms ease',
                  transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path
                  d="M2.5 4.5 6 8l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full pt-4">
                <div
                  id="wwp-dropdown"
                  className="min-w-[260px] rounded-[var(--radius-md)] border border-[#0f2444]/10 bg-[#fdfaf4] p-2 shadow-[0_16px_48px_rgba(15,36,68,0.14)]"
                  role="menu"
                >
                  {PRODUCTS.map((p, idx) => (
                    <button
                      key={p.key}
                      ref={(el) => (itemsRef.current[idx] = el)}
                      type="button"
                      onClick={() => handleProductClick(p)}
                      onKeyDown={(e) => onItemKey(e, idx)}
                      onMouseEnter={() => setActiveItem(idx)}
                      className="focus-ring w-full text-left rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium text-[#1c2019]/85 transition-[colors,padding] duration-200 hover:bg-[#B06F14]/[0.08] hover:pl-6 hover:text-[#9d6f14]"
                      style={{
                        fontFamily: INTER,
                        backgroundColor:
                          activeItem === idx ? '#B06F14/[0.08]' : 'transparent',
                        paddingLeft: activeItem === idx ? '1.5rem' : '1rem',
                        color: activeItem === idx ? '#9d6f14' : '#1c2019/85',
                      }}
                      role="menuitem"
                      aria-current={activeItem === idx ? 'true' : undefined}
                    >
                      {t(p.key)}
                    </button>
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
        <div className="ml-auto flex items-center gap-4">
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
