import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Printer, SealCheck, Package, Warehouse, Truck, Umbrella, MapPinLine,
  Handshake, Headset, Broadcast, Clock, ShieldCheck, TrendUp,
} from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import './ProcessVideo.css'

gsap.registerPlugin(ScrollTrigger)

// ── HOMEPAGE "How We Work" — process video + the 7-step PROCESS EXHIBIT + promise band.
// Replaces the retired 3D conveyor and the rejected card grid. Same slot before
// Projects, same id="process". The video shows its WHOLE frame (contain) on a black
// letterbox. Below it the seven steps + promise band sit inside ONE hairline-bordered
// field — a certificate plate / annual-report exhibit, not a floaty AI layout. Each
// step is engraved-plate numbered ("01" in DM Mono orange with a short underline rule),
// hung from a calm orange process line whose nodes align with the numbers. A full-width
// hairline separates the six-guarantee promise band (medallion icons) below. The frame
// border draws on scroll, then the steps settle in left→right, then the band — one
// quiet, confident sequence; under 1100px the line stands up as a vertical spine.

const VIDEO = '/qfp/video/how-we-work.mp4'
const POSTER = '/qfp/video/how-we-work-poster.jpg'

// Seven steps, in workflow order. "delivered" closes the sequence (the outcome); the
// old "One Partner" moved to the promise band below so it isn't said twice.
const POINTS = [
  { key: 'print', Icon: Printer },
  { key: 'quality', Icon: SealCheck },
  { key: 'fulfillment', Icon: Package },
  { key: 'warehouse', Icon: Warehouse },
  { key: 'ship', Icon: Truck },
  { key: 'covered', Icon: Umbrella },
  { key: 'delivered', Icon: MapPinLine },
]

// The promise band — six guarantees of a single partner. Text (lead + sub) is
// localised via badges.<i>.{lead,sub}; the icon is the non-translatable mark per row.
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

  // THE ENTRANCE — one quiet, confident sequence (~800ms): the frame border DRAWS, the
  // process line draws with it, then the steps settle in left→right, then the promise
  // band. Nothing bounces. Horizontal draw above 1100px, top-down along the vertical
  // spine below. Reduced motion → the plate is already whole and nothing moves.
  useLayoutEffect(() => {
    if (reduced || !bandRef.current) return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      const build = (axis) => () => {
        const trig = { trigger: bandRef.current, start: 'top 82%', once: true }
        const tl = gsap.timeline({ scrollTrigger: trig, defaults: { ease: 'power2.out' } })
        // 1 — the frame border draws (clip reveal), the line draws alongside it
        tl.fromTo('.pv-frame-line',
          { clipPath: axis === 'x' ? 'inset(0 100% 0 0)' : 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0 0)', duration: 0.5, ease: 'power2.inOut' })
        tl.fromTo('.pv-flow-rail-fill',
          { scaleX: axis === 'x' ? 0 : 1, scaleY: axis === 'y' ? 0 : 1 },
          { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power2.inOut' }, 0.08)
        // 2 — the steps settle in, left→right
        tl.fromTo('.pv-step', { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, clearProps: 'transform,opacity,visibility' }, 0.28)
        // 3 — the promise band, last
        tl.fromTo('.pv-badge', { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.035, clearProps: 'transform,opacity,visibility' }, 0.56)
      }
      mm.add('(min-width: 1101px)', build('x'))
      mm.add('(max-width: 1100px)', build('y'))
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

      {/* THE EXHIBIT — the whole assembly sits inside one hairline-bordered field
          (a certificate plate); the border draws on entrance. */}
      <div className="pv-frame-wrap" ref={bandRef}>
        <div className="pv-frame">
          <span className="pv-frame-line" aria-hidden="true" />

          {/* THE STEPS — engraved-plate numbers hung from a calm orange process line,
              nodes aligned with each number. No connectors — the grid does the work. */}
          <div className="pv-flow" role="list" aria-label={t('detailsAria')}>
            <span className="pv-flow-rail" aria-hidden="true">
              <span className="pv-flow-rail-fill" />
            </span>
            {POINTS.map(({ key, Icon }, i) => (
              <div className="pv-step" role="listitem" key={key} style={{ '--i': i }}>
                <span className="pv-step-node" aria-hidden="true" />
                <span className="pv-step-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="pv-step-rule" aria-hidden="true" />
                <div className="pv-step-head">
                  <span className="pv-step-icon" aria-hidden="true"><Icon weight="light" size={20} /></span>
                  <h3 className="pv-step-name">{t(`stages.${key}.name`)}</h3>
                </div>
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
