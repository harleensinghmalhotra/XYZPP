// Print-craft primitives shared across sections: registration marks, mono
// labels, section index tags, and the CMYK calibration bar.

export function RegistrationMark({ size = 40, stroke = 1.25, className = '', color = 'currentColor' }) {
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true" fill="none">
      <circle cx={c} cy={c} r={c - stroke} stroke={color} strokeWidth={stroke} />
      <circle cx={c} cy={c} r={(c - stroke) * 0.42} stroke={color} strokeWidth={stroke} />
      <line x1={c} y1="0" x2={c} y2={size} stroke={color} strokeWidth={stroke} />
      <line x1="0" y1={c} x2={size} y2={c} stroke={color} strokeWidth={stroke} />
    </svg>
  )
}

export function Label({ children, className = '' }) {
  return <span className={`label ${className}`}>{children}</span>
}

// A section index marker: "03 / PRINT SCOPE" with a small reg mark.
export function SectionTag({ index, children, color = 'currentColor', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <RegistrationMark size={16} color={color} />
      <span className="label" style={{ color }}>
        {index} <span className="opacity-40">/</span> {children}
      </span>
    </div>
  )
}

// CMYK process calibration strip — the printer's signature.
export function CalibrationBar({ height = 16, withLabels = false }) {
  const steps = [
    { c: '#00AEEF', l: 'C' },
    { c: '#EC008C', l: 'M' },
    // CMYK process YELLOW ink — a technical print reference, not brand gold. Kept a
    // clean process yellow (not the amber it was) so it never reads as decorative gold.
    { c: '#FFED00', l: 'Y' },
    { c: '#16130F', l: 'K' },
    { c: '#8a8a8a', l: '50' },
    { c: '#c9c9c9', l: '25' },
    { c: '#F3EDE1', l: 'P' },
  ]
  return (
    <div className="w-full" aria-hidden="true">
      <div className="calibration-bar w-full" style={{ height }}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={{ background: s.c, boxShadow: i ? 'inset 1px 0 0 rgba(243,237,225,0.22)' : undefined }}
            className="relative"
          >
            {withLabels && (
              <span className="absolute inset-x-0 -bottom-5 text-center text-[11px] font-mono tracking-widest text-ink-400">
                {s.l}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
