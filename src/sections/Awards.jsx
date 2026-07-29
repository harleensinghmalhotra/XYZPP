import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CTAButton from '@/components/CTAButton'

// ── Awards & Press — pixel-faithful port of the approved design ──
// Navy plaque cards with gold-foil names, a CAPEXIL/press label row, and the
// Forbes press-clipping card. One approved change vs the design: the "RECOGNITION"
// eyebrow LOSES its gold dash/hairline. The section is fully static — the scroll-in
// stagger reveal was removed (a killAll() on homepage→inner navigation could strand
// the hide-first elements invisible), so the cards render present exactly as the CSS.

// Eleven real awards, newest first (title + year + issuer are verbatim in the locale).
// Real award photography lives at site-assets/homepage/awards/award-01..11.webp; only
// award-06 (Most Trusted Brand, MSME 2023) is still a placeholder — the final asset
// has not been supplied yet. The row scrolls; "See More" routes to /newsroom.
const CARDS = [
  { key: 'power100', img: 'award-01.webp', labelKey: 'industry' },
  { key: 'businessconnect', img: 'award-11.webp', labelKey: 'press' },
  { key: 'forbes', img: 'award-02.webp', labelKey: 'press' },
  { key: 'bookedu', img: 'award-03.webp', labelKey: 'industry' },
  { key: 'assocham', img: 'award-04.webp', labelKey: 'industry' },
  { key: 'export23', img: 'award-05.webp', labelKey: 'export' },
  { key: 'trusted', img: 'award-06.webp', labelKey: 'industry' },
  { key: 'twostar', img: 'award-07.webp', labelKey: 'export' },
  { key: 'capexil', img: 'award-08.webp', labelKey: 'export' },
  { key: 'youngest', img: 'award-09.webp', labelKey: 'industry' },
  { key: 'dnb', img: 'award-10.webp', labelKey: 'industry' },
]
const SLOTS = CARDS

// Silent drop-in photo: real webp reveals on load and hides the elegant frame
// placeholder; a 404 keeps the placeholder (zero code change when the file lands).
function AwardPhoto({ img, ph, alt }) {
  const [ok, setOk] = useState(false)
  return (
    <>
      <img
        className="aw-photo-img"
        src={`/site-assets/homepage/awards/${img}`}
        alt={alt}
        loading="lazy"
        decoding="async"
        style={{ opacity: ok ? 1 : 0 }}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
      />
      {!ok && <div className="aw-photo-ph" aria-hidden="true"><span>{ph}</span></div>}
    </>
  )
}

export default function Awards() {
  const { t } = useTranslation('homeAwards')
  const viewport = useRef(null)
  // The prev/next arrow paging was retired: the header now carries a single
  // "See More" pill → /newsroom instead. The plaque row stays a native overflow-x
  // scroller (aw-viewport) so more awards dropped into RESERVED still scroll.

  return (
    <section id="awards" data-theme="dark" className="aw" aria-labelledby="aw-title">
      {/* lighting spans the FULL section — beams emerge from the top edges */}
      <div className="aw-glow" aria-hidden="true" />
      <div className="aw-carpet" aria-hidden="true" />
      <div className="aw-vignette" aria-hidden="true" />
      <div className="aw-inner">
        <div className="aw-content">
          {/* header — eyebrow (dash removed) + heading, with a single "See More"
              pill top-right → /newsroom (the prev/next arrows were retired) */}
          <div className="aw-head">
            <div className="aw-head-text">
              <p className="aw-eyebrow">{t('eyebrow')}</p>
              <h2 id="aw-title" className="aw-title">{t('title')}</h2>
            </div>
            {/* See More → /newsroom: the shared button system (.u-btn), identical to the
                homepage "Request a Quote" primary — orange --gold pill, --lg footprint,
                btn-nebula ring, hover/press feel all inherited from the family. */}
            <CTAButton to="/newsroom" dark>{t('seeMore')}</CTAButton>
          </div>

          {/* paged plaque strip — native horizontal scroller (4 visible), focusable
              labelled region so arrow keys scroll it and it degrades like the WWP row */}
          <div
            className="aw-viewport"
            ref={viewport}
            role="region"
            aria-label={t('rowLabel')}
            tabIndex={0}
          >
            <div className="aw-grid">
              {SLOTS.map((c) => (
                <article className="plq" key={c.key}>
                  <div className="aw-photo">
                    <AwardPhoto img={c.img} ph={t(`cards.${c.key}.ph`)} alt={t(`cards.${c.key}.name`)} />
                    <div className="plq-tint" aria-hidden="true" />
                    <div className="plq-sheen" aria-hidden="true" />
                  </div>
                  <div className="aw-body">
                    <div className="aw-label">{t(`labels.${c.labelKey}`)}</div>
                    <h3 className="aw-name">{t(`cards.${c.key}.name`)}</h3>
                    <p className="aw-meta">{t(`cards.${c.key}.meta`)}</p>
                    <p className="aw-desc">{t(`cards.${c.key}.body`)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
