import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CountUp from '@/components/CountUp'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES, SHOW_RESTRICTED_CLIENTS } from '@/lib/compliance'

// ── Trust strips (sits directly below the hero's book landing) ──────────────
// Content ported verbatim from the client's vibe-coded homepage v17
// (COUNTRIES STRIP + institutions row + STATS BAR). Text, order and icons are
// law — not reworded, trimmed or reordered. Only the presentation is elevated.
//
// The STATS bar was extracted (client reorder) into the `HomeStats` export at the
// foot of this file, so the homepage can drop it BELOW the mission band on its own.
// TrustStrips itself keeps only its two marquees, in place.

// Strip 1 — 27 countries (Ekta's authoritative list), exact source order. Drifts
// LEFT (~42s).
// Display text is resolved via t(`countries.${key}`); keys are stable, order is law.
const COUNTRIES = [
  'india', 'nigeria', 'ghana', 'kenya', 'uganda', 'tanzania', 'zambia',
  'cotedivoire', 'cameroon', 'congo', 'senegal', 'benin', 'ethiopia',
  'rwanda', 'mozambique', 'zimbabwe', 'madagascar', 'mauritius', 'southafrica', 'gabon',
  'mexico', 'usa', 'puertorico', 'germany', 'unitedkingdom', 'spain', 'uae',
]

// Strip 2 — institutions, exact source order + exact per-item icon. Drifts RIGHT (~38s).
// `ministry: true` marks government / ministry / programme names gated behind
// SHOW_MINISTRY_NAMES; `restricted: true` marks named commercial clients (HDFC,
// ZEE Learn / Kidzee, Reliance) gated behind SHOW_RESTRICTED_CLIENTS — permission
// pending, so those stay OUT of the DOM by default. Both filter out cleanly with
// no layout hole. Labels resolve via t(`institutions.${idx}`); some labels
// repeat, so each item carries its source index as a stable key.
const INSTITUTIONS_ALL = [
  { icon: 'layers', ministry: true },
  { icon: 'pin', ministry: true },
  { icon: 'globe', ministry: true },
  { icon: 'monitor', ministry: true },
  { icon: 'bank', ministry: true },
  { icon: 'monitor', ministry: true },
  { icon: 'pin', restricted: true }, // HDFC Bank Ltd
  { icon: 'globe', restricted: true }, // ZEE Learn / Kidzee
  { icon: 'bank', restricted: true }, // Reliance Industries
  { icon: 'pin', ministry: true },
  { icon: 'globe', ministry: true },
  { icon: 'monitor', ministry: true },
  // Programmes wired into the name-only ticker (no delivery figure needed here).
  { icon: 'layers', ministry: true }, // NCERT
  { icon: 'pin', ministry: true }, // PNAPAS
  { icon: 'globe', ministry: true }, // Sarva Shiksha Abhiyan
  { icon: 'monitor', ministry: true }, // CSR Projects
  { icon: 'bank', ministry: true }, // Ministry of Mozambique
].map((it, idx) => ({ ...it, idx }))
const INSTITUTIONS = INSTITUTIONS_ALL.filter(
  (it) => (SHOW_MINISTRY_NAMES || !it.ministry) && (SHOW_RESTRICTED_CLIENTS || !it.restricted),
)

// Strip 3 — four stats, numeric values are law; text is resolved via
// t(`stats.${key}.label|accent|sr`). Count-up on first view. Ekta's gold-numeral
// treatment; her dated flat-outline SVG icons and the straight gray column
// dividers were retired per Harry's bar. Each metric is anchored by one of
// Harry's custom navy/gold 3D clay renders, cut to true alpha (see
// scripts/cutout-strip-icons.mjs → /qfp/icons3d/stat-*.webp).
// Four canonical stats — numerals match the corrected locale copy (9cccb0d):
// 75 million books printed every year · 25+ countries · 800+ containers · 98% on-time.
const STATS = [
  { key: 'books', value: 75, suffix: 'M', img: 'stat-book' },
  { key: 'countries', value: 25, suffix: '+', img: 'stat-globe' },
  { key: 'containers', value: 800, suffix: '+', img: 'stat-box' },
  { key: 'ontime', value: 98, suffix: '%', accent: true, img: 'stat-clock' },
]

// Institution icons — ported from source, gold stroke, uniform 1.6 (set in CSS).
function InstIcon({ type }) {
  const p = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' }
  switch (type) {
    case 'layers':
      return <svg {...p}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    case 'pin':
      return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    case 'globe':
      return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
    case 'monitor':
      return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
    case 'bank':
      return <svg {...p}><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" /></svg>
    default:
      return null
  }
}

// One sequence of a marquee track. Duplicated once (aria-hidden) for a seamless
// -50% loop; the base copy stays in the a11y tree, the clone is hidden.
function CountrySeq({ clone, t }) {
  return (
    <div className="ts-seq" aria-hidden={clone || undefined}>
      {COUNTRIES.map((c, i) => (
        <span key={i} className="ts-country">{t(`countries.${c}`)}</span>
      ))}
    </div>
  )
}

function InstSeq({ clone, t }) {
  return (
    <div className="ts-seq" aria-hidden={clone || undefined}>
      {INSTITUTIONS.map((it, i) => (
        <span key={i} className="ts-inst"><span className="ts-inst-ico"><InstIcon type={it.icon} /></span>{t(`institutions.${it.idx}`)}</span>
      ))}
    </div>
  )
}

export default function TrustStrips() {
  const { t } = useTranslation('homeTrust')
  const reduced = useReducedMotion()
  const track1 = useRef(null)
  const track2 = useRef(null)

  useEffect(() => {
    if (reduced) return
    const nodes = [track1.current, track2.current].filter(Boolean)
    if (!nodes.length) return

    // GPU-composited transform loops via WAAPI (off the main thread, no React
    // state per frame). Strip 1 drifts left, strip 2 drifts right.
    // Ticker speed dialed ~40% slower per client (countries + institutions/projects
    // marquees): 30s → 42s and 38s → 53.2s. Hover-pause + reduced-motion unchanged.
    const a1 = track1.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 42000, iterations: Infinity, easing: 'linear' },
    )
    const a2 = track2.current.animate(
      [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }],
      { duration: 53200, iterations: Infinity, easing: 'linear' },
    )

    // Eased hover-pause: ramp playbackRate 1↔0 over 300ms (cubic-out) so the
    // stop and restart feel decelerated, never snapped. Hover devices only.
    const cleanups = []
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (canHover) {
      const bind = (host, anim) => {
        if (!host || !anim) return
        let raf = 0
        const ramp = (to) => {
          cancelAnimationFrame(raf)
          const from = anim.playbackRate
          const t0 = performance.now()
          const step = (now) => {
            const p = Math.min(1, (now - t0) / 300)
            const eased = 1 - Math.pow(1 - p, 3)
            anim.playbackRate = from + (to - from) * eased
            if (p < 1) raf = requestAnimationFrame(step)
          }
          raf = requestAnimationFrame(step)
        }
        const enter = () => ramp(0)
        const leave = () => ramp(1)
        host.addEventListener('pointerenter', enter)
        host.addEventListener('pointerleave', leave)
        cleanups.push(() => {
          cancelAnimationFrame(raf)
          host.removeEventListener('pointerenter', enter)
          host.removeEventListener('pointerleave', leave)
        })
      }
      bind(track1.current.parentElement, a1)
      bind(track2.current.parentElement, a2)
    }

    return () => {
      a1.cancel()
      a2.cancel()
      cleanups.forEach((fn) => fn())
    }
  }, [reduced])

  const scrollStyle = reduced ? { overflowX: 'auto' } : undefined

  return (
    <section id="trust" aria-labelledby="trust-heading" className="ts-band">
      <h2 id="trust-heading" className="sr-only">
        {t('sectionHeading')}
      </h2>

      {/* Marquees */}
      <div className="ts-wrap">
        <div className="ts-row ts-row--countries">
          <h3 className="sr-only">{t('countriesHeading')}</h3>
          <div className="ts-scroll" style={scrollStyle}>
            <div className="ts-track" ref={track1}>
              <CountrySeq t={t} />
              {!reduced && <CountrySeq clone t={t} />}
            </div>
          </div>
        </div>

        <div className="ts-row ts-row--inst">
          <h3 className="sr-only">{t('institutionsHeading')}</h3>
          <div className="ts-scroll" style={scrollStyle}>
            <div className="ts-track" ref={track2}>
              <InstSeq t={t} />
              {!reduced && <InstSeq clone t={t} />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── HomeStats — the four-metric bar, extracted so the homepage can place it as its
// own standalone block BELOW the mission band (client reorder). Same markup, same
// CountUp, same IntersectionObserver reveal, same numbers — only its home moved.
// Wrapped in a labelled <section> so it is a named landmark on its own.
export function HomeStats() {
  const { t } = useTranslation('homeTrust')
  const reduced = useReducedMotion()
  const statsRef = useRef(null)
  const [statsIn, setStatsIn] = useState(false)

  // Subtle staggered fade-up when the stats grid scrolls into view. Instant
  // (no transform) under reduced-motion; the number count-up is CountUp's own.
  useEffect(() => {
    if (reduced) {
      setStatsIn(true)
      return
    }
    const el = statsRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsIn(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <section className="ts-stats" aria-labelledby="stats-heading">
      <h2 id="stats-heading" className="sr-only">{t('statsHeading')}</h2>
      <ul className={`ts-stats-grid${statsIn ? ' is-in' : ''}`} ref={statsRef}>
        {STATS.map((s) => (
          <li key={s.key} className="ts-stat">
            <span className="sr-only">{t(`stats.${s.key}.sr`)}</span>
            <div aria-hidden="true">
              <span className="ts-stat-fig">
                <img
                  className="ts-stat-ico3d"
                  src={`/qfp/icons3d/${s.img}.webp`}
                  alt=""
                  width="84"
                  height="84"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <div className="ts-stat-num">
                <CountUp value={s.value} suffix={s.suffix} grouping={false} duration={1200} />
                {s.accent && <span className="ts-stat-accent">{t(`stats.${s.key}.accent`)}</span>}
              </div>
              <div className="ts-stat-lbl">{t(`stats.${s.key}.label`)}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
