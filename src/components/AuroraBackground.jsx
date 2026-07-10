import './AuroraBackground.css'

// ── AuroraBackground — the hero's Aceternity aurora, reused for ONE flagship dark
// moment elsewhere on the site (the site-wide CTA band). Same technique as the hero
// (layered transparent-gap gradient ribbons + a slow translateX drift, screen-lit
// over navy), NOT re-implemented — the gradient recipe and drift model are lifted
// verbatim from .hero-aurora and only dialled subtler (lower opacity, a calmer veil)
// so it reads as a quiet echo of the hero, never a second hero. Pure CSS, near-zero
// cost, reduced-motion → static gradient (drift frozen; see the CSS).
//
// It stays EXCLUSIVE to a single deployment by design: import once, place once.
export default function AuroraBackground({ className = '' }) {
  return (
    <div className={`sig-aurora ${className}`} aria-hidden="true">
      <div className="sig-aurora__ribbons" />
      <div className="sig-aurora__veil" />
    </div>
  )
}
