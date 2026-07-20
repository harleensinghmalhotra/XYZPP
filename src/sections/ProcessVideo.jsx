import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Printer, SealCheck, Package, Warehouse, Truck, Umbrella, Handshake } from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import './ProcessVideo.css'

gsap.registerPlugin(ScrollTrigger)

// ── HOMEPAGE "How We Work" — process video + the 7-point PROCESS FLOW. ──────────
// Replaces the retired 3D conveyor (src/sections/process3d) and the rejected card
// grid before it. Same slot before Projects, same id="process". The video shows its
// WHOLE frame (object-fit: contain) on a black letterbox — never cropped. Below it,
// the seven steps are NOT cards: they are seven nodes strung on ONE continuous
// hairline that literally draws the section's own title — "One Continuous Process".
// Each node carries a large ghost numeral (the order is real information, so the
// number is earned), a light icon, a name and a one-line read. On scroll the line
// draws through the nodes left→right (a single motivated gesture, not scattered
// effects); under 1100px the line stands up as a vertical spine and the steps stack.

const VIDEO = '/qfp/video/how-we-work.mp4'
const POSTER = '/qfp/video/how-we-work-poster.jpg'

const POINTS = [
  { key: 'print', Icon: Printer },
  { key: 'quality', Icon: SealCheck },
  { key: 'fulfillment', Icon: Package },
  { key: 'warehouse', Icon: Warehouse },
  { key: 'ship', Icon: Truck },
  { key: 'covered', Icon: Umbrella },
  { key: 'partner', Icon: Handshake },
]

export default function ProcessVideo() {
  const { t } = useTranslation('homeProcess')
  const reduced = useReducedMotion()
  const videoRef = useRef(null)
  const bandRef = useRef(null)

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

  // THE ENTRANCE — the through-line draws through the nodes, then each step's
  // content fade-rises just behind the draw (stagger). One motivated gesture: the
  // line "flowing" is the section's thesis. Horizontal above 1100px, vertical spine
  // below. Reduced motion → the line is already drawn and nothing moves.
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
        tl.fromTo('.pv-step-node', { scale: 0 }, { scale: 1, duration: 0.32, ease: 'back.out(2)', stagger: 0.09 }, 0.12)
        tl.fromTo('.pv-step-body', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.09, clearProps: 'transform,opacity,visibility' }, 0.2)
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

      <div className="pv-flow" role="list" aria-label={t('detailsAria')} ref={bandRef}>
        {/* the continuous line — one rule threading all seven nodes. The faint base
            is the track; the coloured fill draws through it on scroll. */}
        <span className="pv-flow-rail" aria-hidden="true">
          <span className="pv-flow-rail-fill" />
        </span>
        {POINTS.map(({ key, Icon }, i) => (
          <div className="pv-step" role="listitem" key={key} style={{ '--i': i }}>
            <span className="pv-step-node" aria-hidden="true" />
            <div className="pv-step-body">
              <span className="pv-step-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="pv-step-icon" aria-hidden="true"><Icon weight="light" size={24} /></span>
              <h3 className="pv-step-name">{t(`stages.${key}.name`)}</h3>
              <p className="pv-step-desc">{t(`stages.${key}.desc`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
