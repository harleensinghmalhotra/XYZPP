import { useTranslation } from 'react-i18next'

// Print-craft capability labels, resolved from the home namespace so the marquee
// switches language with the rest of the site. Order is fixed by this key list.
const TERM_KEYS = ['offset', 'case', 'foil', 'perfect', 'spotuv', 'saddle', 'litho', 'emboss', 'fourcolour']

// Lane 12b font re-audit: family/weight were already brand (Inter Tight 800, a loaded
// weight), so there was no fallback face. The off-brand look the client caught was the
// ALTERNATING -webkit-text-stroke outline treatment (every odd term drawn transparent
// with a paper stroke) — outline-only letterforms read like a different, condensed
// display face (Anton/Bebas), unlike the solid fill every other heading on the site
// uses. Fix: drop the outline variant so every term is solid Inter Tight fill. The gold
// separator stays an inline SVG sparkle (no font glyph → no system-symbol fallback).
function Row({ terms }) {
  return (
    <div className="mq-row">
      {terms.map((t) => (
        <span key={t} className="mq-item">
          <span className="mq-word">{t}</span>
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
      className="relative z-0 overflow-hidden border-b border-paper/10 bg-[var(--navy)] pb-8 pt-[18svh] md:pb-10 md:pt-[16svh]"
    >
      {/* curved boundary that tops the section — the book overhangs and lands on it */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[9svh] w-full text-[var(--navy)]"
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
