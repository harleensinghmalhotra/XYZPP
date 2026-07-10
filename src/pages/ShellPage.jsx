import { useTranslation } from 'react-i18next'

// Empty shell for a not-yet-designed inner page. Brand System B only:
// cream ground, navy Inter Tight headline, gold DM Mono eyebrow. data-theme="light"
// so SiteNav's IntersectionObserver flips the fixed nav to its light treatment at
// the top of the page. Nothing else lives here yet by design.
export default function ShellPage({ title, eyebrow = 'Quarterfold Printabilities' }) {
  const { t } = useTranslation('common')
  // Chrome eyebrow only: translate known values (e.g. "Legal"); brand name and
  // codes like "404" have no key and fall back to the literal silently.
  const eyebrowText = t(`eyebrow.${eyebrow}`, eyebrow)
  return (
    <main
      id="main"
      data-theme="light"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center"
      style={{ background: '#FDFAF4' }}
    >
      <p
        className="mb-5 text-[12px] font-medium uppercase tracking-[0.28em]"
        style={{ fontFamily: "'DM Mono', monospace", color: '#836013' }}
      >
        {eyebrowText}
      </p>
      <h1
        className="max-w-4xl text-[clamp(40px,7vw,84px)] font-bold leading-[1.05] tracking-tight"
        style={{ fontFamily: "'Inter Tight', sans-serif", color: '#0F2444' }}
      >
        {title}
      </h1>
    </main>
  )
}
