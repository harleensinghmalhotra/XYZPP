import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'
import PromiseLightfall from './promise/PromiseLightfall'
import PromiseConfetti from './promise/PromiseConfetti'

// ── Our Promise — typography + void, with gold light falling behind ───────────
// Harry's composition (option 4): kill the machinery, centre the type, let the
// black breathe. The mission pull-quote stands alone, centred on promise-black,
// with the soft warm-gold "reading lamp" glow behind it. The base background layer
// is now reactbits' Lightfall (WebGL/ogl) — falling light streaks with a twinkle
// field and gentle mouse interaction, rebranded from blue/purple synth to molten
// gold: light gold, deep gold and cream threads falling like foil off a press,
// over the promise-black ground. It REPLACES the previous character-grid background
// (two full-section canvases would fight, so the wall came out clean — zero dead code).
//
// THE VISIBILITY LAW: Lightfall sits at the very back (opacity ~0.8, backgroundGlow
// held low at 0.25 so it's warm breath, not floodlight), then a radial scrim wells
// deep #0A0E14 up behind the text zone so the streaks live only at the EDGES and
// dim under the words. The glow + centred text are layered ABOVE, exactly as built,
// so every text element keeps its full contrast at the brightest streak frame.
// Reduced motion: Lightfall is NOT mounted — static promise-black + glow only.
//
// The two-layer celebration confetti sits ABOVE Lightfall and BELOW the scrim — so
// the scrim's opaque core keeps the type's ground pure and both only ever read in
// the same peripheral ring. Lightfall pauses/unmounts (GL context disposed) off-
// viewport and on hidden tab, and caps DPR at 1 — see PromiseLightfall.
//
// Layer order (z): lightfall 0 · dot grid 1 · confetti 2 · scrim 3 · glow 4 · text 5.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      {!reduced && <PromiseLightfall />}
      <PromiseConfetti reduced={reduced} />
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
