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

// GLOBAL SOUND STATE — one flag rules the whole site (hero typing bed + Cases
// page-turn SFX + any future sound moment). It defaults ON and remembers the
// user's choice forever in localStorage('qfp-sound'): '1' = on, '0' = muted,
// absent = on. Nothing is ever loaded or played on import — ON only means the
// FIRST user-gesture sound moment fires without an extra unmute step; browser
// autoplay policy is still honoured because every play() sits behind a gesture
// (a page flip, the toggle, a click that has unlocked WebAudio).
const STORE_KEY = 'qfp-sound'

function readStored() {
  try {
    const v = localStorage.getItem(STORE_KEY)
    return v === null ? true : v === '1' // default ON; only an explicit '0' mutes
  } catch { return true }
}
function persist(on) {
  try { localStorage.setItem(STORE_KEY, on ? '1' : '0') } catch { /* private mode — in-memory only */ }
}

let bed = null
let enabled = readStored()
let idleTimer = null

function ensureLoaded() {
  if (bed) return
  bed = new Howl({ src: [SRC], volume: 0.45, loop: true, preload: true })
}

export const typingSound = {
  isEnabled: () => enabled,
  enable() {
    enabled = true
    persist(true)
    ensureLoaded()
    Howler.mute(false)
  },
  disable() {
    enabled = false
    persist(false)
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
  // (charsAdded <= 0, e.g. a reverse scroll untyping). Under default-ON the bed is
  // lazy-loaded on the first typed char (the scroll/gesture that drives typing) so
  // the hero no longer needs the toggle click as its unlock — Howler.autoUnlock
  // defers playback to the first real gesture, so this never autoplays uninvited.
  click(charsAdded) {
    if (!enabled || charsAdded <= 0) return
    ensureLoaded()
    if (!bed.playing()) bed.play()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => { if (bed) bed.pause() }, IDLE_PAUSE_MS)
  },
}
