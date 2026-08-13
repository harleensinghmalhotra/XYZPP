import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './MobileNav.css'

// ── Mobile navigation drawer ──────────────────────────────────────────────────
// The site header's centre <nav> is `hidden lg:flex` and the CTA is `hidden
// sm:inline-flex`, so below 1024px the header carried only the logo + language
// toggle — every inner route was unreachable without typing the URL. This adds a
// hamburger (visible <1024 only) that opens a full-screen navy drawer with the
// eight reachable routes + the Request-a-Quote CTA.
//
// Labels come straight from the existing nav.json namespace (EN/FR/ES); the only
// non-nav string reused is homeCerts:close for the close button. The drawer is
// PORTALLED to <body> so its z-index isn't trapped inside the header's stacking
// context (the cookie banner sits at z-200 and is later in the DOM). No GSAP / no
// hide-first reveal — a plain CSS entrance animation on a conditionally-rendered
// node, driven by React state.
// Client Lane C · Task 3 — the new desktop About Us dropdown (Our Story / Our
// Journey / Our Team) does NOT get a drawer accordion: What We Print's own
// 9-item dropdown isn't in this NAV array at all today (no children shown on
// mobile for that pattern either), so matching that precedent means About Us
// stays exactly what it already is below — a single flat link to /about.
const NAV = [
  { key: 'home', to: '/', end: true },
  { key: 'about', to: '/about' },
  { key: 'printOnDemand', to: '/print-on-demand' },
  { key: 'infrastructure', to: '/infrastructure' },
  { key: 'globalMarkets', to: '/global-markets' },
  { key: 'fulfilment', to: '/fulfilment' },
  { key: 'newsroom', to: '/newsroom' },
  { key: 'contact', to: '/contact' },
]

export default function MobileNav() {
  const { t } = useTranslation('nav')
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const drawerRef = useRef(null)
  const closeRef = useRef(null)

  // Close on any route change (covers taps on links, incl. same-label re-taps handled
  // by the onClick below).
  useEffect(() => { setOpen(false) }, [pathname])

  // If the viewport grows into desktop range, the hamburger disappears — close the
  // drawer so it can't be left open covering the desktop nav.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => { if (mq.matches) setOpen(false) }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // While open: lock body scroll (and pause Lenis on the homepage), trap focus, wire
  // Escape, and on EVERY close path (button / link / Escape / unmount) restore scroll,
  // resume Lenis, and return focus to the hamburger. Keying the effect on `open` means
  // the cleanup is the single, guaranteed unlock.
  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.__lenis?.stop?.()

    const focusable = () =>
      [...(drawerRef.current?.querySelectorAll('a[href], button:not([disabled])') || [])]
        .filter((el) => el.offsetParent !== null)
    const raf = requestAnimationFrame(() => (closeRef.current || focusable()[0])?.focus())

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
      if (e.key !== 'Tab') return
      const f = focusable()
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.__lenis?.start?.()
      trigger?.focus?.()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="mnav-toggle"
        aria-label="Menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
      >
        <span className="mnav-bars" aria-hidden="true"><span /><span /><span /></span>
      </button>

      {open && createPortal(
        <div
          id="mobile-nav-drawer"
          className="mnav-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          ref={drawerRef}
        >
          <div className="mnav-head">
            <img
              className="mnav-logo"
              src="/site-assets/homepage/brand/qfp-mark.png"
              alt=""
              aria-hidden="true"
              width="40"
              height="40"
            />
            <button
              ref={closeRef}
              type="button"
              className="mnav-close"
              aria-label={t('close', { ns: 'homeCerts' })}
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mnav-links">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mnav-link${isActive ? ' is-active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="mnav-foot">
            <NavLink to="/contact" className="mnav-cta" onClick={() => setOpen(false)}>
              {t('requestQuote')}
              <span aria-hidden="true">→</span>
            </NavLink>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
