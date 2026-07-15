import { useMemo, useRef } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import TypingBookOverlay from './TypingBookOverlay'

// ── QFP hero skin — LANE 16: STATIC BOOK, SCROLL BUBBLES, SOUND KILLED ──
// Per the client's Canva mock: headline + subhead + two CTAs at the top (all
// static, no typing/animation), then the open book with kids and bubbles below.
// The book is static and present immediately. Bubbles reveal one-by-one (left→right)
// as the visitor scrolls DOWN through the hero, without trapping scroll (no pin —
// just a taller section with no artificial scroll-capture). Once revealed, bubbles
// persist (no hide-on-scroll-back). The old typewriter effect, sound toggle, and
// the standalone mobile of the headline are all gone.
const BOOK_BASE = '/qfp/hero/qfp-book-cover.webp' // BLANK spread
const BUBBLE = '/qfp/hero/qfp-bubble.webp'
const GOLD = '#C89A3C'

// Kids render BEHIND the book, cropped by its edges.
const CUTOUTS = [
  { key: 'boy-red',      src: '/qfp/hero/qfp-kid-boy-red.webp',       layer: 'back', w: 11.5, cx: -21.3, cy: -16.5, z: 2 },
  { key: 'girl-blonde',  src: '/qfp/hero/qfp-kid-girl-blonde.webp',   layer: 'back', w: 15.5, cx: 20.3,  cy: -15.5, z: 2 },
  { key: 'girl-mustard', src: '/qfp/hero/qfp-kid-girl-mustard.webp',  layer: 'back', w: 15.0, cx: -42.0, cy: -6.0,  z: 1 },
  { key: 'boy-green',    src: '/qfp/hero/qfp-kid-boy-green.webp',      layer: 'back', w: 10.5, cx: 41.0,  cy: -6.0,  z: 1 },
]

// 4 speech bubbles — reveal left→right on scroll, persist once shown.
const BUBBLES = [
  { key: 'b-mustard', tk: 'mustard', forKey: 'girl-mustard', w: 12.4, cx: -38.0, cy: -24.0, fs: 'clamp(15px, 1.4vw, 21.5px)' },
  { key: 'b-red', tk: 'red', forKey: 'boy-red', w: 12.9, cx: -11.0, cy: -27.0, fs: 'clamp(14px, 1.2vw, 18.5px)' },
  { key: 'b-blonde', tk: 'blonde', forKey: 'girl-blonde', w: 13.1, cx: 11.0, cy: -27.0, fs: 'clamp(13.5px, 1.16vw, 18px)' },
  { key: 'b-green', tk: 'green', forKey: 'boy-green', w: 13.4, cx: 39.0, cy: -24.0, fs: 'clamp(13px, 1.12vw, 17.2px)' },
]

export default function Hero() {
  const { t } = useTranslation('home')
  const section = useRef(null)

  const cutouts = useMemo(() => CUTOUTS, [])

  // One positioned kid cutout, static on first paint.
  const renderCutout = (c) => (
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

  // Book scene — static kids + blank book base + page copy + bubbles in front.
  // Bubbles start hidden (opacity 0); reduced motion shows them all immediately.
  // Text is always in DOM, never hidden from a11y tree.
  const renderBookScene = () => (
    <div className="relative flex w-full justify-center">
      {/* LAYER 1 — kids behind the book */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative">
          {cutouts.map((c) => (c.layer === 'back' ? renderCutout(c) : null))}
        </div>
      </div>

      {/* BLANK book base. No CSS drop-shadow: the book overhangs the trust strips,
          so any downward drop-shadow smudges the gold border + first marquee. The
          book's own baked-in shading grounds it against the navy; the strips stay
          clean (matches the reference). */}
      <img src={BOOK_BASE} alt="" aria-hidden="true" className="relative z-[1] block w-full select-none object-contain" style={{ clipPath: 'inset(0 0 19% 0)' }} draggable="false" />

      {/* PAGE COPY (static) */}
      <div className="absolute inset-0 z-[2]">
        <TypingBookOverlay />
      </div>

      {/* LAYER 3 — speech bubbles in front */}
      <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
        <div className="relative">
          {BUBBLES.map((b) => (
            <div
              key={b.key}
              className="absolute"
              style={{ left: `${b.cx}vw`, top: `${b.cy}vw`, width: `${b.w}vw`, transform: 'translate(-50%, -50%)', zIndex: 30 }}
            >
              <div data-bubble={b.tk} className="relative" style={{ transformOrigin: '50% 100%', opacity: 1 }}>
                <img src={BUBBLE} alt="" aria-hidden="true" className="block w-full select-none" draggable="false" />
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
                    <Trans t={t} i18nKey={`hero.bubbles.${b.tk}`} components={{ 1: <b className="bub-foil is-lit" /> }} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )


  return (
    <section id="hero" ref={section} data-theme="dark" className="relative bg-[#0c2f4a] overflow-x-clip">
      {/* HERO AURORA — static background */}
      <div className="hero-aurora" aria-hidden="true">
        <div className="hero-aurora__ribbons" />
        <div className="hero-aurora__veil" />
      </div>

      {/* HEADLINE BLOCK — top of hero, static, with real <h1> ──────────────────── */}
      <div className="relative z-[5] flex flex-col items-center px-4 pt-[16vh] pb-[8vh] font-metrisch">
        <h1 className="m-0 flex flex-col items-center leading-[0.9]">
          <div className="text-[8.6vw] font-bold uppercase text-[#fdfaf4] lg:text-[6.4vw]" style={{ letterSpacing: '-0.2vw' }}>
            {t('hero.line1')}
          </div>
          <div className="mt-[14px] flex items-center justify-center text-[4.2vw] font-semibold uppercase lg:text-[3.1vw]" style={{ letterSpacing: '0.16em', paddingLeft: '0.16em', color: GOLD }}>
            {t('hero.line2')}
          </div>
        </h1>

        <p className="mt-[4vh] max-w-[720px] text-center text-[18px] font-normal leading-[1.4] text-white/95">
          {t('hero.subhead')}
        </p>

        {/* Two pill CTAs */}
        <div className="mt-[6.5vh] flex flex-wrap items-center justify-center gap-[24px]">
          <a
            href="#services"
            className="btn-nebula group relative inline-flex h-[54px] items-center gap-[18px] border-[1.5px] border-white/60 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[#0f2444] hover:border-[#f5f0e8]"
          >
            <span className="relative z-10">{t('hero.ctaPrint')}</span>
            <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/60 transition-[background-color,border-color] duration-300 ease-out group-hover:border-[#0f2444] group-hover:bg-[#0f2444]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
            </span>
          </a>
          <a
            href="#reach"
            className="btn-nebula group relative inline-flex h-[54px] items-center border-[1.5px] border-white/60 px-[26px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[#0f2444] hover:border-[#f5f0e8]"
          >
            {t('hero.ctaReach')}
          </a>
        </div>
      </div>

      {/* BOOK SCENE — below headline. The negative margin-bottom pulls TrustStrips up
          UNDER the book so its clipped bottom cover edge lands on the white landing
          zone / gold border (the book overhangs the strips, no navy gap). */}
      <div className="relative z-[15] flex flex-col items-center px-4 pt-[6vh]" style={{ marginBottom: '-21vw' }}>
        {renderBookScene()}
      </div>
    </section>
  )
}
