import { useTranslation } from 'react-i18next'

// Print-craft capability labels, resolved from the home namespace so the marquee
// switches language with the rest of the site. Order is fixed by this key list.
const TERM_KEYS = ['offset', 'case', 'foil', 'perfect', 'spotuv', 'saddle', 'litho', 'emboss', 'fourcolour']
const STAR = 'text-[#C89A3C]' // gold separators — full brand cohesion

function Row({ terms }) {
  return (
    <div className="flex shrink-0 items-center">
      {terms.map((t, i) => (
        <span key={t} className="flex items-center">
          <span
            className={
              i % 2
                ? 'font-display text-[8vw] font-extrabold uppercase leading-none text-transparent [-webkit-text-stroke:1.4px_var(--paper)] md:text-[5.6vw]'
                : 'font-display text-[8vw] font-extrabold uppercase leading-none text-paper md:text-[5.6vw]'
            }
          >
            {t}
          </span>
          <span className={`mx-[3vw] text-[3.4vw] md:text-[2.2vw] ${STAR}`} aria-hidden="true">
            ✶
          </span>
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
