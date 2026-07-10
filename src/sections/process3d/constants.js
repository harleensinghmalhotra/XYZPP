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

// Stage keys are LAW — reused verbatim so the same homeProcess.json locale copy
// drives the plaque labels via t(`stages.${key}.name`). All six gates are the
// identical reference arch (ref MAIN); the book's transform per stage is derived
// from `activeF` in Book.jsx, and Quality alone carries the scanner (ref V2).
export const STATIONS = [
  { key: 'print' },
  { key: 'quality' },
  { key: 'fulfillment' },
  { key: 'warehouse' },
  { key: 'ship' },
  { key: 'covered' },
]

export const N = STATIONS.length

// Low-profile navy belt running left→right along X (ref MAIN/V1). Objects ride the
// top surface at y≈0; the bed sits just below with a visible side rail.
export const BELT = { length: 30, width: 1.55, y: 0, deck: 0.34, x0: -11, x1: 11 }

// Evenly-spaced station X positions across the working span of the belt.
export const stationX = (i) => BELT.x0 + ((BELT.x1 - BELT.x0) * i) / (N - 1)

// Slim rounded "∩" arch gate (ref V1): straight legs at ±half, a semicircle cap
// radius `half`, thin navy band `legW` deep `depth`, with a gold inner-edge trim.
export const ARCH = { half: 0.92, legH: 1.5, legW: 0.17, depth: 0.19, trim: 0.04, plateY: 2.72 }
export const LABEL_Y = ARCH.plateY // plaque sits on a stub above the apex

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
// Camera — MAIN.png framing: elevated 3/4 that looks partway DOWN the line so the
// arch faces read and 2-3 gates recede past the hero object. `side` is the along-
// view X lead; the low objects want a low look target. Gentle dolly tracks the book.
export const CAM = { y: 3.1, z: 8.6, side: 4.4, lookY: 0.75, drift: 0.3, ease: 0.07, fov: 40 }
