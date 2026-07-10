import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { useReducedMotion } from '@/lib/useReducedMotion'
import Scene from './Scene'
import { EKTA } from './constants'
import poster from './poster.jpg'
import './process3d.css'

const MOBILE_MAX = 900 // <901px → static poster fallback

// Phase 3.2 · Stage 1 (scaffold): a scroll-driven R3F conveyor belt carrying a
// book through the 6 process stations, transforming at each. Isolated component
// on the /dev/conveyor route — the existing Process section is untouched.
export default function Process3D() {
  const reduced = useReducedMotion()
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX,
  )
  const [visible, setVisible] = useState(true)
  const wrapRef = useRef(null)

  // Track viewport width for the mobile poster cutover.
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= MOBILE_MAX)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Render only while in the viewport (observer → frameloop demand/never).
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Mobile: static composed poster (screenshotted from this very scene).
  if (mobile) {
    return (
      <main ref={wrapRef} className="conv-root conv-poster">
        <img src={poster} alt="Quarterfold process line: a book travels a conveyor through six stations — print, quality, fulfillment, warehouse, ship, and fully covered." />
        <p className="conv-poster-cap">One Continuous Process</p>
      </main>
    )
  }

  return (
    <main ref={wrapRef} className="conv-root" style={{ background: EKTA.cream }}>
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [-8, 3.25, 8.4], fov: 38 }}
      >
        <Suspense fallback={null}>
          {reduced ? (
            <ScrollControls pages={1} damping={0.2}>
              <Scene frozen />
            </ScrollControls>
          ) : (
            <ScrollControls pages={5} damping={0.2}>
              <Scene />
            </ScrollControls>
          )}
        </Suspense>
      </Canvas>

      {!reduced && (
        <div className="conv-hint" aria-hidden="true">
          <span>Scroll to run the line</span>
          <i className="conv-hint-arrow" />
        </div>
      )}
    </main>
  )
}
