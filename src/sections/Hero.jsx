import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

// ── QFP homepage hero — headline → CTAs → localised artwork (top to bottom) ──────
// Plain document flow, no absolute positioning:
//   1. Visible <h1> headline — one heading, two lines in the big-caps display
//      treatment: headlineTop (cream, 8.6vw→6.4vw bold) over headlineAccent (gold-2,
//      4.2vw→3.1vw tracked caps), font-metrisch, leading-[0.9], uppercased in CSS so
//      the locale JSON stays natural case. Centred in a navy band that matches the
//      artwork's baked sky (var(--navy) resolves to #030C31 under .home-palette).
//      Sits below the in-flow (non-sticky) cream nav.
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

  // Optional lead word lifted onto its own line ABOVE the headline (EN: "An"). Kept as
  // a separate locale key so the break is STRUCTURAL, never a typed newline, and never
  // forced onto languages whose headline does not begin with a liftable article. Read
  // per-language via getResource (NOT t) because i18n.js sets returnEmptyString:false —
  // an empty value through t() would fall back to the English "An"; getResource returns
  // each language's own value, so FR/ES (shipped empty) stay two-line.
  const lead = (i18n.getResource(lang, 'home', 'hero.headlineLead') || '').trim()

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative overflow-x-clip bg-[var(--navy)]">
      {/* Headline + CTAs — one centred block in the navy band above the artwork.
          The block claims a min-height of (viewport − nav − sliver) and vertically
          centres its content, so the headline/subtext/CTAs settle in the middle of
          the first screen and the artwork (in normal flow, directly below) crests
          the fold showing only its top sliver. The nav is in normal flow (non-sticky,
          87px tall) and scrolls away, so it is subtracted once here. The sliver is
          sized in vw (≈6.6% of the 16:9 artwork's height) so it stays a constant
          fraction of the image at any width — a true sliver at 1536 and at 390. */}
      <div className="mx-auto flex min-h-[calc(100svh-87px-3.7vw-14vh)] max-[900px]:min-h-0 max-w-[var(--content-max)] flex-col items-center justify-center px-[var(--page-gutter)] py-[clamp(24px,4vh,48px)] max-[900px]:pb-[16px] text-center">
        {/* ONE visible <h1> (SEO + a11y) — the effd335 big-caps display treatment,
            recoloured onto the CURRENT homepage tokens: line 1 cream (--cream-3),
            line 2 accent (--gold-2) on its own line. font-metrisch (→ Inter Tight),
            centred, leading-[0.9], uppercased in CSS so the locale JSON keeps natural
            case. Sizes/weights/letter-spacing and the 14px inter-line rhythm reproduce
            the reference's on-screen real estate. lg:whitespace-nowrap keeps each line
            single on desktop within the 1280 content box (the reference was full-width);
            below lg the copy wraps as the vw type scales down. */}
        <h1 className="m-0 flex flex-col items-center font-metrisch leading-[0.9]">
          {/* Lead word on its own line (EN "An") — same cream, font and uppercase as the
              line below, set a touch smaller so a two-letter word reads as a deliberate
              editorial lead-in rather than an oversized orphan. Omitted when empty. */}
          {lead && (
            <span
              className="mb-[0.14em] text-[5.4vw] font-bold uppercase text-[color:var(--gold-2)] lg:text-[4vw]"
              style={{ letterSpacing: '-0.1vw' }}
            >
              {lead}
            </span>
          )}
          {/* Line 1 — cream, big display caps. */}
          <span
            className="text-[7.9vw] font-bold uppercase text-[color:var(--cream-3)] lg:whitespace-nowrap lg:text-[5.9vw]"
            style={{ letterSpacing: '-0.2vw' }}
          >
            {t('hero.headlineTop')}
          </span>
          {/* Line 2 — accent gold, smaller tracked caps kicker. paddingLeft offsets the
              trailing 0.16em tracking so the line stays optically centred. */}
          <span
            className="mt-[14px] text-[4.2vw] font-semibold uppercase text-[color:var(--gold-2)] lg:whitespace-nowrap lg:text-[3.1vw]"
            style={{ letterSpacing: '0.16em', paddingLeft: '0.16em' }}
          >
            {t('hero.headlineAccent')}
          </span>
        </h1>

        {/* Visible subhead — the reference's subtext geometry (18px / 1.4 / 720px),
            kept in the current cream-3 @ 80% opacity so no colour changes. */}
        <p className="mt-[4vh] max-w-[720px] text-center text-[18px] leading-[1.4] text-[color:var(--cream-3)] opacity-80">
          {t('hero.subhead')}
        </p>

        {/* Painted-into-art speech-bubble copy, surfaced sr-only for SEO + a11y. */}
        <ul className="sr-only">
          {bubbleLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

      </div>

      {/* HERO IMAGE — full width, natural aspect (2400×1350). Its navy sky continues
          the band; its white ground meets TrustStrips. The two pill CTAs are overlaid
          in the white ground directly under the book (the earlier f4cb85a placement). */}
      <div className="relative max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-[16px]">
        <img
          key={lang}
          src={heroArt}
          alt={t('hero.alt')}
          className="block w-full select-none max-[900px]:aspect-[2400/1350]"
          draggable="false"
          fetchpriority="high"
        />
        {/* TWO BUTTON CTAs — pill shape, one-line labels, equal width. Absolutely
            positioned over the artwork's white ground beneath the book, centred; they
            wrap (stack) on very narrow screens. Markup/hover/focus unchanged. */}
        <div className="hero-cta-pair absolute inset-x-0 z-20 flex flex-wrap items-center justify-center gap-6 max-[900px]:static max-[900px]:z-auto max-[900px]:order-[-1] max-[900px]:w-full max-[900px]:flex-col max-[900px]:flex-nowrap max-[900px]:gap-[12px] max-[900px]:px-[var(--page-gutter)] max-[900px]:![bottom:auto] max-[900px]:![transform:none]" style={{ bottom: 'clamp(3%, 5%, 8%)', transform: 'translate(1.05vw, 22px)' }}>
          <a
            href="#infrastructure"
            className="hero-btn btn-nebula group relative inline-flex h-[54px] min-w-[220px] max-[900px]:w-full max-[900px]:min-w-0 items-center justify-center rounded-full border-[1.5px] border-[var(--gold-2)] bg-[var(--navy)] pl-[22px] pr-[46px] text-[15px] font-medium tracking-[0.3px] text-[#fdfaf4] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-[2px] focus-visible:outline-[var(--gold)] focus-visible:outline-offset-[3px] prefers-reduced:scale-100"
          >
            {/* label centered in the reserved space; arrow pinned flush to the right padding */}
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaPrint')}</span>
            <span className="absolute right-[8px] top-1/2 z-10 flex h-[40px] w-[40px] shrink-0 -translate-y-1/2 items-center justify-center rounded-full bg-[#fdfaf4]/15 transition-all duration-300 ease-out group-hover:bg-[#fdfaf4]/25">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-[#fdfaf4] transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
            </span>
          </a>
          <a
            href="#projects"
            className="hero-btn btn-nebula relative inline-flex h-[54px] min-w-[220px] max-[900px]:w-full max-[900px]:min-w-0 items-center justify-center rounded-full border-[1.5px] border-[var(--gold-2)] bg-[var(--navy)] px-[24px] text-[15px] font-medium tracking-[0.3px] text-[#fdfaf4] transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-[2px] focus-visible:outline-[var(--gold)] focus-visible:outline-offset-[3px] prefers-reduced:scale-100"
          >
            <span className="relative z-10 whitespace-nowrap">{t('hero.ctaReach')}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
