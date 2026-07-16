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

      {/* THE COMPOSED HERO — full-bleed from header to TrustStrips. Image sits on
          the section's navy background, no overhang at z-15 so the full image
          (including white-ground band) is visible inside the hero section, and the
          image's bottom edge aligns cleanly with the TrustStrips junction below. */}
      <div className="pointer-events-none relative z-[15]">
        <img
          src={HERO_ART}
          alt="Four children stand around a giant open book resting on a dotted world map. The book's pages read: Powering Global Education Through Print Excellence. Printing is stronger than ever. We love books. We love printing."
          className="block w-full select-none"
          draggable="false"
          fetchPriority="high"
        />
      </div>

      {/* TWO PILL CTAs — positioned absolutely over the image's baked empty pill
          outlines (visible at ~92% from image top in Ekta's art). Sit EXACTLY atop
          those outlines using % positioning so they scale with the image and land
          perfectly on the baked art regardless of viewport. The layer is pointer-events-auto
          so the pills remain clickable; the image is pointer-events-none. */}
      <div className="absolute inset-x-0 z-[20] flex flex-wrap items-center justify-center gap-[24px]" style={{ bottom: 'clamp(6%, 7.5vh, 12%)' }}>
        <a
          href="#services"
          className="btn-nebula--light group relative inline-flex h-[54px] items-center gap-[18px] border-[1.5px] border-[var(--navy)]/70 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-[var(--navy)] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)]"
        >
          <span className="relative z-10">{t('hero.ctaPrint')}</span>
          <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-[var(--navy)]/70 transition-[background-color,border-color] duration-300 ease-out group-hover:border-white group-hover:bg-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--navy)] transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
          </span>
        </a>
        <a
          href="#reach"
          className="btn-nebula--light group relative inline-flex h-[54px] items-center border-[1.5px] border-[var(--navy)]/70 px-[26px] text-[15px] font-medium tracking-[0.3px] text-[var(--navy)] transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)]"
        >
          {t('hero.ctaReach')}
        </a>
      </div>
    </section>
  )
}
