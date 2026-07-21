import { useTranslation } from 'react-i18next'

// ── Our Promise — the mission, centred on flat navy ──────────────────────────
// Lane 10 (client meeting): the dark glow/aura treatment is DEAD. The section now
// sits on the SAME flat navy (var(--navy) #0F2444) GlobeReach uses, so the two navy
// passages read as one continuous field. Gone with the effect: the LightPillar
// (three.js), the radial scrim, the vignetted dot grid and the warm reading-lamp
// glow — every background layer. Typography alone on navy: the mission pull-quote
// centred, cream on navy (AA+), the gold-2 eyebrow + sign-off matching GlobeReach's
// eyebrow exactly (#F37031 ≈ 6:1 on navy — the older #F37031 dropped to 4.27 once
// the ground lifted from near-black to navy). Text reveal (if any) is unaffected —
// only the background died. PromiseLightPillar is now imported by nothing.

export default function PromiseSection() {
  const { t, i18n } = useTranslation('home')

  const segments = t('promise.segments', { returnObjects: true })
  const SEGMENTS = Array.isArray(segments) ? segments : []

  return (
    <section id="promise" data-theme="dark" className="promise" aria-label={t('promise.aria')}>
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
