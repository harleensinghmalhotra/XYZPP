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

// Slim rounded "∩" arch gate (ref V1) — SHORTENED (R5) so the full arch + its
// floating label sit inside the viewport at all times (never crop under the nav).
export const ARCH = { half: 0.86, legH: 0.98, legW: 0.16, depth: 0.18, trim: 0.038 }
export const APEX_Y = ARCH.legH + ARCH.half
export const LABEL_Y = APEX_Y + 0.52 // billboard label floats above the apex

// ── R5 ending: after the green tick stamps at the last gate the box rides a short
// distance further to the girl at the belt's end. activeF (transform space) still
// reaches N-1 exactly when the book reaches the last gate (P5), keeping every
// stage-transform aligned to its gate; the tail p∈[P5,1] is the ride to the girl.
export const ENDING = { P5: 0.86, girlX: 13.4 }
export const mapActiveF = (p) => Math.min(p / ENDING.P5, 1) * (N - 1)
export const mapBookX = (p) => {
  const x5 = stationX(N - 1)
  return p <= ENDING.P5
    ? BELT.x0 + ((x5 - BELT.x0) * p) / ENDING.P5
    : x5 + ((ENDING.girlX - x5) * (p - ENDING.P5)) / (1 - ENDING.P5)
}
// journey captions (floating stage word), by leg = clamp(floor(activeF), 0, 4)
export const legIndex = (activeF) => Math.min(Math.max(Math.floor(activeF), 0), 4)

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

// Camera — TELEPHOTO near side-on (R4) so the belt runs nearly STRAIGHT across the
// frame, retuned for R5 so every gate + its floating label stays fully in frame
// (lower look target + slightly higher eye leave headroom under the nav). Dolly tracks.
export const CAM = { y: 2.15, z: 11.2, side: 4.2, lookY: 0.72, drift: 0.18, ease: 0.07, fov: 25 }
