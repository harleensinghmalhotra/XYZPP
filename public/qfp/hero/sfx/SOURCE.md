# Hero typing-book key-click samples

`key-click-1.wav`, `key-click-2.wav`, `key-click-3.wav`

**Source / licence:** Procedurally synthesised from scratch by
[`scripts/gen-key-clicks.mjs`](../../../../scripts/gen-key-clicks.mjs) (decaying
filtered-noise transient + a short low "thock" body). They contain no
third-party audio and are released as **CC0 / public domain** — no attribution
required. Regenerate any time with `node scripts/gen-key-clicks.mjs`.

Used by the hero book typing overlay (mechanical-keyboard clicks, OFF by default,
throttled to ≤15 clicks/sec) via Howler.js.
