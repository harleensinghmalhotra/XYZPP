import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — OUTLINE-FREE ART (20th-morning "Hero Image with kids" → hero-kids.webp) ─────
// Structure: the section displays Ekta's outline-free mockup at full width and natural
// aspect ratio (2400×1350). No baked pill outlines—white ground below book is our canvas.
// The HTML layout: image full-width, no overhang, no crops, section bottom = image bottom.
// HTML pill CTAs are positioned absolutely in the white ground below the book base.
//
// Pill positioning:
//   Vertical center: 93% of image height (mid-white-ground, below book base, above image bottom)
//   Horizontal: centered flex row, gap 28px
//   Style: navy 2px border, rounded-full capsule, transparent fill, hover invert
//
// A11y: the <h1> and subhead are sr-only (semantic + SEO); the bubble lines
// are sr-only; image alt is descriptive. Sighted users read the baked headline
// and pill CTAs; screen-reader users hear the sr-only copy.
//
// KNOWN LIMITATION: baked-in text (headline, bubbles) is ENGLISH ONLY. FR/ES
// visitors see English text in the art; pill CTAs localize. Future localized
// re-exports from Ekta will address this.

const HERO_ART = '/qfp/hero/hero-kids.webp'

// The four speech-bubble messages exactly as PAINTED into the art (English only).
// Surfaced sr-only so screen-reader users hear what sighted users read.
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
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip">
      {/* Semantic copy — baked into the image, surfaced sr-only for SEO + a11y. */}
      <h1 className="sr-only">{t('hero.line1')}, {t('hero.line2')}</h1>
      <p className="sr-only">{t('hero.subhead')}</p>
      <ul className="sr-only">
        {BUBBLE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* HERO IMAGE — Ekta's final mockup displayed at full width, natural aspect ratio.
          No overhang, no crops. Section bottom = image bottom. The wrapper is the
          positioning context for the pill CTAs. */}
      <div className="pointer-events-none relative">
        <img
          src={HERO_ART}
          alt="Four children stand around a giant open book resting on a dotted world map. The book's pages read: Powering Global Education Through Print Excellence. Printing is stronger than ever. We love books. We love printing."
          className="block w-full select-none"
          draggable="false"
          fetchPriority="high"
        />

        {/* TWO BUTTON CTAs — pill shape, one-line labels, equal width on spine ────────
            Positioned centered on book spine. Navy fill with gold outline + cream text.
            Pill radius (rounded-full). Both buttons equal width, widened for comfortable
            padding. Labels nowrap (one line each). Gap-center re-centered on spine. */}
        <div
          className="hero-cta-pair absolute z-[20] pointer-events-auto flex items-center gap-6"
          /* Centred on the book's SPINE (pixel-measured at 50.6% of the art, not 50%)
             so both pills are equidistant from the crease, and dropped below the
             book's bottom edge (~90%) into the white ground so they don't overlap it. */
          style={{ top: '95%', left: '50.6%', transform: 'translate(-50%, -50%)' }}
        >
          <a
            href="#what-we-print"
            className="hero-btn btn-nebula group relative inline-flex h-[54px] w-[220px] items-center justify-center rounded-full border-[1.5px] border-[var(--gold-2)] bg-[var(--navy)] pl-[22px] pr-[46px] text-[15px] font-medium tracking-[0.3px] text-[#fdfaf4] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-[2px] focus-visible:outline-[var(--gold)] focus-visible:outline-offset-[3px] prefers-reduced:scale-100"
          >
            {/* label centered in the reserved lane; arrow pinned flush to the right padding */}
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaPrint')}</span>
            <span className="absolute right-[8px] top-1/2 z-10 flex h-[40px] w-[40px] shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-[#fdfaf4]/15 transition-all duration-300 ease-out group-hover:bg-[#fdfaf4]/25">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#fdfaf4] transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
            </span>
          </a>
          <a
            href="#reach"
            className="hero-btn btn-nebula relative inline-flex h-[54px] w-[220px] items-center justify-center rounded-full border-[1.5px] border-[var(--gold-2)] bg-[var(--navy)] px-[24px] text-[15px] font-medium tracking-[0.3px] text-[#fdfaf4] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-[2px] focus-visible:outline-[var(--gold)] focus-visible:outline-offset-[3px] prefers-reduced:scale-100"
          >
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaReach')}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
