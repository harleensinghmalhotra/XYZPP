import { useEffect, useRef } from 'react'
import CountUp from '@/components/CountUp'
import { useReducedMotion } from '@/lib/useReducedMotion'

// ── Trust strips (sits directly below the hero's book landing) ──────────────
// Content ported verbatim from the client's vibe-coded homepage v17
// (COUNTRIES STRIP + institutions row + STATS BAR). Text, order and icons are
// law — not reworded, trimmed or reordered. Only the presentation is elevated.

// Strip 1 — 26 countries, exact source order. Drifts LEFT (~30s).
const COUNTRIES = [
  'India', 'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'Zambia',
  "Côte d'Ivoire", 'Cameroon', 'Congo (DRC)', 'Senegal', 'Benin', 'Ethiopia',
  'Rwanda', 'Mozambique', 'Madagascar', 'Mauritius', 'South Africa', 'Gabon',
  'Mexico', 'USA', 'Puerto Rico', 'Germany', 'United Kingdom', 'Spain', 'UAE',
]

// Strip 2 — institutions, exact source order + exact per-item icon. Drifts RIGHT (~38s).
const INSTITUTIONS = [
  { label: 'World Bank-Funded Projects', icon: 'layers' },
  { label: 'USAID Programmes', icon: 'pin' },
  { label: 'UN AID Programmes', icon: 'globe' },
  { label: 'Government Ministry Tenders', icon: 'monitor' },
  { label: 'Tanzania Institute of Education', icon: 'bank' },
  { label: 'Maharashtra State Bureau', icon: 'monitor' },
  { label: 'HDFC Bank Ltd', icon: 'pin' },
  { label: 'ZEE Learn / Kidzee', icon: 'globe' },
  { label: 'Reliance Industries', icon: 'bank' },
  { label: 'World Bank-Funded Projects', icon: 'pin' },
  { label: 'USAID Programmes', icon: 'globe' },
  { label: 'Government Ministry Tenders', icon: 'monitor' },
]

// Strip 3 — four stats, exact source text + icons. Count-up on first view.
const STATS = [
  { icon: 'books', value: 400, suffix: 'M+', label: 'Books Delivered Since Inception', sr: '400M+ Books Delivered Since Inception' },
  { icon: 'globe40', value: 25, suffix: '+', label: 'Countries Across 4 Continents', sr: '25+ Countries Across 4 Continents' },
  { icon: 'truck', value: 1000, suffix: '+', label: 'Containers Shipped in 2024 to 25', sr: '1000+ Containers Shipped in 2024 to 25' },
  { icon: 'people', value: 98, suffix: '%', accent: 'On-Time', label: 'Delivery, Every Single Year', sr: '98% On-Time Delivery, Every Single Year' },
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

// Stat icons — ported from source, navy stroke.
function StatIcon({ type }) {
  const p = { viewBox: '0 0 40 40', 'aria-hidden': true, focusable: 'false' }
  switch (type) {
    case 'books':
      return <svg {...p}><rect x="6" y="4" width="22" height="32" rx="2" /><rect x="12" y="4" width="22" height="32" rx="2" /><line x1="16" y1="12" x2="26" y2="12" /><line x1="16" y1="16" x2="26" y2="16" /><line x1="16" y1="20" x2="22" y2="20" /></svg>
    case 'globe40':
      return <svg {...p}><circle cx="20" cy="20" r="15" /><path d="M5 20h30" /><path d="M20 5a25 25 0 0 1 7 15 25 25 0 0 1-7 15 25 25 0 0 1-7-15 25 25 0 0 1 7-15z" /></svg>
    case 'truck':
      return <svg {...p}><rect x="2" y="16" width="28" height="16" rx="2" /><path d="M30 24h5l3-6h-8" /><circle cx="10" cy="34" r="3" /><circle cx="24" cy="34" r="3" /><circle cx="35" cy="34" r="3" /><path d="M2 20V10l6-4h14l8 10" /></svg>
    case 'people':
      return <svg {...p}><circle cx="14" cy="12" r="5" /><circle cx="26" cy="12" r="5" /><path d="M4 32c0-5.5 4.5-10 10-10h12c5.5 0 10 4.5 10 10" /><path d="M20 12v8" /></svg>
    default:
      return null
  }
}

// One sequence of a marquee track. Duplicated once (aria-hidden) for a seamless
// -50% loop; the base copy stays in the a11y tree, the clone is hidden.
function CountrySeq({ clone }) {
  return (
    <div className="ts-seq" aria-hidden={clone || undefined}>
      {COUNTRIES.map((c, i) => (
        <span key={i} className="ts-country">{c}</span>
      ))}
    </div>
  )
}

function InstSeq({ clone }) {
  return (
    <div className="ts-seq" aria-hidden={clone || undefined}>
      {INSTITUTIONS.map((it, i) => (
        <span key={i} className="ts-inst"><span className="ts-inst-ico"><InstIcon type={it.icon} /></span>{it.label}</span>
      ))}
    </div>
  )
}

export default function TrustStrips() {
  const reduced = useReducedMotion()
  const track1 = useRef(null)
  const track2 = useRef(null)

  useEffect(() => {
    if (reduced) return
    const nodes = [track1.current, track2.current].filter(Boolean)
    if (!nodes.length) return

    // GPU-composited transform loops via WAAPI (off the main thread, no React
    // state per frame). Strip 1 drifts left, strip 2 drifts right.
    const a1 = track1.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 30000, iterations: Infinity, easing: 'linear' },
    )
    const a2 = track2.current.animate(
      [{ transform: 'translateX(-50%)' }, { transform: 'translateX(0)' }],
      { duration: 38000, iterations: Infinity, easing: 'linear' },
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
        Global reach, institutional partners and delivery record
      </h2>

      {/* Marquees */}
      <div className="ts-wrap">
        <div className="ts-row ts-row--countries">
          <h3 className="sr-only">Countries served</h3>
          <div className="ts-scroll" style={scrollStyle}>
            <div className="ts-track" ref={track1}>
              <CountrySeq />
              {!reduced && <CountrySeq clone />}
            </div>
          </div>
        </div>

        <div className="ts-row ts-row--inst">
          <h3 className="sr-only">Institutions and programmes served</h3>
          <div className="ts-scroll" style={scrollStyle}>
            <div className="ts-track" ref={track2}>
              <InstSeq />
              {!reduced && <InstSeq clone />}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="ts-stats">
        <ul className="ts-stats-grid">
          {STATS.map((s) => (
            <li key={s.sr} className="ts-stat">
              <span className="sr-only">{s.sr}</span>
              <div className="ts-stat-ico" aria-hidden="true"><StatIcon type={s.icon} /></div>
              <div aria-hidden="true">
                <div className="ts-stat-num">
                  <CountUp value={s.value} suffix={s.suffix} grouping={false} duration={1200} />
                  {s.accent && <span className="ts-stat-accent">{s.accent}</span>}
                </div>
                <div className="ts-stat-lbl">{s.label}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
