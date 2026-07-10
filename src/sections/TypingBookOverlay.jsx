import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { typingSound } from '@/lib/typingSound'

// ── HERO TYPING-BOOK OVERLAY ────────────────────────────────────────────────
// The book base image is now the BLANK spread (qfp-book-cover.webp). This layer
// draws the decorative page collage as LIVE HTML text that types itself onto the
// two page surfaces, scrubbed directly to scroll progress. Nothing here is baked
// into a bitmap.
//
// WHY THIS ARCHITECTURE (note for whoever regenerates art later): the old
// lettered asset (qfp-book-pages.webp) is kept in the repo untouched. Because the
// base is blank and the lettering is live text mapped onto two tunable page
// quads, swapping in any future blank-book render from Ekta is trivial — you only
// re-tune LEFT_QUAD / RIGHT_QUAD below to the new page corners; no re-lettering,
// no new bitmap pipeline.
//
// Each page is a CSS matrix3d homography: a flat logical plane (PLANE_W×PLANE_H)
// is projected onto the four measured page corners so text follows the paper's
// perspective tilt. Words live in that logical space (author in plain px), so the
// whole collage scales with the book at any viewport.

const PLANE_W = 1000
const PLANE_H = 1120

// Page-corner targets as fractions of the book-image box (2830×1770). Order:
// tl, tr, br, bl. Tuned so the text plane sits ON the paper, inset from the edges.
const LEFT_QUAD = { tl: [0.205, 0.250], tr: [0.470, 0.243], br: [0.468, 0.700], bl: [0.150, 0.700] }
const RIGHT_QUAD = { tl: [0.505, 0.243], tr: [0.775, 0.250], br: [0.825, 0.700], bl: [0.507, 0.700] }

// Word layout in logical plane space (cx,cy = centre). `size` is font-size in
// logical px; the homography scales it onto the page. Index === bookWords order.
// upper → rendered uppercase (text stays lowercase in i18n). rot in degrees.
const LEFT_LAYOUT = [
  { cx: 300, cy: 150, size: 150, rot: -4, weight: 700, upper: true }, // Vision
  { cx: 355, cy: 305, size: 120, rot: -2, weight: 700, upper: true }, // Creation
  { cx: 735, cy: 220, size: 74, rot: 9, weight: 600 }, // Imagine
  { cx: 250, cy: 455, size: 128, rot: 0, weight: 700, upper: true }, // Idea
  { cx: 565, cy: 470, size: 106, rot: -6, weight: 600 }, // Build
  { cx: 275, cy: 600, size: 94, rot: -3, weight: 600 }, // Impact
  { cx: 530, cy: 610, size: 74, rot: -8, weight: 500 }, // Inspire
  { cx: 345, cy: 730, size: 98, rot: -4, weight: 600 }, // Achieve
  { cx: 715, cy: 585, size: 66, rot: -58, weight: 500 }, // Network (vertical-ish)
  { cx: 800, cy: 700, size: 64, rot: -58, weight: 500 }, // Teamwork (vertical-ish)
  { cx: 425, cy: 890, size: 84, rot: -2, weight: 600 }, // Collaboration
]
const RIGHT_LAYOUT = [
  { cx: 470, cy: 155, size: 150, rot: -3, weight: 700, upper: true }, // Moments
  { cx: 285, cy: 305, size: 94, rot: -6, weight: 600 }, // Explore
  { cx: 665, cy: 265, size: 74, rot: 6, weight: 500 }, // Learn
  { cx: 325, cy: 425, size: 98, rot: -3, weight: 600 }, // Growth
  { cx: 735, cy: 385, size: 80, rot: 38, weight: 500 }, // Curiosity
  { cx: 470, cy: 565, size: 150, rot: -2, weight: 700, upper: true }, // Journey
  { cx: 365, cy: 695, size: 88, rot: -4, weight: 600 }, // Reflection
  { cx: 360, cy: 805, size: 94, rot: -3, weight: 600 }, // Travel
  { cx: 690, cy: 785, size: 76, rot: 8, weight: 500 }, // Connection
  { cx: 345, cy: 910, size: 92, rot: -2, weight: 600 }, // Wonder
  { cx: 665, cy: 900, size: 82, rot: -2, weight: 600 }, // Progress
]

// Reveal sequence — [page, wordIndex]. Deliberately NOT strict left-to-right:
// big anchors first, then it ping-pongs across both pages so the caret hops
// spread out rather than crawling one column. Tuned to feel authored, not random.
const REVEAL_ORDER = [
  ['L', 0], ['R', 0], ['L', 1], ['R', 5], ['L', 3], ['R', 1],
  ['L', 4], ['R', 3], ['L', 2], ['R', 4], ['L', 5], ['R', 2],
  ['L', 7], ['R', 6], ['L', 6], ['R', 7], ['L', 8], ['R', 8],
  ['L', 9], ['R', 9], ['L', 10], ['R', 10],
]

const INK = '#9dabbd' // soft cool grey, matching the retired lettered asset

// Homography helpers (general 2D projective transform → CSS matrix3d).
function adj(m) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ]
}
function mul(a, b) {
  const r = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; r[3 * i + j] = s }
  return r
}
function mulv(m, v) {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]
}
function basis(p) {
  const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]
  const v = mulv(adj(m), [p[3][0], p[3][1], 1])
  return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}
function matrix3dFor(w, h, quad, box) {
  // source unit corners of the plane (tl, tr, br, bl) in the plane's own px space
  const src = [[0, 0], [w, 0], [w, h], [0, h]]
  const dst = ['tl', 'tr', 'br', 'bl'].map((k) => [quad[k][0] * box.w, quad[k][1] * box.h])
  const t = mul(basis(dst), adj(basis(src)))
  for (let i = 0; i < 9; i++) t[i] /= t[8]
  return `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',')})`
}

// One word → char spans. Each char carries data-k (global reveal rank) so the
// driver can sort them into the pure reveal sequence regardless of DOM order.
function Word({ text, spec, rank, reduced }) {
  return (
    <span
      className="tb-word"
      style={{
        position: 'absolute',
        left: spec.cx,
        top: spec.cy,
        transform: `translate(-50%, -50%) rotate(${spec.rot}deg)`,
        fontSize: spec.size,
        fontWeight: spec.weight,
        textTransform: spec.upper ? 'uppercase' : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {text.split('').map((ch, i) => (
        <span key={i} className={`tb-char${reduced ? ' is-on' : ''}`} data-k={rank * 100 + i}>
          {ch}
        </span>
      ))}
    </span>
  )
}

const STYLE = `
.tb-plane{position:absolute;top:0;left:0;transform-origin:0 0;color:${INK};
  font-family:'Caveat',cursive;line-height:1;letter-spacing:0.005em}
.tb-char{position:relative;opacity:0;transition:opacity 45ms linear}
.tb-char.is-on{opacity:1}
.tb-char.is-caret::after{content:'';position:absolute;right:-0.05em;top:6%;bottom:6%;
  width:0.055em;background:currentColor;border-radius:1px;opacity:.9;
  animation:tbCaret 1s steps(1) infinite}
@keyframes tbCaret{0%,50%{opacity:.9}51%,100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.tb-char.is-caret::after{display:none}}
`

// rank lookup: word (page,idx) → its position in REVEAL_ORDER
const RANK = new Map(REVEAL_ORDER.map(([p, i], r) => [`${p}${i}`, r]))
const rankOf = (page, idx) => RANK.get(`${page}${idx}`) ?? 999

const TypingBookOverlay = forwardRef(function TypingBookOverlay({ reduced = false }, ref) {
  const { t, i18n } = useTranslation('home')
  const rootRef = useRef(null)
  const [box, setBox] = useState(null) // rendered book-image box size in px
  const seqRef = useRef([]) // char nodes in pure reveal order
  const shownRef = useRef(0)
  const caretRef = useRef(null)

  const left = t('hero.bookWords.left', { returnObjects: true })
  const right = t('hero.bookWords.right', { returnObjects: true })

  // Measure the book-image box (this overlay is inset-0 over it) so the page
  // quads land in px. Recompute on resize → matrices below follow.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      if (r.width > 0) setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const leftMatrix = useMemo(() => (box ? matrix3dFor(PLANE_W, PLANE_H, LEFT_QUAD, box) : null), [box])
  const rightMatrix = useMemo(() => (box ? matrix3dFor(PLANE_W, PLANE_H, RIGHT_QUAD, box) : null), [box])

  // Rebuild the ordered char sequence whenever the words (language) change.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const nodes = Array.from(el.querySelectorAll('.tb-char'))
    nodes.sort((a, b) => Number(a.dataset.k) - Number(b.dataset.k))
    seqRef.current = nodes
    caretRef.current = null
    if (reduced) {
      nodes.forEach((n) => n.classList.add('is-on'))
      shownRef.current = nodes.length
    } else {
      shownRef.current = 0
      nodes.forEach((n) => n.classList.remove('is-on'))
    }
  }, [reduced, i18n.language])

  // Imperative, per-frame, allocation-free scrub. Pure substring-of-progress:
  // n = round(progress · total). Only the delta between frames is touched, so
  // any scroll speed (or a reverse scroll = untype) lands the exact same glyphs.
  useImperativeHandle(ref, () => ({
    setProgress(p) {
      if (reduced) return
      const seq = seqRef.current
      const total = seq.length
      if (!total) return
      const n = Math.max(0, Math.min(total, Math.round(p * total)))
      const shown = shownRef.current
      if (n === shown) return
      let added = 0
      if (n > shown) {
        for (let i = shown; i < n; i++) seq[i].classList.add('is-on')
        added = n - shown
      } else {
        for (let i = n; i < shown; i++) seq[i].classList.remove('is-on')
      }
      // caret rides the currently-typing character (the last visible one)
      if (caretRef.current) caretRef.current.classList.remove('is-caret')
      const caret = n > 0 && n < total ? seq[n - 1] : null
      if (caret) caret.classList.add('is-caret')
      caretRef.current = caret
      shownRef.current = n
      typingSound.click(added)
    },
  }), [reduced])

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      {/* Left page plane */}
      <div className="tb-plane" style={{ width: PLANE_W, height: PLANE_H, transform: leftMatrix || 'scale(0)', opacity: leftMatrix ? 1 : 0 }}>
        {LEFT_LAYOUT.map((spec, i) => (
          <Word key={i} text={String(left[i] ?? '')} spec={spec} rank={rankOf('L', i)} reduced={reduced} />
        ))}
      </div>
      {/* Right page plane */}
      <div className="tb-plane" style={{ width: PLANE_W, height: PLANE_H, transform: rightMatrix || 'scale(0)', opacity: rightMatrix ? 1 : 0 }}>
        {RIGHT_LAYOUT.map((spec, i) => (
          <Word key={i} text={String(right[i] ?? '')} spec={spec} rank={rankOf('R', i)} reduced={reduced} />
        ))}
      </div>
    </div>
  )
})

export default TypingBookOverlay
