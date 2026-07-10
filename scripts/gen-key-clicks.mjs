// Procedurally synthesises the hero typing-book's mechanical key-click samples.
// These are generated from scratch (decaying filtered noise "click" + a short
// low "thock" body), so they are ORIGINAL and license-free — effectively CC0 /
// public domain, with no third-party attribution needed. Three subtly different
// variants keep a fast scroll from sounding like one machine-gun sample.
//
// Run: node scripts/gen-key-clicks.mjs  →  public/qfp/hero/sfx/key-click-{1,2,3}.wav
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/qfp/hero/sfx')
mkdirSync(out, { recursive: true })

const SR = 44100

// A tiny seeded PRNG so the noise is deterministic (reproducible builds).
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

// One click: fast noise transient + a short body thock, hard exponential decays.
function synth({ seed, dur = 0.055, thock = 170, click = 0.004, body = 0.018, gain = 0.9 }) {
  const rand = rng(seed)
  const n = Math.floor(SR * dur)
  const buf = new Float32Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    // high-frequency "click" — white noise, slightly low-passed, very fast decay
    const white = rand() * 2 - 1
    prev = prev * 0.55 + white * 0.45
    const clickEnv = Math.exp(-t / click)
    // low "thock" body — a short damped sine
    const bodyEnv = Math.exp(-t / body)
    const thockWave = Math.sin(2 * Math.PI * thock * t)
    let s = prev * clickEnv * 0.85 + thockWave * bodyEnv * 0.35
    // soft attack (first ~0.4ms) so the transient isn't a hard DC pop
    const atk = Math.min(1, t / 0.0004)
    buf[i] = s * atk * gain
  }
  return buf
}

function toWav(float32) {
  const n = float32.length
  const bytesPerSample = 2
  const dataSize = n * bytesPerSample
  const buf = Buffer.alloc(44 + dataSize)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * bytesPerSample, 28)
  buf.writeUInt16LE(bytesPerSample, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < n; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]))
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2)
  }
  return buf
}

const variants = [
  { seed: 1337, thock: 172, click: 0.0042, body: 0.019, gain: 0.9 },
  { seed: 90210, thock: 158, click: 0.0038, body: 0.017, gain: 0.82 },
  { seed: 424242, thock: 188, click: 0.0046, body: 0.02, gain: 0.86 },
]
variants.forEach((v, i) => {
  const wav = toWav(synth(v))
  const p = resolve(out, `key-click-${i + 1}.wav`)
  writeFileSync(p, wav)
  console.log('✓', p, wav.length, 'bytes')
})
console.log('done — 3 CC0 key-click samples in', out)
