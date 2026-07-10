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
