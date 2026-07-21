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

// Ten real awards, newest first (title + year + issuer are verbatim in the locale;
// the mock photos at site-assets/homepage/awards/award-01..10.webp are overwrite-ready
// for the real award photography). The row scrolls; "See More" routes to /newsroom.
const CARDS = [
  { key: 'power100', img: 'award-01.webp', labelKey: 'industry' },
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
function AwardPhoto({ img, ph }) {
  const [ok, setOk] = useState(false)
  return (
    <>
      <img
        className="aw-photo-img"
        src={`/site-assets/homepage/awards/${img}`}
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
            {/* See More → /newsroom: the site's standard pill CTA system (identical to
                the "Request a Quote" primary in the Let's-Print-Something section) —
                btn-nebula ring, h-14 pill, orange fill shifting to #F5824A on hover,
                scale-up on hover / press-in on active. */}
            <Link
              to="/newsroom"
              className="btn-nebula focus-ring aw-see-more inline-flex h-14 items-center justify-center gap-2 rounded-[var(--r-btn)] bg-[#F37031] px-10 text-[15px] font-semibold text-[#0e1b46] transition-all duration-300 hover:bg-[#F5824A] hover:scale-[1.02] active:scale-[0.98]"
              style={{ letterSpacing: '0.2px' }}
            >
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
                    <AwardPhoto img={c.img} ph={t(`cards.${c.key}.ph`)} />
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
