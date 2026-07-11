import { useTranslation } from 'react-i18next'

// ── Our Promise — typography + void ───────────────────────────────────────────
// Harry's final call for this section (option 4): kill the machinery, centre the
// type, let the black breathe. The mission pull-quote stands alone, centred on
// promise-black, with ONE effect behind it — a soft warm-gold "reading lamp"
// glow that breathes on an ~9s cycle. It is felt, not seen: never bright enough
// to pull the eye or drop text contrast below AA (asserted at the brightest
// frame). Emphasis is WEIGHT only (light 300 vs bold 700), never colour — gold
// lives only on the eyebrow + attribution. Read-the-bold-alone survives across
// locales because the bold/light split rides the translated segments.
//
// All motion is time-based CSS (the glow keyframes); no scroll coupling, no JS
// animation, no WebGL. Reduced motion freezes the glow at its mid value (CSS).

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
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
