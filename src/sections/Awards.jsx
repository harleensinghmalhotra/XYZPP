import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Awards & Press — pixel-faithful port of the approved Claude Design export ──
// Navy plaque cards with gold-foil names, a CAPEXIL/press label row, and the
// Forbes press-clipping card. One approved change vs the export: the "RECOGNITION"
// eyebrow LOSES its gold dash/hairline. Only motion added: a subtle stagger reveal
// on the four cards (the export is static); reduced-motion → static.

const CARDS = [
  { key: 'pw24', img: 'award-01.webp', labelKey: 'industry' },
  { key: 'pw23', img: 'award-02.webp', labelKey: 'industry' },
  { key: 'forbes', forbes: true, labelKey: 'press' },
  { key: 'capexil', img: 'award-04.webp', labelKey: 'export' },
]

// Reserved slots for awards the client says are coming. Add an entry here (drop the
// webp at the path below + its locale keys cards.<key>.name/body/ph + labels.<key>)
// and the plaque appears — using the same graceful AwardPhoto frame until the photo
// lands, so a missing file is never a broken image. Empty by default → NO dead space
// while unfilled. Next expected paths, in order:
//   public/qfp/awards/award-05.webp · award-06.webp · award-07.webp · award-08.webp
const RESERVED = [] // e.g. { key: 'pw25', img: 'award-05.webp', labelKey: 'industry' }
const SLOTS = [...CARDS, ...RESERVED]

// The Forbes card's photo zone IS a designed press clipping (no photo needed).
function ForbesClipping({ t }) {
  return (
    <div className="aw-clip">
      <div className="aw-clip-head">
        <span className="aw-clip-masthead">{t('forbes.masthead')}</span>
        <span className="aw-clip-date">{t('forbes.date')}</span>
      </div>
      <div className="aw-clip-rule" />
      <div className="aw-clip-headline">{t('forbes.headline')}</div>
      <div className="aw-clip-lines">
        <span style={{ width: '100%' }} />
        <span style={{ width: '93%' }} />
        <span style={{ width: '98%' }} />
        <span style={{ width: '58%' }} />
      </div>
    </div>
  )
}

// Silent drop-in photo: real webp reveals on load and hides the elegant frame
// placeholder; a 404 keeps the placeholder (zero code change when the file lands).
function AwardPhoto({ img, ph }) {
  const [ok, setOk] = useState(false)
  return (
    <>
      <img
        className="aw-photo-img"
        src={`/qfp/awards/${img}`}
        alt=""
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
  const root = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)
  // The prev/next arrow paging was retired (client): the header now carries a single
  // "See More" pill → /newsroom instead. The plaque row stays a native overflow-x
  // scroller (aw-viewport) so more awards dropped into RESERVED still scroll.

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.aw-head'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.plq'), { autoAlpha: 0, y: 28 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true } })
      tl.to(q('.aw-head'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        // clearProps hands the cards back to CSS so :hover lift/sheen work
        .to(q('.plq'), { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.15)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="awards" ref={root} data-theme="dark" className="aw" aria-labelledby="aw-title">
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
            <Link to="/newsroom" className="u-btn u-btn--gold aw-see-more">
              {t('seeMore')}
              <span aria-hidden="true">→</span>
            </Link>
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
                    {c.forbes ? <ForbesClipping t={t} /> : <AwardPhoto img={c.img} ph={t(`cards.${c.key}.ph`)} />}
                    <div className="plq-tint" aria-hidden="true" />
                    <div className="plq-sheen" aria-hidden="true" />
                  </div>
                  <div className="aw-body">
                    <div className="aw-label">{t(`labels.${c.labelKey}`)}</div>
                    <h3 className="aw-name">{t(`cards.${c.key}.name`)}</h3>
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
