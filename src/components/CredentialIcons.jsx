// 4 bespoke credential icons with thin strokes, gold color, consistent optical weight

const GOLD = '#F37031'
const GOLD_HOVER = '#D4931F'
const STROKE_WIDTH = 1.5

export function CertificateIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={GOLD} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200 group-hover:stroke-[#D4931F]">
      {/* Seal/badge shape */}
      <circle cx="16" cy="14" r="9" />
      {/* Ribbon left */}
      <path d="M 10 22 Q 8 24 7 28" />
      {/* Ribbon right */}
      <path d="M 22 22 Q 24 24 25 28" />
      {/* Checkmark inside seal */}
      <path d="M 13 14 L 15 16 L 20 11" />
    </svg>
  )
}

export function PenNibIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={GOLD} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200 group-hover:stroke-[#D4931F]">
      {/* Pen nib */}
      <path d="M 8 8 L 16 24 L 20 18 L 24 24 L 24 8 Q 20 6 16 6 Q 12 6 8 8" />
      {/* Text lines */}
      <line x1="10" y1="12" x2="22" y2="12" />
      <line x1="10" y1="16" x2="18" y2="16" />
    </svg>
  )
}

export function PrinterIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={GOLD} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200 group-hover:stroke-[#D4931F]">
      {/* Layered sheets */}
      <rect x="6" y="6" width="14" height="10" />
      <path d="M 8 12 L 20 12" />
      <rect x="5" y="15" width="14" height="10" />
      <path d="M 7 21 L 19 21" />
      <rect x="4" y="24" width="14" height="1" />
      {/* Pressure cylinder appearance */}
      <circle cx="24" cy="15" r="4" />
      <line x1="24" y1="11" x2="24" y2="19" />
    </svg>
  )
}

export function HeadsetIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke={GOLD} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-200 group-hover:stroke-[#D4931F]">
      {/* Headband */}
      <path d="M 8 18 Q 8 10 16 10 Q 24 10 24 18" />
      {/* Left ear cup */}
      <circle cx="8" cy="20" r="3" />
      {/* Right ear cup */}
      <circle cx="24" cy="20" r="3" />
      {/* Microphone boom */}
      <path d="M 8 23 L 6 26" />
      {/* Mic capsule */}
      <circle cx="6" cy="27" r="1.5" />
      {/* Optional: person orbit/halo for "account manager" */}
      <circle cx="16" cy="11" r="5" opacity="0.4" />
    </svg>
  )
}
