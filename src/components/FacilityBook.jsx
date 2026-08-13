import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Printer, StackSimple, BookOpenText, Warehouse, Buildings, Stack, Gauge, Palette,
  BookOpen, GearSix, Target, Books, Needle, Package, Truck, UsersThree,
  GlobeHemisphereWest, Ruler, PushPin, Headset, Factory, Cpu, SealCheck, Sparkle,
  House,
} from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { typingSound } from '@/lib/typingSound'
import './FacilityBook.css'

const STACK_IMG = '/site-assets/homepage/facility-book/book-stack.webp'
const IMG = (name) => `/site-assets/homepage/facility-book/${name}.webp`

// FLOW book-stack render drives the pile. Flip to false (or an image 404 → onError)
// to fall back to the CSS-built pile below — cheap insurance.
const USE_IMAGE_STACK = true

// The stack ART is now WORDLESS (colour-coded spines, no baked text) so labels
// translate. Each entry places one HTML label centred on that spine's front face:
// cy = vertical centre of the colour band, left/width span the face, height is the
// click zone. All-% so they track the transparent render at every container width
// (measured off book-stack.webp: blue/orange/green/red/slate faces between the four
// white page blocks). Order matches BOOKS.
const SPINE_POS = [
  { cy: 10.5, left: 12, width: 73, height: 13 }, // Web Offset (blue)
  { cy: 31.5, left: 12, width: 73, height: 13 }, // Sheet Fed (orange)
  { cy: 53,   left: 12, width: 73, height: 13 }, // Binding and Finishing (green)
  { cy: 74,   left: 12, width: 73, height: 13 }, // Warehouse (red)
  { cy: 94,   left: 12, width: 73, height: 12 }, // Corporate Headquarters (slate) — cy measured off book-stack.webp (slate band centre = 94%)
]

// ── Facility Book — Infrastructure section & /infrastructure page ──────────────
// A stack of five colour-coded hardcover books (the left rail); click a spine to
// OPEN that facility into the two-page spread on the right, or hit the ⌂ Overview
// pill to return to the resting Infrastructure intro. The spread IS the open-book
// art (navy hardcover, cream pages) and it TURNS — a CSS-3D leaf folds over the
// spine and BOTH pages change:
//   • The RESTING / Overview state is a full TEXT takeover across both pages — the
//     Infrastructure intro on the left, the "As of July 2026…" spec list on the
//     right (no photo). This is the default on load.
//   • A facility book walks a set of SPREADS:
//       SPREAD 1 = the facility read (left) + photo 1 (right)
//       SPREAD 2+ = photos on BOTH sides (photo 2 left, photo 3 right, …)
//     A facility with an EVEN photo count leaves one over: it closes on a single
//     photo centred across the spread (repeat-free). ← → / arrows / swipe turn the
//     whole spread with the fold animation, both ways.
//
// Each book's title/body live under a single i18n base: facilities.01–03 for the
// first three, books.04/05 for the last two. Its images ship at
// /site-assets/homepage/facility-book/<name>-NN.webp (overwrite-to-swap). The full
// facility photo set is wired per facility — web 9 · sheetfed 8 · binding 11 ·
// warehouse 6 · head office 1 — flipped through on the right page (contain-fit, so
// portrait + panoramic shots letterbox on the navy page, never crop).
const seq = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`)
const BOOKS = [
  { id: '01', base: 'facilities.01', images: seq('web-machines', 9), Icon: Printer, pIcons: [Stack, Ruler, BookOpen, Gauge] },
  { id: '02', base: 'facilities.02', images: seq('sheetfed', 8), Icon: StackSimple, pIcons: [GearSix, Target, Books, Palette] },
  { id: '03', base: 'facilities.03', images: seq('binding', 11), Icon: BookOpenText, pIcons: [BookOpen, PushPin, Needle, Books] },
  // Warehouse photos FIRST (racking / dispatch), paper stock AFTER (client). The
  // sequence helper ordered paper-stock first, so this list is explicit + hand-ordered:
  //   04/05/06 = storage racking + dispatch floor · 01/02/03 = paper reels + rolls.
  { id: '04', base: 'books.04', images: ['warehousing-04', 'warehousing-05', 'warehousing-06', 'warehousing-01', 'warehousing-02', 'warehousing-03'], Icon: Warehouse, pIcons: [Package, Stack, Truck, GlobeHemisphereWest] },
  { id: '05', base: 'books.05', images: seq('head-office', 1), Icon: Buildings, pIcons: [Palette, Headset, UsersThree, Buildings] },
]

// Intro spread — LEFT-page pillar row (4) and RIGHT-page spec list (7). Icons are
// picked here (brand navy/orange only, never the reference's rainbow); the labels
// and numbers come from the locale so they translate.
const PILLAR_ICONS = [Factory, Cpu, GlobeHemisphereWest, SealCheck]
const SPEC_ICONS = [Printer, StackSimple, BookOpen, PushPin, Needle, Books, Sparkle]

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
const FLIP_MS = 560          // JS input lock ≈ the CSS leaf turn
const num = (n) => String(n).padStart(2, '0')

// QA seam: `?flip=<ms>` slows the leaf turn so a mid-flip frame can be captured;
// drives BOTH the CSS animation-duration and the JS input lock.
function readFlipMs() {
  if (typeof window === 'undefined') return FLIP_MS
  const v = parseInt(new URLSearchParams(window.location.search).get('flip'), 10)
  return Number.isFinite(v) ? Math.min(6000, Math.max(200, v)) : FLIP_MS
}

// TALL (portrait / squareish) images fill a single page; everything else is a
// LANDSCAPE (16:9-ish) that fills a full double-page spread. Derived from the
// shipped assets' aspect ratios — update this set if a swapped-in file changes
// orientation (the folder README lists the expected shape per slot).
const TALL = new Set([
  'web-machines-03', 'web-machines-08', 'web-machines-09',
  'sheetfed-08', 'binding-04',
  // binding-09 is now the Aster Automatic (landscape 3:2) — spans a double page.
])
const isLand = (src) => !TALL.has(src)

// Walk a facility's wired images into SPREADS under the image-system rules:
//   • Spread 0  = the facility read (left) + the first TWO 16:9s stacked to fill the
//                 tall right page (`intro0`).
//   • Landscape = a full DOUBLE-PAGE spread, one image across both pages (`double`).
//   • Tall      = a full single page; consecutive talls pair two-per-spread (`pair`),
//                 a lone leftover shows centred on one page (`solo`).
// Corporate Headquarters (id 05) is left UNTOUCHED: its single tall photo keeps the
// original read-left / photo-right single spread.
// Chunk a flat, ordered photo list into 2-3-photo groups for the mobile deck
// (Lane A · Task 2). Greedy by 3; if the final remainder would leave a lone
// orphaned photo (n % 3 === 1), the last two groups become 2+2 instead of
// ...+3+1 so no page ever shows a single photo when 2+ are available.
function chunkPhotos(list) {
  const n = list.length
  if (n <= 3) return n ? [list] : []
  const groups = []
  let i = 0
  if (n % 3 === 1) {
    const full3Count = Math.floor(n / 3) - 1
    for (let g = 0; g < full3Count; g++) { groups.push(list.slice(i, i + 3)); i += 3 }
    groups.push(list.slice(i, i + 2)); i += 2
    groups.push(list.slice(i, i + 2)); i += 2
  } else {
    while (i < n) { groups.push(list.slice(i, Math.min(i + 3, n))); i += 3 }
  }
  return groups
}

const BLANK = { kind: 'blank' }
function buildSpreads(book) {
  if (!book) return []
  const imgs = book.images || []
  if (book.id === '05') {
    return [{ t: 'base', left: { kind: 'text' }, right: imgs[0] ? { kind: 'photo', src: imgs[0] } : BLANK }]
  }
  const spreads = []
  const lands = imgs.filter(isLand)
  const stack = lands.slice(0, 2)                     // the two 16:9s for the first spread
  spreads.push({ t: 'intro0', stack })
  const used = new Set(stack)
  const rest = imgs.filter((s) => !used.has(s))       // keep original order
  let buf = []
  const flush = () => {
    if (buf.length === 2) spreads.push({ t: 'pair', left: { kind: 'photo', src: buf[0] }, right: { kind: 'photo', src: buf[1] } })
    else if (buf.length === 1) spreads.push({ t: 'solo', solo: { kind: 'photo', src: buf[0] } })
    buf = []
  }
  for (const src of rest) {
    if (isLand(src)) { flush(); spreads.push({ t: 'double', src }) }
    else { buf.push(src); if (buf.length === 2) flush() }
  }
  flush()
  return spreads
}

// A photo page — the contain-fit facility image (letterboxed on the navy page so the
// mixed portrait / panoramic shots never crop).
function PhotoFrame({ src }) {
  return (
    <div className="ib-img-frame">
      <img
        className="ib-img"
        key={src}
        src={IMG(src)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </div>
  )
}

export default function FacilityBook() {
  const { t } = useTranslation('homeInfraSection')
  const reduced = useReducedMotion()
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  const [activeBook, setActiveBook] = useState(-1) // -1 = intro/overview spread, 0+ = book index
  const [imgOk, setImgOk] = useState(true)          // FLOW stack photo loaded? false → CSS pile
  const [spread, setSpread] = useState(0)           // current spread within the open book
  const [xfade, setXfade] = useState(0)             // bumps to re-trigger the crossfade
  const [flip, setFlip] = useState(null)            // { from, dir } while a leaf is turning
  const [hasTurned, setHasTurned] = useState(false) // first turn stops the nav-arrow pulse for good
  const [hasOpened, setHasOpened] = useState(false) // first book opened → stop the "click a book" hint pulse + dim the spine arrows
  const [deckPage, setDeckPage] = useState(0)       // Round 2 Lane 3 — current card in the mobile horizontal swipe deck (native scroll = source of truth)
  const [viewer, setViewer] = useState(null)        // Lane A · Task 3 — { photos, idx } while the fullscreen photo viewer is open, else null
  const busy = useRef(false)
  const timer = useRef(null)
  const sectionRef = useRef(null)
  const bookWrapRef = useRef(null)                  // the open book column (desktop)
  const deckRef = useRef(null)                      // the mobile scroll-snap deck scroller
  const deckRaf = useRef(0)
  const inView = useRef(false)                      // ≥50% of the stack fills the viewport
  const stepRef = useRef(() => {})
  const flipMs = useRef(FLIP_MS)
  useEffect(() => { flipMs.current = readFlipMs() }, [])

  // Page-turn cursor hint: a subtle "Turn →" pill that follows the pointer over the
  // open book and, on click, turns to the next spread. Desktop turnable state only
  // (canFlip && showTurn); updated via the ref so mousemove never re-renders.
  const turnCursorRef = useRef(null)
  const moveTurnCursor = (e) => {
    const el = turnCursorRef.current
    const wrap = el?.parentElement
    if (!el || !wrap) return
    const r = wrap.getBoundingClientRect()
    el.style.left = `${e.clientX - r.left}px`
    el.style.top = `${e.clientY - r.top}px`
    el.style.opacity = '1'
  }
  const hideTurnCursor = () => { if (turnCursorRef.current) turnCursorRef.current.style.opacity = '0' }

  // The CSS-3D leaf turn only reads well with room + motion allowed; narrow / reduced
  // fall back to a silent crossfade.
  const canFlip = !reduced && !narrow

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

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
  const spreads = book ? buildSpreads(book) : []
  const totalSpreads = spreads.length
  const safeSpread = Math.min(spread, Math.max(0, totalSpreads - 1))

  // Facility read copy (the text page).
  const title = book ? t(`${book.base}.title`) : t('books.intro.heading')
  const facIntro = book ? t(`${book.base}.intro`) : ''
  const rawPoints = book ? t(`${book.base}.points`, { returnObjects: true }) : []
  const points = Array.isArray(rawPoints) ? rawPoints : []

  // Intro spread copy — left-page pillars + right-page spec list (localised).
  const rawPillars = isIntro ? t('books.intro.pillars', { returnObjects: true }) : []
  const pillars = Array.isArray(rawPillars) ? rawPillars : []
  const rawSpecs = isIntro ? t('books.intro.list', { returnObjects: true }) : []
  const specs = Array.isArray(rawSpecs) ? rawSpecs : []

  // Turn to a spread within the OPEN book — one leaf at a time, input locked mid-turn.
  // A `solo` spread on either side of the turn can't ride the two-face leaf, so those
  // transitions fall back to the crossfade (as do narrow / reduced-motion).
  const go = (target) => {
    if (busy.current || isIntro) return
    // Cross-section roll-over: turning PAST the last spread opens the NEXT facility at
    // its first spread; turning BEFORE the first opens the PREVIOUS facility at its last
    // spread — so a visitor reads all five books front to back with the right arrow
    // alone. The very first / very last spread stop cleanly (their arrow is disabled).
    if (target >= totalSpreads) {
      if (activeBook < BOOKS.length - 1) { if (!hasTurned) setHasTurned(true); select(activeBook + 1, 0) }
      return
    }
    if (target < 0) {
      if (activeBook > 0) { if (!hasTurned) setHasTurned(true); select(activeBook - 1, 'last') }
      return
    }
    if (target === safeSpread) return
    if (!hasTurned) setHasTurned(true)
    const dir = target > safeSpread ? 'next' : 'prev'
    // The two-face leaf can only carry a photo↔photo turn (both spreads `pair`). Any
    // spread involving a double-page image, the intro stack or a solo turns as one
    // unit via the crossfade (narrow / reduced motion crossfade too).
    const leafable = (s) => s && s.t === 'pair'
    const canLeaf = canFlip && leafable(spreads[safeSpread]) && leafable(spreads[target])
    if (!canLeaf) {
      playTurn()
      setSpread(target)
      setXfade((k) => k + 1) // instant crossfade — no leaf turn
      return
    }
    busy.current = true
    playTurn()
    setFlip({ from: safeSpread, dir })
    setSpread(target)
    timer.current = setTimeout(() => {
      setFlip(null)
      busy.current = false
    }, flipMs.current)
  }

  // Jump to a different book (0+) or back to the Overview (-1) — a crossfade, never a
  // leaf turn. Guarded by the same input lock so it can't collide with a running turn.
  const select = (target, spreadTarget = 0) => {
    if (busy.current || target < -1 || target >= BOOKS.length) return
    // clicking the already-open book's spine is a no-op; the cross-section roll-over
    // always targets a DIFFERENT book, so it passes this guard.
    if (target === activeBook && (spreadTarget === 0 || spreadTarget === safeSpread)) return
    if (target >= 0 && !hasOpened) setHasOpened(true)
    setFlip(null)
    setActiveBook(target)
    // 'last' resolves to the destination book's final spread (previous-facility roll-over).
    let s = spreadTarget === 'last' && target >= 0 ? Math.max(0, buildSpreads(BOOKS[target]).length - 1) : spreadTarget
    setSpread(typeof s === 'number' ? s : 0)
    setXfade((k) => k + 1)
    playTurn()
    // Round 2 Lane 3 — the earlier lane's mobile auto-scroll (bookWrapRef into view on
    // spine tap) is GONE: on mobile the chip selector and the swipe deck are adjacent,
    // so a chip tap swaps content in place with no scroll jump. The deck-reset effect
    // (below) slides the deck back to page 1 on any facility change. Desktop is
    // unaffected (it never auto-scrolled).
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(safeSpread + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(safeSpread - 1) }
  }

  // FOCUS-FREE ARROW KEYS — the open book answers ← → the moment the stack fills
  // ≥50% of the VIEWPORT. `stepRef` always holds the latest go() closure.
  useEffect(() => { stepRef.current = (dir) => go(safeSpread + dir) })

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
      go(dx < 0 ? safeSpread + 1 : safeSpread - 1)
    }
    touch.current = null
  }

  // ── MOBILE SWIPE DECK (<900px) ───────────────────────────────────────────────
  // Below 900px the flip-book is replaced by a native horizontal scroll-snap deck
  // (see the render + FacilityBook.css). Native scroll IS the source of truth: the
  // crossfade/leaf/`spread` machinery is bypassed entirely here. `deckPage` is
  // derived from scrollLeft so the counter/arrows/dots track the snapped card.
  const deckStepPx = () => {
    const el = deckRef.current
    if (!el) return 0
    const card = el.querySelector('.ib-deck-card')
    return card ? card.getBoundingClientRect().width + 12 /* gap */ : el.clientWidth
  }
  const onDeckScroll = () => {
    cancelAnimationFrame(deckRaf.current)
    deckRaf.current = requestAnimationFrame(() => {
      const el = deckRef.current
      if (!el) return
      const step = deckStepPx() || 1
      const page = Math.round(el.scrollLeft / step)
      setDeckPage((p) => (p === page ? p : page))
    })
  }
  const deckScrollTo = (page, count) => {
    const el = deckRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(page, count - 1))
    el.scrollTo({ left: clamped * deckStepPx(), behavior: reduced ? 'auto' : 'smooth' })
  }
  // Any facility change (chip tap, Overview return) resets the deck to page 1.
  useEffect(() => {
    if (!narrow) return
    const el = deckRef.current
    if (el) el.scrollLeft = 0
    setDeckPage(0)
  }, [activeBook, narrow])

  // ── FULLSCREEN PHOTO VIEWER (<900px only) — Lane A · Task 3. Tap any photo in the
  // deck to open a fullscreen overlay over the WHOLE facility's photo list (across
  // its pages, in order), swipeable left/right, with a close (×), a position
  // indicator, and pinch-zoom free from the native <img> — no zoom code written.
  // Mirrors the site's proven Gallery lightbox pattern (OurStory.jsx `Gallery`):
  // keyboard nav, a Tab trap, body-scroll lock, focus into the dialog on open and
  // back to the tapped photo on close — all in one effect keyed on `viewer`, so
  // every close path (×, Escape, backdrop tap, swipe-to-end-then-close) runs the
  // same cleanup and can never leave scroll locked or focus stranded.
  const viewerDialogRef = useRef(null)
  const lastTappedRef = useRef(null)
  const wasViewerOpen = useRef(false)
  const viewerTouch = useRef(null)

  const openViewer = (photos, idx, triggerEl) => {
    lastTappedRef.current = triggerEl || null
    setViewer({ photos, idx })
  }
  const closeViewer = () => setViewer(null)
  const viewerGo = (delta) => {
    setViewer((v) => {
      if (!v) return v
      const n = v.photos.length
      return { ...v, idx: (v.idx + delta + n) % n }
    })
  }

  useEffect(() => {
    if (!viewer) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeViewer() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); viewerGo(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); viewerGo(1) }
      else if (e.key === 'Tab') {
        const f = viewerDialogRef.current?.querySelectorAll('button')
        if (!f || !f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => viewerDialogRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      cancelAnimationFrame(raf)
    }
  }, [viewer])

  // Return focus to the tapped photo when the overlay closes (any close path).
  useEffect(() => {
    if (wasViewerOpen.current && !viewer) lastTappedRef.current?.focus?.()
    wasViewerOpen.current = !!viewer
  }, [viewer])

  // Decisive horizontal drag only — mirrors the book-spread swipe below, never
  // preventDefault()s, so a native edge-swipe / back-gesture is never trapped.
  const onViewerTouchStart = (e) => { viewerTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onViewerTouchEnd = (e) => {
    if (!viewerTouch.current) return
    const dx = e.changedTouches[0].clientX - viewerTouch.current.x
    const dy = e.changedTouches[0].clientY - viewerTouch.current.y
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      viewerGo(dx < 0 ? 1 : -1)
    }
    viewerTouch.current = null
  }

  // The facility read — icon badge, title, orange rule, intro, feature points.
  const renderText = () => (
    <div className="ib-textpage ib-facpage">
      <span className="ib-fac-dots" aria-hidden="true" />
      <span className="ib-fac-badge" aria-hidden="true">
        {book.Icon && <book.Icon weight="light" size={24} />}
      </span>
      <h2 className="ib-facpage-title">{title}</h2>
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
  )

  // A base page zone (left or right) for whatever face the current spread carries.
  const renderZone = (face, side) => {
    const cls = side === 'left' ? 'ib-imgpage--left' : 'ib-imgpage--right'
    if (!face) return <div className={`ib-imgpage ${cls} ib-blankpage`} aria-hidden="true" />
    if (face.kind === 'text') return renderText()
    if (face.kind === 'photo') {
      return <div className={`ib-imgpage ${cls}`}><PhotoFrame src={face.src} /></div>
    }
    return <div className={`ib-imgpage ${cls} ib-blankpage`} aria-hidden="true" />
  }

  // ── MOBILE DECK PAGES (<900px) — flatten the desktop SPREADS (built for a two-page
  // book) into a flat, order-preserving photo list, exactly as before, then regroup
  // into 2-3-photo pages (Lane A · Task 2: a single 16:9 photo rendered small in a
  // tall uniform card wasted the page; stacking 2-3 per page fills it instead). Page 1
  // is always the facility READ (the cream text card); every following page is a
  // photo group, each stamped with its startIdx into the flat list so a tapped photo
  // (Lane A · Task 3) can open the fullscreen viewer at the right position and swipe
  // through the WHOLE facility, not just its own page. All curation from buildSpreads
  // is preserved — we just re-flatten its photos in order, then chunk. Reuses
  // renderText() verbatim; desktop is untouched (buildSpreads / the flip-book render
  // path never call this).
  const buildFacilityPhotos = () => {
    if (isIntro || !book) return []
    const photos = []
    for (const sp of spreads) {
      if (sp.t === 'intro0') (sp.stack || []).forEach((s) => photos.push(s))
      else if (sp.t === 'double') photos.push(sp.src)
      else if (sp.t === 'solo') {
        // Binding & Finishing's solo carries the diptych + trimmer plate on desktop;
        // on the phone they become their own photos ahead of the solo shot.
        if (book.id === '03') {
          photos.push('binding-finishing-diptych')
          photos.push('binding-finishing-trimmer')
        }
        if (sp.solo?.src) photos.push(sp.solo.src)
      } else {
        if (sp.left?.kind === 'photo') photos.push(sp.left.src)
        if (sp.right?.kind === 'photo') photos.push(sp.right.src)
      }
    }
    return photos
  }
  const facilityPhotos = buildFacilityPhotos()
  const buildMobilePages = () => {
    if (isIntro || !book) return []
    const groups = chunkPhotos(facilityPhotos)
    let offset = 0
    const pages = [{ kind: 'read' }]
    for (const g of groups) {
      pages.push({ kind: 'photoGroup', srcs: g, startIdx: offset })
      offset += g.length
    }
    return pages
  }
  const mobilePages = buildMobilePages()

  // ── Resolve the two base faces + (while turning) the leaf's two faces ──────────
  // The SAME leaf geometry the original used: a right-half page hinged on the spine,
  // 0° → −180° for NEXT, −180° → 0° for PREV. Base pages show the DESTINATION spread;
  // the leaf carries the folding faces over whichever base page is mid-swap. Because
  // spread 0's left is the only text face and it never rides the leaf, the turning
  // leaf is always photo↔photo.
  const cur = spreads[safeSpread] || { left: BLANK, right: BLANK }
  let baseLeft = cur.left, baseRight = cur.right, leafFront = null, leafBack = null
  if (flip) {
    const oldS = spreads[flip.from] || cur
    if (flip.dir === 'next') {
      baseLeft = oldS.left; baseRight = cur.right; leafFront = oldS.right; leafBack = cur.left
    } else {
      baseLeft = cur.left; baseRight = oldS.right; leafFront = cur.right; leafBack = oldS.left
    }
  }

  const regionLabel = t('books.ui.region')
  const overviewLabel = t('books.ui.overview')
  // A facility is open → the arrows show and roll across sections. Only the very first
  // spread of Web Offset and the very last spread of Corporate Headquarters stop (their
  // arrow disables); everywhere else an arrow always leads somewhere.
  const atVeryStart = activeBook <= 0 && safeSpread === 0
  const atVeryEnd = activeBook === BOOKS.length - 1 && safeSpread === totalSpreads - 1
  // Mobile deck card count: the Overview is two cards (intro + spec list); a facility
  // is its read card + one card per photo. Drives the counter/dots + arrow disabling.
  const deckCount = isIntro ? 2 : Math.max(1, mobilePages.length)
  const showTurn = !isIntro
  const pulse = showTurn && !hasTurned && !reduced
  // Turnable = the desktop flip state with somewhere forward to go. Only then does the
  // "Turn →" cursor hint appear and clicking the book turn forward.
  const turnable = showTurn && !atVeryEnd && canFlip

  const overviewPill = (
    <button
      type="button"
      className={`ib-overview${isIntro ? ' is-active' : ''}`}
      onClick={() => select(-1)}
      aria-pressed={isIntro}
    >
      <House weight={isIntro ? 'fill' : 'regular'} size={13} aria-hidden="true" />
      <span>{overviewLabel}</span>
    </button>
  )

  // DISCOVERABILITY — a DM-Mono instruction that pulses until the first book is opened
  // this session, dimming once a facility has been opened. (The hand-drawn spine arrows
  // were removed per client; the hint + the spine labels' hover glow/lift signal that
  // the stack is interactive.)
  // Client Lane C · Task 2 — the old "Click a book…" → "Tap a book…" mechanism was a
  // regex .replace(/\bClick\b/i, 'Tap') on the ONE `books.ui.hint` string. That only
  // ever worked for EN (FR/ES never contain the literal word "Click", so those locales
  // silently showed the desktop wording verbatim on mobile) — and separately, the
  // {hint} element was only ever rendered inside the desktop (!narrow) branch below, so
  // on mobile no hint rendered at all and the swap was dead code. Both are fixed here:
  // a dedicated `books.ui.hintMobile` key (translated per-locale, not derived) replaces
  // the regex, and {hint} is now also rendered inside the mobile branch.
  const hint = (
    <p className={`ib-hint${hasOpened || reduced ? ' is-done' : ''}`}>
      {narrow ? t('books.ui.hintMobile') : t('books.ui.hint')}
    </p>
  )

  return (
    <div className="ib-stage" ref={sectionRef} data-theme="dark">
      {narrow ? (
        /* ═══ MOBILE (<900px) — chip selector + horizontal swipe deck ═══════════════
           The vertical spine-stack + single stacked spread (which forced up-down
           hunting and hid that more pages existed) is replaced by: a one-line chip
           row to pick the facility, and a native scroll-snap deck of that facility's
           pages with the next card peeking ~15% as the "there's more" cue. The
           desktop flip-book below is untouched (rendered only when !narrow). */
        <>
        <div className="ib-mobile">
          {hint}
          <div className="ib-chips" role="tablist" aria-label={regionLabel}>
            <button
              type="button"
              role="tab"
              aria-selected={isIntro}
              className={`ib-chip ib-chip--ov${isIntro ? ' is-active' : ''}`}
              onClick={() => select(-1)}
            >
              <House weight={isIntro ? 'fill' : 'regular'} size={13} aria-hidden="true" />
              <span>{overviewLabel}</span>
            </button>
            {BOOKS.map((b, bi) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                aria-selected={bi === activeBook}
                className={`ib-chip${bi === activeBook ? ' is-active' : ''}`}
                onClick={() => select(bi)}
              >
                {t(`${b.base}.title`)}
              </button>
            ))}
          </div>

          <div
            className="ib-deck"
            ref={deckRef}
            onScroll={onDeckScroll}
            tabIndex={0}
            aria-label={isIntro ? overviewLabel : title}
          >
            {isIntro ? (
              <>
                <div className="ib-deck-card ib-deck-card--text">
                  <div className="ib-textpage ib-intro-left">
                    <h2 className="ib-intro-title">{title}</h2>
                    <p className="ib-intro-sub">{t('books.intro.subtitle')}</p>
                    <span className="ib-intro-rule" aria-hidden="true" />
                    <p className="ib-intro-para">{t('books.intro.para1')}</p>
                    <p className="ib-intro-para">{t('books.intro.para2')}</p>
                    <ul className="ib-pillars">
                      {pillars.map((p, i) => {
                        const PIcon = PILLAR_ICONS[i]
                        return (
                          <li key={i} className="ib-pillar">
                            <span className="ib-pillar-icon" aria-hidden="true">{PIcon && <PIcon weight="light" size={22} />}</span>
                            <span className="ib-pillar-label">{p.label}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                <div className="ib-deck-card ib-deck-card--text">
                  <div className="ib-intro-right">
                    <h3 className="ib-intro-rhead">{t('books.intro.rightHeading')}</h3>
                    <ul className="ib-speclist">
                      {specs.map((it, i) => {
                        const SIcon = SPEC_ICONS[i]
                        return (
                          <li key={i} className="ib-spec">
                            <span className="ib-spec-chip" aria-hidden="true">{SIcon && <SIcon weight="regular" size={14} />}</span>
                            <span className="ib-spec-num">{it.num || ''}</span>
                            <span className="ib-spec-text">
                              <span className="ib-spec-title">{it.title}</span>
                              {it.sub && <span className="ib-spec-sub">{it.sub}</span>}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    <p className="ib-intro-closing">{t('books.intro.closing')}</p>
                  </div>
                </div>
              </>
            ) : (
              mobilePages.map((pg, i) => (
                <div
                  className={`ib-deck-card ib-deck-card--${pg.kind === 'read' ? 'text' : 'photo'}`}
                  key={`${activeBook}-${i}`}
                >
                  {pg.kind === 'read' ? renderText() : (
                    <div className="ib-deck-photo-group">
                      {pg.srcs.map((s, gi) => (
                        <button
                          type="button"
                          className="ib-deckphoto-tap"
                          key={s}
                          onClick={(e) => openViewer(facilityPhotos, pg.startIdx + gi, e.currentTarget)}
                          aria-label={t('books.ui.viewPhoto')}
                        >
                          <div className="ib-img-frame ib-img-frame--deckgroup">
                            <img
                              className="ib-img ib-img--cover"
                              src={IMG(s)}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              draggable="false"
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="ib-deck-bar">
            <button
              type="button"
              className="ib-deck-arrow"
              onClick={() => deckScrollTo(deckPage - 1, deckCount)}
              disabled={deckPage <= 0}
              aria-label={t('books.ui.prev')}
            >
              <span aria-hidden="true">←</span>
            </button>
            <div className="ib-deck-dots" aria-hidden="true">
              {Array.from({ length: deckCount }, (_, i) => (
                <span key={i} className={`ib-deck-dot${i === Math.min(deckPage, deckCount - 1) ? ' is-on' : ''}`} />
              ))}
            </div>
            <span className="ib-deck-count" aria-live="polite">
              {t('books.ui.pageWord').toUpperCase()} {num(Math.min(deckPage, deckCount - 1) + 1)}
              <span className="ib-pagecount-sep"> / </span>{num(deckCount)}
            </span>
            <button
              type="button"
              className="ib-deck-arrow"
              onClick={() => deckScrollTo(deckPage + 1, deckCount)}
              disabled={deckPage >= deckCount - 1}
              aria-label={t('books.ui.next')}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* FULLSCREEN PHOTO VIEWER — portaled to document.body so it is never
            constrained by an ancestor's transform (the section gets a GSAP `y`
            reveal transform on scroll-in) or clipped by `.ib-stage`'s
            overflow:hidden. Mobile-only: this whole branch only exists when
            narrow === true. */}
        {viewer && createPortal(
          <div
            className="ib-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={t('books.ui.photoViewer')}
            ref={viewerDialogRef}
            tabIndex={-1}
            onClick={(e) => { if (e.target === e.currentTarget) closeViewer() }}
            onTouchStart={onViewerTouchStart}
            onTouchEnd={onViewerTouchEnd}
          >
            <button type="button" className="ib-viewer-close" onClick={closeViewer} aria-label={t('books.ui.close')}>×</button>
            {viewer.photos.length > 1 && (
              <button type="button" className="ib-viewer-nav ib-viewer-prev" onClick={() => viewerGo(-1)} aria-label={t('books.ui.prev')}>‹</button>
            )}
            <div className="ib-viewer-stage">
              <img className="ib-viewer-img" src={IMG(viewer.photos[viewer.idx])} alt="" />
            </div>
            {viewer.photos.length > 1 && (
              <button type="button" className="ib-viewer-nav ib-viewer-next" onClick={() => viewerGo(1)} aria-label={t('books.ui.next')}>›</button>
            )}
            <p className="ib-viewer-counter">{viewer.idx + 1} / {viewer.photos.length}</p>
          </div>,
          document.body,
        )}
        </>
      ) : (
      <div
        className="ib-interactive"
        role="group"
        aria-label={regionLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* LEFT RAIL — ⌂ Overview pill above the WORDLESS BOOK STACK (FLOW photo +
            HTML spine labels, or the CSS fallback pile) */}
        {USE_IMAGE_STACK && imgOk ? (
          <div className="ib-stack ib-stack--img" aria-label={regionLabel}>
            {hint}
            {overviewPill}
            <div className="ib-imgstack">
              <img
                className="ib-imgstack-photo"
                src={STACK_IMG}
                alt=""
                aria-hidden="true"
                draggable="false"
                onError={() => setImgOk(false)}
              />
              {/* one HTML label per colour spine (the art carries no text now) —
                  centred on the spine face. Hover / focus lights a soft gold glow;
                  the open book gets gold text + a bookmark dot at the leading edge. */}
              {BOOKS.map((b, bi) => {
                const label = t(`${b.base}.title`)
                const isActive = bi === activeBook
                const pos = SPINE_POS[bi]
                return (
                  <button
                    key={b.id}
                    type="button"
                    className={`ib-imglabel${isActive ? ' is-active' : ''}`}
                    style={{ top: `${pos.cy}%`, left: `${pos.left}%`, width: `${pos.width}%`, height: `${pos.height}%` }}
                    onClick={() => select(bi)}
                    aria-label={t('books.ui.open', { title: label })}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="ib-imglabel-glow" aria-hidden="true" />
                    <span className="ib-imglabel-mark" aria-hidden="true" />
                    <span className="ib-imglabel-text">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="ib-stack" aria-label={regionLabel}>
            {hint}
            {overviewPill}
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
                  onClick={() => select(bi)}
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

        {/* THE OPEN BOOK — the art-backed spread that turns. It sits on its own drop
            shadow alone (the stacked page-block behind it was removed per client). */}
        <div className={`ib-book-wrap${isIntro ? ' ib-book-wrap--intro' : ''}`} ref={bookWrapRef}>
          <div
            className={`ib-book${flip ? ` is-flipping is-${flip.dir}` : ''}${turnable ? ' ib-book--turnable' : ''}`}
            data-mode={canFlip ? 'flip' : 'flat'}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseMove={turnable ? moveTurnCursor : undefined}
            onMouseLeave={turnable ? hideTurnCursor : undefined}
            onClick={turnable ? () => go(safeSpread + 1) : undefined}
          >
            <div className="ib-spread" key={canFlip ? `b${activeBook}` : `x${activeBook}-${safeSpread}-${xfade}`}>
              {isIntro ? (
                <>
                  {/* OVERVIEW (resting) — full text takeover, no photo. LEFT: the
                      Infrastructure overview + four capability pillars. */}
                  <div className="ib-textpage ib-intro-left">
                    <h2 className="ib-intro-title">{title}</h2>
                    <p className="ib-intro-sub">{t('books.intro.subtitle')}</p>
                    <span className="ib-intro-rule" aria-hidden="true" />
                    <p className="ib-intro-para">{t('books.intro.para1')}</p>
                    <p className="ib-intro-para">{t('books.intro.para2')}</p>
                    <ul className="ib-pillars">
                      {pillars.map((p, i) => {
                        const PIcon = PILLAR_ICONS[i]
                        return (
                          <li key={i} className="ib-pillar">
                            <span className="ib-pillar-icon" aria-hidden="true">
                              {PIcon && <PIcon weight="light" size={22} />}
                            </span>
                            <span className="ib-pillar-label">{p.label}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* RIGHT: the dated spec list + closing line. */}
                  <div className="ib-intro-right">
                    <h3 className="ib-intro-rhead">{t('books.intro.rightHeading')}</h3>
                    <ul className="ib-speclist">
                      {specs.map((it, i) => {
                        const SIcon = SPEC_ICONS[i]
                        return (
                          <li key={i} className="ib-spec">
                            <span className="ib-spec-chip" aria-hidden="true">
                              {SIcon && <SIcon weight="regular" size={14} />}
                            </span>
                            <span className="ib-spec-num">{it.num || ''}</span>
                            <span className="ib-spec-text">
                              <span className="ib-spec-title">{it.title}</span>
                              {it.sub && <span className="ib-spec-sub">{it.sub}</span>}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    <p className="ib-intro-closing">{t('books.intro.closing')}</p>
                  </div>
                </>
              ) : cur.t === 'intro0' ? (
                <>
                  {/* SPREAD 1 — the facility read (left) + two 16:9s stacked to fill
                      the tall right page (no small floating photo, no dead bands). */}
                  {renderText()}
                  <div className="ib-imgpage ib-imgpage--right ib-stackpair">
                    {(cur.stack || []).map((s) => (
                      <div className="ib-img-frame ib-img-frame--stack" key={s}>
                        <img className="ib-img ib-img--cover" src={IMG(s)} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
                      </div>
                    ))}
                  </div>
                </>
              ) : cur.t === 'double' ? (
                // LANDSCAPE — one image stretched across BOTH pages, continuous through
                // the spine (never a small centred landscape on one page). No centre
                // gutter overlay: a spanning photo must read as one uncut image (client).
                <div className="ib-doublepage">
                  <div className="ib-img-frame ib-img-frame--double">
                    <img className="ib-img ib-img--cover" key={cur.src} src={IMG(cur.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
                  </div>
                </div>
              ) : cur.t === 'solo' ? (
                // Lone portrait leftover — ONE page only, never centred across the fold
                // (client). It lands on the RIGHT well within the margins; the facing
                // LEFT page is a clean cream plate carrying the facility mark + title so
                // the spread never reads as an awkwardly empty leaf.
                <>
                  {book.id === '03' ? (
                    // Binding & Finishing: the client's binding-hall diptych (top) and
                    // three-knife trimmer (bottom) replace the icon/title plate on the
                    // left page — stacked, contain-fit so the diptych reads whole, held
                    // inside the same page margin. Right page keeps its solo photo.
                    <div className="ib-imgpage ib-imgpage--left ib-stackpair">
                      <div className="ib-img-frame ib-img-frame--stack">
                        <img className="ib-img" key="bf-diptych" src={IMG('binding-finishing-diptych')} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
                      </div>
                      <div className="ib-img-frame ib-img-frame--stack">
                        <img className="ib-img" key="bf-trimmer" src={IMG('binding-finishing-trimmer')} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" />
                      </div>
                    </div>
                  ) : (
                    <div className="ib-imgpage ib-imgpage--left ib-soloplate" aria-hidden="true">
                      <span className="ib-soloplate-mark">
                        {book.Icon && <book.Icon weight="light" size={30} />}
                      </span>
                      <span className="ib-soloplate-rule" />
                      <span className="ib-soloplate-label">{title}</span>
                    </div>
                  )}
                  <div className="ib-imgpage ib-imgpage--right"><PhotoFrame src={cur.solo.src} /></div>
                </>
              ) : (
                <>
                  {/* BASE PAGES — the destination spread's left + right faces (facing
                      tall pages, or the HQ read + photo). During a photo↔photo turn the
                      leaf covers whichever base page is mid-swap. */}
                  {renderZone(baseLeft, 'left')}
                  {renderZone(baseRight, 'right')}

                  {/* THE TURNING LEAF — a double-sided page hinged on the spine. */}
                  {flip && canFlip && (
                    <div className="ib-leaf" style={{ animationDuration: `${flipMs.current}ms` }}>
                      <div className="ib-leaf-face ib-leaf-front">
                        {leafFront?.kind === 'photo' && <PhotoFrame src={leafFront.src} />}
                      </div>
                      <div className="ib-leaf-face ib-leaf-back">
                        {leafBack?.kind === 'photo' && <PhotoFrame src={leafBack.src} />}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* OBVIOUS PAGE-TURNING — solid orange arrows at the book's outer edges
              (pulsing until the first turn), a large DM Mono counter + keyboard hint. */}
          {showTurn && (
            <>
              <button
                type="button"
                className={`ib-nav ib-nav--prev${pulse ? ' is-pulsing' : ''}`}
                onClick={() => go(safeSpread - 1)}
                disabled={atVeryStart}
                aria-label={t('books.ui.prev')}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                className={`ib-nav ib-nav--next${pulse ? ' is-pulsing' : ''}`}
                onClick={() => go(safeSpread + 1)}
                disabled={atVeryEnd}
                aria-label={t('books.ui.next')}
              >
                <span aria-hidden="true">→</span>
              </button>
              <div className="ib-turnbar">
                <span className="ib-pagecount" aria-live="polite">
                  {t('books.ui.pageWord').toUpperCase()} {num(safeSpread + 1)}
                  <span className="ib-pagecount-sep"> / </span>{num(totalSpreads)}
                </span>
                <span className="ib-kbd" aria-hidden="true">← →</span>
              </div>
            </>
          )}

          {/* PAGE-TURN CURSOR — a subtle "Turn →" pill that follows the pointer over
              the open book (desktop turnable state only); click turns forward. */}
          {turnable && (
            <span className="ib-turncursor" ref={turnCursorRef} aria-hidden="true">
              {t('books.ui.turn')}<span className="ib-turncursor-arrow"> →</span>
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
