import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Certifications — faithful port of Alternativ's certs section, QFP content ──
// Signature: the cream section sweeps in on a giant dome/arc over the section above
// and the next dark section arcs in below. Three functional filter pills, a slow
// rotating seal, and a flat hairline-card carousel (scroll / drag + arrow buttons).

// Filter pills → which cards they reveal (default: all shown, first pill active).
// Label text resolved from the homeCerts namespace by key (pills.<key>).
const PILLS = [
  { key: 'certifications', tint: 'gold' },
  { key: 'environment', tint: 'olive' },
  { key: 'social', tint: 'navy' },
]

// eyebrow / title / body resolved from homeCerts (cards.<key>.*). Proper names,
// cert titles, codes and logo filenames stay hardcoded; the FSC licence code and
// the typographic Star Export House mark are non-translatable by compliance/brand.
const CERTS = [
  {
    key: 'fsc',
    cats: ['environment'],
    logo: 'fsc.webp',
    // COMPLIANCE LAW: the FSC licence code must render with the FSC mark on every
    // surface it appears — the card cannot ship without it.
    code: 'TUVDC-COC-101258',
  },
  {
    key: 'iso9001',
    cats: ['certifications'],
    logo: 'iso.webp',
  },
  {
    key: 'iso14001',
    cats: ['environment'],
    logo: 'iso.webp',
  },
  {
    key: 'sedex',
    cats: ['social'],
    logo: 'sedex.webp',
  },
  {
    key: 'star',
    cats: ['certifications'],
    typographic: true,
  },
]

function CheckMark() {
  return (
    <svg className="cert-check" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 10.4l2.6 2.6L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Certifications() {
  const { t } = useTranslation('homeCerts')
  const root = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [active, setActive] = useState(null) // null → all shown (first pill styled active)
  const [arrows, setArrows] = useState({ prev: false, next: true })

  const visible = active ? CERTS.filter((c) => c.cats.includes(active)) : CERTS

  // arrow enable/disable from scroll position
  const syncArrows = () => {
    const el = viewport.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setArrows({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4 })
  }
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    el.scrollTo({ left: 0 })
    // let layout settle after a filter change, then re-read the extents
    const id = requestAnimationFrame(syncArrows)
    return () => cancelAnimationFrame(id)
  }, [active])

  const nudge = (dir) => {
    const el = viewport.current
    if (!el) return
    const card = el.querySelector('.cert-card')
    const step = card ? card.offsetWidth + 20 : 360
    el.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' })
  }

  // drag-to-scroll (pointer) — feels like the reference carousel
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    let down = false, startX = 0, startLeft = 0, moved = false
    const onDown = (e) => { down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; el.setPointerCapture?.(e.pointerId) }
    const onMove = (e) => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = startLeft - dx }
    const onUp = (e) => { down = false; el.releasePointerCapture?.(e.pointerId) }
    // swallow click after a drag so cards/arrows don't misfire
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation() } }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    el.addEventListener('scroll', syncArrows, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('scroll', syncArrows)
    }
  }, [])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.certs-pills, .certs-title, .certs-sub, .certs-seal'), { autoAlpha: 0, y: 18 })
      gsap.set(q('.cert-card'), { autoAlpha: 0, y: 28 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 68%', once: true } })
      tl.to(q('.certs-pills'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.certs-seal'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.05)
        .to(q('.certs-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.1)
        .to(q('.certs-sub'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.2)
        .to(q('.cert-card'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.25)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="certifications" ref={root} data-theme="light" className="certs" aria-labelledby="certs-title">
      {/* signature curve — cream dome sweeping over the section above */}
      <svg className="certs-arc-top" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,160 L1440,160 L1440,108 Q720,-34 0,108 Z" fill="#fdfaf4" />
      </svg>

      <div className="certs-inner">
        <div className="certs-top">
          {/* filter pills */}
          <div className="certs-pills" role="group" aria-label={t('filterAria')}>
            {PILLS.map((p, i) => {
              const isActive = active === p.key || (active === null && i === 0)
              return (
                <button
                  key={p.key}
                  type="button"
                  data-filter={p.key}
                  className={`certs-pill certs-pill--${p.tint}${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActive((prev) => (prev === p.key ? null : p.key))}
                >
                  {t(`pills.${p.key}`)}
                </button>
              )
            })}
          </div>

          {/* rotating seal */}
          <div className="certs-seal" aria-hidden="true">
            <svg className="certs-seal-ring" viewBox="0 0 200 200">
              <defs>
                <path id="certSealPath" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text>
                <textPath href="#certSealPath" startOffset="0">
                  {t('seal')}
                </textPath>
              </text>
            </svg>
            <span className="certs-seal-core">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
                <path d="M4 21c1.5-4 4-6.5 7.5-8" />
              </svg>
            </span>
          </div>
        </div>

        {/* headline */}
        <div className="certs-head">
          <h2 id="certs-title" className="certs-title">{t('title')}</h2>
          <p className="certs-sub">{t('sub')}</p>
        </div>

        {/* card carousel */}
        <div className="certs-carousel">
          <div className="certs-viewport" ref={viewport} tabIndex={0} role="group" aria-label={t('carouselAria')}>
            <div className="certs-track">
              {visible.map((c) => (
                <article className="cert-card" key={c.key}>
                  <div className="cert-card-eyebrow">
                    <CheckMark />
                    <span>{t(`cards.${c.key}.eyebrow`)}</span>
                  </div>

                  <div className="cert-card-mark">
                    {c.typographic ? (
                      <div className="cert-star" aria-label="Star Export House">
                        <span className="cert-star-glyph" aria-hidden="true">★</span>
                        <span className="cert-star-word">STAR EXPORT<br />HOUSE</span>
                      </div>
                    ) : (
                      <img src={`/qfp/certs/${c.logo}`} alt={`${t(`cards.${c.key}.title`)} logo`} loading="lazy" decoding="async" />
                    )}
                    <div className="cert-card-title">{t(`cards.${c.key}.title`)}</div>
                    {c.code && <div className="cert-card-code">{t('licence')} {c.code}</div>}
                  </div>

                  <p className="cert-card-body">{t(`cards.${c.key}.body`)}</p>
                </article>
              ))}
            </div>
          </div>

          {/* prev / next arrows — grey inactive, navy active */}
          <div className="certs-arrows">
            <button type="button" className="certs-arrow" onClick={() => nudge(-1)} disabled={!arrows.prev} aria-label={t('prevAria')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" className="certs-arrow" onClick={() => nudge(1)} disabled={!arrows.next} aria-label={t('nextAria')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* signature curve — the next dark section (techniques strip) arcs in below */}
      <svg className="certs-arc-bottom" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,150 L1440,150 L1440,70 Q720,-10 0,70 Z" fill="#0f2444" />
      </svg>
    </section>
  )
}
