// The spinning "QFP STORIES" gold-foil seal from the hero, extracted for reuse.
// Slow 60s rotation (seal-spin keyframe lives in index.css), gold foil on navy.
// IDs are namespaced so it can coexist with the hero's inline seal on the homepage.
export default function QfpSeal({ size = 72, className = '', title = 'Quarterfold Printabilities seal', style = {} }) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={`select-none ${className}`}
      style={{ width: size, height: size, animation: 'seal-spin 60s linear infinite', filter: 'drop-shadow(0 0 5px rgba(200,154,60,0.55))', ...style }}
    >
      <defs>
        <path id="qfp-seal-shared-path" fill="none" d="M 60,60 m 0,-46 a 46,46 0 1,1 0,92 a 46,46 0 1,1 0,-92" />
        <linearGradient id="qfp-seal-shared-foil" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#fbeec2" />
          <stop offset="0.5" stopColor="#d8a94a" />
          <stop offset="1" stopColor="#9b7420" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="url(#qfp-seal-shared-foil)" strokeWidth="2" />
      <circle cx="60" cy="60" r="35" fill="none" stroke="url(#qfp-seal-shared-foil)" strokeWidth="1" opacity="0.55" />
      <text fill="url(#qfp-seal-shared-foil)" fontFamily="'DM Mono', monospace" fontWeight="500" fontSize="11" letterSpacing="1.5">
        <textPath href="#qfp-seal-shared-path" startOffset="0" textLength="289" lengthAdjust="spacing">
          QFP STORIES · QFP STORIES · QFP STORIES ·
        </textPath>
      </text>
      <circle cx="60" cy="60" r="3" fill="url(#qfp-seal-shared-foil)" />
    </svg>
  )
}
