import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP homepage hero — headline → CTAs → localised artwork (top to bottom) ──────
// Plain document flow, no absolute positioning:
//   1. Visible <h1> headline — one heading, two lines: headlineTop (cream, display)
//      and headlineAccent (gold-2, its own line), stepped down from --h1 to --h2 so
//      the block clears the fold. Centred in a navy band that matches the artwork's
//      baked sky (var(--navy) resolves to #030C31 under .home-palette). Sits below
//      the in-flow (non-sticky) cream nav.
//   2. A visible subhead (headlineSub), then the two pill CTAs, centred in normal
//      flow; the pills wrap (stack) rather than squash on narrow screens.
//   3. The full-width artwork image (natural 2400×1350 aspect). Its navy sky
//      continues the band's navy seamlessly; its white ground meets TrustStrips.
//
// A11y: the <h1> is now visible copy. The subhead and the four speech-bubble lines
// stay sr-only — that text is painted into the art, surfaced sr-only for screen
// readers. Image alt is descriptive and localised.
//
// LOCALISED ART: the illustration (headline + speech bubbles baked in) ships per
// language — English, French, Spanish — chosen from the active i18n language. Any
// unrecognised or missing language falls back to English, so the image is never
// broken. The sr-only bubble copy and the image alt are localised alongside the
// art via the home.json locale files.

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
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip bg-[var(--navy)]">
      {/* Headline + CTAs — centred in the navy band above the artwork, normal flow.
          Top padding is deliberately smaller than the shared --hero-pad-top: the
          nav is in normal flow (non-sticky), so the headline block + CTAs stay short
          enough that the top of the artwork clears the fold at 1536×743. */}
      <div className="mx-auto max-w-[var(--content-max)] px-[var(--page-gutter)] pt-[clamp(48px,7vh,84px)] pb-[clamp(24px,4vh,40px)] text-center">
        {/* ONE <h1> (SEO + a11y): line 1 cream/display, line 2 accent on its own line.
            Stepped down from --h1 to --h2 so the block never fills the fold. Accent
            colour comes from the existing --gold-2 token. */}
        <h1 className="mx-auto max-w-[20ch] [font-family:'Inter_Tight',sans-serif] font-bold leading-[1.05] tracking-[-0.02em] text-[length:var(--h2)] text-[color:var(--cream-3)] [text-wrap:balance]">
          <span className="block">{t('hero.headlineTop')}</span>
          <span className="block text-[color:var(--gold-2)]">{t('hero.headlineAccent')}</span>
        </h1>

        {/* Visible subhead — smaller, cream at reduced opacity, between headline and CTAs. */}
        <p className="mx-auto mt-4 max-w-[52ch] text-[length:var(--body)] leading-[1.6] text-[color:var(--cream-3)] opacity-80">
          {t('hero.headlineSub')}
        </p>

        {/* Painted-into-art copy, surfaced sr-only for SEO + a11y. */}
        <p className="sr-only">{t('hero.subhead')}</p>
        <ul className="sr-only">
          {bubbleLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {/* TWO BUTTON CTAs — pill shape, one-line labels, equal width. Now in normal
            flow, centred below the headline; they wrap (stack) rather than squash on
            narrow screens. Navy fill + gold nebula ring + cream label read on navy. */}
        <div className="hero-cta-pair mt-7 flex flex-wrap items-center justify-center gap-6">
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

      {/* HERO IMAGE — full width, natural aspect (2400×1350). Below the CTAs; its
          navy sky continues the band, its white ground meets TrustStrips. */}
      <img
        key={lang}
        src={heroArt}
        alt={t('hero.alt')}
        className="block w-full select-none"
        draggable="false"
        fetchpriority="high"
      />
    </section>
  )
}
