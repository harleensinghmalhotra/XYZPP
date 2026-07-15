import { useEffect, useMemo, useRef } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { prefersReduced } from '@/lib/useReducedMotion'
import TypingBookOverlay from './TypingBookOverlay'

// ── QFP hero skin — RESKINNED to Ekta's design language. ──
// LANE 16 — STATIC BOOK, SCROLL BUBBLES, PILL CTAs, SOUND KILLED.
// Per the client's Canva mock (navy field, an open book carrying the headline as
// static text on its pages, four kids flanking with speech-bubble callouts, two
// pill CTAs): the hero is now STATIC. The book, the kids and the page copy are
// present immediately — no scrub-typed reveal, no rise, no sound. The ONLY motion
// is the four speech bubbles, which reveal one-by-one (left→right) as the visitor
// scrolls DOWN through the hero, and never trap the scroll (no pin / no scroll-jack
// — a native CSS sticky scene + a pinless ScrollTrigger that only reads progress).
//
// The visible headline lives on the book's LEFT page (drawn by <TypingBookOverlay>,
// decorative / aria-hidden). The page's real semantic heading is the single
// sr-only <h1> below (same text Lane 5 promoted — "Powering Global Education
// Through Print Excellence") so there is exactly one real <h1> and it stays out of
// axe's contrast path. The standalone cream/gold header block is removed per the
// client ("it will instead sit as a caption on top of the book hero image").
const BOOK_BASE = '/qfp/hero/qfp-book-cover.webp' // BLANK spread — permanent base
const BUBBLE = '/qfp/hero/qfp-bubble.webp'

// Kids. w / cx / cy are in **vw** (offsets from the book centre) so the whole
// spread scales with the book at any viewport. All 4 kids render BEHIND the book
// (layer:'back') so the pages crop them — the two centre kids peek
// head+shoulders+chest over the page tops, the two outer kids stand at ground
// level and are cropped by the book's side edges. Static now — landed on paint.
const CUTOUTS = [
  { key: 'boy-red',      src: '/qfp/hero/qfp-kid-boy-red.webp',       layer: 'back', w: 11.5, cx: -21.3, cy: -16.5, z: 2 },
  { key: 'girl-blonde',  src: '/qfp/hero/qfp-kid-girl-blonde.webp',   layer: 'back', w: 15.5, cx: 20.3,  cy: -15.5, z: 2 },
  { key: 'girl-mustard', src: '/qfp/hero/qfp-kid-girl-mustard.webp',  layer: 'back', w: 15.0, cx: -42.0, cy: -6.0,  z: 1 },
  { key: 'boy-green',    src: '/qfp/hero/qfp-kid-boy-green.webp',      layer: 'back', w: 10.5, cx: 41.0,  cy: -6.0,  z: 1 },
]

// 4 speech bubbles — one floating CLEARLY above each kid's head, tail pointing DOWN
// toward that kid. Text is REAL HTML (translated via <Trans>) inside a single
// transform wrapper so it scales WITH the bubble; the gold key figure is wrapped in
// <1></1> in the locale string. `fs` is a per-bubble type size tuned by sentence
// length so every bubble lands at ~70-80% interior fill in EN/FR/ES.
// ORDER = array order = left→right (mustard, red, blonde, green) — the sequence in
// which they reveal on scroll, matching the mock's left-to-right callout flow.
const BUBBLES = [
  { key: 'b-mustard', tk: 'mustard', forKey: 'girl-mustard', w: 12.4, cx: -38.0, cy: -24.0, fs: 'clamp(15px, 1.4vw, 21.5px)' },
  { key: 'b-red', tk: 'red', forKey: 'boy-red', w: 12.9, cx: -11.0, cy: -27.0, fs: 'clamp(14px, 1.2vw, 18.5px)' },
  { key: 'b-blonde', tk: 'blonde', forKey: 'girl-blonde', w: 13.1, cx: 11.0, cy: -27.0, fs: 'clamp(13.5px, 1.16vw, 18px)' },
  { key: 'b-green', tk: 'green', forKey: 'boy-green', w: 13.4, cx: 39.0, cy: -24.0, fs: 'clamp(13px, 1.12vw, 17.2px)' },
]

// Scroll progress (0→1 across the hero section) at which each bubble reveals, in
// array order. All four are shown by ~0.52, then the scene holds and scrolls away.
const REVEAL_AT = [0.10, 0.24, 0.38, 0.52]

export default function Hero() {
  const { t } = useTranslation('home')
  const reduced = prefersReduced()
  const section = useRef(null)
  const bubbleRefs = useRef([])

  const cutouts = useMemo(() => CUTOUTS, [])

  // One positioned kid cutout. Static — landed (opacity 1, no scale) on first paint.
  const renderCutout = (c, i) => (
    <div
      key={c.key}
      className="absolute"
      style={{ left: `${c.cx}vw`, top: `${c.cy}vw`, width: `${c.w}vw`, transform: 'translate(-50%, -50%)', zIndex: c.z }}
    >
      <div data-cut={c.key} style={{ transformOrigin: '50% 50%' }}>
        <img src={c.src} alt="" aria-hidden="true" className="block w-full max-w-none select-none drop-shadow-[0_12px_20px_rgba(10,20,40,0.35)]" draggable="false" />
      </div>
    </div>
  )

  // The book "scene" — kids behind, blank book base, static page copy, and the 4
  // speech bubbles in front. Bubbles start hidden (opacity 0) in the animated hero
  // and are revealed on scroll; in reduced motion they render visible immediately.
  // Their TEXT is always in the DOM (never display:none / aria-hidden) so it's in
  // the accessibility tree regardless of scroll position.
  const renderBookScene = () => (
    <div className="relative flex w-full justify-center">
      {/* LAYER 1 (z-0) — the 4 kids render BEHIND the book so the pages and side
          edges crop them (the peek effect). */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative">
          {cutouts.map((c, i) => (c.layer === 'back' ? renderCutout(c, i) : null))}
        </div>
      </div>

      {/* BLANK book base (z-[1], ON TOP of the kids). clip-path cuts the bottom
          19% transparent shadow-padding zone so the CSS drop-shadow stops at the
          TrustStrips gold-border line (junction unchanged). */}
      <img src={BOOK_BASE} alt="" aria-hidden="true" className="relative z-[1] block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" style={{ clipPath: 'inset(0 0 19% 0)' }} draggable="false" />
      {/* PAGE COPY (z-[2]) — Ekta's headline + copy laid STATIC on the blank base. */}
      <div className="absolute inset-0 z-[2]">
        <TypingBookOverlay />
      </div>

      {/* LAYER 3 (z-[3]) — speech bubbles IN FRONT of the book */}
      <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
        <div className="relative">
          {BUBBLES.map((b, i) => (
            <div
              key={b.key}
              className="absolute"
              style={{ left: `${b.cx}vw`, top: `${b.cy}vw`, width: `${b.w}vw`, transform: 'translate(-50%, -50%)', zIndex: 30 }}
            >
              <div ref={(n) => (bubbleRefs.current[i] = n)} data-bubble={b.tk} className="relative will-change-transform" style={{ transformOrigin: '50% 100%', opacity: reduced ? 1 : 0 }}>
                <img src={BUBBLE} alt="" aria-hidden="true" className="block w-full select-none" draggable="false" />
                {/* text in the bubble body (upper ~78%, above the tail), centred. */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-center px-[7%] text-center" style={{ height: '78%' }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Inter Tight', 'Inter', sans-serif",
                      fontWeight: 500,
                      color: '#0F2444',
                      fontSize: b.fs,
                      lineHeight: 1.4,
                      letterSpacing: '-0.004em',
                    }}
                  >
                    <Trans t={t} i18nKey={`hero.bubbles.${b.tk}`} components={{ 1: <b className={`bub-foil${reduced ? ' is-lit' : ''}`} /> }} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Scroll-revealed bubbles — pinless, no scroll-jack. ──
  // A single pinless ScrollTrigger reads the hero's scroll progress and reveals each
  // bubble once as its threshold is crossed (fade + slight rise, ~380ms). Persist:
  // once shown a bubble stays shown (scrolling back up does NOT hide it) — the
  // simpler, more robust behaviour (no reverse book-keeping, no flicker at the top
  // edge). The scene is held by a native CSS sticky wrapper (below), so the visitor
  // can keep scrolling past the hero at any point — the trigger never pins.
  useEffect(() => {
    if (reduced) return
    const nodes = bubbleRefs.current
    const ctx = gsap.context(() => {
      const revealed = new Set()
      gsap.set(nodes.filter(Boolean), { opacity: 0, y: 14 })
      const reveal = (i) => {
        if (revealed.has(i)) return
        revealed.add(i)
        const node = nodes[i]
        if (!node) return
        gsap.to(node, { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' })
        node.querySelectorAll('.bub-foil').forEach((el) => el.classList.add('is-lit'))
      }
      gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const p = self.progress
            REVEAL_AT.forEach((thr, i) => { if (p >= thr) reveal(i) })
          },
        },
      })
    }, section)
    return () => ctx.revert()
  }, [reduced])

  // Two on-palette pill CTAs (reuse the site's .btn-nebula button language — the
  // ring inherits --radius-pill, so these are true pills). "What we print" carries
  // a chevron and links to the WhatWePrint section (#services); "Our global reach"
  // links to the GlobeReach section (#reach).
  // The static book fills the frame, so the pills sit on its cream lower pages
  // (below the headline, per the mock). They take navy ink on the cream-surface
  // .btn-nebula--light variant so they read on the light page, inverting to a navy
  // fill with cream text on hover (the site's cream/navy/gold button language).
  const ctas = (
    <div className="absolute inset-x-0 bottom-[6vh] z-[25] flex flex-wrap items-center justify-center gap-[24px] px-4">
      <a
        href="#services"
        className="btn-nebula btn-nebula--light group relative inline-flex h-[54px] items-center gap-[16px] border-[1.5px] border-[#0f2444]/45 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-[#0f2444] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#0f2444] hover:text-[#f5f0e8] hover:border-[#0f2444]"
      >
        <span className="relative z-10">{t('hero.ctaPrint')}</span>
        <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-[#0f2444]/45 transition-[background-color,border-color] duration-300 ease-out group-hover:border-[#f5f0e8]/70 group-hover:bg-[#f5f0e8]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0f2444] transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
        </span>
      </a>
      <a
        href="#reach"
        className="btn-nebula btn-nebula--light group relative inline-flex h-[54px] items-center border-[1.5px] border-[#0f2444]/45 px-[26px] text-[15px] font-medium tracking-[0.3px] text-[#0f2444] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#0f2444] hover:text-[#f5f0e8] hover:border-[#0f2444]"
      >
        {t('hero.ctaReach')}
      </a>
    </div>
  )

  return (
    // Section height gives the four bubbles room to reveal one-by-one as the visitor
    // scrolls; the scene is held by a native CSS `sticky` wrapper (NOT a GSAP pin),
    // so scroll is never trapped — the visitor can pass the hero at any point.
    <section id="hero" ref={section} data-theme="dark" className="relative z-[1] bg-[#0c2f4a]" style={{ height: '220vh' }}>
      <div className="sticky top-0 h-[100svh] overflow-x-clip">
        {/* HERO AURORA — signature static background (CSS-only, scroll-independent),
            at the very BACK of the stack. The exact dotted world-map treatment is a
            later lane; today the background is navy #0c2f4a + this settled aurora. */}
        <div className="hero-aurora" aria-hidden="true">
          <div className="hero-aurora__ribbons" />
          <div className="hero-aurora__veil" />
        </div>

        {/* The single real <h1> — same headline copy Lane 5 promoted, kept as the
            page's one semantic heading. Visually hidden (sr-only) because the client
            asked the standalone header be removed and the headline sit as a caption
            ON the book; the book's left page (decorative) carries it visibly. */}
        <h1 className="sr-only">{t('hero.line1')} {t('hero.line2')}</h1>

        {/* Book scene at its LANDED position (translateY(-36.5vh)), everything static
            + present immediately. pointer-events-none so its tall transparent lower
            area never swallows hover from the CTAs / TrustStrips below. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] mt-[54vh] flex flex-col items-center" style={{ transform: 'translateY(-36.5vh)' }}>
          {renderBookScene()}
        </div>

        {ctas}
      </div>
    </section>
  )
}
