import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'
import './Cases.css'

// Case photos: Pexels (free commercial use, no attribution required). Provenance:
//   case-01 (Tanzania)  — https://www.pexels.com/photo/5212345/  (classroom)
//   case-02 (Nigeria)   — https://www.pexels.com/photo/8926553/  (school child)
//   case-03 (USAID Ghana) — https://www.pexels.com/photo/1720186/ (children reading)
// Downloaded, cropped 16:10, compressed → public/qfp/cases/case-0N.webp, then given
// our navy duotone + bottom scrim so they sit in the brand.

// `desc`/`heading` name a specific ministry or funded programme; `*Safe` variants
// drop the named entity for neutral phrasing when SHOW_MINISTRY_NAMES is off
// (permission pending). Country names are geographic and always stay, so every
// card keeps its shape — only the gated name changes.
// Structural data only — user-facing text resolves via the `homeCases` namespace.
// `hasHeadingSafe`/`hasDescSafe` mark which cards gate a named entity behind
// SHOW_MINISTRY_NAMES; `tagKeys` keeps the tag order stable per card.
const CASES = [
  { id: '01', img: 'case-01.webp', tagKeys: ['country', 'books'], hasDescSafe: true },
  { id: '02', img: 'case-02.webp', tagKeys: ['country', 'books'], hasDescSafe: true },
  { id: '03', img: 'case-03.webp', tagKeys: ['country', 'books'], hasHeadingSafe: true, hasDescSafe: true },
]

export default function Cases() {
  const { t } = useTranslation('homeCases')
  const [active, setActive] = useState('01')
  const cases = CASES.map((c) => ({
    ...c,
    heading: (!SHOW_MINISTRY_NAMES && c.hasHeadingSafe)
      ? t(`cases.${c.id}.headingSafe`)
      : t(`cases.${c.id}.heading`),
    title: t(`cases.${c.id}.title`),
    tags: c.tagKeys.map((k) => t(`cases.${c.id}.tags.${k}`)),
    desc: (!SHOW_MINISTRY_NAMES && c.hasDescSafe)
      ? t(`cases.${c.id}.descSafe`)
      : t(`cases.${c.id}.desc`),
  }))

  return (
    <section id="cases" className="section-cases" data-theme="dark">
      <div className="cases-header" data-theme="light">
        <div className="cases-header-inner">
          <div className="cases-eyebrow">{t('eyebrow')}</div>
          <h3>{t('title')}</h3>
          <p>{t('sub')}</p>
        </div>
      </div>

      <div className="cases-list">
        {cases.map((c) => (
          <div
            key={c.id}
            className={`case-item ${active === c.id ? 'active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            <div className="case-content">
              <div className="case-content-canvas">
                <div className="inner">
                  <div className="case-heading">{t('photo')} · {c.heading}</div>
                  <h4 className="case-title">{c.title}</h4>
                  <div className="tags">
                    {c.tags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                  <div className="case-result">
                    <p>{c.desc}</p>
                  </div>
                  <a href="#" className="case-link desktop">{t('readMore')}</a>
                </div>
              </div>
            </div>

            <div className="case-media">
              <div className="case-media-photo">
                <img src={`/qfp/cases/${c.img}`} alt="" loading="lazy" decoding="async" />
                <div className="case-duotone" aria-hidden="true" />
                <div className="case-scrim" aria-hidden="true" />
              </div>

              <div className="vertical-heading">{c.heading}</div>
              <div className="num">{c.id}</div>
              <a href="#" className="case-link mobile">{t('readMore')}</a>
            </div>
          </div>
        ))}
      </div>

      <div className="cases-footer">
        <button className="view-all-cases">{t('viewAll')}</button>
      </div>
    </section>
  )
}
