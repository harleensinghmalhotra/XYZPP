import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'
import { typingSound } from '@/lib/typingSound'
import './Cases.css'

// ── Case Studies — THE OPEN BOOK ─────────────────────────────────────────────
// Ekta's verdict on the old filmstrip: "not intuitive — the closed spines read as
// decoration, nothing signals clickability or how many stories exist." So the
// section becomes a real book you browse, and the metaphor explains itself:
//   • THE OPEN SPREAD — the active case is a two-page spread. Left page (cream):
//     eyebrow, title, country/stat pills, body copy, "Read the full case study →".
//     Right page: the case photo with an inner spine shadow + a page-curl hint.
//   • THE SHELF OF SPINES — the OTHER cases dock left as vertical book spines
//     (foil gold number, country, one-line title). Hover pulls a spine out toward
//     the viewer (the proven Projects shelf move). THE GENIUS DETAIL: the open
//     case's spine is MISSING from the shelf — a visible gap sits where it was
//     pulled, so you understand the whole system in one glance.
//   • THE PAGE TURN — switching cases turns a real leaf over the spine (CSS 3D,
//     ~520ms, ease-out). One turn at a time, input locked mid-flip, both
//     directions clean. Reduced-motion (or narrow) → instant crossfade, no flip.
//   • NAVIGATION YOU CAN FEEL — a gold ribbon bookmark = "you are here", a DM Mono
//     "CASE 0N / 0N" counter, page-corner arrow buttons, keyboard ← →, touch
//     swipe. Scroll is NEVER hijacked; interaction is click / key / swipe only.

// Structural data only — user-facing text resolves via the `homeCases` namespace.
// `hasHeadingSafe`/`hasDescSafe` mark which cards gate a named entity behind
// SHOW_MINISTRY_NAMES; `tagKeys` keeps the tag order stable per card. Ministry
// names stay gated EXACTLY as they do today — every card keeps its shape, only
// the named entity swaps for the neutral phrasing when the flag is off.
const CASES = [
  { id: '01', img: 'case-01.webp', tagKeys: ['country', 'books'], hasDescSafe: true },
  { id: '02', img: 'case-02.webp', tagKeys: ['country', 'books'], hasDescSafe: true },
  { id: '03', img: 'case-03.webp', tagKeys: ['country', 'books'], hasHeadingSafe: true, hasDescSafe: true },
]

const FLIP_MS = 560 // JS lock slightly longer than the 520ms CSS leaf turn

// Page-turn SFX — a quiet paper fold that fires the instant a leaf starts turning.
// One recording, one <Audio> element: we reset currentTime to 0 on every turn so a
// fast flipper restarts the sound cleanly instead of stacking overlapping voices.
// Volume sits low (0.35) — a real page turn is barely there; it should feel like
// part of the fold, not a notification.
const TURN_SRC = '/qfp/sounds/page-turn.wav'
const TURN_VOL = 0.35

// QA seam (same spirit as ?ether=off / ?glow=olive / ?hideRestricted elsewhere):
// `?flip=<ms>` slows the page-turn so its mid-flip frames can be captured. Default
// ships the real 560ms; the value drives BOTH the CSS leaf turn and the JS lock.
function readFlipMs() {
  if (typeof window === 'undefined') return FLIP_MS
  const v = parseInt(new URLSearchParams(window.location.search).get('flip'), 10)
  return Number.isFinite(v) ? Math.min(6000, Math.max(200, v)) : FLIP_MS
}

// The left page — the read: eyebrow, title, country/stat pills, body copy, CTA.
// Cream ground, navy ink. href="#" for now (per-case pages are scoped later).
function LeftPage({ c, t }) {
  return (
    <div className="cs-face cs-face--text" aria-hidden="true">
      <div className="cs-eyebrow">{c.heading}</div>
      <h4 className="cs-title">{c.title}</h4>
      <div className="cs-pills">
        {c.tags.map((tag) => (
          <span key={tag} className="cs-pill">{tag}</span>
        ))}
      </div>
      <p className="cs-body">{c.desc}</p>
      <a href="#" className="cs-cta" onClick={(e) => e.preventDefault()} tabIndex={-1}>
        {t('readMore')}
      </a>
    </div>
  )
}

// The right page — the case photo. Brand navy duotone + a bottom scrim (matches
// the old filmstrip treatment), an inner spine shadow up the bound (left) edge,
// and a soft page-curl hint lifting off the bottom-right corner.
function RightPage({ c }) {
  return (
    <div className="cs-face cs-face--photo" aria-hidden="true">
      <img src={`/qfp/cases/${c.img}`} alt="" loading="lazy" decoding="async" />
      <span className="cs-duotone" />
      <span className="cs-photo-scrim" />
      <span className="cs-spine-shadow" />
      <span className="cs-curl" />
    </div>
  )
}

export default function Cases() {
  const { t } = useTranslation('homeCases')
  const reduced = useReducedMotion()
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  const [active, setActive] = useState(0)
  const [xfade, setXfade] = useState(0)     // bumps to re-trigger the crossfade
  const [flip, setFlip] = useState(null)    // { from, dir } while a leaf is turning
  const busy = useRef(false)
  const timer = useRef(null)
  const flipMs = useRef(FLIP_MS)
  useEffect(() => { flipMs.current = readFlipMs() }, [])
  const total = CASES.length
  const flat = !reduced && !narrow // page-turn only when it reads well

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  // Page-turn SFX. The Audio object is created lazily on mount (a visitor who never
  // renders this section pays nothing) and told to preload='auto' so the sample is
  // decoded and ready by the first flip — no gap between fold and fold-sound. A
  // missing/404 file just leaves a silent element: play() rejects and we swallow it.
  const turnAudio = useRef(null)
  useEffect(() => {
    const a = new Audio(TURN_SRC)
    a.preload = 'auto'
    a.volume = TURN_VOL
    turnAudio.current = a
    return () => { turnAudio.current = null }
  }, [])

  // Fire one paper-turn. Called at flip START by every turn path (spine, arrows,
  // keyboard, swipe) — never on mount or the default render. Gated three ways:
  //   • only in `flat` (flip) mode — reduced-motion / narrow get the silent crossfade;
  //   • only when the global sound toggle is ON — the hero's mute is law here;
  //   • currentTime reset to 0 so rapid flips restart the sample, never stack it.
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

  // Resolve every case with the compliance gate applied (heading + desc).
  const cases = CASES.map((c) => ({
    ...c,
    heading: (!SHOW_MINISTRY_NAMES && c.hasHeadingSafe)
      ? t(`cases.${c.id}.headingSafe`)
      : t(`cases.${c.id}.heading`),
    title: t(`cases.${c.id}.title`),
    tags: c.tagKeys.map((k) => t(`cases.${c.id}.tags.${k}`)),
    desc: (!SHOW_MINISTRY_NAMES && c.hasDescSafe)
      ? t(`cases.${c.id}.descSafe`)
      : t(`cases.${c.id}.desc`),
  }))

  // Open a case. One turn at a time — input is locked while the leaf turns.
  const go = (target) => {
    if (busy.current || target === active || target < 0 || target >= total) return
    const dir = target > active ? 'next' : 'prev'
    if (!flat) {
      setActive(target)
      setXfade((k) => k + 1) // instant crossfade — no flip
      return
    }
    busy.current = true
    playTurn() // paper turn fires with the fold, not after it
    setFlip({ from: active, dir })
    setActive(target)
    timer.current = setTimeout(() => {
      setFlip(null)
      busy.current = false
    }, flipMs.current)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1) }
  }

  // Touch swipe on the spread — no scroll hijack (we only act on a decisive
  // horizontal drag and never call preventDefault on the move).
  const touch = useRef(null)
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      go(dx < 0 ? active + 1 : active - 1) // swipe left → next page
    }
    touch.current = null
  }

  const cur = cases[active]

  // Build the two base pages + (when flipping) the turning leaf's faces. Both
  // directions use the SAME leaf geometry: a right-half leaf hinged on the spine,
  // turning between 0° and −180°. NEXT plays 0 → −180, PREV plays −180 → 0.
  //   NEXT: base left = OLD text, base right = NEW photo;
  //         leaf front = OLD photo, leaf back = NEW text.
  //   PREV: base left = NEW text, base right = OLD photo;
  //         leaf front = NEW photo, leaf back = OLD text.
  let baseLeft = cur, baseRight = cur, leafFront = null, leafBack = null
  if (flip) {
    const oldC = cases[flip.from]
    const nu = cases[active]
    if (flip.dir === 'next') {
      baseLeft = oldC; baseRight = nu; leafFront = oldC; leafBack = nu
    } else {
      baseLeft = nu; baseRight = oldC; leafFront = nu; leafBack = oldC
    }
  }

  const num = (n) => String(n).padStart(2, '0')

  return (
    <section id="cases" className="section-cases" data-theme="dark">
      {/* beige header band — kept from the old section (Certifications rhythm) */}
      <div className="cases-header" data-theme="light">
        <div className="cases-header-inner">
          <div className="cases-eyebrow">{t('eyebrow')}</div>
          <h3>{t('title')}</h3>
          <p>{t('sub')}</p>
        </div>
      </div>

      {/* THE STAGE — the section's dark ground behind the open book */}
      <div className="cs-stage">
        <div
          className="cs-interactive"
          role="group"
          aria-label={t('title')}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {/* THE SHELF — closed cases as vertical spines; the open case is MISSING */}
          <ul className="cs-shelf" aria-label={t('title')}>
            {cases.map((c, i) => {
              if (i === active) {
                // the pulled book leaves a visible gap — the metaphor explains itself
                return <li key={c.id} className="cs-slot cs-slot--gap" aria-hidden="true" />
              }
              return (
                <li key={c.id} className="cs-slot">
                  <button
                    type="button"
                    className={`cs-spine cs-spine--${i % 2 === 0 ? 'navy' : 'cream'}`}
                    onClick={() => go(i)}
                    aria-label={`${t('caseWord', 'Case')} ${num(i + 1)} — ${c.tags[0]}, ${c.title}`}
                  >
                    <span className="cs-spine-num">{num(i + 1)}</span>
                    <span className="cs-spine-label">
                      <span className="cs-spine-country">{c.tags[0]}</span>
                      <span className="cs-spine-dot" aria-hidden="true">·</span>
                      <span className="cs-spine-title">{c.title}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* THE BOOK */}
          <div className="cs-book-wrap">
            <div
              className={`cs-book${flip ? ` is-flipping is-${flip.dir}` : ''}`}
              data-mode={flat ? 'flip' : 'flat'}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* ribbon "you are here" + DM Mono counter (announces case changes),
                  anchored to the book so both align to the spread's top edge */}
              <div className="cs-ribbon" aria-hidden="true" />
              <div className="cs-counter" aria-live="polite">
                {t('caseWord', 'Case').toUpperCase()} {num(active + 1)} <span className="cs-counter-sep">/</span> {num(total)}
                <span className="cs-sr"> — {cur.title}</span>
              </div>

              <div className="cs-spread" key={flat ? 'flip' : `x${xfade}`}>
                {/* left page (text) + right page (photo) */}
                <div className="cs-page cs-page--left"><LeftPage c={baseLeft} t={t} /></div>
                <div className="cs-page cs-page--right"><RightPage c={baseRight} /></div>

                {/* the turning leaf — a double-sided page hinged on the spine */}
                {flip && (
                  <div className="cs-leaf" style={{ animationDuration: `${flipMs.current - 40}ms` }}>
                    <div className="cs-leaf-face cs-leaf-front"><RightPage c={leafFront} /></div>
                    <div className="cs-leaf-face cs-leaf-back"><LeftPage c={leafBack} t={t} /></div>
                  </div>
                )}
              </div>

              {/* page-corner arrow buttons — bottom corners of the spread */}
              <button
                type="button"
                className="cs-arrow cs-arrow--prev"
                onClick={() => go(active - 1)}
                disabled={active === 0}
                aria-label={t('prev', 'Previous case')}
              >
                ←
              </button>
              <button
                type="button"
                className="cs-arrow cs-arrow--next"
                onClick={() => go(active + 1)}
                disabled={active === total - 1}
                aria-label={t('next', 'Next case')}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="cases-footer">
        <button className="view-all-cases">{t('viewAll')}</button>
      </div>
    </section>
  )
}
