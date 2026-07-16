import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — EKTA'S FINAL MOCKUP (wsw.png → hero-final.webp) ───────────────
// Structure: the section displays Ekta's full-bleed composed mockup at full width
// and natural aspect ratio (2400×1350). The HTML layout is dead simple: image
// full-width, no overhang, no crops, section bottom = image bottom. The only
// HTML overlays are two pill CTAs, pinned absolutely to the baked outline coords.
//
// Pill measurements from wsw.png baked outlines:
//   Vertical center: 77% of image height
//   Left pill:  33% from left, ~7.5% wide, ~4% tall
//   Right pill: 67% from left, ~7.5% wide, ~4% tall
//   Style: navy 2px outline, transparent fill, rounded-full capsule
//
// A11y: the <h1> and subhead are sr-only (semantic + SEO); the bubble lines
// are sr-only; image alt is descriptive. Sighted users read the baked headline
// and pill CTAs; screen-reader users hear the sr-only copy.
//
// KNOWN LIMITATION: baked-in text (headline, bubbles) is ENGLISH ONLY. FR/ES
// visitors see English text in the art; pill CTAs localize. Future localized
// re-exports from Ekta will address this.

const HERO_ART = '/qfp/hero/hero-final.webp'

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
      <h1 className="sr-only">{t('hero.line1')} — {t('hero.line2')}</h1>
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

        {/* TWO PILL CTAs — positioned absolutely over the image's baked pill outlines.
            Pinned to 77% vertical center via top: 77% + translateY(-50%). Horizontal
            layout: two pills at ~33% and ~67%, each ~7.5% wide. Wrapper pointer-events-none;
            pill row pointer-events-auto so CTAs remain clickable. */}
        <div
          className="absolute inset-x-0 z-[20] pointer-events-auto flex items-center justify-center gap-[32px]"
          style={{ top: '77%', transform: 'translateY(-50%)' }}
        >
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
