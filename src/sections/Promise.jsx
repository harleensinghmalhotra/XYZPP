import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'
import PromiseLightPillar from './promise/PromiseLightPillar'

// ── Our Promise — typography + void, with one column of light rising behind ───
// Harry's composition (option 4): kill the machinery, centre the type, let the
// black breathe. The mission pull-quote stands alone, centred on promise-black,
// with the soft warm-gold "reading lamp" glow behind it. The base background layer
// is reactbits' LightPillar (three.js) — a single vertical column of living light,
// a two-stop gradient between EXACTLY two colours (so no third hue can ever appear).
// Our two metals: light gold #C9A96A crown, deep navy #1B3A6B root — serene, slowly
// rotating, film-grained. It REPLACES the previous streak-field background entirely.
//
// THE TEXT LAW: the pillar rises CENTRED behind the words, so the radial scrim is
// the load-bearing wall — it wells deep #0A0E14 up over the whole text block so the
// pillar's hot core reads as light BEHIND a dark pane the type sits on, while the
// column glows free above and to the sides. The glow + centred text layer ABOVE, so
// every text element clears AA at the pillar's brightest rotation frame. Reduced
// motion: LightPillar is NOT mounted — static promise-black + glow only. It pauses/
// unmounts (GL context disposed) off-viewport and on hidden tab, DPR capped at 1,
// mixBlendMode 'screen' over the black stage — see PromiseLightPillar.
//
// Layer order (z): pillar 0 · dot grid 1 · scrim 2 · glow 4 · text 5.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      {!reduced && <PromiseLightPillar />}
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
