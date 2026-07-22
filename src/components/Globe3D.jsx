import { Suspense, forwardRef, lazy, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Globe3D — a photoreal, textured Earth for the Global Projects band. Replaces
   the old cobe dotted globe (which read "cheap / pixelated"). Built on
   react-globe.gl (three-globe + three), which we already ship.

   Look: NASA Blue Marble day texture + topology bump for real continents/oceans,
   a warm GOLD atmosphere rim (brand accent #F37031, not the old generic blue),
   and a transparent canvas so the section's near-black navy and
   the CSS gold halo read as "soft space / velvet" behind the sphere.

   Behaviour contract (kept from the cobe version):
   • slow auto-rotate, drag-to-rotate enabled, wheel/pinch zoom OFF so page scroll
     is never hijacked;
   • gold arcs + gold market points from Navi Mumbai (HQ) to 28 export countries.

   THE CONVERSATION (new — Projects revamp): the globe *reacts* to the copy around
   it. The section holds a ref and calls imperative methods:
     • focusRegion(slug)  → smooth pointOfView to that region + brighten its arcs,
                            dim the rest ("face where the cursor is").
     • pulseCountry(name) → brighten one country's arc + swell its marker.
     • reset()            → clear the highlight, resume the quiet auto-rotate.
   All reactions are NO-OPS under prefers-reduced-motion (drag still works; the
   sphere just holds its static, fully-lit state).

   Safety rails (mirrors GlobeFlyTo, the MapLibre section):
   • react-globe.gl is DYNAMIC-imported (React.lazy) and only mounted once the
     section is ~200px from the viewport — the initial bundle never pays for three.
   • three-globe scene is torn down on unmount (react-kapsule _destructor).
   • DPR capped at 1.5 (renderer.setPixelRatio) to keep fill-rate sane.
   • Rendering PAUSES when scrolled off-screen (pauseAnimation/resumeAnimation).
   • prefers-reduced-motion → static rendered Earth (no spin, no arc dashes).
   • No-WebGL → a calm CSS "planet" disc (no dotted world-map — that motif is dead).
   The wrapper carries data-phase="boot|inview|ready" for CSS + verification.
───────────────────────────────────────────────────────────────────────────── */

const Globe = lazy(() => import('react-globe.gl'))

// Brand accent: light gold #F37031 for the atmosphere + markers/arcs.
const GOLD = '#F37031'
const GOLD_RGB = 'rgba(200,154,60'

// Self-hosted, license-safe textures — NASA Blue Marble (public domain) shipped
// as three-globe's own example assets. See public/qfp/earth/SOURCE.txt.
const EARTH_TEX = '/site-assets/homepage/globe/earth-blue-marble.jpg'
const BUMP_TEX = '/site-assets/homepage/globe/earth-topology.png'

// Navi Mumbai HQ — every arc originates here. name '__HQ' so India-side records
// (Maharashtra / HDFC / ZEE) can pulse the origin marker itself.
const HQ = { lat: 19.03, lng: 73.0, name: '__HQ', region: 'asia' }

// QFP export destinations — { lat, lng, name, region }. 28 countries
// (Africa-weighted, matching the ledger); `region` tags them for the destination
// panels' focus reaction. `name` matches the globe targets the record cards pulse.
const DEST = [
  { lat: -6.37, lng: 34.89, name: 'Tanzania', region: 'africa' },
  { lat: 9.08, lng: 8.68, name: 'Nigeria', region: 'africa' },
  { lat: 7.54, lng: -5.55, name: 'Côte d’Ivoire', region: 'africa' },
  { lat: -4.04, lng: 21.76, name: 'DR Congo', region: 'africa' },
  { lat: 7.95, lng: -1.02, name: 'Ghana', region: 'africa' },
  { lat: -0.02, lng: 37.91, name: 'Kenya', region: 'africa' },
  { lat: 1.37, lng: 32.29, name: 'Uganda', region: 'africa' },
  { lat: -13.13, lng: 27.85, name: 'Zambia', region: 'africa' },
  { lat: -30.56, lng: 22.94, name: 'South Africa', region: 'africa' },
  { lat: 9.15, lng: 40.49, name: 'Ethiopia', region: 'africa' },
  { lat: -1.94, lng: 29.87, name: 'Rwanda', region: 'africa' },
  { lat: 14.5, lng: -14.45, name: 'Senegal', region: 'africa' },
  { lat: 7.37, lng: 12.35, name: 'Cameroon', region: 'africa' },
  { lat: -11.2, lng: 17.87, name: 'Angola', region: 'africa' },
  { lat: -18.67, lng: 35.53, name: 'Mozambique', region: 'africa' },
  { lat: -13.25, lng: 34.3, name: 'Malawi', region: 'africa' },
  { lat: -19.02, lng: 29.15, name: 'Zimbabwe', region: 'africa' },
  { lat: 23.42, lng: 53.85, name: 'UAE', region: 'asia' },
  { lat: 23.89, lng: 45.08, name: 'Saudi Arabia', region: 'asia' },
  { lat: 37.09, lng: -95.71, name: 'USA', region: 'europe' },
  { lat: 56.13, lng: -106.35, name: 'Canada', region: 'europe' },
  { lat: 23.63, lng: -102.55, name: 'Mexico', region: 'europe' },
  { lat: 51.17, lng: 10.45, name: 'Germany', region: 'europe' },
  { lat: 40.46, lng: -3.75, name: 'Spain', region: 'europe' },
  { lat: 55.38, lng: -3.44, name: 'United Kingdom', region: 'europe' },
  { lat: 46.23, lng: 2.21, name: 'France', region: 'europe' },
  { lat: 52.13, lng: 5.29, name: 'Netherlands', region: 'europe' },
  { lat: -25.27, lng: 133.78, name: 'Australia', region: 'asia' },
]

// Where the camera swings to when a destination panel is hovered. Americas &
// Europe centres on the Atlantic so both landmasses read at once.
const REGION_POV = {
  africa: { lat: 3, lng: 21, altitude: 2.1 },
  asia: { lat: 21, lng: 74, altitude: 2.1 },
  europe: { lat: 32, lng: -34, altitude: 2.45 },
}
const DEFAULT_POV = { lat: 14, lng: 52, altitude: 2.3 }

// ── arc / point colour ramps ─────────────────────────────────────────────────
const ARC_BASE = [`${GOLD_RGB},0)`, `${GOLD_RGB},0.5)`, `${GOLD_RGB},0.9)`]
const ARC_BRIGHT = [`${GOLD_RGB},0.2)`, `${GOLD_RGB},0.85)`, 'rgba(255,240,205,1)']
const ARC_DIM = [`${GOLD_RGB},0)`, `${GOLD_RGB},0.1)`, `${GOLD_RGB},0.22)`]

// Given the active highlight, decide how a destination reads (base | bright | dim).
function tierFor(d, hi) {
  if (!hi.region && !hi.country) return 'base'
  if (hi.country && d.name === hi.country) return 'bright'
  if (hi.region && d.region === hi.region) return 'bright'
  return 'dim'
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch {
    return false
  }
}

function Globe3D({ reduced = false, className = '' }, ref) {
  const wrapRef = useRef(null)
  const globeEl = useRef(null)
  const [inview, setInview] = useState(false) // gate the heavy import on proximity
  const [size, setSize] = useState(0) // square px (globe needs explicit w/h)
  const [fallback, setFallback] = useState(false)
  // The one reactive knob the section drives: { region, country }. Rebuilds the
  // arc/point arrays (new refs) so react-globe.gl re-renders their colour/size.
  const [hi, setHi] = useState({ region: null, country: null })

  // Expose the "conversation" API to the Projects section.
  useImperativeHandle(ref, () => ({
    focusRegion(region) {
      if (reduced) return
      setHi({ region, country: null })
      const g = globeEl.current
      const pov = REGION_POV[region]
      if (g && pov) g.pointOfView(pov, 900)
    },
    pulseCountry(name) {
      if (reduced) return
      setHi({ region: null, country: name })
      const g = globeEl.current
      if (!g) return
      // India-side records pulse the HQ origin; face India for those.
      const d = DEST.find((x) => x.name === name)
      if (d) g.pointOfView({ lat: d.lat, lng: d.lng, altitude: 2.15 }, 800)
      else if (name === '__HQ') g.pointOfView({ lat: 20, lng: 76, altitude: 2.15 }, 800)
    },
    reset() {
      if (reduced) return
      setHi({ region: null, country: null })
    },
  }), [reduced])

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

  // Arc/point data — rebuilt whenever the highlight changes so colours/sizes
  // update. Colour + stroke + radius are baked onto each datum (accessor reads it).
  const arcs = useMemo(
    () =>
      DEST.map((d) => {
        const tier = tierFor(d, hi)
        return {
          startLat: HQ.lat,
          startLng: HQ.lng,
          endLat: d.lat,
          endLng: d.lng,
          color: tier === 'bright' ? ARC_BRIGHT : tier === 'dim' ? ARC_DIM : ARC_BASE,
          stroke: tier === 'bright' ? 0.85 : 0.5,
        }
      }),
    [hi],
  )
  const points = useMemo(() => {
    const hqHot = hi.country === '__HQ'
    const list = [
      { lat: HQ.lat, lng: HQ.lng, size: hqHot ? 1.25 : 0.9, color: hqHot ? 'rgba(255,230,214,1)' : GOLD },
    ]
    for (const d of DEST) {
      const tier = tierFor(d, hi)
      list.push({
        lat: d.lat,
        lng: d.lng,
        size: tier === 'bright' ? 1.05 : tier === 'dim' ? 0.35 : 0.5,
        color: tier === 'bright' ? 'rgba(255,230,214,1)' : GOLD,
      })
    }
    return list
  }, [hi])

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
    g.pointOfView(DEFAULT_POV, 0)
    if (wrapRef.current) wrapRef.current.dataset.phase = 'ready'
  }

  return (
    <div ref={wrapRef} className={`proj-globe ${className}`} data-phase={inview ? 'inview' : 'boot'} aria-hidden="true">
      {fallback ? (
        <div className="proj-globe-fallback" />
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
              // gold market arcs from HQ — colour/stroke baked per-arc so the region
              // focus (bright) + dim states read as intentional trade routes.
              arcsData={arcs}
              arcColor="color"
              arcStroke="stroke"
              arcAltitudeAutoScale={0.55}
              arcDashLength={reduced ? 1 : 0.45}
              arcDashGap={reduced ? 0 : 0.9}
              arcDashInitialGap={() => Math.random()}
              arcDashAnimateTime={reduced ? 0 : 4200}
              // gold market points (swell + brighten on focus/pulse)
              pointsData={points}
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

export default forwardRef(Globe3D)
