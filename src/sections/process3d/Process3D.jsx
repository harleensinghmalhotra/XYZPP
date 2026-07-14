import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/lib/useReducedMotion'
import Scene from './Scene'
import { EKTA, CAM, STATIONS, N, mapActiveF } from './constants'
import poster from './poster.jpg'
import './process3d.css'

gsap.registerPlugin(ScrollTrigger)

const MOBILE_MAX = 900 // <901px → static poster fallback
const PAGES = 6 // ×100vh of scroll travel the conveyor scrubs across (R7: +1 for the
// re-timed ending — reach, box morph, jump, settle, then a dead HOLD before unpin)

// One-shot render kick for the reduced-motion (frameloop="demand") canvas — draws
// the static beauty shot once on mount and again on resize, no continuous loop.
function Kick() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    invalidate()
    const on = () => invalidate()
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [invalidate])
  return null
}

// ── The homepage Process section, now the 3D conveyor. ───────────────────────
// Keeps id="process" so every "See our process" link still lands here. The scene
// is driven by the SAME page scroll as the rest of the homepage: a sticky-pinned
// canvas + a GSAP ScrollTrigger scrub feeding a 0..1 progress ref into the Scene.
// No drei ScrollControls → no nested scroller to fight Lenis or the hero pin.
//
// TWO TEXT LAYERS, neither fighting the scene:
//   • LAYER 1 — the museum label (`Caption`): a single caption for the CURRENT stage,
//     floating in the dark upper sky above the arches, cross-faded imperatively off the
//     scroll ref (never React state). aria-hidden — a visual echo only.
//   • LAYER 2 — the document (`Details`): the full six-stage grid + badge row in NORMAL
//     FLOW below the scene. REAL, translated, selectable HTML — this is where a screen
//     reader reads the process, and what the legal review requires (the descriptions
//     used to live ONLY as baked plaque pixels, an a11y failure). The canvas is
//     aria-hidden; the plaque billboards still show the station NAME only.
// The scene therefore renders FULL-BLEED and unobstructed at every scroll position.
export default function Process3D() {
  const { t } = useTranslation('homeProcess')
  const reduced = useReducedMotion()
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX,
  )
  const [visible, setVisible] = useState(false)
  const pinRef = useRef(null)
  const scrollRef = useRef(null)
  const captionRef = useRef(null) // Layer 1 — the floating museum label; active stage driven imperatively
  const progress = useRef(0) // 0..1 conveyor progress, written by ScrollTrigger

  // Track viewport width for the mobile poster cutover.
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= MOBILE_MAX)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Render only while the pinned canvas is on screen (observer → frameloop).
  useEffect(() => {
    const el = pinRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.01 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [mobile, reduced])

  // Scroll scrub → progress ref. Lives on the SAME ScrollTrigger/Lenis loop as the
  // hero pin, so there is one scroll system and no boundary fighting. Skipped for
  // mobile (poster) and reduced-motion (static shot). Also cross-fades Layer 1 (the
  // floating museum label) to the CURRENT stage — imperatively (data-active +
  // is-active class swap), never via React state, so the 3D frameloop is never
  // re-rendered by the text layer.
  useEffect(() => {
    if (reduced || mobile) return
    const el = scrollRef.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        progress.current = self.progress
        const cap = captionRef.current
        if (!cap) return
        const idx = Math.min(N - 1, Math.max(0, Math.round(mapActiveF(self.progress))))
        if (cap.dataset.active !== String(idx)) {
          cap.dataset.active = String(idx)
          const caps = cap.children
          for (let i = 0; i < caps.length; i++) caps[i].classList.toggle('is-active', i === idx)
        }
      },
    })
    return () => st.kill()
  }, [reduced, mobile])

  const Header = (
    <div className="conv-head u-section">
      <div className="u-section-inner">
        <p className="u-eyebrow">{t('eyebrow')}</p>
        <h2 className="u-h2">{t('title')}</h2>
        <p className="conv-sub">{t('sub')}</p>
      </div>
    </div>
  )

  // ── LAYER 2 — THE DOCUMENT (real-DOM text): a six-column detail grid + the
  // closing badge row, in NORMAL DOCUMENT FLOW below the scene. ALL SIX
  // descriptions are always present as selectable text nodes — this is where the
  // screen reader reads the whole process, and what satisfies compliance (real
  // HTML, not baked pixels). It overlaps nothing; on narrow viewports the grid
  // stacks. Nothing is display:none. Used identically in the full, mobile, and
  // reduced-motion paths.
  const badges = t('badges', { returnObjects: true })
  const Details = (
    <div className="proc-layer">
      <ol className="proc-details" aria-label={t('detailsAria')}>
        {STATIONS.map((s, i) => (
          <li key={s.key} className="proc-col">
            <span className="proc-col-num">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="proc-col-name">{t(`stages.${s.key}.name`)}</h3>
            <span className="proc-col-rule" aria-hidden="true" />
            <p className="proc-col-desc">{t(`stages.${s.key}.desc`)}</p>
          </li>
        ))}
      </ol>
      <ul className="proc-badges" aria-label={t('detailsAria')}>
        {(Array.isArray(badges) ? badges : []).map((b, i) => (
          <li key={i} className="proc-badge">{b}</li>
        ))}
      </ul>
    </div>
  )

  // ── LAYER 1 — THE MUSEUM LABEL (full experience only): a single caption for the
  // CURRENT stage, floating in the dark upper-left sky above the arches. All six
  // are stacked in place; only the active one is opaque, and the scroll scrub
  // cross-fades between them (imperative is-active swap — no React re-render). No
  // card, no panel: just the index, the name, and the description on the sky.
  // aria-hidden — it is a visual echo; the screen-reader truth lives in Layer 2.
  const Caption = (
    <div className="conv-caption" aria-hidden="true" ref={captionRef}>
      {STATIONS.map((s, i) => (
        <figure key={s.key} className={`conv-cap${i === 0 ? ' is-active' : ''}`}>
          <span className="conv-cap-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="conv-cap-name">{t(`stages.${s.key}.name`)}</span>
          <figcaption className="conv-cap-desc">{t(`stages.${s.key}.desc`)}</figcaption>
        </figure>
      ))}
    </div>
  )

  // ── Mobile: header + static composed poster + the full HTML detail layer ──
  if (mobile) {
    return (
      <section id="process" data-theme="light" className="conv-section">
        {Header}
        <div className="conv-root conv-poster">
          <img src={poster} alt="" aria-hidden="true" />
          <p className="conv-poster-cap">{t('stages.covered.name')}</p>
        </div>
        {Details}
      </section>
    )
  }

  // ── Reduced-motion: header + a single static beauty shot + the HTML detail layer ──
  if (reduced) {
    return (
      <section id="process" data-theme="light" className="conv-section">
        {Header}
        <div ref={pinRef} className="conv-root conv-still" aria-hidden="true">
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: [14, CAM.y, CAM.z], fov: CAM.fov }}
          >
            <Suspense fallback={null}>
              <Kick />
              <Scene frozen />
            </Suspense>
          </Canvas>
        </div>
        {Details}
      </section>
    )
  }

  // ── Full experience: header, then the sticky-pinned scrubbed conveyor ──
  return (
    <section id="process" data-theme="light" className="conv-section">
      {Header}
      <div ref={scrollRef} className="conv-scroll" style={{ height: `${PAGES * 100}vh`, background: EKTA.cream }}>
        <div ref={pinRef} className="conv-pin">
          <div className="conv-stage" aria-hidden="true">
            <Canvas
              frameloop={visible ? 'always' : 'never'}
              dpr={[1, 1.5]}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              camera={{ position: [-8, CAM.y, CAM.z], fov: CAM.fov }}
            >
              <Suspense fallback={null}>
                <Scene progress={progress} />
              </Suspense>
            </Canvas>
          </div>
          {Caption}
          <i className="conv-hint-arrow" aria-hidden="true" />
        </div>
      </div>
      {Details}
    </section>
  )
}
