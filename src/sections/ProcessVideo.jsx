import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Printer, SealCheck, Package, Warehouse, Truck, Umbrella, Handshake } from '@phosphor-icons/react'
import { useReducedMotion } from '@/lib/useReducedMotion'
import './ProcessVideo.css'

gsap.registerPlugin(ScrollTrigger)

// ── HOMEPAGE "How We Work" — process video + a flagship 7-point numbered band. ──
// Replaces the retired 3D conveyor (src/sections/process3d). Same slot before
// Projects, same id="process". The video shows its WHOLE frame (object-fit: contain)
// centred on a navy letterbox — never cropped or stretched. Below it, the seven
// process points read as ONE continuous instrument panel: a cream band bounded by
// navy hairlines, seven equal cells split by vertical hairlines, each with a large
// ghost numeral + light icon, name and description.

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

  // Cells fade-rise in sequence on scroll (stagger 60ms); reduced-motion → static.
  useLayoutEffect(() => {
    if (reduced || !bandRef.current) return
    const ctx = gsap.context(() => {
      gsap.set('.pv-cell', { autoAlpha: 0, y: 18 })
      gsap.to('.pv-cell', {
        autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06,
        clearProps: 'transform,opacity,visibility',
        scrollTrigger: { trigger: bandRef.current, start: 'top 82%', once: true },
      })
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

      <ol className="pv-band" aria-label={t('detailsAria')} ref={bandRef}>
        {POINTS.map(({ key, Icon }, i) => (
          <li key={key} className="pv-cell">
            <span className="pv-cell-mark" aria-hidden="true">
              <span className="pv-cell-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="pv-cell-icon"><Icon weight="light" size={24} /></span>
            </span>
            <h3 className="pv-cell-name">{t(`stages.${key}.name`)}</h3>
            <p className="pv-cell-desc">{t(`stages.${key}.desc`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
