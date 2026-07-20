import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Handshake, Headset, Broadcast, Clock, ShieldCheck, TrendUp } from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import './ProcessVideo.css'

gsap.registerPlugin(ScrollTrigger)

// ── HOMEPAGE "How We Work" — process video + the PROCESS EXHIBIT + promise band. ──────
// Same slot before Projects, id="process". Below the letterboxed video, one hairline-
// bordered field (a certificate plate) holds: the client's approved process ARTWORK
// (paper ribbon flowing press → inspection → folding → rack → box → finished navy book),
// its baked-in caption band cropped off and blended cream-on-cream; then OUR rebuilt
// 7-step text row on a strict grid, each column sitting roughly under its artwork moment
// (roll → 01 Print … navy book → 07 Delivered); then a full-width hairline and the six-
// guarantee promise band. The artwork carries all imagery, so the text row runs no icons.
// Entrance: the plate + artwork settle first, then the text columns cascade left→right,
// then the band. Reduced-motion safe. Under 1100px the text stacks; the artwork stays
// whole (contain), never cropped.

const VIDEO = '/qfp/video/how-we-work.mp4'
const POSTER = '/qfp/video/how-we-work-poster.jpg'
const ARTWORK = '/site-assets/homepage/process/process-artwork.webp'

// Seven steps, in workflow order — our copy, keyed to the locale. "delivered" closes the
// sequence; "One Partner" lives only in the promise band so it isn't said twice.
const POINTS = ['print', 'quality', 'fulfillment', 'warehouse', 'ship', 'covered', 'delivered']

// The promise band — six guarantees of a single partner. Text (lead + sub) is localised
// via badges.<i>.{lead,sub}; the medallion icon is the non-translatable mark per row.
const BADGE_ICONS = [Handshake, Headset, Broadcast, Clock, ShieldCheck, TrendUp]

export default function ProcessVideo() {
  const { t } = useTranslation('homeProcess')
  const reduced = useReducedMotion()
  const videoRef = useRef(null)
  const bandRef = useRef(null)

  const rawBadges = t('badges', { returnObjects: true })
  const badges = Array.isArray(rawBadges) ? rawBadges : []

  useEffect(() => {
    const v = videoRef.current
    if (!v || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play?.().catch(() => {})
        else v.pause?.()
      },
      { threshold: 0.2 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  // THE ENTRANCE — one quiet, confident sequence (~900ms): the plate border draws and
  // the artwork fades in, then the seven text columns cascade left→right, then the
  // promise band. Nothing bounces. Reduced motion → the plate is already whole.
  useLayoutEffect(() => {
    if (reduced || !bandRef.current) return
    const ctx = gsap.context(() => {
      const trig = { trigger: bandRef.current, start: 'top 82%', once: true }
      const tl = gsap.timeline({ scrollTrigger: trig, defaults: { ease: 'power2.out' } })
      // 1 — the plate border draws (clip reveal) + the artwork fades in
      tl.fromTo('.pv-frame-line',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0 0 0)', duration: 0.5, ease: 'power2.inOut' })
      tl.fromTo('.pv-art', { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.55, clearProps: 'transform,opacity,visibility' }, 0.1)
      // 2 — the text columns cascade, left→right
      tl.fromTo('.pv-step', { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.06, clearProps: 'transform,opacity,visibility' }, 0.42)
      // 3 — the promise band, last
      tl.fromTo('.pv-badge', { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.035, clearProps: 'transform,opacity,visibility' }, 0.78)
    }, bandRef)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="process" data-theme="light" className="pv-section">
      <div className="pv-head">
        <p className="u-eyebrow">{t('eyebrow')}</p>
        <h2 className="u-h2">{t('title')}</h2>
        <p className="pv-sub">{t('sub')}</p>
      </div>

      <div className="pv-video-wrap">
        <video
          ref={videoRef}
          className="pv-video"
          muted
          loop
          playsInline
          autoPlay
          preload="none"
          poster={POSTER}
          aria-hidden="true"
        >
          <source src={VIDEO} type="video/mp4" />
        </video>
      </div>

      {/* THE EXHIBIT — the whole assembly sits inside one hairline-bordered field (a
          certificate plate) whose interior is toned to the artwork's own cream so the
          illustration blends with no rectangle seam; the border draws on entrance. */}
      <div className="pv-frame-wrap" ref={bandRef}>
        <div className="pv-frame">
          <span className="pv-frame-line" aria-hidden="true" />

          {/* THE ARTWORK — client illustration, caption band cropped off, full-width and
              cream-on-cream. Decorative (the copy below carries the meaning). */}
          <div className="pv-art">
            <img
              className="pv-art-img"
              src={ARTWORK}
              alt=""
              aria-hidden="true"
              width="2000"
              height="865"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>

          {/* THE TEXT ROW — our seven steps on a strict grid, each roughly under its
              artwork moment. No icons here — the artwork carries the imagery. */}
          <div className="pv-flow" role="list" aria-label={t('detailsAria')}>
            {POINTS.map((key, i) => (
              <div className="pv-step" role="listitem" key={key} style={{ '--i': i }}>
                <span className="pv-step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="pv-step-rule" aria-hidden="true" />
                <h3 className="pv-step-name">{t(`stages.${key}.name`)}</h3>
                <p className="pv-step-desc">{t(`stages.${key}.desc`)}</p>
              </div>
            ))}
          </div>

          <span className="pv-divide" aria-hidden="true" />

          {/* THE PROMISE BAND — the six guarantees of a single partner, each on a
              thin-ring medallion; quiet and institutional, inside the same plate. */}
          <ul className="pv-badges" aria-label={t('sub')}>
            {badges.map((b, i) => {
              const BIcon = BADGE_ICONS[i]
              return (
                <li className="pv-badge" key={i}>
                  <span className="pv-badge-medallion" aria-hidden="true">{BIcon && <BIcon weight="regular" size={14} />}</span>
                  <span className="pv-badge-text">
                    <span className="pv-badge-lead">{b.lead}</span>
                    <span className="pv-badge-sub">{b.sub}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
