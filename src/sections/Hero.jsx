import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — EKTA'S MOCKUP EXACTLY (wsw.png / 16 Jul 2026) ─────────────────
// Structure (final): the section goes DIRECTLY from the header into Ekta's
// full-bleed composed image — no HTML headline/subhead block visible. The image
// (navy sky + dotted world map + open book with headline printed on its pages +
// four kids + four speech bubbles + white ground curve) fills the hero top-to-
// bottom. The only HTML overlays are the two pill CTAs, positioned absolutely
// in the white ground area directly under the book, matching Ekta's mockup
// exactly.
//
// A11y: the <h1> and subhead are sr-only (semantic + SEO, not visually rendered);
// the bubble lines are also sr-only; the image alt is descriptive. Sighted users
// read the headline baked into the art and the pill CTAs; screen-reader users
// hear the sr-only copy.
//
// KNOWN LIMITATION: the baked-in text (headline on the book, bubbles) is ENGLISH
// ONLY. FR/ES visitors see English text in the art; the pill CTAs localize. The
// real fix is a future set of localized re-exports from Ekta, not code.
//
// JUNCTION: unchanged (de1dcdb / d47d341 / 03ed769 / 7dd1e24 / a4f1e27). The
// art's pure-white bottom lands exactly on ts-band's gold border via the fixed
// -115px overhang at z-15. No navy gap, no shadow smudge.

const HERO_ART = '/qfp/hero/hero-composed.webp'

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
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip" style={{ backgroundColor: 'var(--navy)' }}>
      {/* Semantic copy — baked into the image, surfaced sr-only for SEO + a11y. */}
      <h1 className="sr-only">{t('hero.line1')} — {t('hero.line2')}</h1>
      <p className="sr-only">{t('hero.subhead')}</p>
      <ul className="sr-only">
        {BUBBLE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* THE COMPOSED HERO — full-bleed from header to TrustStrips. Image overhangs
          115px below the white ground via marginBottom: -115px; the ts-band padding-top
          compensates so the gold border lands at the section junction. The wrapper div
          (relative z-15) is the positioning context for the CTAs. */}
      <div className="pointer-events-none relative z-[15]" style={{ marginBottom: '-115px' }}>
        <img
          src={HERO_ART}
          alt="Four children stand around a giant open book resting on a dotted world map. The book's pages read: Powering Global Education Through Print Excellence. Printing is stronger than ever. We love books. We love printing."
          className="block w-full select-none"
          draggable="false"
          fetchPriority="high"
        />

        {/* TWO PILL CTAs — positioned absolutely inside the image wrapper, so they
            stay pinned to the image's baked pill outlines regardless of section size.
            Simple capsule pills: 2px navy outline, transparent fill, centered text.
            Positioned at 93% of wrapper height (measured from baked outlines in art).
            Wrapper pointer-events-none; CTA row pointer-events-auto so pills click. */}
        <div className="absolute inset-x-0 z-[20] flex flex-wrap items-center justify-center gap-[24px] pointer-events-auto" style={{ top: '93%', transform: 'translateY(-50%)' }}>
          <a
            href="#services"
            className="inline-flex h-[54px] items-center px-[26px] border-[2px] border-[var(--navy)] rounded-full text-[15px] font-medium text-[var(--navy)] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)]"
          >
            {t('hero.ctaPrint')}
          </a>
          <a
            href="#reach"
            className="inline-flex h-[54px] items-center px-[26px] border-[2px] border-[var(--navy)] rounded-full text-[15px] font-medium text-[var(--navy)] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)]"
          >
            {t('hero.ctaReach')}
          </a>
        </div>
      </div>
    </section>
  )
}
