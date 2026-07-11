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

// ── Ending (R7): every book transform completes as activeF reaches N-1 at P5
// (gate-aligned). The sealed, ticked box then rides on and STOPS at boxRestX — a
// clear ~1-unit gap BEFORE the girl (no contact). The celebration (reach → box
// morph → jump → settle) runs [swapA..swapB]; after swapB a dead HOLD to p=1 lets
// the finished scene breathe before the pin releases. boxRestX is placed so the
// world box lands exactly where the pick-sprite's held box sits → the morph is
// pop-free (Scene fades the world box out as the pick sprite fades in).
export const ENDING = {
  P5: 0.77,        // activeF hits N-1; all transforms done, box at the last gate
  arriveP: 0.83,   // box finishes its run and rests at boxRestX
  girlX: 13.95,
  boxRestX: 12.37, // clear gap before the girl; she leans in, box morphs to her hands
  swapA: 0.83,     // celebration begins (she reaches as the box stops)
  swapB: 0.95,     // celebration settled; [swapB..1] is the end HOLD
}
export const mapActiveF = (p) => Math.min(p / ENDING.P5, 1) * (N - 1)
export const mapBookX = (p) => {
  const x5 = stationX(N - 1)
  if (p <= ENDING.P5) return BELT.x0 + ((x5 - BELT.x0) * p) / ENDING.P5
  if (p <= ENDING.arriveP) return x5 + ((ENDING.boxRestX - x5) * (p - ENDING.P5)) / (ENDING.arriveP - ENDING.P5)
  return ENDING.boxRestX
}
// linear 0..1 celebration ramp across [swapA..swapB]; sub-phases (reach/morph/
// jump/settle) are smoothed off this inside Girl. Stays 1 through the end HOLD.
export const handoffOf = (p) => Math.min(Math.max((p - ENDING.swapA) / (ENDING.swapB - ENDING.swapA), 0), 1)
// Journey captions (the floating stage word) that RIDE with the box, by leg =
// clamp(floor(activeF), 0, 4): Paper · Paper to Book · Book to Package · Packed &
// Sealed · Shipped. The 6th leg — "Delivered" — is NOT a travelling caption; it is
// raised beside the girl only at the catch moment (see Scene), so it reads as the
// box actually arriving in her hands rather than a gate label.
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

// Camera — TELEPHOTO near side-on so the belt runs nearly STRAIGHT across the frame.
// R6: the whole line sits in the LOWER THIRD with generous air above the arches — a
// higher look target drops the belt down and opens sky/label breathing room. Dolly tracks.
export const CAM = { y: 2.55, z: 11.6, side: 4.2, lookY: 1.5, drift: 0.18, ease: 0.07, fov: 25 }
