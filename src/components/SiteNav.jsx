import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '@/components/LanguageToggle'
import MobileNav from '@/components/MobileNav'
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

// About Us dropdown — mirrors reScrollWwp's role: ScrollToTop (global) only
// refires when [pathname, hash] actually CHANGES, so re-clicking the anchor
// we're already on needs its own scroll. /about has no Lenis (only the
// homepage does — see ScrollToTop.jsx), so this is a plain native scroll to
// NAV_OFFSET above the target, matching ScrollToTop's own math.
const ABOUT_NAV_OFFSET = 86
function reScrollAbout(id) {
  const reduced = prefersReduced()
  const run = () => {
    if (!id) { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return }
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - ABOUT_NAV_OFFSET
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' })
  }
  run()
}

// 3-item About Us dropdown: clones the What We Print pattern exactly (same
// markup, hover/focus/keyboard behaviour, styling). "Our Story" has no anchor
// (recon: nothing to add — plain /about already lands at the top); "Our
// Journey" and "Our Team" anchor to #journey / #team (ids added for this —
// see JourneyTimeline.jsx and OurStory.jsx).
const ABOUT_ITEMS = [
  { key: 'ourStory', to: '/about' },
  { key: 'ourJourney', to: '/about#journey' },
  { key: 'ourTeam', to: '/about#team' },
]

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

// SITE HEADER — the approved anatomy (qfp-homepage-v17.html):
// a SOLID opaque cream bar, 86px tall, NON-STICKY (in normal flow — scrolls away
// with the page and does not reappear on scroll-up), faint navy hairline +
// soft shadow. No transparency, no glass, no per-route theme-flip — the header is
// the same solid cream chrome on every page (over the dark hero too, exactly as
// specified). Logo = 48px QF monogram + two-line Inter-Tight-700 wordmark. Nav
// links carry the center-growing gold underline (.qnav-link). CTA = square navy
// ghost button that fills navy on hover.
export default function SiteNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation('nav')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(-1)
  // About Us dropdown — Client Lane C · Task 3. Separate state/refs from WWP's
  // (not a shared/generalized abstraction) so the already-verified WWP dropdown
  // can't regress from a refactor; the two instances are otherwise identical.
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false)
  const [aboutActiveItem, setAboutActiveItem] = useState(-1)
  const aboutMenuRef = useRef(null)
  const aboutTriggerRef = useRef(null)
  const aboutItemsRef = useRef([])
  const aboutFocusIntent = useRef(false)
  // Below 1024px the header is fixed (see MobileNav.css): true slides it up out of view.
  const [hidden, setHidden] = useState(false)
  const menuRef = useRef(null)
  const triggerRef = useRef(null)
  const itemsRef = useRef([])
  // true only when activeItem moved by keyboard → the effect below pulls real DOM
  // focus onto that item. Mouse hover leaves it false so hovering never steals focus.
  const focusIntent = useRef(false)

  useEffect(() => {
    setMenuOpen(false)
    setActiveItem(-1)
    setAboutMenuOpen(false)
    setAboutActiveItem(-1)
    setHidden(false) // every route lands at the top (ScrollToTop) → header visible
  }, [pathname])

  // Hide-on-scroll-down / reveal-on-scroll-up, below the hamburger breakpoint only.
  // The header is position:fixed <1024px (MobileNav.css) so the nav is always one tap
  // away; here we only toggle the translateY via data-hidden. Plain rAF-throttled
  // window-scroll listener with a direction compare + ~10px jitter threshold — NO
  // GSAP/ScrollTrigger (would trip killAll). Works on native scroll AND on the
  // homepage: Lenis smooths WHEEL only (no syncTouch), so on a touch device the scroll
  // is native and window.scrollY updates either way. Reduced-motion: skip entirely →
  // the fixed header just stays visible (no slide). Desktop (>=1024px): force-visible
  // and the CSS keeps it position:relative, so this is inert there.
  useEffect(() => {
    if (prefersReduced()) return
    let lastY = Math.max(0, window.scrollY || 0)
    let ticking = false
    const update = () => {
      ticking = false
      const y = Math.max(0, window.scrollY || 0)
      if (window.innerWidth >= 1024) { setHidden(false); lastY = y; return }
      if (y <= 8) { setHidden(false); lastY = y; return } // near the very top: always show
      const dy = y - lastY
      if (Math.abs(dy) < 10) return // ignore jitter; don't move the reference point
      setHidden(dy > 0) // scrolling down → hide; up → reveal
      lastY = y
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard roving focus: when arrow keys move the highlight, move real focus too,
  // so a focused item's native Enter/Space selects it. Mouse hover is highlight-only.
  useEffect(() => {
    if (menuOpen && activeItem >= 0 && focusIntent.current) {
      itemsRef.current[activeItem]?.focus()
    }
    focusIntent.current = false
  }, [menuOpen, activeItem])

  useEffect(() => {
    if (aboutMenuOpen && aboutActiveItem >= 0 && aboutFocusIntent.current) {
      aboutItemsRef.current[aboutActiveItem]?.focus()
    }
    aboutFocusIntent.current = false
  }, [aboutMenuOpen, aboutActiveItem])

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

  // The About Us LABEL itself still navigates to plain /about, exactly as the
  // plain Link it replaces did.
  const goToAbout = () => {
    const alreadyThere = pathname === '/about' && !window.location.hash
    navigate('/about')
    setAboutMenuOpen(false)
    setAboutActiveItem(-1)
    if (alreadyThere) reScrollAbout(null)
  }

  const handleAboutItemClick = (item) => {
    const hash = item.to.includes('#') ? item.to.split('#')[1] : null
    const alreadyThere = pathname === '/about' && (hash ? window.location.hash === `#${hash}` : !window.location.hash)
    navigate(item.to)
    setAboutMenuOpen(false)
    setAboutActiveItem(-1)
    if (alreadyThere) reScrollAbout(hash)
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

  // About Us — identical keyboard behaviour to WWP's onTriggerKey/onItemKey above.
  const onAboutTriggerKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goToAbout()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      aboutFocusIntent.current = true
      setAboutMenuOpen(true)
      setAboutActiveItem(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      aboutFocusIntent.current = true
      setAboutMenuOpen(true)
      setAboutActiveItem(ABOUT_ITEMS.length - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAboutMenuOpen(false)
      setAboutActiveItem(-1)
    }
  }

  const onAboutItemKey = (e, idx) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      aboutFocusIntent.current = true
      setAboutActiveItem(idx < ABOUT_ITEMS.length - 1 ? idx + 1 : 0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx > 0) {
        aboutFocusIntent.current = true
        setAboutActiveItem(idx - 1)
      } else {
        setAboutMenuOpen(false)
        setAboutActiveItem(-1)
        aboutTriggerRef.current?.focus()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAboutMenuOpen(false)
      setAboutActiveItem(-1)
      aboutTriggerRef.current?.focus()
    }
  }

  return (
    <header
      role="banner"
      data-hidden={hidden ? 'true' : undefined}
      className="site-header relative z-[200] border-b border-[#030C31]/[0.08] bg-[#fdfaf4]"
      style={{ boxShadow: '0 2px 24px rgba(3,12,49,0.06)' }}
    >
      <div
        className="mx-auto flex h-[86px] max-w-page items-center gap-2 px-4 xl:gap-6 xl:px-8 2xl:gap-8 2xl:px-14"
        style={{ fontFamily: TIGHT }}
      >
        {/* logo lockup — 48px monogram + two-line wordmark, all navy */}
        <Link to="/" className="focus-ring flex items-center gap-3" aria-label="Quarterfold Printabilities home">
          <img src="/site-assets/homepage/brand/qfp-mark.png" alt="" aria-hidden="true" width="48" height="48" className="h-12 w-12 shrink-0 object-contain" />
          <span className="hidden flex-col leading-[1.06] text-[#030C31] sm:flex">
            <span className="text-[16px] font-bold tracking-[0.2px]">Quarterfold</span>
            <span className="text-[16px] font-bold tracking-[0.2px]">Printabilities</span>
          </span>
        </Link>

        {/* center nav — breathing scales up with width: tight gap-2 at lg, a real
            xl (1280) breathing tier, and a generous 2xl (1536) gap so the row never
            reads as "cluttered". FR/ES stay uncrowded via the compact nav strings. */}
        <nav className="hidden items-center gap-2 lg:flex xl:gap-4 2xl:gap-6">
          {/* Home — first, explicit; the logo also links home but a named nav
              item. aria-current marks it on "/" (no other link carries an active
              treatment, so we match that: same qnav-link, semantics only). */}
          <Link to="/" aria-current={pathname === '/' ? 'page' : undefined} className="qnav-link">{t('home')}</Link>

          {/* About Us — 3-item dropdown, cloned from What We Print (Client Lane C ·
              Task 3). The label itself still navigates straight to /about. */}
          <div
            className="relative"
            ref={aboutMenuRef}
            onMouseEnter={() => setAboutMenuOpen(true)}
            onMouseLeave={() => setAboutMenuOpen(false)}
            onFocus={() => setAboutMenuOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setAboutMenuOpen(false)
            }}
          >
            <button
              ref={aboutTriggerRef}
              type="button"
              className="qnav-link inline-flex items-center gap-1.5"
              aria-haspopup="true"
              aria-expanded={aboutMenuOpen}
              aria-controls="about-dropdown"
              onClick={goToAbout}
              onKeyDown={onAboutTriggerKey}
            >
              {t('about')}
              <svg
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
                style={{
                  transition: 'transform 200ms ease',
                  transform: aboutMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
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
            {aboutMenuOpen && (
              <div className="absolute left-0 top-full pt-4">
                <div
                  id="about-dropdown"
                  className="min-w-[260px] rounded-[var(--radius-md)] border border-[#030C31]/10 bg-[#fdfaf4] p-2 shadow-[0_16px_48px_rgba(3,12,49,0.14)]"
                  role="menu"
                >
                  {ABOUT_ITEMS.map((item, idx) => (
                    <button
                      key={item.key}
                      ref={(el) => (aboutItemsRef.current[idx] = el)}
                      type="button"
                      onClick={() => handleAboutItemClick(item)}
                      onKeyDown={(e) => onAboutItemKey(e, idx)}
                      onMouseEnter={() => setAboutActiveItem(idx)}
                      className="focus-ring w-full text-left rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium text-[#1c2019]/85 transition-[colors,padding] duration-200 hover:bg-[#B06F15]/[0.08] hover:pl-6 hover:text-[#925C10]"
                      style={{
                        fontFamily: INTER,
                        backgroundColor:
                          aboutActiveItem === idx ? '#B06F15/[0.08]' : 'transparent',
                        paddingLeft: aboutActiveItem === idx ? '1.5rem' : '1rem',
                        color: aboutActiveItem === idx ? '#925C10' : '#1c2019/85',
                      }}
                      role="menuitem"
                      aria-current={aboutActiveItem === idx ? 'true' : undefined}
                    >
                      {t(item.key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  className="min-w-[260px] rounded-[var(--radius-md)] border border-[#030C31]/10 bg-[#fdfaf4] p-2 shadow-[0_16px_48px_rgba(3,12,49,0.14)]"
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
                      className="focus-ring w-full text-left rounded-[var(--radius-sm)] px-4 py-2.5 text-[13px] font-medium text-[#1c2019]/85 transition-[colors,padding] duration-200 hover:bg-[#B06F15]/[0.08] hover:pl-6 hover:text-[#925C10]"
                      style={{
                        fontFamily: INTER,
                        backgroundColor:
                          activeItem === idx ? '#B06F15/[0.08]' : 'transparent',
                        paddingLeft: activeItem === idx ? '1.5rem' : '1rem',
                        color: activeItem === idx ? '#925C10' : '#1c2019/85',
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
        <div className="ml-auto flex items-center gap-3 2xl:gap-4">
          <LanguageToggle light />
          {/* Square navy ghost button — fills navy on hover (.nav-cta). */}
          <Link
            to="/contact"
            className="btn-nebula btn-nebula--light focus-ring hidden shrink-0 items-center gap-1.5 whitespace-nowrap border-[1.5px] border-[#030C31] px-4 py-[10px] text-[13px] font-medium text-[#030C31] transition-colors duration-200 hover:bg-[#030C31] hover:text-[#fdfaf4] sm:inline-flex 2xl:px-[22px]"
            style={{ fontFamily: INTER, letterSpacing: '0.3px' }}
          >
            {t('requestQuote')}
            <span aria-hidden="true">→</span>
          </Link>
          {/* Hamburger — visible below 1024px only (where the centre nav is hidden). */}
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
