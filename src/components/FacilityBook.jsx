import { useEffect, useRef, useState } from 'react'
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
  { cy: 92,   left: 12, width: 73, height: 12 }, // Corporate Headquarters (slate)
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
// client photo set is wired per facility — web 9 · sheetfed 8 · binding 11 ·
// warehouse 6 · head office 1 — flipped through on the right page (contain-fit, so
// portrait + panoramic shots letterbox on the navy page, never crop).
const seq = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`)
const BOOKS = [
  { id: '01', base: 'facilities.01', images: seq('web-machines', 9), Icon: Printer, pIcons: [Stack, Ruler, BookOpen, Gauge] },
  { id: '02', base: 'facilities.02', images: seq('sheetfed', 8), Icon: StackSimple, pIcons: [GearSix, Target, Books, Palette] },
  { id: '03', base: 'facilities.03', images: seq('binding', 11), Icon: BookOpenText, pIcons: [BookOpen, PushPin, Needle, Books] },
  { id: '04', base: 'books.04', images: seq('warehousing', 6), Icon: Warehouse, pIcons: [Package, Stack, Truck, GlobeHemisphereWest] },
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

// Walk a facility's wired images into SPREADS. Spread 0 pairs the text read with the
// first photo; every spread after pairs the remaining photos two-at-a-time (left,
// right). ODD leftover (a facility with an EVEN photo count): the last image becomes
// a `solo` spread — one photo centred across the spread — so nothing is ever blank
// and no image repeats. Current counts: web 9 / binding 11 → clean pairs; sheetfed 8
// / warehouse 6 → close on a solo photo; head office 1 → a single spread.
const BLANK = { kind: 'blank' }
function buildSpreads(book) {
  if (!book) return []
  const imgs = book.images || []
  const spreads = [{ left: { kind: 'text' }, right: imgs[0] ? { kind: 'photo', src: imgs[0] } : BLANK }]
  for (let i = 1; i < imgs.length; i += 2) {
    const l = imgs[i]
    const r = imgs[i + 1]
    if (r) spreads.push({ left: { kind: 'photo', src: l }, right: { kind: 'photo', src: r } })
    else spreads.push({ solo: { kind: 'photo', src: l } })
  }
  return spreads
}

// A photo page — the contain-fit facility image (letterboxed on the navy page so the
// client's mixed portrait / panoramic shots never crop).
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
  const [hasTurned, setHasTurned] = useState(false) // first turn stops the arrow pulse for good
  const busy = useRef(false)
  const timer = useRef(null)
  const sectionRef = useRef(null)
  const inView = useRef(false)                      // ≥50% of the stack fills the viewport
  const stepRef = useRef(() => {})
  const flipMs = useRef(FLIP_MS)
  useEffect(() => { flipMs.current = readFlipMs() }, [])

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
    if (busy.current || isIntro || target === safeSpread || target < 0 || target >= totalSpreads) return
    if (!hasTurned) setHasTurned(true)
    const dir = target > safeSpread ? 'next' : 'prev'
    const soloEnds = spreads[safeSpread]?.solo || spreads[target]?.solo
    if (!canFlip || soloEnds) {
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
  const select = (target) => {
    if (busy.current || target === activeBook || target < -1 || target >= BOOKS.length) return
    setFlip(null)
    setActiveBook(target)
    setSpread(0)
    setXfade((k) => k + 1)
    playTurn()
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

  // The facility read — icon badge, title, orange rule, intro, feature points.
  const renderText = () => (
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
  )

  // A base page zone (left or right) for whatever face the current spread carries.
  const renderZone = (face, side) => {
    const cls = side === 'left' ? 'ib-imgpage--left' : 'ib-imgpage--right'
    if (face.kind === 'text') return renderText()
    if (face.kind === 'photo') {
      return <div className={`ib-imgpage ${cls}`}><PhotoFrame src={face.src} /></div>
    }
    return <div className={`ib-imgpage ${cls} ib-blankpage`} aria-hidden="true" />
  }

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
  const showTurn = !isIntro && totalSpreads > 1
  const pulse = showTurn && !hasTurned && !reduced

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

  return (
    <div className="ib-stage" ref={sectionRef} data-theme="dark">
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

        {/* THE OPEN BOOK — the art-backed spread that turns */}
        <div className="ib-book-wrap">
          <div
            className={`ib-book${flip ? ` is-flipping is-${flip.dir}` : ''}`}
            data-mode={canFlip ? 'flip' : 'flat'}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="ib-spread" key={canFlip ? `b${activeBook}` : `x${activeBook}-${safeSpread}-${xfade}`}>
              {isIntro ? (
                <>
                  {/* OVERVIEW (resting) — full text takeover, no photo. LEFT: the
                      Infrastructure overview + four capability pillars. */}
                  <div className="ib-textpage ib-intro-left">
                    <h3 className="ib-intro-title">{title}</h3>
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
                    <h4 className="ib-intro-rhead">{t('books.intro.rightHeading')}</h4>
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
              ) : cur.solo ? (
                // ODD leftover — one photo centred across the spread, repeat-free.
                <div className="ib-imgpage ib-imgpage--solo"><PhotoFrame src={cur.solo.src} /></div>
              ) : (
                <>
                  {/* BASE PAGES — the destination spread's left + right faces. During a
                      turn the leaf covers whichever base page is mid-swap. */}
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
                disabled={safeSpread === 0}
                aria-label={t('books.ui.prev')}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                className={`ib-nav ib-nav--next${pulse ? ' is-pulsing' : ''}`}
                onClick={() => go(safeSpread + 1)}
                disabled={safeSpread === totalSpreads - 1}
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
        </div>
      </div>
    </div>
  )
}
