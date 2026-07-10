import { useId } from 'react'

// SectionCurve — the site's signature curved section transition, extracted from
// the homepage (Marquee's navy landing curve) into a reusable divider. Drop it as
// the first (position="top") or last (position="bottom") child of a `position:
// relative` section; `fill` is the colour of the section this curve transitions
// INTO (its own light section, or the light neighbour it sweeps toward), so the
// curve always matches that surface and never reads as an orphan tonal band.
// A soft navy-tinted shadow rides the curve edge (2.7 elevation language) so it
// reads as a layered paper lip rather than a flat SVG. The homepage does NOT use
// this component (its dome/landing curves are bespoke CSS) — changes here are
// inner-page only and leave Home byte-identical. Purely decorative (aria-hidden).
export default function SectionCurve({ position = 'top', fill = '#FDFAF4', height = 68, hairline, className = '' }) {
  const top = position === 'top'
  // unique id per instance so the blur <filter> never collides across curves
  const sid = `sc-${useId().replace(/[^a-z0-9]/gi, '')}`
  // Convex edge: the middle bulges past the flat baseline toward the neighbour.
  // top: baseline at y=44, control points overshoot to y=-6 (bulge up), fill below.
  // bottom: mirrored (baseline y=76, control points to y=126, fill above).
  const path = top
    ? 'M0,120 L0,44 C360,-6 1080,-6 1440,44 L1440,120 Z'
    : 'M0,0 L0,76 C360,126 1080,126 1440,76 L1440,0 Z'
  const line = top ? 'M0,44 C360,-6 1080,-6 1440,44' : 'M0,76 C360,126 1080,126 1440,76'
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-[1] w-full ${top ? 'top-0 -translate-y-[1px]' : 'bottom-0 translate-y-[1px]'} ${className}`}
      style={{ height, color: fill }}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={sid} x="-2%" y="-60%" width="104%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <path d={path} fill="currentColor" />
      {/* grounded edge shadow — navy-tinted soft lip along the curve. The spill on
          the neighbour side is clipped by the section's overflow, leaving a one-
          sided shadow that grounds the paper edge (drawn over the fill so it reads
          on light surfaces). */}
      <path d={line} fill="none" stroke="rgba(15,36,68,0.22)" strokeWidth="3.4" filter={`url(#${sid})`} />
      {hairline && <path d={line} fill="none" stroke={hairline} strokeWidth="1.5" />}
    </svg>
  )
}
