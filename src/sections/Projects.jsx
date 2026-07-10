import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import createGlobe from 'cobe'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'

gsap.registerPlugin(ScrollTrigger)

// ── Global Projects — the dark cinematic proof band ──────────────────────────
// Navy showpiece: a dotted world map behind, a slow auto-rotating cobe globe
// with gold markers on QFP's markets, a word-rise header (Promise pattern), three
// cursor-spotlight region cards, and an 8-tile milestone wall whose numbers tick
// up once on view. Reduced-motion → everything static/final. GPU-only.

// One-line compliance switch: flip to false to drop HDFC + ZEE rows (they carry
// the same client-permission flag as the trust strips). A `?hideRestricted` URL
// param also forces them off for preview/QA without a code change.
const SHOW_RESTRICTED_CLIENTS = true

// QFP market markers for the globe — [lat, lng]. Gold, sized by prominence.
const MARKERS = [
  { location: [20.59, 78.96], size: 0.09 }, // India (HQ)
  { location: [-6.37, 34.89], size: 0.07 }, // Tanzania
  { location: [9.08, 8.68], size: 0.07 }, // Nigeria
  { location: [7.54, -5.55], size: 0.06 }, // Côte d'Ivoire
  { location: [-4.04, 21.76], size: 0.06 }, // DR Congo
  { location: [7.95, -1.02], size: 0.05 }, // Ghana
  { location: [-0.02, 37.91], size: 0.05 }, // Kenya
  { location: [1.37, 32.29], size: 0.04 }, // Uganda
  { location: [-13.13, 27.85], size: 0.04 }, // Zambia
  { location: [23.42, 53.85], size: 0.05 }, // UAE
  { location: [37.09, -95.71], size: 0.05 }, // USA
  { location: [51.17, 10.45], size: 0.04 }, // Germany
  { location: [40.46, -3.75], size: 0.04 }, // Spain
  { location: [55.38, -3.44], size: 0.04 }, // UK
  { location: [23.63, -102.55], size: 0.04 }, // Mexico
]

// ambient gold pulses over the map's market regions (decorative, tuned @1536)
const PULSES = [
  { left: '67.5%', top: '50%', d: 0 }, // India
  { left: '57.5%', top: '64%', d: 1.1 }, // East Africa
  { left: '49%', top: '55%', d: 2.0 }, // West Africa
  { left: '53%', top: '62%', d: 0.6 }, // Central Africa
  { left: '62%', top: '46%', d: 1.6 }, // Gulf
]

// Region cards — text resolved from the homeProjects namespace by key/slug; the
// body carries an embedded <strong> country list rendered via <Trans>.
const REGIONS = [
  { slug: 'africa' },
  { slug: 'asia' },
  { slug: 'europe' },
]

// The editorial ledger — one hero stat (loud) + seven quiet rows (understated).
// The hero story names a government body; when SHOW_MINISTRY_NAMES is off it
// falls back to a neutral national-programme phrasing (same layout, no hole).
// hero numbers stay numeric; the story text (with its embedded <strong>) is
// resolved from the namespace — the ministry gate picks the key, both variants
// are translated (ledger.heroStory / ledger.heroStoryFallback).
const HERO = {
  value: '10',
  suffix: 'M+',
  storyKey: SHOW_MINISTRY_NAMES ? 'ledger.heroStory' : 'ledger.heroStoryFallback',
}
// `ministry: true` rows carry government / ministry / programme names gated behind
// SHOW_MINISTRY_NAMES; `restricted: true` rows carry commercial client names gated
// behind SHOW_RESTRICTED_CLIENTS. Either gate filters its rows out cleanly.
// `key` → stable i18n key (name/desc); `unitKey` → unit label key. Numbers numeric.
const LEDGER = [
  { key: 'nigeria', num: '8', unitKey: 'books', ministry: true },
  { key: 'cotedivoire', num: '4', unitKey: 'books', ministry: true },
  { key: 'drcongo', num: '3.5', unitKey: 'books', ministry: true },
  { key: 'usaidghana', num: '2', unitKey: 'books', ministry: true },
  { key: 'maharashtra', num: '1.5', unitKey: 'books', ministry: true },
  { key: 'hdfc', num: '1.3', unitKey: 'books', restricted: true },
  { key: 'zee', num: '0.5', unitKey: 'kits', restricted: true },
]

// two stacked 0–9 sets → the reel does one full loop then locks on the target,
// which reads as a satisfying vertical "roll". yPercent (not px) so the lock
// survives font-size changes from the clamp()/vw number sizing.
const REEL_CELLS = Array.from({ length: 20 }, (_, i) => i % 10)

const words = (s) => s.split(' ')

function RegionCard({ slug, t }) {
  return (
    <article className="proj-region">
      <div className="proj-region-media">
        <div className="proj-region-base" aria-hidden="true" />
        {/* silent CSS-bg photo: a missing file simply reveals the navy base (no 404) */}
        <div
          className="proj-region-photo"
          aria-hidden="true"
          style={{ backgroundImage: `url(/qfp/regions/region-${slug}.webp)` }}
        />
      </div>
      <div className="proj-region-overlay" aria-hidden="true" />
      <div className="proj-region-scrim" aria-hidden="true" />
      <div className="proj-region-content">
        <h3 className="proj-region-name">{t(`regions.${slug}.name`)}</h3>
        <p className="proj-region-text">
          <Trans t={t} i18nKey={`regions.${slug}.body`} components={{ strong: <strong /> }} />
        </p>
      </div>
    </article>
  )
}

function Globe({ reduced }) {
  const canvas = useRef(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let phi = 5.35 // start with Africa/Europe/India (dense landmass) facing front
    let width = 0
    let raf
    const onResize = () => { if (el) width = el.offsetWidth }
    window.addEventListener('resize', onResize)
    onResize()
    const rot = reduced ? 0 : 0.0026 // slow, dignified drift
    // cobe v2: no internal loop / onRender — we drive it via globe.update().
    const R = 1.6 // globe backing scale (also the devicePixelRatio) — lighter than 2× for smoother scrub
    const globe = createGlobe(el, {
      devicePixelRatio: R,
      width: width * R,
      height: width * R,
      phi: 5.35,
      theta: 0.26,
      dark: 1,
      diffuse: 1.5,
      mapSamples: 17000,
      mapBrightness: 12, // brighter, warmer continents so the sphere reads premium
      mapBaseBrightness: 0.13, // floor glow so the ocean-facing side is never a dead void
      baseColor: [0.19, 0.29, 0.48], // lifted navy so the sphere separates from the field
      markerColor: [0.92, 0.73, 0.38], // gold #C89A3C
      glowColor: [0.5, 0.44, 0.36], // warm gold-tinted atmosphere bloom
      markers: MARKERS,
    })
    const render = () => {
      globe.update({ phi, width: width * R, height: width * R })
      phi += rot
      raf = requestAnimationFrame(render)
    }
    globe.update({ phi, width: width * R, height: width * R }) // paint once immediately
    // only spin while on-screen — no GPU burn when scrolled away
    let running = false
    const start = () => { if (!running && !reduced) { running = true; raf = requestAnimationFrame(render) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 })
    io.observe(el)
    // fade the canvas in once it has painted (avoids a hard pop)
    requestAnimationFrame(() => { if (el) el.style.opacity = '1' })
    return () => { stop(); io.disconnect(); globe.destroy(); window.removeEventListener('resize', onResize) }
  }, [reduced])

  return (
    <div className="proj-globe" aria-hidden="true">
      <canvas ref={canvas} className="proj-globe-canvas" />
    </div>
  )
}

// Masked digit-reel odometer. Renders real DOM text (aria-label carries the value
// for AT); each digit is a 20-cell vertical strip clipped to a 1em window. The reels
// sit at rest (showing "0"); the parent GSAP timeline rolls each `.odo-reel` to its
// data-d target once on scroll entry. Reduced-motion → plain final text, no reel.
function Odometer({ value, suffix = 'M+', reduced }) {
  if (reduced) {
    return <span className="odo odo--static" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}{suffix}</span>
  }
  return (
    <span className="odo" role="text" aria-label={`${value}${suffix}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {String(value).split('').map((c, i) =>
        c === '.' ? (
          <span key={i} className="odo-dot" aria-hidden="true">.</span>
        ) : (
          <span key={i} className="odo-digit" aria-hidden="true">
            <span className="odo-reel" data-d={c}>
              {REEL_CELLS.map((n, j) => <span key={j} className="odo-cell">{n}</span>)}
            </span>
          </span>
        ),
      )}
      <span className="odo-suffix" aria-hidden="true">{suffix}</span>
    </span>
  )
}

export default function Projects() {
  const { t } = useTranslation('homeProjects')
  const root = useRef(null)
  const ledger = useRef(null)
  const [reduced] = useState(prefersReduced)

  const hideParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('hideRestricted')
  const showRestricted = SHOW_RESTRICTED_CLIENTS && !hideParam
  const rows = LEDGER.filter(
    (r) => (SHOW_MINISTRY_NAMES || !r.ministry) && (showRestricted || !r.restricted),
  )

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      // top block entrance
      gsap.set(q('.proj-eyebrow'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.pw'), { autoAlpha: 0, yPercent: 80, filter: 'blur(8px)' })
      gsap.set(q('.proj-sub'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.proj-globe'), { autoAlpha: 0, scale: 0.92 })
      gsap.set(q('.proj-region'), { autoAlpha: 0, y: 26 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 74%', once: true } })
      tl.to(q('.proj-head .proj-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.pw'), { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.055, ease: 'power3.out' }, 0.1)
        .to(q('.proj-globe'), { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 0.15)
        .to(q('.proj-sub'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '>-0.5')
        .to(q('.proj-region'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, '>-0.3')

      // editorial ledger — own trigger so it fires as the block enters
      // roll a set of reels to their data-d targets. yPercent = -(10 + d) * 5:
      // one full 0–9 loop (10 cells) then land on d, within the 20-cell strip.
      const roll = (sel, vars) =>
        gsap.fromTo(q(sel), { yPercent: 0 },
          { yPercent: (i, el) => -(10 + Number(el.dataset.d)) * 5, ...vars })

      gsap.set(q('.ledger-hero-label, .ledger-hero-story'), { autoAlpha: 0, y: 12 })
      gsap.set(q('.ledger-hero-num'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.ledger-row'), { autoAlpha: 0, y: 18 })

      const tl2 = gsap.timeline({ scrollTrigger: { trigger: ledger.current, start: 'top 78%', once: true } })
      // 1 · single soft gold light pass over the whole block (once, ~900ms)
      tl2.fromTo(q('.proj-ledger-flash'),
        { autoAlpha: 0, xPercent: -35 },
        { autoAlpha: 0.15, duration: 0.34, ease: 'power1.in' }, 0)
        .to(q('.proj-ledger-flash'), { autoAlpha: 0, xPercent: 135, duration: 0.56, ease: 'power1.out' }, 0.34)
      // 2 · hero stat — label, then the huge number rolls (left-first), then story
        .to(q('.ledger-hero-label'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15)
        .to(q('.ledger-hero-num'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.2)
        .add(roll('.ledger-hero .odo-reel', { duration: 1.2, ease: 'power3.out', stagger: 0.09 }), 0.25)
        .to(q('.ledger-hero-story'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.55)
      // 3 · the quiet rows cascade in (~60ms apart); each number rolls as it lands.
      //     clearProps hands rows back to CSS so the :hover whisper works.
        .to(q('.ledger-row'), { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.6)
        .add(roll('.ledger-row .odo-reel', { duration: 0.8, ease: 'power2.out', stagger: 0.05 }), 0.66)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="projects" ref={root} data-theme="dark" className="proj" aria-labelledby="proj-title">
      <div className="proj-map" aria-hidden="true">
        <img className="proj-map-img" src="/qfp/worldmap-dots.webp" alt="" loading="lazy" decoding="async" />
        {PULSES.map((p, i) => (
          <span key={i} className="proj-pulse" style={{ left: p.left, top: p.top, animationDelay: `${p.d}s` }} />
        ))}
      </div>

      <div className="proj-inner">
        <div className="proj-top">
          <div className="proj-head">
            <p className="proj-eyebrow proj-eyebrow-script">{t('eyebrow')}</p>
            <h2 id="proj-title" className="proj-title">
              <span className="proj-line">
                {words(t('titleA')).map((w, i) => <span key={`a${i}`} className="pw pw-light">{w}</span>)}
              </span>
              <span className="proj-line proj-line-gold">
                {words(t('titleB')).map((w, i) => <span key={`b${i}`} className="pw pw-bold">{w}</span>)}
              </span>
            </h2>
            <p className="proj-sub">{t('sub')}</p>
          </div>
          <Globe reduced={reduced} />
        </div>

        <div className="proj-regions">
          {REGIONS.map((r) => <RegionCard key={r.slug} slug={r.slug} t={t} />)}
        </div>

        <div className="proj-ledger" ref={ledger}>
          <span className="proj-ledger-flash" aria-hidden="true" />

          <div className="ledger-hero">
            <p className="ledger-hero-label">{t('ledger.heroLabel')}</p>
            <div className="ledger-hero-num">
              <Odometer value={HERO.value} suffix={HERO.suffix} reduced={reduced} />
            </div>
            <p className="ledger-hero-story">
              <Trans t={t} i18nKey={HERO.storyKey} components={{ strong: <strong /> }} />
            </p>
          </div>

          <div className="proj-ledger-rows">
            {rows.map((r) => (
              <div className="ledger-row" key={r.key}>
                <span className="ledger-name">{t(`ledger.rows.${r.key}.name`)}</span>
                <span className="ledger-num">
                  <Odometer value={r.num} suffix="M+" reduced={reduced} />
                  <span className="ledger-unit">{t(`ledger.units.${r.unitKey}`)}</span>
                </span>
                <span className="ledger-desc">{t(`ledger.rows.${r.key}.desc`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
