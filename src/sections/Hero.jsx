import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — FINAL COMPOSED ART (Ekta, 16 Jul 2026) ────────────────────────
// The hero is now a SINGLE fully-composed image: navy sky + dotted world map + an
// open book with the headline printed on its pages + four kids + four speech
// bubbles + a white ground curve, all baked into one WebP (hero-composed.webp,
// exported from Ekta's "HERO IMAGE EKTA.png"). It REPLACES the old layered build
// (blank book base + four kid cutouts + a bubble webp + an HTML page-copy
// homography rendered by TypingBookOverlay). Those parts — and TypingBookOverlay —
// are gone; their orphaned source assets are listed in the swap report.
//
// A11y: the headline, subhead and every bubble line are BAKED INTO the pixels, so
// the real, machine-readable copy lives here as sr-only siblings — a semantic <h1>
// (still the page's first heading, for SEO), the subhead, and the four bubble
// messages — plus a descriptive alt on the image. Sighted and screen-reader users
// get the same words.
//
// KNOWN LIMITATION (note, not a bug): the baked-in text is ENGLISH ONLY. FR/ES
// visitors see the English headline + bubbles in the art; only the two CTAs and the
// sr-only <h1>/subhead localize. The real fix is a future set of localized
// re-exports from Ekta, not code.
//
// JUNCTION — must not regress (see de1dcdb / d47d341 / 03ed769): the art's bottom
// edge is PURE WHITE full-width. Its container overhangs TrustStrips by a fixed
// -115px (== ts-band's 115px top padding) at z-15, so the white bottom lands
// exactly on ts-band's gold border and covers ts-band's own navy→white curve. The
// <section> keeps NO z-index, so this overhang (z-15) floats above the band (z-1) —
// the same paint trick the old book used. Result: no navy gap, no shadow smudge.

const HERO_ART = '/qfp/hero/hero-composed.webp'
const NAVY = '#0d1b45' // matches the baked sky so the section shows no seam behind/around the art

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
      {/* Real semantic copy — baked into the art, so surfaced sr-only for SEO + a11y. */}
      <h1 className="sr-only">{t('hero.line1')} — {t('hero.line2')}</h1>
      <p className="sr-only">{t('hero.subhead')}</p>
      <ul className="sr-only">
        {BUBBLE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* Two pill CTAs — real HTML over the navy sky at the top of the scene, so the
          existing white-outline (dark-surface) treatment holds. Palette/font law
          preserved: Inter Tight via .font-metrisch, pill geometry unchanged. */}
      <div className="relative z-[5] flex flex-wrap items-center justify-center gap-[24px] px-4 pt-[9vh] pb-[3.5vh] font-metrisch">
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

      {/* THE COMPOSED HERO. Overhangs TrustStrips (-115px) at z-15 so its pure-white
          bottom edge lands on ts-band's gold border and hides the band's navy curve. */}
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
