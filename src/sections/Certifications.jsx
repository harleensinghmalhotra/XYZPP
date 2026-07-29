import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── Certifications — faithful port of Alternativ's certs section, QFP content ──
// Signature: the cream section sweeps in on a giant dome/arc over the section above
// and the next dark section arcs in below. A slow rotating seal and a flat
// hairline-card carousel (scroll / drag + arrow buttons). The filter pills were
// removed: all five certifications always show, so a filter control served no
// purpose. Each card is click-to-expand: clicking (or Enter/Space) opens a dialog
// with the full, unclamped body; Escape / backdrop / the close button dismiss it.

// eyebrow / title / body resolved from homeCerts (cards.<key>.*). Proper names,
// cert titles, codes and logo filenames stay hardcoded; the FSC licence code and the
// "Two Star Export House" name are non-translatable by compliance/brand (the name stays
// English in every locale, so its logo alt does too).
const CERTS = [
  {
    key: 'fsc',
    logo: 'fsc.webp',
    // COMPLIANCE LAW: the FSC licence code must render with the FSC mark on every
    // surface it appears — the card cannot ship without it.
    code: 'TUVDC-COC-101258',
  },
  {
    key: 'iso9001',
    logo: 'iso.webp',
  },
  {
    key: 'iso27001',
    logo: 'iso.webp',
  },
  {
    key: 'sedex',
    logo: 'sedex.webp',
  },
  {
    key: 'star',
    logo: 'star-export-house.webp',
  },
]

function CheckMark() {
  return (
    <svg className="cert-check" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 10.4l2.6 2.6L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// The certification logo image, shared by the card and the expanded dialog so both
// read identically. All five certifications now use a real logo (the Two Star Export
// House badge included); the alt derives from the localised card title, so it matches
// how the other four are labelled.
function CertMark({ c, t }) {
  return (
    <img src={`/site-assets/homepage/certifications/${c.logo}`} alt={`${t(`cards.${c.key}.title`)} logo`} loading="lazy" decoding="async" />
  )
}

// `flatBottom` suppresses the navy sweep-arc at the section's foot. Default (false)
// keeps the arc for a navy neighbour below (the homepage Marquee / the Infrastructure
// page's capability triptych, which carries its own cream top-curve). Pass `flatBottom`
// when a CREAM section follows, so the arc doesn't dome navy onto a light background.
// `flatTop` likewise suppresses the cream dome that rises ABOVE the section — pass it
// when the section above is a self-contained panel (e.g. the Infrastructure page's navy
// facility-book stage) that the cream curve would otherwise invade.
export default function Certifications({ flatBottom = false, flatTop = false }) {
  const { t } = useTranslation('homeCerts')
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [arrows, setArrows] = useState({ prev: false, next: true })
  const [expanded, setExpanded] = useState(null) // cert key of the open dialog, or null
  const triggerRef = useRef(null)                 // card that opened the dialog (focus return)
  const closeBtnRef = useRef(null)

  const visible = CERTS
  const openCert = expanded ? CERTS.find((c) => c.key === expanded) : null

  const openCard = (key, el) => { triggerRef.current = el; setExpanded(key) }
  const closeModal = () => setExpanded(null)

  // arrow enable/disable from scroll position
  const syncArrows = () => {
    const el = viewport.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setArrows({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4 })
  }
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    el.scrollTo({ left: 0 })
    // read the scroll extents once layout has settled
    const id = requestAnimationFrame(syncArrows)
    return () => cancelAnimationFrame(id)
  }, [])

  const nudge = (dir) => {
    const el = viewport.current
    if (!el) return
    const card = el.querySelector('.cert-card')
    const step = card ? card.offsetWidth + 20 : 360
    el.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' })
  }

  // drag-to-scroll (pointer) — feels like the reference carousel
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    let down = false, startX = 0, startLeft = 0, moved = false
    const onDown = (e) => { down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; el.setPointerCapture?.(e.pointerId) }
    const onMove = (e) => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = startLeft - dx }
    const onUp = (e) => { down = false; el.releasePointerCapture?.(e.pointerId) }
    // After a drag, swallow the click so nothing misfires. On a genuine click, open
    // the card that was clicked — delegated here (not a per-card onClick) because the
    // pointer-capture drag routes the click through the viewport, so a card-level
    // onClick can't be relied on. Arrows live outside .certs-viewport, so they are
    // unaffected. `moved` is the drag-versus-click guard.
    const onClick = (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); return }
      // pointer capture during the drag makes the click target the viewport, so read
      // the real element under the pointer to find which card was clicked.
      const hit = document.elementFromPoint(e.clientX, e.clientY)
      const card = hit?.closest?.('.cert-card')
      if (card && card.dataset.certKey) { triggerRef.current = card; setExpanded(card.dataset.certKey) }
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    el.addEventListener('scroll', syncArrows, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('scroll', syncArrows)
    }
  }, [])

  // dialog lifecycle: Escape closes, body scroll locks, focus moves to the close
  // button on open and returns to the triggering card on close.
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus())
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      cancelAnimationFrame(id)
      document.body.style.overflow = prevOverflow
      triggerRef.current?.focus?.()
    }
  }, [expanded])

  return (
    <section id="certifications" data-theme="light" className={`certs${flatBottom ? '' : ' certs-archb'}`} aria-labelledby="certs-title">
      {/* signature curve — cream dome sweeping over the section above. Suppressed when
          the section above is a self-contained panel (flatTop) it would invade. */}
      {!flatTop && (
        <svg className="certs-arc-top" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,160 L1440,160 L1440,108 Q720,-34 0,108 Z" fill="#fdfaf4" />
        </svg>
      )}

      <div className="certs-inner">
        <div className="certs-top">
          {/* rotating seal */}
          <div className="certs-seal" aria-hidden="true">
            <svg className="certs-seal-ring" viewBox="0 0 200 200">
              <defs>
                <path id="certSealPath" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text>
                <textPath href="#certSealPath" startOffset="0">
                  {t('seal')}
                </textPath>
              </text>
            </svg>
            <span className="certs-seal-core">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
                <path d="M4 21c1.5-4 4-6.5 7.5-8" />
              </svg>
            </span>
          </div>
        </div>

        {/* headline */}
        <div className="certs-head">
          <h2 id="certs-title" className="certs-title">{t('title')}</h2>
          <p className="certs-sub">{t('sub')}</p>
        </div>

        {/* card carousel */}
        <div className="certs-carousel">
          <div className="certs-viewport" ref={viewport} tabIndex={0} role="group" aria-label={t('carouselAria')}>
            <div className="certs-track">
              {visible.map((c) => (
                <article
                  className="cert-card"
                  key={c.key}
                  data-cert-key={c.key}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expanded === c.key}
                  aria-label={`${t(`cards.${c.key}.title`)}. ${t('expandHint')}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(c.key, e.currentTarget) }
                  }}
                >
                  <div className="cert-card-eyebrow">
                    <CheckMark />
                    <span>{t(`cards.${c.key}.eyebrow`)}</span>
                  </div>

                  <div className="cert-card-mark">
                    <CertMark c={c} t={t} />
                    <div className="cert-card-title">{t(`cards.${c.key}.title`)}</div>
                    {c.code && <div className="cert-card-code">{t('licence')} {c.code}</div>}
                  </div>

                  <p className="cert-card-body">{t(`cards.${c.key}.body`)}</p>
                </article>
              ))}
            </div>
          </div>

          {/* prev / next arrows — grey inactive, navy active */}
          <div className="certs-arrows">
            <button type="button" className="certs-arrow" onClick={() => nudge(-1)} disabled={!arrows.prev} aria-label={t('prevAria')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" className="certs-arrow" onClick={() => nudge(1)} disabled={!arrows.next} aria-label={t('nextAria')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* expanded card dialog — full, unclamped body */}
      {openCert && (
        <div className="cert-modal-backdrop" onClick={closeModal}>
          <div
            className="cert-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cert-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="cert-modal-close" onClick={closeModal} aria-label={t('close')} ref={closeBtnRef}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
            <div className="cert-card-eyebrow">
              <CheckMark />
              <span>{t(`cards.${openCert.key}.eyebrow`)}</span>
            </div>
            <div className="cert-modal-mark">
              <CertMark c={openCert} t={t} />
              <div id="cert-modal-title" className="cert-card-title">{t(`cards.${openCert.key}.title`)}</div>
              {openCert.code && <div className="cert-card-code">{t('licence')} {openCert.code}</div>}
            </div>
            <p className="cert-modal-body">{t(`cards.${openCert.key}.body`)}</p>
          </div>
        </div>
      )}

      {/* signature curve — the next dark section arcs in below. Suppressed when a cream
          section follows (flatBottom), so the navy dome never lands on a light background. */}
      {!flatBottom && (
        <svg className="certs-arc-bottom" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,150 L1440,150 L1440,70 Q720,-10 0,70 Z" fill="var(--navy)" />
        </svg>
      )}
    </section>
  )
}
