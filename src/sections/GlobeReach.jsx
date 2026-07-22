import { useTranslation } from 'react-i18next'
import GlobeFlyTo from '@/components/GlobeFlyTo'

// ── Printed in India. Read by the World. ────────────────────────────────────
// Homepage global markets moment (sits between WhatWePrint and Promise).
// Section header kept to eyebrow + title + subhead + globe.
// Regions restructured as destination cards with descriptions below.
// Credentials moved to 2x2 grid below destinations (compact card treatment).
export default function GlobeReach() {
  const { t } = useTranslation('home')

  return (
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
  )
}
