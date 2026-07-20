import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Printer, SealCheck, Package, Warehouse, Truck, Umbrella, Handshake } from '@phosphor-icons/react'
import './ProcessVideo.css'

// ── HOMEPAGE "How We Work" — full-bleed process video + 7-point strip. ─────────
// Replaces the retired 3D conveyor (src/sections/process3d). Same slot before
// Projects, same id="process" so every "See our process" link still lands here,
// same header copy (homeProcess.json eyebrow/title/sub). The video is a muted,
// looping, playsInline autoplay loop (poster = its own first frame); an
// IntersectionObserver plays it only while on screen and pauses it off-screen so
// nothing decodes for nothing. Below it, the seven process points rebuild the old
// six-column detail grid + badge row as one refined strip.

const VIDEO = '/qfp/video/how-we-work.mp4'
const POSTER = '/qfp/video/how-we-work-poster.jpg'

// Six process stages + the closing "One Partner" point — which absorbs the retired
// badge line "One partner. Zero runaround." Icons are Phosphor LIGHT, matching the
// credentials-row treatment (weight="light", gold-2 via currentColor).
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
  const videoRef = useRef(null)

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

      <ol className="pv-points" aria-label={t('detailsAria')}>
        {POINTS.map(({ key, Icon }, i) => (
          <li key={key} className="pv-point">
            <span className="pv-point-icon" aria-hidden="true">
              <Icon weight="light" size={27} />
            </span>
            <span className="pv-point-num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="pv-point-name ref-cap-head">{t(`stages.${key}.name`)}</h3>
            <p className="pv-point-desc ref-cap-body">{t(`stages.${key}.desc`)}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
