// Mechanical key-click sound for the hero typing-book — Howler.js, OFF by default.
//
// A module singleton so the toggle button and the per-character typing driver
// share one state. Nothing is loaded or played until the user taps the toggle:
// enable() lazily builds the Howls, so a visitor who never opts in pays zero
// audio cost, and every play() happens strictly AFTER a user gesture (the tap),
// which satisfies browser autoplay policies.
//
// Throttled to <= ~15 clicks/sec: a fast scroll becomes rapid clatter but never
// a machine-gun spam of one-per-character. Samples are CC0 (see
// public/qfp/hero/sfx/SOURCE.md) and round-robined with a little pitch jitter so
// the clatter sounds organic.
import { Howl, Howler } from 'howler'

const SRC = [
  '/qfp/hero/sfx/key-click-1.wav',
  '/qfp/hero/sfx/key-click-2.wav',
  '/qfp/hero/sfx/key-click-3.wav',
]
const MIN_GAP_MS = 1000 / 15 // hard ceiling of 15 clicks / second

let sounds = null
let enabled = false
let lastPlay = 0
let rr = 0

function ensureLoaded() {
  if (sounds) return
  sounds = SRC.map((src) => new Howl({ src: [src], volume: 0.32, preload: true }))
}

export const typingSound = {
  isEnabled: () => enabled,
  enable() {
    ensureLoaded()
    Howler.mute(false)
    enabled = true
  },
  disable() {
    enabled = false
  },
  toggle() {
    if (enabled) this.disable()
    else this.enable()
    return enabled
  },
  // Fire a (throttled) click when `charsAdded` new characters were just typed.
  // No-op when disabled, on delete (charsAdded <= 0), or inside the throttle gap.
  click(charsAdded) {
    if (!enabled || charsAdded <= 0 || !sounds) return
    const now = performance.now()
    if (now - lastPlay < MIN_GAP_MS) return
    lastPlay = now
    const s = sounds[rr++ % sounds.length]
    s.rate(0.9 + Math.random() * 0.2)
    s.play()
  },
}
