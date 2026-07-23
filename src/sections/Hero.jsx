import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP hero — OUTLINE-FREE ART (20th-morning "Hero Image with kids" → hero-kids.webp) ─────
// Structure: the section displays the outline-free mockup at full width and natural
// aspect ratio (2400×1350). No baked pill outlines—white ground below book is the canvas.
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
// LOCALISED ART: the hero illustration (headline + speech bubbles are baked into
// the image) ships per language — English, French, Spanish — chosen from the active
// i18n language. Any unrecognised or missing language falls back to English, so the
// image is never broken. The sr-only bubble copy and the image alt are localised
// alongside the art via the home.json locale files.

// Language-keyed hero art. Any language not listed here resolves to English.
const HERO_ART = {
  en: '/site-assets/homepage/hero/hero-main.webp',
  fr: '/site-assets/homepage/hero/hero-main-fr.webp',
  es: '/site-assets/homepage/hero/hero-main-es.webp',
}
const HERO_ART_FALLBACK = HERO_ART.en

export default function Hero() {
  const { t, i18n } = useTranslation('home')
  const section = useRef(null)

  // Normalise the active language (e.g. 'fr-FR' → 'fr') and resolve the art;
  // anything unrecognised or missing falls back to English so the image never breaks.
  const lang = (i18n.language || 'en').slice(0, 2).toLowerCase()
  const heroArt = HERO_ART[lang] || HERO_ART_FALLBACK
  const bubbles = t('hero.bubbles', { returnObjects: true })
  const bubbleLines = Array.isArray(bubbles) ? bubbles : []

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip">
      {/* Semantic copy — baked into the image, surfaced sr-only for SEO + a11y. */}
      <h1 className="sr-only">{t('hero.line1')}, {t('hero.line2')}</h1>
      <p className="sr-only">{t('hero.subhead')}</p>
      <ul className="sr-only">
        {bubbleLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {/* HERO IMAGE — final mockup displayed at full width, natural aspect ratio.
          No overhang, no crops. Section bottom = image bottom. The wrapper is the
          positioning context for the pill CTAs. */}
      <div className="pointer-events-none relative">
        <img
          key={lang}
          src={heroArt}
          alt={t('hero.alt')}
          className="block w-full select-none"
          draggable="false"
          fetchpriority="high"
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
            {/* label centered in the reserved space; arrow pinned flush to the right padding */}
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaPrint')}</span>
            <span className="absolute right-[8px] top-1/2 z-10 flex h-[40px] w-[40px] shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-[#fdfaf4]/15 transition-all duration-300 ease-out group-hover:bg-[#fdfaf4]/25">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#fdfaf4] transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
            </span>
          </a>
          <a
            href="#projects"
            className="hero-btn btn-nebula relative inline-flex h-[54px] w-[220px] items-center justify-center rounded-full border-[1.5px] border-[var(--gold-2)] bg-[var(--navy)] px-[24px] text-[15px] font-medium tracking-[0.3px] text-[#fdfaf4] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-[2px] focus-visible:outline-[var(--gold)] focus-visible:outline-offset-[3px] prefers-reduced:scale-100"
          >
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaReach')}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
