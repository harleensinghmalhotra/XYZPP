// SectionCurve — the site's signature curved section transition, extracted from
// the homepage (Marquee's navy landing curve) into a reusable divider. Drop it as
// the first (position="top") or last (position="bottom") child of a `position:
// relative` section; `fill` is that section's own background colour, so the curve
// sweeps this section's tone up/down into the neighbour, replacing a flat straight
// tonal edge. Purely decorative (aria-hidden), no layout cost, no animation.
export default function SectionCurve({ position = 'top', fill = '#FDFAF4', height = 68, hairline, className = '' }) {
  const top = position === 'top'
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
      <path d={path} fill="currentColor" />
      {hairline && <path d={line} fill="none" stroke={hairline} strokeWidth="1.5" />}
    </svg>
  )
}
