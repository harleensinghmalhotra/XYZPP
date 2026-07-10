import { useTranslation } from 'react-i18next'
import GlobeFlyTo from '@/components/GlobeFlyTo'

// ── Printed in India. Read by the World. ────────────────────────────────────
// Homepage reach moment (sits between TrustStrips and WhatWePrint). Normal flow,
// ~92vh, NOT pinned — so it never touches the hero's scroll engine. Text left,
// branded MapLibre globe right-weighted/full-bleed. The globe boots itself only
// when it nears the viewport (see GlobeFlyTo) and flies space → Navi Mumbai.
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
          <p className="gr-lede">
            {t('globeReach.lede')}
          </p>
          <a href="/#projects" className="gr-link">
            {t('globeReach.link')} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="gr-globe">
          <GlobeFlyTo flightMs={6000} beatMs={1200} />
        </div>
      </div>
    </section>
  )
}
