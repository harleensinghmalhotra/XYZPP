import { useEffect, useRef, useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   GlobeFlyTo — a MapLibre GL v5 globe that replicates the Mapbox flyTo demo
   (https://docs.mapbox.com/mapbox-gl-js/example/flyto-options/) with zero tokens:
   open-source MapLibre + OpenFreeMap vector tiles (no signup, no API key).

   Branded into a "QFP planet": navy space + ocean, cream/beige land, warm-gold
   atmosphere glow, country labels only. Choreography on first scroll-into-view:
     globe rotating in space  →  beat  →  cinematic flyTo Navi Mumbai  →  two
     gold markers pop (Vashi · Taloja)  →  drag enabled.

   Safety rails, all handled here so the section wrappers stay dumb:
   • maplibre-gl (JS + CSS) is DYNAMIC-imported only when the section is ~200px
     from the viewport — the homepage/hero initial bundle never pays for it.
   • Instance is fully .remove()'d on unmount.
   • prefers-reduced-motion → no flight, render the landed state with pins.
   • Mobile (<901px) → static worldmap-dots fallback, maplibre never loads.
   • Tiles unreachable → graceful worldmap-dots fallback with gold pins + caption
     (no broken map, no console spam loop).
   The wrapper carries data-phase="space|flying|landed" for CSS + verification.
───────────────────────────────────────────────────────────────────────────── */

// Brand law (Phase 2.x): navy family space/ocean, cream/beige land, gold glow.
const NAVY = '#0F2444'
const CREAM = '#F0EBE0'
const CREAM_WARM = '#E6DDC8'
const GOLD = '#C89A3C'
const GOLD_DEEP = '#9B7420'

// OpenFreeMap "positron" — the cleaner, lighter of the two free bases, easiest
// to restyle into a cream-land planet. Free vector tiles, no key. (See
// https://openfreemap.org — /styles/liberty is the busier alternative.)
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

// Navi Mumbai landing, plus the two QFP sites that pop as gold markers.
const TARGET = { center: [73.0, 19.03], zoom: 9 }
const MARKERS = [
  { lngLat: [72.9987, 19.077], label: 'Vashi', role: 'Head Office' },
  { lngLat: [73.103, 19.083], label: 'Taloja', role: 'Main Factory' },
]

const SPACE_VIEW = { center: [58, 21], zoom: 1.3 }
const MOBILE_MQ = '(max-width: 900px)'

// Walk the loaded style once and repaint every layer into the QFP palette, so it
// never reads as Google Maps: ocean/background navy, land cream, water lines navy,
// roads/POIs/buildings hidden, labels off except country names.
function brandStyle(map) {
  const layers = map.getStyle()?.layers || []
  for (const { id, type } of layers) {
    try {
      if (type === 'background') {
        // positron's background IS the land/earth base — cream. Oceans are the
        // separate `water` fill (→ navy below), so continents read cream on navy.
        map.setPaintProperty(id, 'background-color', CREAM)
      } else if (type === 'fill') {
        if (/water|ocean|sea|river|lake|bay|marine|reservoir/i.test(id)) {
          map.setPaintProperty(id, 'fill-color', NAVY)
          map.setPaintProperty(id, 'fill-opacity', 1)
        } else if (/building/i.test(id)) {
          map.setLayoutProperty(id, 'visibility', 'none')
        } else {
          // land / landcover / landuse / park → cream, greens a touch warmer
          map.setPaintProperty(id, 'fill-color', /wood|forest|park|grass|green|scrub/i.test(id) ? CREAM_WARM : CREAM)
          map.setPaintProperty(id, 'fill-opacity', 1)
        }
      } else if (type === 'line') {
        if (/water|river|waterway/i.test(id)) {
          map.setPaintProperty(id, 'line-color', NAVY)
        } else if (/boundary|admin/i.test(id)) {
          map.setPaintProperty(id, 'line-color', 'rgba(155,116,32,0.45)')
          map.setPaintProperty(id, 'line-width', 0.6)
        } else {
          map.setLayoutProperty(id, 'visibility', 'none') // roads, rail, bridges…
        }
      } else if (type === 'symbol') {
        if (/country|continent/i.test(id)) {
          map.setPaintProperty(id, 'text-color', CREAM)
          map.setPaintProperty(id, 'text-halo-color', NAVY)
          map.setPaintProperty(id, 'text-halo-width', 1.3)
        } else {
          map.setLayoutProperty(id, 'visibility', 'none') // cities, POIs, streets
        }
      } else if (type === 'fill-extrusion') {
        map.setLayoutProperty(id, 'visibility', 'none')
      }
    } catch {
      /* layer lacks that property — ignore and continue */
    }
  }
}

// Space (deep navy, darker than the ocean so the planet's silhouette reads) with
// a subtle warm-gold atmosphere rim. Kept LIGHT: a heavy atmosphere/fog blanks the
// globe at low zoom (navy ocean == navy space); fog hugs the ground only.
function brandSky(map) {
  try {
    map.setSky({
      'sky-color': '#081326',
      'sky-horizon-blend': 0.35,
      'horizon-color': GOLD,
      'horizon-fog-blend': 0.7,
      'fog-color': NAVY,
      'fog-ground-blend': 0.95,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 4, 0.15, 7, 0],
    })
  } catch {
    /* setSky unsupported — globe still renders, just without the glow */
  }
}

export default function GlobeFlyTo({ flightMs = 6000, beatMs = 1200, className = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const mapRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.matchMedia(MOBILE_MQ).matches

    // Mobile → static fallback, maplibre never loads (protect low-power fps).
    if (mobile) {
      setFallback(true)
      return
    }

    let cancelled = false
    const cleanups = []
    const setPhase = (p) => {
      if (wrapRef.current) wrapRef.current.dataset.phase = p
    }
    setPhase('boot')

    // Gate the heavy import on viewport proximity (~200px). Nothing downloads
    // until the section is about to matter.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          boot()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(wrap)
    cleanups.push(() => io.disconnect())

    async function boot() {
      let maplibregl
      try {
        await import('maplibre-gl/dist/maplibre-gl.css')
        maplibregl = (await import('maplibre-gl')).default
      } catch {
        if (!cancelled) setFallback(true)
        return
      }
      if (cancelled || !canvasRef.current) return

      let map
      try {
        map = new maplibregl.Map({
          container: canvasRef.current,
          style: STYLE_URL,
          center: reduced ? TARGET.center : SPACE_VIEW.center,
          zoom: reduced ? TARGET.zoom : SPACE_VIEW.zoom,
          attributionControl: { compact: true },
          interactive: true,
          fadeDuration: 0,
          maxZoom: 12,
        })
      } catch {
        if (!cancelled) setFallback(true)
        return
      }
      mapRef.current = map

      const removeMap = () => {
        try {
          map.remove()
        } catch {
          /* already gone */
        }
        if (mapRef.current === map) mapRef.current = null
      }
      cleanups.push(removeMap)

      // Interaction OFF until landed (disable every handler; re-enable drag only).
      ;['dragPan', 'scrollZoom', 'boxZoom', 'dragRotate', 'keyboard', 'doubleClickZoom', 'touchZoomRotate', 'touchPitch'].forEach(
        (h) => map[h]?.disable?.(),
      )

      // Failure watchdog: if the style/tiles never load, fall back gracefully.
      let loaded = false
      const failTimer = setTimeout(() => {
        if (!loaded && !cancelled) {
          removeMap()
          setFallback(true)
        }
      }, 8000)
      cleanups.push(() => clearTimeout(failTimer))

      // A style/source error BEFORE first load = tiles unreachable → fallback.
      // After load, transient glyph/tile errors are ignored (no spam loop).
      map.on('error', () => {
        if (!loaded && !cancelled) {
          clearTimeout(failTimer)
          removeMap()
          setFallback(true)
        }
      })

      map.on('load', () => {
        if (cancelled) return
        loaded = true
        clearTimeout(failTimer)
        try {
          map.setProjection({ type: 'globe' })
        } catch {
          /* globe unsupported — falls back to mercator, still branded */
        }
        brandStyle(map)
        brandSky(map)

        // Reduced motion → skip the flight, show the landed state with pins.
        if (reduced) {
          landed(map, maplibregl, setPhase)
          return
        }

        // Start the choreography only once the space view has actually PAINTED
        // (first idle) — so the planet is never a half-loaded blob during the
        // beat. Guard with a timeout in case idle is slow/never fires.
        let started = false
        const begin = () => {
          if (started || cancelled) return
          started = true
          setPhase('space')

          // Choreography: slow spin in space → beat → cinematic flyTo → land.
          let spinning = true
          let raf = requestAnimationFrame(function spin() {
            if (!spinning || cancelled) return
            const c = map.getCenter()
            map.setCenter([c.lng + 0.06, c.lat])
            raf = requestAnimationFrame(spin)
          })
          const stopSpin = () => {
            spinning = false
            cancelAnimationFrame(raf)
          }
          cleanups.push(stopSpin)

          const beat = setTimeout(() => {
            if (cancelled) return
            stopSpin()
            setPhase('flying')
            map.once('moveend', () => {
              if (cancelled) return
              landed(map, maplibregl, setPhase)
            })
            // curve shapes the space→ground arc (the demo's cinematic feel); an
            // explicit duration keeps the ~6s (home) / ~4s (about) pacing exact.
            map.flyTo({ center: TARGET.center, zoom: TARGET.zoom, curve: 1.4, duration: flightMs, essential: true })
          }, beatMs)
          cleanups.push(() => clearTimeout(beat))
        }
        map.once('idle', begin)
        const idleFallback = setTimeout(begin, 2500)
        cleanups.push(() => clearTimeout(idleFallback))
      })
    }

    return () => {
      cancelled = true
      cleanups.forEach((fn) => {
        try {
          fn()
        } catch {
          /* ignore */
        }
      })
    }
  }, [flightMs, beatMs])

  // Landed: pop the two gold markers, hand drag back to the user.
  function landed(map, maplibregl, setPhase) {
    MARKERS.forEach((m, i) => {
      const el = document.createElement('div')
      el.className = 'qfp-globe-marker'
      const pin = document.createElement('span')
      pin.className = 'qfp-globe-pin'
      const tip = document.createElement('span')
      tip.className = 'qfp-globe-tip'
      tip.innerHTML = `<b>${m.label}</b><i>${m.role}</i>`
      el.append(pin, tip)
      new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(m.lngLat).addTo(map)
      // Staggered pop; rAF so the transition start is painted before .is-in.
      requestAnimationFrame(() => setTimeout(() => el.classList.add('is-in'), 180 + i * 220))
    })
    // Drag on (scrollZoom stays off so the map never hijacks page scroll).
    map.dragPan.enable()
    map.dragRotate.enable()
    map.touchZoomRotate.enable()
    map.keyboard.enable()
    setPhase('landed')
  }

  return (
    <div ref={wrapRef} className={`qfp-globe ${className}`} data-phase="boot">
      {fallback ? (
        <div className="qfp-globe-fallback">
          <img src="/qfp/worldmap-dots.webp" alt="" aria-hidden="true" loading="lazy" />
          <span className="qfp-globe-fbpin qfp-globe-fbpin--vashi" aria-hidden="true" />
          <span className="qfp-globe-fbpin qfp-globe-fbpin--taloja" aria-hidden="true" />
          <p className="qfp-globe-fbcap">Vashi · Taloja, Navi Mumbai, India</p>
        </div>
      ) : (
        <div ref={canvasRef} className="qfp-globe-canvas" aria-hidden="true" />
      )}
    </div>
  )
}
