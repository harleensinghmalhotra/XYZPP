import { useTranslation } from 'react-i18next'

// Print-craft capability labels, resolved from the home namespace so the marquee
// switches language with the rest of the site. Order is fixed by this key list.
const TERM_KEYS = ['offset', 'case', 'foil', 'perfect', 'spotuv', 'saddle', 'litho', 'emboss', 'fourcolour']

// Lane 12 font re-audit: the runtime computed families were already brand (words →
// Inter Tight, text → Inter), but the ✶ (U+2726) separator glyph is in NEITHER brand
// font, so the browser drew it from a system symbol fallback (Segoe UI Symbol) — the
// off-brand face the client caught. Fix: declare the brand faces EXPLICITLY (like the
// neighbouring sections do, not via Tailwind aliases) in the .mq-* block, and draw the
// gold sparkle as an inline SVG so no non-brand font can ever render in the strip.
function Row({ terms }) {
  return (
    <div className="mq-row">
      {terms.map((t, i) => (
        <span key={t} className="mq-item">
          <span className={i % 2 ? 'mq-word mq-word--outline' : 'mq-word'}>{t}</span>
          <svg className="mq-star" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 1.5 L13.7 10.3 L22.5 12 L13.7 13.7 L12 22.5 L10.3 13.7 L1.5 12 L10.3 10.3 Z" />
          </svg>
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  const { t } = useTranslation('home')
  const terms = TERM_KEYS.map((k) => t(`marquee.terms.${k}`))
  return (
    <section
      id="marquee"
      aria-label={t('marquee.aria')}
      data-theme="dark"
      // z-0 so the hero (z-1) overhangs onto this section as it lands; extra top
      // padding leaves the landing zone clear for the overhanging book spine.
      className="relative z-0 overflow-hidden border-b border-paper/10 bg-[#0f2444] pb-8 pt-[18svh] md:pb-10 md:pt-[16svh]"
    >
      {/* curved boundary that tops the section — the book overhangs and lands on it */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[9svh] w-full text-[#0f2444]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0,120 L0,44 C 360,-4 1080,-4 1440,44 L1440,120 Z" fill="currentColor" />
        <path d="M0,44 C 360,-4 1080,-4 1440,44" fill="none" stroke="var(--paper)" strokeOpacity="0.12" strokeWidth="1.5" />
      </svg>
      <h2 className="sr-only">{t('marquee.aria')}</h2>
      <ul className="sr-only">
        {terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="flex w-max motion-safe:animate-[marquee_38s_linear_infinite] motion-reduce:animate-none"
      >
        <Row terms={terms} />
        <Row terms={terms} />
      </div>
    </section>
  )
}
