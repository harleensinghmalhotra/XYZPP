// Mechanical typing sound for the hero typing-book — Howler.js, OFF by default.
//
// A module singleton so the toggle button and the per-character typing driver
// share one state. Nothing is loaded or played until the user taps the toggle:
// enable() lazily builds the Howl, so a visitor who never opts in pays zero
// audio cost, and every play() happens strictly AFTER a user gesture (the tap),
// which satisfies browser autoplay policies.
//
// SOUND: a single continuous "keyboard typing" recording (public/qfp/hero/sfx/
// keyboard-typing.wav, ~6.6s) played as a LOOPED BED — it runs while characters
// are actively being typed (forward scroll/scrub) and pauses shortly after the
// typing stops, so the clatter tracks the reveal instead of firing one shot per
// glyph. (Replaces the old round-robin of short key-click samples, which are
// kept in the repo but no longer referenced.)
import { Howl, Howler } from 'howler'

const SRC = '/qfp/hero/sfx/keyboard-typing.wav'
const IDLE_PAUSE_MS = 160 // pause the bed this long after the last typed char

let bed = null
let enabled = false
let idleTimer = null

function ensureLoaded() {
  if (bed) return
  bed = new Howl({ src: [SRC], volume: 0.45, loop: true, preload: true })
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
    clearTimeout(idleTimer)
    if (bed) bed.stop()
  },
  toggle() {
    if (enabled) this.disable()
    else this.enable()
    return enabled
  },
  // Keep the typing bed alive while characters are being added. Each call (re)arms
  // an idle timer; when no new characters arrive for IDLE_PAUSE_MS the bed pauses,
  // resuming seamlessly on the next keystroke. No-op when disabled or on delete
  // (charsAdded <= 0, e.g. a reverse scroll untyping).
  click(charsAdded) {
    if (!enabled || charsAdded <= 0 || !bed) return
    if (!bed.playing()) bed.play()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { if (bed) bed.pause() }, IDLE_PAUSE_MS)
  },
}
