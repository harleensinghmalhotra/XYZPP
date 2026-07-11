import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'
import PromiseLiquidEther from './promise/PromiseLiquidEther'

// ── Our Promise — typography + void, with ink breathing beneath ───────────────
// Harry's composition (option 4): kill the machinery, centre the type, let the
// black breathe. The mission pull-quote stands alone, centred on promise-black,
// with the soft warm-gold "reading lamp" glow behind it. This round adds ONE more
// layer far below: the reactbits LiquidEther fluid, tuned to whisper — navy/gold
// ink drifting under water, capped hard in presence.
//
// THE VISIBILITY LAW: the fluid sits at the very back (wrapper opacity ~0.3),
// then a radial scrim wells up deep #0A0E14 behind the text zone so the ink
// visibly parts around the type — the fluid is only ever felt at the edges. The
// glow + centred text from the last round are layered ABOVE, exactly as built, so
// every text element keeps its full contrast at the fluid's brightest frame.
// Reduced motion: the sim is not mounted at all — static navy ground + the glow.
//
// Layer order (z): ether 0 · dot grid 1 · scrim 2 · glow 3 · text 4.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      {!reduced && (
        <PromiseLiquidEther
          resolution={0.35}
          isBounce={false}
          autoDemo
          autoSpeed={0.3}
          autoIntensity={1.2}
          mouseForce={10}
          cursorSize={80}
          colors={['#1B3A6B', '#9B7420', '#0F2444']}
        />
      )}
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
