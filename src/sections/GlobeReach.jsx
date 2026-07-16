import { useTranslation } from 'react-i18next'
import GlobeFlyTo from '@/components/GlobeFlyTo'

// ── Printed in India. Read by the World. ────────────────────────────────────
// Homepage global markets moment (sits between WhatWePrint and Promise). Normal
// flow, ~92vh, NOT pinned. Text left (header, subhead, regions, bullets),
// branded MapLibre globe right-weighted/full-bleed. The globe boots itself only
// when it nears the viewport (see GlobeFlyTo) and flies space → Navi Mumbai.
export default function GlobeReach() {
  const { t } = useTranslation('home')
  const regions = t('globeReach.regions', { returnObjects: true })
  const bullets = t('globeReach.bullets', { returnObjects: true })

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

          <div className="gr-regions">
            {regions && regions.map((region, idx) => (
              <div key={idx} className="gr-region">
                <h3 className="gr-region-title">
                  {region.title}
                  {region.subtitle && <span className="gr-region-subtitle"> {region.subtitle}</span>}
                </h3>
                <p className="gr-region-description">{region.description}</p>
              </div>
            ))}
          </div>

          <div className="gr-bullets">
            {bullets && bullets.map((bullet, idx) => (
              <div key={idx} className="gr-bullet">
                <h4 className="gr-bullet-title">{bullet.title}</h4>
                <p className="gr-bullet-description">{bullet.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="gr-globe">
          <GlobeFlyTo flightMs={6000} beatMs={1200} />
        </div>
      </div>
    </section>
  )
}
