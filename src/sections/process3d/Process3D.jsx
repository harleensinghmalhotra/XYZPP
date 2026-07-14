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
// ACCESSIBILITY (client + legal review): the six stage descriptions used to live
// ONLY as baked pixels inside the plaque texture — an a11y failure and the reason
// the section read "amateur". They now live as REAL, translated, selectable HTML
// in the detail grid below (`renderDetails`), so the canvas carries no essential
// text and is marked aria-hidden. The plaque billboards still show the station
// NAME only (Canva PNG faces); the paragraphs are HTML, never drawn to canvas.
export default function Process3D() {
  const { t } = useTranslation('homeProcess')
  const reduced = useReducedMotion()
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX,
  )
  const [visible, setVisible] = useState(false)
  const pinRef = useRef(null)
  const scrollRef = useRef(null)
  const detailsRef = useRef(null) // the HTML detail grid — active column driven imperatively
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
  // mobile (poster) and reduced-motion (static shot). Also emphasises the active
  // stage's HTML column — imperatively (data-active + is-active), never via React
  // state, so the 3D frameloop is never re-rendered by the text layer.
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
        const grid = detailsRef.current
        if (!grid) return
        const idx = Math.min(N - 1, Math.max(0, Math.round(mapActiveF(self.progress))))
        if (grid.dataset.active !== String(idx)) {
          grid.dataset.active = String(idx)
          const cols = grid.children
          for (let i = 0; i < cols.length; i++) cols[i].classList.toggle('is-active', i === idx)
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

  // ── The real-DOM text layer: a six-column detail grid + the closing badge row.
  // ALL SIX descriptions are always present as text nodes (a screen reader reads
  // every one at any scroll position); the active column is merely emphasised.
  // Nothing is display:none — on narrow viewports the grid stacks. `flow` = true
  // places it in normal document flow (mobile/reduced), false = overlaid on the
  // lower pinned viewport (full experience), always above the exit-melt strip.
  const badges = t('badges', { returnObjects: true })
  const renderDetails = (flow) => (
    <div className={`proc-layer${flow ? ' proc-layer--flow' : ''}`}>
      <ol className="proc-details" ref={flow ? undefined : detailsRef} aria-label={t('detailsAria')}>
        {STATIONS.map((s, i) => (
          <li key={s.key} className={`proc-col${i === 0 ? ' is-active' : ''}`}>
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

  // ── Mobile: header + static composed poster + the full HTML detail layer ──
  if (mobile) {
    return (
      <section id="process" data-theme="light" className="conv-section">
        {Header}
        <div className="conv-root conv-poster">
          <img src={poster} alt="" aria-hidden="true" />
          <p className="conv-poster-cap">{t('stages.covered.name')}</p>
        </div>
        {renderDetails(true)}
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
        {renderDetails(true)}
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
          {renderDetails(false)}
          <i className="conv-hint-arrow" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
