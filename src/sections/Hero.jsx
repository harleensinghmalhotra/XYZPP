import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — VISIBLE HEADLINE BLOCK + FINAL COMPOSED ART (Ekta, 16 Jul 2026) ─
// Structure (post-correction): the hero opens with the pre-swap top block, fully
// VISIBLE HTML — a real <h1> (hero.line1 cream / hero.line2 gold), the subhead, and
// the two pill CTAs, in that order, on the flat navy sky. BELOW it sits Ekta's
// single fully-composed image (navy sky + dotted world map + open book with the
// headline printed on its pages + four kids + four speech bubbles + a white ground
// curve, all baked in), occupying the lower portion of the hero at the scale the
// old layered book held — full width, overhanging TrustStrips.
//
// The headline appears TWICE on purpose — the HTML block is the semantic hero
// heading; the book in the image is the visual. This is Ekta's intent; do not
// deduplicate.
//
// A11y: the bubble lines are baked into the pixels, so the real copy is surfaced
// sr-only below, and the image carries a descriptive alt. The <h1>/subhead are now
// visible HTML (no longer sr-only) and the <h1> is still the page's first heading.
//
// KNOWN LIMITATION (note, not a bug): the baked-in text (headline on the book,
// bubbles) is ENGLISH ONLY. FR/ES visitors see English text in the art; only the
// HTML block (h1/subhead/CTAs) localizes. The real fix is a future set of localized
// re-exports from Ekta, not code.
//
// JUNCTION — unchanged from 7dd1e24 (must not regress; see de1dcdb / d47d341 /
// 03ed769): the art's bottom edge is PURE WHITE full-width. Its container overhangs
// TrustStrips by a fixed -115px (== ts-band's 115px top padding) at z-15, so the
// white bottom lands exactly on ts-band's gold border and covers the band's own
// navy curve. The <section> keeps NO z-index, so the overhang (z-15) floats above
// the band (z-1). Result: no navy gap, no shadow smudge.

const HERO_ART = '/qfp/hero/hero-composed.webp'
// Navy/gold come from the homepage-scoped palette (.home-palette in index.css),
// which is set to Ekta's baked hero values (navy #0e1b46 / gold #aa6f1d) — so the
// section sky matches the art pixel-for-pixel and the headline gold matches the
// baked bubbles.
const NAVY = 'var(--navy)'
const GOLD = 'var(--gold)' // exact Ekta gold; the headline is large so AA holds on navy

// The four speech-bubble messages exactly as PAINTED into the art (English only —
// see the known-limitation note). Surfaced sr-only so screen-reader users hear what
// sighted users read off the bubbles.
const BUBBLE_LINES = [
  'Oh yes! Education has no borders.',
  'WOW! Quarterfold prints 75 million books every year.',
  'What? Quarterfold also exports to 25+ countries every year?',
  'Yes! Trusted by publishers across continents for its quality and on-time delivery!',
]

export default function Hero() {
  const { t } = useTranslation('home')
  const section = useRef(null)

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip" style={{ backgroundColor: NAVY }}>
      {/* Bubble copy — baked into the art, surfaced sr-only for a11y. */}
      <ul className="sr-only">
        {BUBBLE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* HEADLINE BLOCK — top of hero, static, with real VISIBLE <h1> (restored from
          the pre-swap hero, ba7b134). Sits on the flat navy sky. */}
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
            className="btn-nebula group relative inline-flex h-[54px] items-center gap-[18px] border-[1.5px] border-white/60 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[var(--navy)] hover:border-[#f5f0e8]"
          >
            <span className="relative z-10">{t('hero.ctaPrint')}</span>
            <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/60 transition-[background-color,border-color] duration-300 ease-out group-hover:border-[var(--navy)] group-hover:bg-[var(--navy)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
            </span>
          </a>
          <a
            href="#reach"
            className="btn-nebula group relative inline-flex h-[54px] items-center border-[1.5px] border-white/60 px-[26px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[var(--navy)] hover:border-[#f5f0e8]"
          >
            {t('hero.ctaReach')}
          </a>
        </div>
      </div>

      {/* THE COMPOSED HERO — below the headline block, at the old book's scale (full
          width). Overhangs TrustStrips (-115px) at z-15 so its pure-white bottom
          edge lands on ts-band's gold border and hides the band's navy curve. */}
      <div className="pointer-events-none relative z-[15]" style={{ marginBottom: '-115px' }}>
        <img
          src={HERO_ART}
          alt="Four children stand around a giant open book resting on a dotted world map. The book's pages read: Powering Global Education Through Print Excellence. Printing is stronger than ever. We love books. We love printing."
          className="block w-full select-none"
          draggable="false"
          fetchPriority="high"
        />
      </div>
    </section>
  )
}
