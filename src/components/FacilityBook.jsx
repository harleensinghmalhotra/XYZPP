import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Printer, StackSimple, BookOpenText, Warehouse, Buildings, Stack, Gauge, Palette,
  BookOpen, GearSix, Target, Books, Needle, ShieldCheck, Package, Truck, UsersThree,
  Handshake, GlobeHemisphereWest,
} from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { typingSound } from '@/lib/typingSound'
import './FacilityBook.css'

const STACK_IMG = '/site-assets/homepage/facility-book/book-stack.webp'

// FLOW book-stack render drives the pile. Flip to false (or an image 404 → onError)
// to fall back to the CSS-built pile below — cheap insurance.
const USE_IMAGE_STACK = true

// Invisible click zones over the five colour-labelled spines of the stack ART
// (blue Web Offset / orange Sheet Fed / green Binding / red Warehouse / slate HQ).
// Each zone spans that book's spine + its page block. All-% so they track the image
// at every container width (pixel-measured off the render).
const SPINE_POS = [
  { top: 10, left: 16, width: 68, height: 18 }, // Web Offset (blue)
  { top: 28, left: 16, width: 68, height: 19 }, // Sheet Fed (orange)
  { top: 47, left: 16, width: 68, height: 19 }, // Binding and Finishing (green)
  { top: 66, left: 16, width: 68, height: 17 }, // Warehouse (red)
  { top: 83, left: 16, width: 68, height: 13 }, // Corporate Headquarters (slate)
]

// ── Facility Book — Infrastructure section & /infrastructure page ──────────────
// A shelf of five hardcover books (the PILE, left rail); click one to OPEN it into
// the two-page spread on the right. The spread IS the "NEW BOOK EMPTY FOR
// INFRASTRUCTURE" art (navy hardcover, cream pages, orange ribbon):
//   • LEFT page carries ALL of that facility's copy — title at the top, body below
//     in the reference caption size, with key phrases richly highlighted.
//   • RIGHT page is a full-bleed facility photo; ← → / swipe / arrows flip through
//     the 2–3 strongest shots for that facility.
// The old "FACILITY 01/02" numbering, gold cover eyebrows and mock navy panels are
// gone. All five facilities now carry real content (04/05 read from books.04/05).
//
// Each book's title/body live under a single i18n base: facilities.01–03 for the
// first three, books.04/05 for the last two. Its images ship at /qfp/infra/<name>.webp.
const BOOKS = [
  { id: '01', base: 'facilities.01', images: ['web-1', 'web-2', 'web-3'], Icon: Printer, pIcons: [Stack, Gauge, Palette, BookOpen] },
  { id: '02', base: 'facilities.02', images: ['sheetfed-1', 'sheetfed-2', 'sheetfed-3'], Icon: StackSimple, pIcons: [GearSix, Target, Palette, Books] },
  { id: '03', base: 'facilities.03', images: ['binding-1', 'binding-2', 'binding-3'], Icon: BookOpenText, pIcons: [BookOpen, Needle, Books, Stack] },
  { id: '04', base: 'books.04', images: ['warehouse-1', 'warehouse-2', 'warehouse-3'], Icon: Warehouse, pIcons: [Stack, ShieldCheck, Package, Truck] },
  { id: '05', base: 'books.05', images: ['headoffice-1'], Icon: Buildings, pIcons: [UsersThree, Buildings, Handshake, GlobeHemisphereWest] },
]

// Physical pile order for the CSS fallback — facility books interleaved with inert
// FILLER slabs so the stack reads as a real pile. Only facility books are buttons.
const PILE = [
  { book: 0 }, { filler: true },
  { book: 1 }, { filler: true },
  { book: 2 }, { filler: true },
  { book: 3 }, { filler: true },
  { book: 4 }, { filler: true },
]

const TURN_SRC = '/qfp/sounds/page-turn.wav'
const TURN_VOL = 0.35
const num = (n) => String(n).padStart(2, '0')

export default function FacilityBook() {
  const { t } = useTranslation('homeInfraSection')
  const reduced = useReducedMotion()
  const [activeBook, setActiveBook] = useState(-1) // -1 = intro spread, 0+ = book index
  const [imgOk, setImgOk] = useState(true)          // FLOW pile photo loaded? false → CSS pile
  const [page, setPage] = useState(0)               // current image within the open book
  const [xfade, setXfade] = useState(0)             // bumps to re-trigger the crossfade
  const sectionRef = useRef(null)
  const inView = useRef(false)                      // ≥50% of the stack fills the viewport
  const stepRef = useRef(() => {})

  // Page-turn SFX — lazy Audio on mount, silent if the file 404s or sound is off.
  const turnAudio = useRef(null)
  useEffect(() => {
    const a = new Audio(TURN_SRC)
    a.preload = 'auto'
    a.volume = TURN_VOL
    turnAudio.current = a
    return () => { turnAudio.current = null }
  }, [])
  const playTurn = () => {
    if (reduced || !typingSound.isEnabled()) return
    const a = turnAudio.current
    if (!a) return
    try {
      a.currentTime = 0
      const p = a.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch { /* file missing / not ready — stay silent */ }
  }

  const isIntro = activeBook === -1
  const book = isIntro ? null : BOOKS[activeBook]
  const images = book ? book.images : []
  const total = images.length
  const safePage = Math.min(page, Math.max(0, total - 1))
  const title = book ? t(`${book.base}.title`) : t('books.intro.heading')
  const introBody = t('books.intro.body')          // the intro spread's right-page line
  const facIntro = book ? t(`${book.base}.intro`) : ''
  const rawPoints = book ? t(`${book.base}.points`, { returnObjects: true }) : []
  const points = Array.isArray(rawPoints) ? rawPoints : []

  // Flip through the open book's images — crossfade, one step at a time.
  const go = (target) => {
    if (isIntro || target === safePage || target < 0 || target >= total) return
    playTurn()
    setPage(target)
    setXfade((k) => k + 1)
  }

  // Switch to a different book — crossfade in on its first image.
  const openBook = (target) => {
    if (target === activeBook || target < 0 || target >= BOOKS.length) return
    setActiveBook(target)
    setPage(0)
    setXfade((k) => k + 1)
    playTurn()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(safePage + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(safePage - 1) }
  }

  // FOCUS-FREE ARROW KEYS — the open book answers ← → the moment the stack fills
  // ≥50% of the VIEWPORT. `stepRef` always holds the latest go() closure.
  useEffect(() => { stepRef.current = (dir) => go(safePage + dir) })

  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const vp = entry.rootBounds?.height || window.innerHeight
        const coverage = vp ? entry.intersectionRect.height / vp : 0
        inView.current = coverage >= 0.5
        el.dataset.kbdActive = inView.current ? '1' : '0'
      }
    }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20) })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onWinKey = (e) => {
      if (!inView.current) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (e.defaultPrevented) return
      const a = document.activeElement
      if (a) {
        const tag = a.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable) return
      }
      e.preventDefault()
      stepRef.current(e.key === 'ArrowRight' ? 1 : -1)
    }
    window.addEventListener('keydown', onWinKey)
    return () => window.removeEventListener('keydown', onWinKey)
  }, [])

  // Touch swipe on the spread — decisive horizontal drag only, never hijacks scroll.
  const touch = useRef(null)
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? safePage + 1 : safePage - 1)
    }
    touch.current = null
  }

  const regionLabel = t('books.ui.region')

  return (
    <div className="ib-stage" ref={sectionRef} data-theme="dark">
      <div
        className="ib-interactive"
        role="group"
        aria-label={regionLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* LEFT RAIL — BOOK PILE (FLOW photo + HTML spine labels, or CSS fallback) */}
        {USE_IMAGE_STACK && imgOk ? (
          <div className="ib-stack ib-stack--img" aria-label={regionLabel}>
            <div className="ib-imgstack">
              <img
                className="ib-imgstack-photo"
                src={STACK_IMG}
                alt=""
                aria-hidden="true"
                draggable="false"
                onError={() => setImgOk(false)}
              />
              {/* invisible hit zones over the five colour-labelled spines (labels are
                  baked into the art) — a soft glow/outline on hover + active only */}
              {BOOKS.map((b, bi) => {
                const label = t(`${b.base}.title`)
                const isActive = bi === activeBook
                const pos = SPINE_POS[bi]
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`ib-hit${isActive ? ' is-active' : ''}`}
                    style={{ top: `${pos.top}%`, left: `${pos.left}%`, width: `${pos.width}%`, height: `${pos.height}%` }}
                    onClick={() => openBook(bi)}
                    aria-label={t('books.ui.open', { title: label })}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="ib-hit-glow" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="ib-stack" aria-label={regionLabel}>
            {PILE.map((slot, pos) => {
              if (slot.filler) {
                return (
                  <div key={`f${pos}`} className="ib-filler" aria-hidden="true">
                    <span className="ib-book-top" />
                    <span className="ib-filler-edge" />
                  </div>
                )
              }
              const bi = slot.book
              const b = BOOKS[bi]
              const label = t(`${b.base}.title`)
              const isActive = bi === activeBook
              const cream = bi % 2 === 1
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`ib-spine${cream ? ' ib-spine--cream' : ''}${isActive ? ' ib-spine--active' : ''}`}
                  onClick={() => openBook(bi)}
                  aria-label={t('books.ui.open', { title: label })}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="ib-book-top" aria-hidden="true" />
                  <span className="ib-book-spine">
                    <span className="ib-book-print">
                      <span className="ib-book-foil" aria-hidden="true" />
                      <span className="ib-spine-text">{label}</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* THE OPEN BOOK — the art-backed spread */}
        <div className="ib-book-wrap">
          <div
            className="ib-book"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {!isIntro && total > 1 && (
              <div className="ib-counter" aria-live="polite">
                {t('books.ui.pageWord').toUpperCase()} {num(safePage + 1)} <span className="ib-counter-sep">/</span> {num(total)}
              </div>
            )}

            <div className="ib-spread">
              {isIntro ? (
                <>
                  {/* INTRO (resting) — centred "Infrastructure" on the left page, the
                      location line + arrow centred on the right page (the pre-restructure
                      original), over the same open-book art. */}
                  <div className="ib-textpage ib-textpage--intro">
                    <h3 className="ib-intro-heading">{title}</h3>
                  </div>
                  <div className="ib-intropage">
                    <p className="ib-intro-body">{introBody}</p>
                    <span className="ib-intro-arrow" aria-hidden="true">→</span>
                  </div>
                </>
              ) : (
                <>
                  {/* LEFT — the read: icon badge, title, rule, intro, feature points
                      (client reference layout; content restructured from approved copy) */}
                  <div className="ib-textpage ib-facpage">
                    <span className="ib-fac-dots" aria-hidden="true" />
                    <span className="ib-fac-badge" aria-hidden="true">
                      {book.Icon && <book.Icon weight="light" size={24} />}
                    </span>
                    <h3 className="ib-facpage-title">{title}</h3>
                    <span className="ib-facpage-rule" aria-hidden="true" />
                    <p className="ib-facpage-intro">{facIntro}</p>
                    <ul className="ib-facpage-points">
                      {points.map((pt, i) => {
                        const PtIcon = book.pIcons[i]
                        return (
                          <li key={i} className="ib-fpoint">
                            <span className="ib-fpoint-icon" aria-hidden="true">
                              {PtIcon && <PtIcon weight="light" size={17} />}
                            </span>
                            <span className="ib-fpoint-text">
                              <span className="ib-fpoint-title">{pt.title}</span>
                              <span className="ib-fpoint-desc">{pt.desc}</span>
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* RIGHT — full-bleed facility photo (flip through the set) */}
                  {total > 0 && (
                    <div className="ib-imgpage">
                      <div className="ib-img-frame">
                        <img
                          key={`${activeBook}-${safePage}-${xfade}`}
                          className="ib-img"
                          src={`/qfp/infra/${images[safePage]}.webp`}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                        />
                      </div>
                      {total > 1 && (
                        <>
                          <button
                            type="button"
                            className="ib-arrow ib-arrow--prev"
                            onClick={() => go(safePage - 1)}
                            disabled={safePage === 0}
                            aria-label={t('books.ui.prev')}
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            className="ib-arrow ib-arrow--next"
                            onClick={() => go(safePage + 1)}
                            disabled={safePage === total - 1}
                            aria-label={t('books.ui.next')}
                          >
                            →
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
