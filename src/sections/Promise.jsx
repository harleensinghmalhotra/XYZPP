import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'
import PromiseTypeWall from './promise/PromiseTypeWall'
import PromiseConfetti from './promise/PromiseConfetti'

// ── Our Promise — typography + void, with a wall of type set in the dark ──────
// Harry's composition (option 4): kill the machinery, centre the type, let the
// black breathe. The mission pull-quote stands alone, centred on promise-black,
// with the soft warm-gold "reading lamp" glow behind it. The base background layer
// is now the LetterGlitch type wall (reactbits) — a canvas grid of glitching
// characters rebranded to letterpress: ink-on-night navies and gold, set in our
// own DM Mono, glitching at a slow compositor's pace. It REPLACES the old fluid
// background — two full-section canvases would fight, so the ether came out clean.
//
// THE VISIBILITY LAW: the wall sits at the very back (wrapper opacity ~0.42), its
// own centreVignette darkens under the type, then a radial scrim wells deep
// #0A0E14 up behind the text zone so the wall lives only at the EDGES and fades
// under the words. The glow + centred text are layered ABOVE, exactly as built, so
// every text element keeps its full contrast at the wall's brightest random frame.
// Reduced motion: the wall renders ONE static grid frame — no glitching, no rAF.
//
// The two-layer celebration confetti sits ABOVE the wall and BELOW the scrim — so
// the scrim's opaque core keeps the type's ground pure and both canvases only ever
// read in the same peripheral ring. The wall is texture; the confetti is objects.
//
// Layer order (z): typewall 0 · dot grid 1 · confetti 2 · scrim 3 · glow 4 · text 5.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      <PromiseTypeWall reduced={reduced} />
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
