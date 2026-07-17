import { useTranslation } from 'react-i18next'
import GlobeFlyTo from '@/components/GlobeFlyTo'

// ── Printed in India. Read by the World. ────────────────────────────────────
// Homepage global markets moment (sits between WhatWePrint and Promise).
// RESTRUCTURE (Lane 6): Section header kept to eyebrow + title + subhead + globe.
// Regions restructured as destination cards with descriptions below.
// Credentials moved to 2x2 grid below destinations (compact card treatment).
export default function GlobeReach() {
  const { t } = useTranslation('home')
  const regions = t('globeReach.regions', { returnObjects: true })
  const bullets = t('globeReach.bullets', { returnObjects: true })

  return (
    <>
      {/* Header section with globe */}
      <section id="reach" data-theme="dark" aria-labelledby="reach-heading" className="gr-section">
        <div className="gr-grid">
          <div className="gr-copy">
            <p className="gr-eyebrow">{t('globeReach.eyebrow')}</p>
            <h2 id="reach-heading" className="gr-title">
              <span className="gr-bold">{t('globeReach.titleLine1')}</span>
              <br />
              <span className="gr-thin">{t('globeReach.titleThin')}</span> <span className="gr-bold">{t('globeReach.titleBold2')}</span>
            </h2>
            <p className="gr-subhead">
              {t('globeReach.subhead')}
            </p>
          </div>
          <div className="gr-globe">
            <GlobeFlyTo flightMs={6000} beatMs={1200} />
          </div>
        </div>
      </section>

      {/* Destination cards section */}
      <section data-theme="dark" className="relative bg-[var(--navy)] px-6 py-24 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-page">
          <div className="grid gap-8 md:grid-cols-3">
            {regions && regions.map((region, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex-1 rounded-[var(--r-card)] bg-[rgb(var(--navy-2-rgb))] p-6">
                  <h3 className="mb-2 text-xl font-semibold text-[#fdfaf4]">
                    {region.title}
                    {region.subtitle && <span className="block text-sm font-normal text-[#fdfaf4]/70"> {region.subtitle}</span>}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#fdfaf4]/85">
                  {region.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials grid section */}
      <section data-theme="dark" className="relative bg-[var(--navy)] px-6 py-24 sm:px-10 lg:px-14">
        <div className="mx-auto max-w-page">
          <div className="grid gap-6 sm:grid-cols-2">
            {bullets && bullets.map((bullet, idx) => (
              <div key={idx} className="rounded-[var(--r-card)] border border-[#fdfaf4]/10 bg-[rgb(var(--navy-2-rgb))] p-6">
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/20">
                  <span className="text-sm font-bold text-[var(--gold-2)]">✓</span>
                </div>
                <h4 className="mb-2 text-base font-semibold text-[#fdfaf4]">
                  {bullet.title}
                </h4>
                <p className="text-sm leading-relaxed text-[#fdfaf4]/75">
                  {bullet.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
