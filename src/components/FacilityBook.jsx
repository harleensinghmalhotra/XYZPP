import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { typingSound } from '@/lib/typingSound'
import stackImg from '@/assets/facility-book-stack.png'
import './FacilityBook.css'

// FLOW book-stack render drives the pile. Flip to false (or an image 404 → onError)
// to fall back to the CSS-built pile below — cheap insurance.
const USE_IMAGE_STACK = true

// One UNIFORM label zone per navy spine, each dead-centred on ITS OWN spine's
// visible front face. All-% so the zones + centring hold at every container width.
const SPINE_POS = [
  { top: 6.5, left: 13, width: 57, rot: -4 }, // Web Machines (on the tilted top cover)
  { top: 26, left: 10.8, width: 59.8, rot: 0 }, // Sheetfed Machines
  { top: 44, left: 8.6, width: 56.5, rot: 0 },  // Binding and Finishing
  { top: 62, left: 8, width: 55.9, rot: 0 },    // Warehousing
  { top: 82, left: 7.3, width: 61, rot: 0 },    // Head Office
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
  { id: '01', base: 'facilities.01', images: ['web-1', 'web-2', 'web-3'] },
  { id: '02', base: 'facilities.02', images: ['sheetfed-1', 'sheetfed-2', 'sheetfed-3'] },
  { id: '03', base: 'facilities.03', images: ['binding-1', 'binding-2', 'binding-3'] },
  { id: '04', base: 'books.04', images: ['warehouse-1', 'warehouse-2', 'warehouse-3'] },
  { id: '05', base: 'books.05', images: ['headoffice-1'] },
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

// Wrap the body copy's key phrases in a rich highlight. `phrases` are exact,
// per-language substrings (from the locale) so EN/FR/ES stay in parity.
function Highlighted({ text, phrases }) {
  if (!phrases || !phrases.length) return text
  const esc = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${esc.join('|')})`, 'g')
  return text.split(re).map((part, i) =>
    phrases.includes(part)
      ? <mark key={i} className="ib-hl">{part}</mark>
      : <span key={i}>{part}</span>,
  )
}

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
  const body = book ? t(`${book.base}.body`) : t('books.intro.body')
  const highlights = book ? (t(`${book.base}.highlights`, { returnObjects: true }) || []) : []
  const hlList = Array.isArray(highlights) ? highlights : []

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
                src={stackImg}
                alt=""
                aria-hidden="true"
                draggable="false"
                onError={() => setImgOk(false)}
              />
              {BOOKS.map((b, bi) => {
                const label = t(`${b.base}.title`)
                const isActive = bi === activeBook
                const pos = SPINE_POS[bi]
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`ib-imglabel${isActive ? ' is-active' : ''}`}
                    style={{ top: `${pos.top}%`, left: `${pos.left}%`, width: `${pos.width}%`, '--rot': `${pos.rot}deg` }}
                    onClick={() => openBook(bi)}
                    aria-label={t('books.ui.open', { title: label })}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="ib-imglabel-glow" aria-hidden="true" />
                    <span className="ib-imglabel-text">{label}</span>
                    <span className="ib-imglabel-mark" aria-hidden="true" />
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
              {/* LEFT — the read (title + highlighted body) */}
              <div className={`ib-textpage${isIntro ? ' ib-textpage--intro' : ''}`}>
                <h3 className="ib-fac-title">{title}</h3>
                <p className="ib-fac-body ref-cap-body">
                  {isIntro ? body : <Highlighted text={body} phrases={hlList} />}
                </p>
              </div>

              {/* RIGHT — full-bleed facility photo (flip through the set) */}
              {!isIntro && total > 0 && (
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
