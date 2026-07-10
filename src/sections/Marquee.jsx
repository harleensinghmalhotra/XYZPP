const TERMS = [
  'Offset Printing',
  'Case Binding',
  'Foil Blocking',
  'Perfect Bound',
  'Spot UV',
  'Saddle Stitch',
  'Lithography',
  'Embossing',
  '4-Colour Process',
]
const STAR = 'text-[#C89A3C]' // gold separators — full brand cohesion

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {TERMS.map((t, i) => (
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
  return (
    <section
      id="marquee"
      aria-label="Print-craft capabilities"
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
      <h2 className="sr-only">Print-craft capabilities</h2>
      <ul className="sr-only">
        {TERMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="flex w-max motion-safe:animate-[marquee_38s_linear_infinite] motion-reduce:animate-none"
      >
        <Row />
        <Row />
      </div>
    </section>
  )
}
