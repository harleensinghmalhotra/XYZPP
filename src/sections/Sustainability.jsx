import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Sustainability — "Responsible by Practice." ──────────────────────────────
// LEFT is a designed nature scene (line-art illustration), not a photograph: a quiet
// cream panel with stroke-drawn line-art in the site's icon language — two soft
// clouds top-left (one drifting), a gold ray-tick sun top-right (subtle shimmer),
// a leafy plant up the right edge, and a row of swaying grass along the bottom.
// One gold butterfly with an olive body drifts the airy middle space, its wings
// clearly spread (rotateY flap capped low so they never collapse edge-on — the
// R1 "snail" bug). A pressed FSC certification plate holds the bottom-left corner.
// LAWS: strokes in olive #6B7A2A / gold #F37031 / navy #0F2444 on cream only; no
// photo; no long straight light lines (sun rays are short ticks); reduced-motion →
// everything static, wings open. GPU-only (CSS transforms), 60fps, no JS rAF.

const BULLETS = ['waste', 'fsc', 'iso', 'disposal']

function Leaf() {
  return (
    <svg className="sustain-leaf" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
      <path d="M4 21c1.5-4 4-6.5 7.5-8" />
    </svg>
  )
}

// A flat, top-down butterfly drawn as FOUR separate wing lobes (two forewings up-
// out, two smaller hindwings down-out) with clear gaps between them + a thin olive
// body and tiny clubbed antennae — an unmistakable butterfly silhouette. The flap
// is a 2D scaleX squeeze of the wing group toward the body centre (bulletproof, no
// 3D foreshortening), so the wings never collapse edge-on into the R1 "snail" lump.
function Butterfly() {
  return (
    <svg className="bfly" viewBox="0 0 120 100" fill="none" aria-hidden="true" focusable="false">
      <g className="bfly-wings">
        <path className="bfly-wing-fill" d="M61 39C70 20 92 9 106 16C117 22 113 41 98 46C84 50 67 49 61 44Z" />
        <path className="bfly-wing-fill" d="M62 53C76 53 92 60 95 73C98 85 86 91 75 86C65 82 59 67 61 56Z" />
        <path className="bfly-wing-fill" d="M59 39C50 20 28 9 14 16C3 22 7 41 22 46C36 50 53 49 59 44Z" />
        <path className="bfly-wing-fill" d="M58 53C44 53 28 60 25 73C22 85 34 91 45 86C55 82 61 67 59 56Z" />
        <path className="bfly-wing-pattern" d="M67 40C78 29 91 22 102 22" />
        <path className="bfly-wing-pattern" d="M53 40C42 29 29 22 18 22" />
        <path className="bfly-wing-pattern" d="M68 60C77 63 84 69 88 76" />
        <path className="bfly-wing-pattern" d="M52 60C43 63 36 69 32 76" />
      </g>
      <g className="bfly-body">
        <path className="bfly-antenna" d="M60 33C57 25 51.5 20 46 18M60 33C63 25 68.5 20 74 18" />
        <circle className="bfly-antenna-tip" cx="46" cy="17.4" r="1.6" />
        <circle className="bfly-antenna-tip" cx="74" cy="17.4" r="1.6" />
        <path className="bfly-body-fill" d="M60 30C62 30 63.4 32.6 63.4 37L62.4 66C62.4 72 61.3 76 60 76C58.7 76 57.6 72 57.6 66L56.6 37C56.6 32.6 58 30 60 30Z" />
      </g>
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

      // the FSC plate settles in just after the panel
      gsap.from(q('.svA-chip'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 62%', once: true } })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="sustainability" ref={root} data-theme="light" className="sustain" aria-labelledby="sustain-title">
      <div className="sustain-inner">
        {/* LEFT — designed nature scene (line-art illustration): clouds + sun in the sky,
            plant up the right, grass along the bottom, one butterfly in the middle,
            the pressed FSC plate bottom-left. All stroke line-art but the butterfly. */}
        <div className="sustain-media">
          <figure className="svA">
            <div className="svA-frame" role="img" aria-label={t('sceneAlt')}>
              {/* SKY — two soft clouds top-left (cloud 1 drifts), a ray-tick sun top-right */}
              <svg className="scn-cloud scn-cloud1" viewBox="0 0 64 26" fill="none" aria-hidden="true" focusable="false">
                <path d="M9 23C2 23 1 14 9 13C9 5 22 3 26 11C30 3 44 4 45 13C54 12 57 22 48 23C41 27 17 27 9 23Z" />
              </svg>
              <svg className="scn-cloud scn-cloud2" viewBox="0 0 50 22" fill="none" aria-hidden="true" focusable="false">
                <path d="M8 19C2 19 1 12 8 11C8 5 18 3 21 10C25 3 35 5 35 12C43 11 45 18 38 19C32 22 14 22 8 19Z" />
              </svg>
              <svg className="scn-sun" viewBox="0 0 72 72" fill="none" aria-hidden="true" focusable="false">
                <circle className="scn-sun-disc" cx="36" cy="36" r="15" />
                <g className="scn-sun-rays">
                  <path d="M57 36H64" /><path d="M50.8 50.8L55.8 55.8" /><path d="M36 57V64" /><path d="M21.2 50.8L16.2 55.8" />
                  <path d="M15 36H8" /><path d="M21.2 21.2L16.2 16.2" /><path d="M36 15V8" /><path d="M50.8 21.2L55.8 16.2" />
                </g>
              </svg>

              {/* PLANT — leafy branch up the right edge */}
              <svg className="scn-plant" viewBox="0 0 130 320" fill="none" aria-hidden="true" focusable="false">
                <path className="scn-stem" d="M108 320C86 276 74 236 70 188C67 150 74 110 64 72C61 60 60 52 62 42" />
                <path className="scn-leaf" d="M70 188C86 180 106 182 118 193C104 201 84 199 70 188Z" />
                <path className="scn-leaf" d="M67 156C51 148 43 131 45 112C61 121 69 138 67 156Z" />
                <path className="scn-leaf" d="M69 130C85 123 103 126 114 137C100 144 81 141 69 130Z" />
                <path className="scn-leaf" d="M63 92C48 84 41 68 43 50C58 58 65 74 63 92Z" />
                <path className="scn-leaf" d="M62 50C60 38 66 28 76 24C72 36 68 46 62 50Z" />
              </svg>

              {/* GREENERY — a row of swaying grass blades along the bottom-right */}
              <svg className="scn-grass" viewBox="0 0 300 64" fill="none" aria-hidden="true" focusable="false">
                <path d="M12 64C9 44 14 32 6 16" />
                <path d="M30 64C31 46 27 34 33 22" />
                <path d="M50 64C46 40 51 25 45 9" />
                <path d="M68 64C70 48 66 36 72 26" />
                <path d="M88 64C84 42 90 28 85 13" />
                <path d="M110 64C112 46 108 34 114 22" />
                <path d="M133 64C129 40 135 24 130 11" />
                <path d="M156 64C158 48 154 36 160 26" />
                <path d="M180 64C176 43 182 29 177 15" />
                <path d="M205 64C207 48 203 34 209 24" />
                <path d="M230 64C226 42 232 26 227 12" />
                <path d="M256 64C258 48 254 36 260 26" />
                <path d="M281 64C277 44 283 30 278 17" />
              </svg>

              {/* BUTTERFLY — drifts the airy middle */}
              <Butterfly />

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
