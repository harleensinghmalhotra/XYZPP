import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Sustainability — "Responsible by Practice." ──────────────────────────────
// LEFT is a designed nature scene, not a photograph: a quiet cream→olive-wash
// panel carrying stroke-drawn branch line-art (olive #6B7A2A + gold #9B7420) and
// a pair of hand-built CSS butterflies — gold-gradient wings on an olive body,
// gently flapping (rotateY, ~0.8s) as they drift a lazy wandering path across the
// panel (12–18s, no tight loops). One pressed FSC certification plate seats
// bottom-left, clear of the flight path. RIGHT is the fixed editorial column.
// LAWS: System B palette, olive #6B7A2A the accent; no photo; no straight
// interior lines; reduced-motion → butterflies static, wings open, nothing moves.
// GPU-only (CSS transforms), 60fps, no JS rAF. (adapted from the Uiverse butterfly
// by WerlynRodriguez — CC-attribution loader, rebuilt to the brand.)

const BULLETS = ['waste', 'fsc', 'iso', 'disposal']

function Leaf() {
  return (
    <svg className="sustain-leaf" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
      <path d="M4 21c1.5-4 4-6.5 7.5-8" />
    </svg>
  )
}

// One butterfly wing (right side; the left is a scaleX(-1) mirror). Gold-gradient
// fill, olive stroke veins — same line-language as the leaf icons above.
function Wing() {
  return (
    <svg className="bfly-wing-svg" viewBox="0 0 66 66" fill="none" aria-hidden="true" focusable="false">
      {/* broad forewing (up-out) + rounder hindwing (down-out) — reads as a butterfly at a glance */}
      <path className="bfly-wing-fill" fill="url(#bflyWing)" d="M2 33C2 18 7 5 23 2C42 -2 63 3 63 17C63 28 50 34 33 34C21 34 9 34 2 33Z" />
      <path className="bfly-wing-fill" fill="url(#bflyWing)" d="M2 35C2 49 9 62 25 64C41 66 51 58 48 48C44 40 30 37 17 36C10 36 5 35 2 35Z" />
      <path className="bfly-wing-vein" d="M6 32C20 18 36 10 52 8" />
      <path className="bfly-wing-vein" d="M6 37C17 47 28 54 40 58" />
    </svg>
  )
}

function Butterfly({ variant }) {
  return (
    <div className={`bfly bfly-${variant}`} aria-hidden="true">
      <div className="bfly-wing bfly-wing-l"><Wing /></div>
      <div className="bfly-wing bfly-wing-r"><Wing /></div>
      <svg className="bfly-body" viewBox="0 0 12 40" fill="none" aria-hidden="true">
        <path className="bfly-antenna" d="M6 9C5 5 3.4 3 1.5 1.6M6 9C7 5 8.6 3 10.5 1.6" />
        <path className="bfly-body-fill" d="M6 6C7.6 6 8.6 8 8.6 12L7.8 30C7.8 34 7 37 6 37C5 37 4.2 34 4.2 30L3.4 12C3.4 8 4.4 6 6 6Z" />
      </svg>
    </div>
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

      // the FSC plate settles in just after the panel
      gsap.from(q('.svA-chip'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 62%', once: true } })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="sustainability" ref={root} data-theme="light" className="sustain" aria-labelledby="sustain-title">
      <div className="sustain-inner">
        {/* LEFT — designed nature scene: olive-wash panel, stroke branch line-art,
            two brand butterflies drifting; one pressed FSC certification plate. */}
        <div className="sustain-media">
          <figure className="svA">
            <div className="svA-frame" role="img" aria-label={t('sceneAlt')}>
              {/* stroke-drawn branch line-art — olive + gold, composed asymmetrically */}
              <svg className="bfly-flora" viewBox="0 0 400 560" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                <defs>
                  {/* wing fill — deep olive-gold at the body warming to light gold at the tip */}
                  <linearGradient id="bflyWing" x1="0" y1="0.15" x2="0.9" y2="0.95">
                    <stop offset="0" stopColor="#7d6320" />
                    <stop offset="0.5" stopColor="#a9822f" />
                    <stop offset="1" stopColor="#d6ae59" />
                  </linearGradient>
                </defs>
                <g className="flora-olive">
                  {/* lower-right branch arching up-left, with leaves */}
                  <path d="M404 566C372 512 356 468 350 414C345 366 352 326 340 286" />
                  <path d="M350 414C368 402 386 402 402 412" />
                  <path d="M350 414C334 404 326 388 326 368" />
                  <path d="M345 372C361 362 379 364 393 376" />
                  <path d="M345 372C332 360 326 344 328 326" />
                  <path d="M342 330C356 320 374 320 388 330" />
                  <path d="M342 330C328 320 322 304 324 286" />
                </g>
                <g className="flora-gold">
                  {/* top-left sprig */}
                  <path d="M-4 52C34 66 62 82 82 116" />
                  <path d="M40 74C40 58 50 46 66 40" />
                  <path d="M40 74C24 74 12 64 6 50" />
                  <path d="M64 98C66 82 78 72 94 68" />
                </g>
              </svg>

              <Butterfly variant="1" />
              <Butterfly variant="2" />

              <figcaption className="svA-chip">
                <svg className="svA-chip-leaf" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
                  <path d="M4 21c1.5-4 4-6.5 7.5-8" />
                </svg>
                <span className="svA-chip-label">{t('fscLabel')}</span>
                <span className="svA-chip-sep" aria-hidden="true">·</span>
                <span className="svA-chip-code">TUVDC-COC-101258</span>
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
