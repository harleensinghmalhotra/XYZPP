import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES, SHOW_RESTRICTED_CLIENTS } from '@/lib/compliance'
import Globe3D from '@/components/Globe3D'

gsap.registerPlugin(ScrollTrigger)

// ── Global Projects — the globe on its stage ─────────────────────────────────
// The realistic Earth (react-globe.gl, see Globe3D) is the jewel; everything
// around it was rebuilt for the revamp:
//   • THE STAGE — deep near-black velvet, a sparse static star field and a warm
//     gold backlight halo (the dotted world-map behind the globe is GONE).
//   • DESTINATION PANELS — three tall duotone region posters (airline energy);
//     hovering one swings the globe to face that region + brightens its arcs.
//   • SHIPMENT RECORDS — the old excel-ledger is now a rail of passport-stamped
//     shipment cards; hovering one pulses that country's arc/marker on the globe.
// Reduced-motion → static globe, no reveals, no globe reactions. GPU-only.

// HDFC + ZEE rows carry the same client-permission flag as the trust strips, so
// the gate is the CENTRAL one from src/lib/compliance.js (not a local const —
// that leaked `true` in the last revamp and shipped restricted names). A
// `?hideRestricted` URL param also forces them off for preview/QA.

// Destination posters — text resolved from the homeProjects namespace by slug.
// `slug` also names the Globe3D focus region (africa | asia | europe). `img` is
// the clean school-kids photo (public/qfp/destinations/, no duotone filter).
const REGIONS = [
  { slug: 'africa', img: '/qfp/destinations/africa-1.jpg' },
  { slug: 'asia', img: '/qfp/destinations/asia-2.jpg' },
  { slug: 'europe', img: '/qfp/destinations/europe-2.jpg' },
]

// The featured milestone (loud) + seven shipment records (quiet). The featured
// story names a government body; when SHOW_MINISTRY_NAMES is off it falls back to
// a neutral national-programme phrasing (same card, no hole).
const HERO = {
  value: '10',
  suffix: 'M+',
  storyKey: SHOW_MINISTRY_NAMES ? 'ledger.heroStory' : 'ledger.heroStoryFallback',
  globeTarget: 'Tanzania',
}
// `ministry: true` rows carry government / ministry / programme names gated behind
// SHOW_MINISTRY_NAMES; `restricted: true` rows carry commercial client names gated
// behind SHOW_RESTRICTED_CLIENTS. Either gate filters its rows out cleanly.
// `key` → stable i18n key (name/desc); `unitKey` → unit label key; `globeTarget`
// → the Globe3D marker/arc this record pulses ('__HQ' for the India-side rows).
const LEDGER = [
  { key: 'nigeria', num: '8', unitKey: 'books', ministry: true, globeTarget: 'Nigeria' },
  { key: 'cotedivoire', num: '4', unitKey: 'books', ministry: true, globeTarget: 'Côte d’Ivoire' },
  { key: 'drcongo', num: '3.5', unitKey: 'books', ministry: true, globeTarget: 'DR Congo' },
  { key: 'usaidghana', num: '2', unitKey: 'books', ministry: true, globeTarget: 'Ghana' },
  { key: 'maharashtra', num: '1.5', unitKey: 'books', ministry: true, globeTarget: '__HQ' },
  { key: 'hdfc', num: '1.3', unitKey: 'books', restricted: true, globeTarget: '__HQ' },
  { key: 'zee', num: '0.5', unitKey: 'kits', restricted: true, globeTarget: '__HQ' },
]

// two stacked 0–9 sets → the reel does one full loop then locks on the target,
// which reads as a satisfying vertical "roll". yPercent (not px) so the lock
// survives font-size changes from the clamp()/vw number sizing.
const REEL_CELLS = Array.from({ length: 20 }, (_, i) => i % 10)

const words = (s) => s.split(' ')

// Deterministic sparse star field (seeded → stable across renders, no hydration
// flicker). ~64 tiny dots; ~40% barely twinkle (opacity only; killed under RM).
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const STARS = (() => {
  const r = mulberry32(0x134af7)
  return Array.from({ length: 64 }, () => ({
    left: +(r() * 100).toFixed(2),
    top: +(r() * 100).toFixed(2),
    s: +(0.8 + r() * 1.6).toFixed(2),
    o: +(0.22 + r() * 0.55).toFixed(2),
    tw: r() < 0.42,
    d: +(r() * 6).toFixed(2),
  }))
})()

// ── Destination poster — clean school-kids photo (no duotone filter) framed by a
// brand gold→navy glow-border. A bottom-up navy scrim is the ONLY tint, and it
// only sits behind the label/stat zone so faces stay natural. Hovering (or
// focusing) it swings the globe to face the region and brightens the glow.
// href="#" for now — per-region pages are built later, per client.
function DestPanel({ slug, img, t, onFocus, onReset }) {
  const name = t(`regions.${slug}.name`)
  const stat = t(`regions.${slug}.stat`)
  const statLabel = t(`regions.${slug}.statLabel`)
  return (
    // TODO(region-pages): point href to the per-region destination page once the
    // client scopes+approves them; keep the globe-focus + stat as the poster.
    // The glow lives on ::before/::after of .proj-dest (outside .proj-dest-frame,
    // which owns overflow:hidden so only the photo zoom is clipped, not the glow).
    <a
      className="proj-dest"
      href="#"
      data-region={slug}
      aria-label={`${name} — ${stat} ${statLabel}`}
      onClick={(e) => e.preventDefault()}
      onMouseEnter={onFocus}
      onMouseLeave={onReset}
      onFocus={onFocus}
      onBlur={onReset}
    >
      <div className="proj-dest-frame">
        <div className="proj-dest-media" aria-hidden="true">
          <div className="proj-dest-base" />
          <img
            className="proj-dest-photo"
            src={img}
            alt={t(`regions.${slug}.alt`)}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="proj-dest-scrim" aria-hidden="true" />
        <div className="proj-dest-content">
          <span className="proj-dest-kicker">{t(`regions.${slug}.descriptor`)}</span>
          <h3 className="proj-dest-name">{name}</h3>
          <div className="proj-dest-stat">
            <span className="proj-dest-stat-num">{stat}</span>
            <span className="proj-dest-stat-label">{statLabel}</span>
          </div>
        </div>
        <span className="proj-dest-go" aria-hidden="true">→</span>
      </div>
    </a>
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

// One shipment record — printed-label / passport-stamp card. Country in DM Mono
// caps, the big figure in gold, one human line (unit · authority). Hovering it
// pulses that country's arc/marker on the globe.
function RecordCard({ country, unit, story, line, stamp, num, suffix, reduced, featured, onPulse, onReset }) {
  return (
    <article
      className={`proj-rec${featured ? ' is-featured' : ''}`}
      onMouseEnter={onPulse}
      onMouseLeave={onReset}
    >
      <span className="proj-rec-perf" aria-hidden="true" />
      <span className="proj-rec-stamp" aria-hidden="true">{stamp}</span>
      <span className="proj-rec-country">{country}</span>
      <span className="proj-rec-num">
        <Odometer value={num} suffix={suffix} reduced={reduced} />
        <span className="proj-rec-unit">{unit}</span>
      </span>
      {story ? <p className="proj-rec-line">{story}</p> : <p className="proj-rec-line">{line}</p>}
    </article>
  )
}

export default function Projects() {
  const { t } = useTranslation('homeProjects')
  const root = useRef(null)
  const recordsRef = useRef(null)
  const globe = useRef(null)
  const [reduced] = useState(prefersReduced)

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const hideParam = !!params && params.has('hideRestricted')
  const showRestricted = SHOW_RESTRICTED_CLIENTS && !hideParam
  // A/B glow tuning — `?glow=olive` swaps the navy leg for olive so both can be
  // screenshotted side-by-side. Default (and the shipped pick) is navy.
  const glowVariant = params?.get('glow') === 'olive' ? 'olive' : 'navy'
  const rows = LEDGER.filter(
    (r) => (SHOW_MINISTRY_NAMES || !r.ministry) && (showRestricted || !r.restricted),
  )

  const stars = useMemo(() => STARS, [])

  // globe-conversation handlers (no-op targets when reduced → Globe3D guards it)
  const focusRegion = (slug) => globe.current?.focusRegion(slug)
  const pulse = (target) => globe.current?.pulseCountry(target)
  const releaseGlobe = () => globe.current?.reset()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      // top block entrance
      gsap.set(q('.proj-eyebrow'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.pw'), { autoAlpha: 0, yPercent: 80, filter: 'blur(8px)' })
      gsap.set(q('.proj-sub'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.proj-globe'), { autoAlpha: 0, scale: 0.92 })
      gsap.set(q('.proj-dests-eyebrow'), { autoAlpha: 0, y: 12 })
      gsap.set(q('.proj-dest'), { autoAlpha: 0, y: 26 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 74%', once: true } })
      tl.to(q('.proj-head .proj-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.pw'), { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.055, ease: 'power3.out' }, 0.1)
        .to(q('.proj-globe'), { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out', clearProps: 'transform' }, 0.15)
        .to(q('.proj-sub'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '>-0.5')
        .to(q('.proj-dests-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>-0.2')
        .to(q('.proj-dest'), { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, '>-0.3')

      // shipment records — own trigger so they fire as the rail enters.
      const roll = (sel, vars) =>
        gsap.fromTo(q(sel), { yPercent: 0 },
          { yPercent: (i, el) => -(10 + Number(el.dataset.d)) * 5, ...vars })

      gsap.set(q('.proj-records-eyebrow'), { autoAlpha: 0, y: 12 })
      gsap.set(q('.proj-rec'), { autoAlpha: 0, y: 22 })

      const tl2 = gsap.timeline({ scrollTrigger: { trigger: recordsRef.current, start: 'top 80%', once: true } })
      tl2.to(q('.proj-records-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.proj-rec'), { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.05)
        .add(roll('.proj-rec .odo-reel', { duration: 1.0, ease: 'power3.out', stagger: 0.04 }), 0.18)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="projects" ref={root} data-theme="dark" className="proj" aria-labelledby="proj-title">
      {/* THE STAGE — near-black velvet, sparse stars, gold backlight (on the globe) */}
      <div className="proj-stage" aria-hidden="true">
        <div className="proj-stars">
          {stars.map((st, i) => (
            <span
              key={i}
              className={`proj-star${st.tw ? ' is-tw' : ''}`}
              style={{
                left: `${st.left}%`,
                top: `${st.top}%`,
                width: `${st.s}px`,
                height: `${st.s}px`,
                opacity: st.o,
                animationDelay: `${st.d}s`,
              }}
            />
          ))}
        </div>
        <div className="proj-vignette" />
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
          <Globe3D ref={globe} reduced={reduced} />
        </div>

        {/* DESTINATION PANELS */}
        <div className="proj-dests" data-glow={glowVariant}>
          <p className="proj-dests-eyebrow">{t('destinationsEyebrow')}</p>
          <div className="proj-dests-grid">
            {REGIONS.map((r) => (
              <DestPanel
                key={r.slug}
                slug={r.slug}
                img={r.img}
                t={t}
                onFocus={() => focusRegion(r.slug)}
                onReset={releaseGlobe}
              />
            ))}
          </div>
        </div>

        {/* SHIPMENT RECORDS */}
        <div className="proj-records" ref={recordsRef}>
          <p className="proj-records-eyebrow">{t('ledger.recordsEyebrow')}</p>
          <div className="proj-records-rail">
            <RecordCard
              featured
              country={t('ledger.heroCountry')}
              unit={t('ledger.units.books')}
              stamp={t('ledger.heroLabel')}
              num={HERO.value}
              suffix={HERO.suffix}
              reduced={reduced}
              story={<Trans t={t} i18nKey={HERO.storyKey} components={{ strong: <strong /> }} />}
              onPulse={() => pulse(HERO.globeTarget)}
              onReset={releaseGlobe}
            />
            {rows.map((r) => (
              <RecordCard
                key={r.key}
                country={t(`ledger.rows.${r.key}.name`)}
                unit={t(`ledger.units.${r.unitKey}`)}
                stamp={t(`ledger.units.${r.unitKey}`)}
                num={r.num}
                suffix="M+"
                reduced={reduced}
                line={t(`ledger.rows.${r.key}.desc`)}
                onPulse={() => pulse(r.globeTarget)}
                onReset={releaseGlobe}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
