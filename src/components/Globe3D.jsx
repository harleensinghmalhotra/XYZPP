import { Suspense, lazy, useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Globe3D — a photoreal, textured Earth for the Global Projects band. Replaces
   the old cobe dotted globe (which read "cheap / pixelated"). Built on
   react-globe.gl (three-globe + three), which we already ship.

   Look (Ekta's DNA): NASA Blue Marble day texture + topology bump for real
   continents/oceans, a warm GOLD atmosphere rim (her accent #C89A3C, not the old
   generic blue), and a transparent canvas so the section's navy #0F2444 and the
   CSS backdrop-bloom read as "soft space" behind the sphere.

   Behaviour contract (kept from the cobe version):
   • slow auto-rotate, drag-to-rotate enabled, wheel/pinch zoom OFF so page scroll
     is never hijacked;
   • gold arcs + gold market points from Navi Mumbai (HQ) to 28 export countries.

   Safety rails (mirrors GlobeFlyTo, the MapLibre section):
   • react-globe.gl is DYNAMIC-imported (React.lazy) and only mounted once the
     section is ~200px from the viewport — the initial bundle never pays for three.
   • three-globe scene is torn down on unmount (react-kapsule _destructor).
   • DPR capped at 1.5 (renderer.setPixelRatio) to keep fill-rate sane.
   • Rendering PAUSES when scrolled off-screen (pauseAnimation/resumeAnimation).
   • prefers-reduced-motion → static rendered Earth (no spin, no arc dashes).
   • No-WebGL → the same dotted-worldmap fallback the section already uses.
   The wrapper carries data-phase="boot|inview|ready" for CSS + verification.
───────────────────────────────────────────────────────────────────────────── */

const Globe = lazy(() => import('react-globe.gl'))

// Brand accent (Ekta): light gold #C89A3C for the atmosphere + markers/arcs.
const GOLD = '#C89A3C'
const GOLD_RGB = 'rgba(200,154,60'

// Self-hosted, license-safe textures — NASA Blue Marble (public domain) shipped
// as three-globe's own example assets. See public/qfp/earth/SOURCE.txt.
const EARTH_TEX = '/qfp/earth/earth-blue-marble.jpg'
const BUMP_TEX = '/qfp/earth/earth-topology.png'

// Navi Mumbai HQ — every arc originates here.
const HQ = { lat: 19.03, lng: 73.0, label: 'Navi Mumbai · HQ' }

// QFP export destinations — [lat, lng, name]. 28 countries (Africa-weighted, matching
// the ledger), re-plotted from the cobe MARKERS set and extended past 25.
const DEST = [
  [-6.37, 34.89, 'Tanzania'],
  [9.08, 8.68, 'Nigeria'],
  [7.54, -5.55, 'Côte d’Ivoire'],
  [-4.04, 21.76, 'DR Congo'],
  [7.95, -1.02, 'Ghana'],
  [-0.02, 37.91, 'Kenya'],
  [1.37, 32.29, 'Uganda'],
  [-13.13, 27.85, 'Zambia'],
  [-30.56, 22.94, 'South Africa'],
  [9.15, 40.49, 'Ethiopia'],
  [-1.94, 29.87, 'Rwanda'],
  [14.5, -14.45, 'Senegal'],
  [7.37, 12.35, 'Cameroon'],
  [-11.2, 17.87, 'Angola'],
  [-18.67, 35.53, 'Mozambique'],
  [-13.25, 34.3, 'Malawi'],
  [-19.02, 29.15, 'Zimbabwe'],
  [23.42, 53.85, 'UAE'],
  [23.89, 45.08, 'Saudi Arabia'],
  [37.09, -95.71, 'USA'],
  [56.13, -106.35, 'Canada'],
  [23.63, -102.55, 'Mexico'],
  [51.17, 10.45, 'Germany'],
  [40.46, -3.75, 'Spain'],
  [55.38, -3.44, 'United Kingdom'],
  [46.23, 2.21, 'France'],
  [52.13, 5.29, 'Netherlands'],
  [-25.27, 133.78, 'Australia'],
]

// Arcs: HQ → each destination. Gold gradient that fades in from the origin.
const ARCS = DEST.map(([lat, lng]) => ({
  startLat: HQ.lat,
  startLng: HQ.lng,
  endLat: lat,
  endLng: lng,
}))

// Points: a brighter HQ dot + one gold dot per market.
const POINTS = [
  { lat: HQ.lat, lng: HQ.lng, size: 0.9, color: GOLD },
  ...DEST.map(([lat, lng]) => ({ lat, lng, size: 0.5, color: GOLD })),
]

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

export default function Globe3D({ reduced = false, className = '' }) {
  const wrapRef = useRef(null)
  const globeEl = useRef(null)
  const [inview, setInview] = useState(false) // gate the heavy import on proximity
  const [size, setSize] = useState(0) // square px (globe needs explicit w/h)
  const [fallback, setFallback] = useState(false)

  // Mount gate: proximity IntersectionObserver (rootMargin 200px), like GlobeFlyTo.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    if (!hasWebGL()) {
      setFallback(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          setInview(true)
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(wrap)
    return () => io.disconnect()
  }, [])

  // Keep the globe square-sized to its container.
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => setSize(Math.round(wrap.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  // Pause the render loop while off-screen (GPU idle when scrolled away).
  useEffect(() => {
    if (!inview) return
    const wrap = wrapRef.current
    if (!wrap) return
    const io = new IntersectionObserver(
      ([e]) => {
        const g = globeEl.current
        if (!g) return
        if (e.isIntersecting) g.resumeAnimation?.()
        else g.pauseAnimation?.()
      },
      { threshold: 0 },
    )
    io.observe(wrap)
    return () => io.disconnect()
  }, [inview])

  // Configure controls + renderer once the globe is ready.
  const onReady = () => {
    const g = globeEl.current
    if (!g) return
    try {
      const renderer = g.renderer()
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
    } catch {
      /* renderer not ready */
    }
    const controls = g.controls()
    if (controls) {
      controls.enableZoom = false // never hijack page scroll
      controls.enablePan = false
      controls.autoRotate = !reduced // slow, dignified drift
      controls.autoRotateSpeed = 0.32
      controls.rotateSpeed = 0.5
      controls.minPolarAngle = 0.35
      controls.maxPolarAngle = Math.PI - 0.35
    }
    // Face India / Africa / the Gulf (the dense market landmass), like the cobe start.
    g.pointOfView({ lat: 14, lng: 52, altitude: 2.3 }, 0)
    if (wrapRef.current) wrapRef.current.dataset.phase = 'ready'
  }

  return (
    <div ref={wrapRef} className={`proj-globe ${className}`} data-phase={inview ? 'inview' : 'boot'} aria-hidden="true">
      {fallback ? (
        <div className="proj-globe-fallback">
          <img src="/qfp/worldmap-dots.webp" alt="" loading="lazy" decoding="async" />
        </div>
      ) : (
        inview &&
        size > 0 && (
          <Suspense fallback={null}>
            <Globe
              ref={globeEl}
              width={size}
              height={size}
              onGlobeReady={onReady}
              animateIn={false}
              backgroundColor="rgba(0,0,0,0)"
              rendererConfig={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
              globeImageUrl={EARTH_TEX}
              bumpImageUrl={BUMP_TEX}
              showAtmosphere
              atmosphereColor={GOLD}
              atmosphereAltitude={0.23}
              // gold market arcs from HQ — lifted higher + a touch bolder/brighter so
              // they read as intentional trade routes, not stray hairlines.
              arcsData={ARCS}
              arcColor={() => [`${GOLD_RGB},0)`, `${GOLD_RGB},0.55)`, `${GOLD_RGB},0.95)`]}
              arcStroke={0.5}
              arcAltitudeAutoScale={0.55}
              arcDashLength={reduced ? 1 : 0.45}
              arcDashGap={reduced ? 0 : 0.9}
              arcDashInitialGap={() => Math.random()}
              arcDashAnimateTime={reduced ? 0 : 4200}
              // gold market points
              pointsData={POINTS}
              pointColor="color"
              pointAltitude={0.006}
              pointRadius="size"
              pointResolution={12}
            />
          </Suspense>
        )
      )}
    </div>
  )
}
