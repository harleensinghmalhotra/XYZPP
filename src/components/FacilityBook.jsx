import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { typingSound } from '@/lib/typingSound'
import './FacilityBook.css'

// ── Facility Book — shared component for Infrastructure section & /infrastructure page ──
// The three facility cards become a shelf of hardcover books, recycled straight
// from Case Studies' OPEN-BOOK mechanics (Cases.jsx) — copied, never imported, so
// the gated Case Studies section survives untouched for if/when it returns. The
// client's ask: "a stack of books, click one to open it, flip through 3–4 pages
// of content inside, click a different book to switch." FIVE books:
//   • Books 1–3 carry the current facility content, paginated into three leaves
//     each — a COVER (facility title), an OVERVIEW (the body copy) and AT A GLANCE
//     (the location / headline stat). Their right page is a designed navy+gold MOCK
//     panel (a real facility photo drops straight in later — client is replacing
//     photography anyway), matching the placeholder language already on the page.
//   • Books 4–5 are RESERVED placeholder slots — visible in the stack so the client
//     sees "five books, ready for content", opening to a graceful "coming soon"
//     page rather than erroring. Content drops in by filling books.04 / books.05.
// What was recycled from Cases: the shelf of standing spines (the OPEN book's spine
// is MISSING from the shelf — a visible gap explains the metaphor), the two-page
// spread, the 3D leaf page-turn (locked one turn at a time, reduced-motion / narrow
// fall back to a silent crossfade), the ribbon "you are here", the DM Mono counter,
// the page-corner arrows, keyboard ← →, touch swipe, and the quiet page-turn SFX.
// The spines are SLIMMER than Cases' per the client ("a little thinner than before").

// Structural data only — every user-facing string resolves through i18n.
//   • Books 1–3 pull their pages from the EXISTING `facilities.<src>.*` keys
//     (title / body / caption / ph) so there's no copy duplication.
//   • Books 4–5 are `placeholder` and read `books.<id>.*` (eyebrow/title/body/cover).
// To fill a reserved book later: drop real content into `books.04` / `books.05`
// (or convert it to a facilities-backed book) and clear its `placeholder` flag.
const BOOKS = [
  { id: '01', src: '01', icon: 'tower' },   // Web Machines
  { id: '02', src: '02', icon: 'press' },   // Sheetfed Machines
  { id: '03', src: '03', icon: 'carton' },  // Binding and Finishing
  { id: '04', icon: 'carton', placeholder: true },  // Warehousing
  { id: '05', icon: 'tower', placeholder: true },   // Head Office
]

const FLIP_MS = 560 // JS lock slightly longer than the 520ms CSS leaf turn

// Page-turn SFX — the SAME quiet paper fold Cases uses, fired the instant a leaf
// starts turning. Gated three ways (flat/flip mode only, global sound toggle on,
// currentTime reset so rapid flips restart rather than stack). A page turn inside
// a facility book is the same book metaphor and the same site sound language, so
// keeping it here reads as consistent, not a new noise.
const TURN_SRC = '/qfp/sounds/page-turn.wav'
const TURN_VOL = 0.35

// QA seam mirrored from Cases: `?flip=<ms>` slows the leaf turn so its mid-flip
// frames can be captured; drives BOTH the CSS leaf turn and the JS input lock.
function readFlipMs() {
  if (typeof window === 'undefined') return FLIP_MS
  const v = parseInt(new URLSearchParams(window.location.search).get('flip'), 10)
  return Number.isFinite(v) ? Math.min(6000, Math.max(200, v)) : FLIP_MS
}

// Stroke icons — the exact facility/placeholder icon language already on the page
// (Infrastructure.jsx MachineIcon set), so the mock cover art matches the site.
function BookIcon({ name }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1 }
  return (
    <svg className="ib-ph-icon" viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
      {name === 'press' && (
        <>
          <path d="M8 30h32M8 30V16a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v14" {...s} />
          <path d="M14 30v8h20v-8M20 14v-4h8v4" {...s} />
          <path d="M18 22h12" {...s} />
        </>
      )}
      {name === 'tower' && (
        <>
          <rect x="10" y="6" width="28" height="36" rx="2" {...s} />
          <path d="M17 14h14M17 22h14M17 30h14" {...s} />
          <circle cx="24" cy="24" r="6" {...s} />
        </>
      )}
      {name === 'carton' && (
        <>
          <path d="M24 6 8 14v20l16 8 16-8V14L24 6Z" {...s} />
          <path d="M8 14l16 8 16-8M24 22v20M24 22 16 10M32 10l-8 4" {...s} />
        </>
      )}
      {name === 'soon' && ( /* reserved slot — a dashed frame with a plus, "content lands here" */
        <>
          <rect x="9" y="9" width="30" height="30" rx="3" strokeDasharray="3 4" {...s} />
          <path d="M24 18v12M18 24h12" {...s} />
        </>
      )}
    </svg>
  )
}

// The left page — the read. Cream ground, navy ink. Shape depends on the leaf kind:
// a COVER (big facility title), an OVERVIEW (body copy), AT A GLANCE (a headline
// stat/location), or the RESERVED placeholder (title + a soft "coming soon" line).
function LeftPage({ pg }) {
  return (
    <div className="ib-face ib-face--text" aria-hidden="true">
      <div className="ib-eyebrow">{pg.eyebrow}</div>
      {pg.kind === 'glance' ? (
        <p className="ib-glance">{pg.big}</p>
      ) : (
        <>
          <h4 className={`ib-title${pg.kind === 'cover' ? ' ib-title--cover' : ''}${pg.kind === 'placeholder' ? ' ib-title--soon' : ''}`}>
            {pg.title}
          </h4>
          {pg.body && <p className={`ib-body${pg.kind === 'placeholder' ? ' ib-body--soon' : ''}`}>{pg.body}</p>}
        </>
      )}
    </div>
  )
}

// The right page — the designed MOCK cover panel standing in for a facility photo
// (a real image drops straight in later). Deep-navy ground, a faint tonal dot grid,
// the book's gold stroke mark and a DM Mono caption — plus the Cases inner-spine
// shadow up the bound edge and a soft page-curl catch, so it reads as a real page.
function RightPage({ icon, caption }) {
  return (
    <div className="ib-face ib-face--panel" aria-hidden="true">
      <div className="ib-ph-pattern" />
      <div className="ib-ph-mark">
        <BookIcon name={icon} />
        <span className="ib-ph-cap">{caption}</span>
      </div>
      <span className="ib-spine-shadow" />
      <span className="ib-curl" />
    </div>
  )
}

const num = (n) => String(n).padStart(2, '0')

export default function FacilityBook() {
  const { t } = useTranslation('homeInfraSection')
  const reduced = useReducedMotion()
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  const [activeBook, setActiveBook] = useState(0)
  const [page, setPage] = useState(0)      // current leaf within the open book
  const [xfade, setXfade] = useState(0)     // bumps to re-trigger the crossfade
  const [flip, setFlip] = useState(null)    // { from, dir } while a leaf is turning
  const busy = useRef(false)
  const timer = useRef(null)
  const sectionRef = useRef(null)
  const inView = useRef(false)              // ≥50% of the stack fills the viewport
  const stepRef = useRef(() => {})          // latest go() stepper for the window listener
  const flipMs = useRef(FLIP_MS)
  useEffect(() => { flipMs.current = readFlipMs() }, [])
  const flat = !reduced && !narrow          // leaf turn only when it reads well

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  // Page-turn SFX — lazy Audio on mount, preloaded, silent if the file 404s.
  const turnAudio = useRef(null)
  useEffect(() => {
    const a = new Audio(TURN_SRC)
    a.preload = 'auto'
    a.volume = TURN_VOL
    turnAudio.current = a
    return () => { turnAudio.current = null }
  }, [])
  const playTurn = () => {
    if (!flat) return
    if (!typingSound.isEnabled()) return
    const a = turnAudio.current
    if (!a) return
    try {
      a.currentTime = 0
      const p = a.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch { /* file missing / not ready — stay silent, never throw */ }
  }

  // Resolve the active book into its ordered pages (leaves). Books 1–3 paginate the
  // existing facility copy into cover / overview / at-a-glance; a reserved book is a
  // single graceful placeholder leaf. `coverCaption` is the mock panel's label —
  // shared across a book's pages so its cover art stays consistent as you flip.
  const book = BOOKS[activeBook]
  const buildPages = (b) => {
    if (b.placeholder) {
      return {
        coverCaption: t(`books.${b.id}.cover`),
        pages: [{
          kind: 'placeholder',
          eyebrow: t(`books.${b.id}.eyebrow`),
          title: t(`books.${b.id}.title`),
          body: t(`books.${b.id}.body`),
        }],
      }
    }
    return {
      coverCaption: t(`facilities.${b.src}.ph`),
      pages: [
        { kind: 'cover', eyebrow: `${t('books.ui.coverEyebrow')} ${b.id}`, title: t(`facilities.${b.src}.title`) },
        { kind: 'text', eyebrow: t('books.ui.overviewEyebrow'), body: t(`facilities.${b.src}.body`) },
        { kind: 'glance', eyebrow: t('books.ui.glanceEyebrow'), big: t(`facilities.${b.src}.caption`) },
      ],
    }
  }
  const { coverCaption, pages } = buildPages(book)
  const total = pages.length

  // Turn to a page within the OPEN book — one leaf at a time, input locked mid-flip.
  const go = (target) => {
    if (busy.current || target === page || target < 0 || target >= total) return
    const dir = target > page ? 'next' : 'prev'
    if (!flat) {
      setPage(target)
      setXfade((k) => k + 1) // instant crossfade — no leaf turn
      return
    }
    busy.current = true
    playTurn()
    setFlip({ from: page, dir })
    setPage(target)
    timer.current = setTimeout(() => {
      setFlip(null)
      busy.current = false
    }, flipMs.current)
  }

  // Switch to a different book — a jump, not a leaf turn: crossfade in on page 1.
  // Guarded by the same input lock so it can't collide with a running page turn.
  const openBook = (target) => {
    if (busy.current || target === activeBook || target < 0 || target >= BOOKS.length) return
    setFlip(null)
    setActiveBook(target)
    setPage(0)
    setXfade((k) => k + 1)
    playTurn()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(page + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(page - 1) }
  }

  // FOCUS-FREE ARROW KEYS — the open book answers ← → the moment the stack fills
  // ≥50% of the VIEWPORT (coverage, not the section's own ratio, exactly as Cases
  // measures it). `stepRef` always holds the latest go() closure.
  useEffect(() => { stepRef.current = (dir) => go(page + dir) })

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
      go(dx < 0 ? page + 1 : page - 1)
    }
    touch.current = null
  }

  // Build the two base pages + (when flipping) the turning leaf's faces — the SAME
  // leaf geometry Cases uses: a right-half leaf hinged on the spine, 0° → −180° for
  // NEXT, −180° → 0° for PREV. Left = text page, right = mock cover panel.
  const cur = pages[page]
  let baseLeft = cur, baseRight = cur, leafFront = null, leafBack = null
  if (flip) {
    const oldP = pages[flip.from]
    const nu = pages[page]
    if (flip.dir === 'next') {
      baseLeft = oldP; baseRight = nu; leafFront = oldP; leafBack = nu
    } else {
      baseLeft = nu; baseRight = oldP; leafFront = nu; leafBack = oldP
    }
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
        {/* LEFT RAIL — five gold-underline nav buttons */}
        <nav className="ib-nav" aria-label={regionLabel}>
          {BOOKS.map((b, i) => {
            const label = b.placeholder ? t(`books.${b.id}.eyebrow`) : t(`facilities.${b.src}.title`)
            const titleFull = b.placeholder ? t(`books.${b.id}.title`) : t(`facilities.${b.src}.title`)
            const isActive = i === activeBook
            return (
              <button
                key={b.id}
                type="button"
                className={`ib-nav-button${isActive ? ' ib-nav-button--active' : ''}${b.placeholder ? ' ib-nav-button--soon' : ''}`}
                onClick={() => openBook(i)}
                aria-label={t('books.ui.open', { title: `${titleFull} (${num(i + 1)} / ${num(BOOKS.length)})` })}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="ib-nav-label">{label}</span>
                <span className="ib-nav-underline" aria-hidden="true" />
              </button>
            )
          })}
        </nav>

        {/* THE OPEN BOOK */}
        <div className="ib-book-wrap">
          <div
            className={`ib-book${flip ? ` is-flipping is-${flip.dir}` : ''}`}
            data-mode={flat ? 'flip' : 'flat'}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="ib-ribbon" aria-hidden="true" />
            <div className="ib-counter" aria-live="polite">
              {t('books.ui.pageWord').toUpperCase()} {num(page + 1)} <span className="ib-counter-sep">/</span> {num(total)}
              <span className="ib-sr">{cur.title || cur.big || cur.eyebrow}</span>
            </div>

            <div className="ib-spread" key={flat ? `b${activeBook}` : `x${activeBook}-${xfade}`}>
              <div className="ib-page ib-page--left"><LeftPage pg={baseLeft} /></div>
              <div className="ib-page ib-page--right"><RightPage icon={book.icon} caption={coverCaption} /></div>

              {flip && (
                <div className="ib-leaf" style={{ animationDuration: `${flipMs.current - 40}ms` }}>
                  <div className="ib-leaf-face ib-leaf-front"><RightPage icon={book.icon} caption={coverCaption} /></div>
                  <div className="ib-leaf-face ib-leaf-back"><LeftPage pg={leafBack} /></div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="ib-arrow ib-arrow--prev"
              onClick={() => go(page - 1)}
              disabled={page === 0}
              aria-label={t('books.ui.prev')}
            >
              ←
            </button>
            <button
              type="button"
              className="ib-arrow ib-arrow--next"
              onClick={() => go(page + 1)}
              disabled={page === total - 1}
              aria-label={t('books.ui.next')}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
