import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Sustainability — "Responsible by Practice." ──────────────────────────────
// LEFT is a full-bleed editorial showpiece: one tall forest-canopy photograph
// graded through a navy→olive→pale-olive SVG duotone (feColorMatrix desaturate +
// feComponentTransfer tritone map, so the image reads art-directed, never a
// pasted stock thumbnail), barely-rounded, filling the column, carrying one
// DM-Mono FSC stat chip, with a slow Ken Burns drift scrubbed to scroll.
// RIGHT is the fixed editorial column. LAWS: System B palette, olive #6B7A2A the
// accent; no tilted-photo-in-card; no straight interior lines; reduced-motion →
// fully static. (Chosen from an A/B/C round; see shots/sustainability/.)

const BULLETS = ['waste', 'fsc', 'iso', 'disposal']

function Leaf() {
  return (
    <svg className="sustain-leaf" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
      <path d="M4 21c1.5-4 4-6.5 7.5-8" />
    </svg>
  )
}

export default function Sustainability() {
  const { t } = useTranslation('homeSustain')
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.sustain-eyebrow, .sustain-title, .sustain-intro'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.sustain-media'), { autoAlpha: 0, y: 24 })
      gsap.set(q('.sustain-item'), { autoAlpha: 0, y: 16 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true } })
      tl.to(q('.sustain-media'), { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power2.out', clearProps: 'transform' }, 0)
        .to(q('.sustain-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15)
        .to(q('.sustain-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.22)
        .to(q('.sustain-intro'), { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.32)
        .to(q('.sustain-item'), { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.4)

      // slow Ken Burns drift, scrubbed to scroll — the frame clips the bleed so
      // the scale never reveals an edge
      const img = q('.svA-img')[0]
      if (img) {
        gsap.fromTo(img, { scale: 1.04, yPercent: -1.5, xPercent: -1 }, {
          scale: 1.14, yPercent: 1.5, xPercent: 1, ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        })
      }

      // the FSC chip settles in just after the frame
      gsap.from(q('.svA-chip'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 62%', once: true } })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="sustainability" ref={root} data-theme="light" className="sustain" aria-labelledby="sustain-title">
      <div className="sustain-inner">
        {/* LEFT — full-bleed editorial: navy→olive duotone canopy + FSC chip */}
        <div className="sustain-media">
          <figure className="svA">
            <svg className="svA-defs" aria-hidden="true" focusable="false">
              <filter id="sustain-duotone" colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values="0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0.33 0.34 0.33 0 0  0 0 0 1 0" />
                <feComponentTransfer>
                  <feFuncR type="table" tableValues="0.055 0.420 0.863" />
                  <feFuncG type="table" tableValues="0.141 0.478 0.894" />
                  <feFuncB type="table" tableValues="0.267 0.165 0.706" />
                </feComponentTransfer>
              </filter>
            </svg>
            <div className="svA-frame">
              <img className="svA-img" src="/qfp/sustain/canopy.jpg" alt={t('cutoutAlt')} loading="lazy" decoding="async" />
              <span className="svA-vignette" aria-hidden="true" />
              <figcaption className="svA-chip">
                <span className="svA-chip-dot" aria-hidden="true" />
                FSC&nbsp;Certified · TUVDC-COC-101258
              </figcaption>
            </div>
          </figure>
        </div>

        {/* RIGHT — editorial text (unchanged) */}
        <div className="sustain-body">
          <p className="sustain-eyebrow">{t('eyebrow')}</p>
          <h2 id="sustain-title" className="sustain-title">{t('title')}</h2>
          <p className="sustain-intro">{t('intro')}</p>
          <ul className="sustain-list">
            {BULLETS.map((b) => (
              <li className="sustain-item" key={b}>
                <Leaf />
                <span className="sustain-item-text">{t(`bullets.${b}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
