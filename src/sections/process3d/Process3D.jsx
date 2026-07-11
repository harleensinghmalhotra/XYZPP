import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '@/lib/useReducedMotion'
import Scene from './Scene'
import { EKTA, CAM } from './constants'
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
export default function Process3D() {
  const { t } = useTranslation('homeProcess')
  const reduced = useReducedMotion()
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX,
  )
  const [visible, setVisible] = useState(false)
  const pinRef = useRef(null)
  const scrollRef = useRef(null)
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
  // mobile (poster) and reduced-motion (static shot).
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
      onUpdate: (self) => { progress.current = self.progress },
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

  // ── Mobile: header + static composed poster (screenshotted from this scene) ──
  if (mobile) {
    return (
      <section id="process" data-theme="light" className="conv-section">
        {Header}
        <div className="conv-root conv-poster">
          <img src={poster} alt={t('sub')} />
          <p className="conv-poster-cap">{t('stages.covered.name')}</p>
        </div>
      </section>
    )
  }

  // ── Reduced-motion: header + a single static "You're Covered" beauty shot ──
  if (reduced) {
    return (
      <section id="process" data-theme="light" className="conv-section">
        {Header}
        <div ref={pinRef} className="conv-root conv-still">
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
      </section>
    )
  }

  // ── Full experience: header, then the sticky-pinned scrubbed conveyor ──
  return (
    <section id="process" data-theme="light" className="conv-section">
      {Header}
      <div ref={scrollRef} className="conv-scroll" style={{ height: `${PAGES * 100}vh`, background: EKTA.cream }}>
        <div ref={pinRef} className="conv-pin">
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
          <i className="conv-hint-arrow" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
