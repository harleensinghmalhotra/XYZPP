import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'
import PromiseLightfall from './promise/PromiseLightfall'

// ── Our Promise — typography + void, with gold rain falling behind ────────────
// Harry's composition (option 4): kill the machinery, centre the type, let the
// black breathe. The mission pull-quote stands alone, centred on promise-black,
// with the soft warm-gold "reading lamp" glow behind it. The base background layer
// is reactbits' Lightfall (WebGL/ogl) — falling light streaks with a twinkle field
// and mouse interaction, rebranded from the demo's blue/purple synth to molten
// gold: light gold, deep gold and cream threads raining like foil off a press, over
// the promise-black ground. This round drives it to the reference DEMO's presence —
// FULL power: opacity 1, the demo's top-glow halo, streaks that visibly RAIN. The
// old celebration overlay is GONE entirely (one less canvas — that budget goes to
// the rain); only the lamp glow and the centred type remain over the fall.
//
// THE VISIBILITY LAW (the one law that survives full power): with the rain at 100%,
// the radial scrim becomes the load-bearing wall — it wells deep #0A0E14 up behind
// the text zone so the streaks visibly DIM under the words (as the demo itself
// darkens behind its headline) while raining free at the EDGES. The glow + centred
// text layer ABOVE, so every text element clears AA at the brightest streak frame,
// cursor agitation included. Reduced motion: Lightfall is NOT mounted — static
// promise-black + glow only. Lightfall pauses/unmounts (GL context disposed) off-
// viewport and on hidden tab, and caps DPR at 1 — see PromiseLightfall.
//
// Layer order (z): lightfall 0 · dot grid 1 · scrim 2 · glow 4 · text 5.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      {!reduced && <PromiseLightfall />}
      <div className="promise-scrim" aria-hidden="true" />
      <div className="promise-bg" aria-hidden="true" />
      <div className="promise-glow" aria-hidden="true" />
      <div className="promise-inner" lang={i18n.language}>
        <p className="promise-eyebrow">{t('promise.eyebrow')}</p>
        <blockquote className="promise-quote">
          {SEGMENTS.map((seg, i) => (
            <span key={i} className={seg.bold ? 'pq-bold' : 'pq-light'}>
              {seg.text}{i < SEGMENTS.length - 1 ? ' ' : ''}
            </span>
          ))}
        </blockquote>
        <p className="promise-support">{t('promise.support')}</p>
        <p className="promise-attr">{t('promise.attribution')}</p>
      </div>
    </section>
  )
}
