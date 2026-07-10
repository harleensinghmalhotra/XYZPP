import { useId } from 'react'

// SectionCurve — the site's signature curved section transition, extracted from
// the homepage (Marquee's navy landing curve) into a reusable divider. Drop it as
// the first (position="top") or last (position="bottom") child of a `position:
// relative` section.
//
// `fill` is the colour of the surface the curve reads as, and it must equal a real
// section background or a dark sliver leaks through the transparent side. Two modes:
//   • default  — THIS section sweeps out into its neighbour; fill = this section's
//                own bg (bulge points at the neighbour).
//   • inward   — the NEIGHBOUR sweeps into this section; fill = the neighbour's bg,
//                bulge points into this section. Used on DARK sections so a light
//                neighbour dips in and no navy band/sliver ever forms. This is how
//                every inner-page boundary stays beige/cream, never blue.
//
// A soft navy-tinted shadow rides the curve edge (2.7 elevation language) so it
// reads as a layered paper lip, not a flat SVG. The homepage does NOT use this
// component (its dome/landing curves are bespoke CSS), so changes here are inner-
// page only and leave Home byte-identical. Purely decorative (aria-hidden).
export default function SectionCurve({ position = 'top', fill = '#FDFAF4', height = 68, hairline, inward = false, className = '' }) {
  const top = position === 'top'
  // unique id per instance so the blur <filter> never collides across curves
  const sid = `sc-${useId().replace(/[^a-z0-9]/gi, '')}`
  // Baselines: the flat tonal edge. The bulge overshoots ±50 units past it — away
  // from this section (default) or into it (inward, mirrored). preserveAspectRatio
  // is none, so these viewBox units stretch to the section width.
  const path = top
    ? (inward
        ? 'M0,0 L0,44 C360,94 1080,94 1440,44 L1440,0 Z'      // neighbour dips DOWN into this section
        : 'M0,120 L0,44 C360,-6 1080,-6 1440,44 L1440,120 Z') // this section bulges UP into neighbour
    : (inward
        ? 'M0,120 L0,76 C360,26 1080,26 1440,76 L1440,120 Z'  // neighbour rises UP into this section
        : 'M0,0 L0,76 C360,126 1080,126 1440,76 L1440,0 Z')   // this section bulges DOWN into neighbour
  const line = top
    ? (inward ? 'M0,44 C360,94 1080,94 1440,44' : 'M0,44 C360,-6 1080,-6 1440,44')
    : (inward ? 'M0,76 C360,26 1080,26 1440,76' : 'M0,76 C360,126 1080,126 1440,76')
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
      {/* grounded edge shadow — soft navy-tinted lip along the curve. The spill on
          the neighbour side is clipped by the section's overflow, leaving a one-
          sided shadow that grounds the paper edge (drawn over the light fill). */}
      <path d={line} fill="none" stroke="rgba(15,36,68,0.22)" strokeWidth="3.4" filter={`url(#${sid})`} />
      {hairline && <path d={line} fill="none" stroke={hairline} strokeWidth="1.5" />}
    </svg>
  )
}
