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

// ── HOMEPAGE "How We Work" — process video + the 7-step PROCESS FLOW + promise band.
// Replaces the retired 3D conveyor and the rejected card grid. Same slot before
// Projects, same id="process". The video shows its WHOLE frame (contain) on a black
// letterbox. Below it the seven steps are NOT cards: seven nodes on ONE orange base-
// line, each tied to its read by a short vertical connector so line + text read as a
// single diagram. A large ghost numeral sits BEHIND each icon+title cluster (the order
// is real information — the number is earned). Under the steps, a quiet certifications-
// style promise band restates the six things a single partner guarantees. The line
// draws through the nodes on scroll (one motivated gesture); under 1100px it stands up.

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

  // THE ENTRANCE — the baseline draws through the nodes; each connector drops, then
  // the read fade-rises just behind it; the promise band settles in last. One
  // motivated gesture (the "flow"). Horizontal above 1100px, vertical spine below.
  // Reduced motion → the line is already drawn and nothing moves.
  useLayoutEffect(() => {
    if (reduced || !bandRef.current) return
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()
      const build = (axis) => () => {
        const trig = { trigger: bandRef.current, start: 'top 80%', once: true }
        const tl = gsap.timeline({ scrollTrigger: trig })
        tl.fromTo('.pv-flow-rail-fill',
          { scaleX: axis === 'x' ? 0 : 1, scaleY: axis === 'y' ? 0 : 1 },
          { scaleX: 1, scaleY: 1, duration: 0.85, ease: 'power2.inOut' })
        tl.fromTo('.pv-step-node', { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(2)', stagger: 0.08 }, 0.12)
        tl.fromTo('.pv-step-stem', { scaleY: 0 }, { scaleY: 1, duration: 0.26, ease: 'power2.out', stagger: 0.08 }, 0.2)
        tl.fromTo('.pv-step-body', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.26)
        tl.fromTo('.pv-badge', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.05, clearProps: 'transform,opacity,visibility' }, 0.55)
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

      <div className="pv-flow-wrap" ref={bandRef}>
        {/* THE STEPS — seven nodes on one orange baseline, each tied to its read by a
            short vertical connector so the diagram reads as one piece. */}
        <div className="pv-flow" role="list" aria-label={t('detailsAria')}>
          <span className="pv-flow-rail" aria-hidden="true">
            <span className="pv-flow-rail-fill" />
          </span>
          {POINTS.map(({ key, Icon }, i) => (
            <div className="pv-step" role="listitem" key={key} style={{ '--i': i }}>
              <span className="pv-step-node" aria-hidden="true" />
              <span className="pv-step-stem" aria-hidden="true" />
              <div className="pv-step-body">
                <span className="pv-step-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <div className="pv-step-head">
                  <span className="pv-step-icon" aria-hidden="true"><Icon weight="light" size={20} /></span>
                  <h3 className="pv-step-name">{t(`stages.${key}.name`)}</h3>
                </div>
                <p className="pv-step-desc">{t(`stages.${key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* THE PROMISE BAND — a quiet, dense certifications-style row: the six things a
            single partner guarantees. Thin top hairline off the steps; vertical
            hairlines between badges. */}
        <ul className="pv-badges" aria-label={t('sub')}>
          {badges.map((b, i) => {
            const BIcon = BADGE_ICONS[i]
            return (
              <li className="pv-badge" key={i}>
                <span className="pv-badge-icon" aria-hidden="true">{BIcon && <BIcon weight="regular" size={18} />}</span>
                <span className="pv-badge-text">
                  <span className="pv-badge-lead">{b.lead}</span>
                  <span className="pv-badge-sub">{b.sub}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
