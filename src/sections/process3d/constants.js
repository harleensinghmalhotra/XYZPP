// EKTA palette (from recon/EKTA-DESIGN-DNA.md) — HER colours, not our old System B
// gold/navy. Navy authority, gold prestige accent, cream paper, olive eco note.
export const EKTA = {
  cream: '#FDFAF4',
  cream2: '#F0EBE0',
  paper: '#FBF7EE', // page/paper white (4th-cream family)
  navy: '#0F2444',
  navy2: '#1B3A6B',
  gold: '#9B7420',
  gold2: '#C89A3C',
  olive: '#6B7A2A',
  ink: '#1C2019',
  kraft: '#C6A971', // cardboard tone (kraft) — reads as shipping box
  kraftDark: '#A98A54',
}

// Stage keys are LAW — reused verbatim from the existing Process section so the
// same homeProcess.json locale copy drives both. Names/desc resolve via
// t(`stages.${key}.name|desc`). `state` is the book's visual transformation as it
// arrives at that station; `variant` picks the station's distinctive structure.
export const STATIONS = [
  { key: 'print', state: 'pages', variant: 'gate', accent: 'gold' },
  { key: 'quality', state: 'bound', variant: 'arch', accent: 'gold' },
  { key: 'fulfillment', state: 'wrapped', variant: 'machine', accent: 'olive' },
  { key: 'warehouse', state: 'boxed', variant: 'gate', accent: 'gold' },
  { key: 'ship', state: 'sealed', variant: 'arch', accent: 'gold' },
  { key: 'covered', state: 'covered', variant: 'machine', accent: 'olive' },
]

export const N = STATIONS.length

// Straight belt running left→right along X. Book rides the top surface at y≈0.
export const BELT = { length: 27, width: 3.2, y: 0, x0: -11, x1: 11 }

// Evenly-spaced station X positions across the working span of the belt.
export const stationX = (i) => BELT.x0 + ((BELT.x1 - BELT.x0) * i) / (N - 1)

export const BEAM_TOP = 3.15 // y of the station cross-beam
export const LABEL_Y = 3.95 // y of the floating label plate

// ── Round-2 choreography maths ────────────────────────────────────────────
// Everything downstream is driven by ONE continuous value: `activeF` = scroll
// progress mapped to [0 .. N-1] (station index space). The book TRANSFORMS as it
// travels the segment approaching each station, completing just before arrival —
// so the transform reads as the station "doing the work" to the passing book.

// Hermite smoothstep — the workhorse ease for every scrubbed transform.
export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
// Symmetric bell centred at `c`, ~zero beyond ±w. For arrival pulses / sweeps.
export const bell = (x, c, w) => {
  const d = Math.min(1, Math.abs(x - c) / w)
  return (1 - d) * (1 - d) * (3 - 2 * (1 - d)) // smoothstep of (1-d)
}
export const lerp = (a, b, t) => a + (b - a) * t

// Transform k (1..N-1) runs over the last ~55% of the segment before station k,
// finishing ~5% shy of arrival. smooth() saturates, so it stays 1 afterwards.
export const transform = (k, activeF) => smooth(k - 1 + 0.42, k - 0.05, activeF)

// Camera rest pose — a pulled-back 3/4 "watching the line" rig (R3): far enough
// that the travelling book + 2-3 stations stay in frame at all times, elevated so
// the viewer observes the production line rather than standing inside it. `side`
// offsets the camera off the belt axis so a near pillar never bisects the book.
// The book is scaled up (Book.jsx) so it still reads as the hero at this distance.
export const CAM = { y: 3.85, z: 10.2, side: 3.4, lookY: 1.4, drift: 0.32, ease: 0.07, fov: 42 }
