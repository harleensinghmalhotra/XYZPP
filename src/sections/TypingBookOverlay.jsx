import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// ── HERO BOOK-PAGE OVERLAY (STATIC) ─────────────────────────────────────────
// The book base image is the BLANK spread (qfp-book-cover.webp). This layer draws
// EKTA'S page copy as HTML text laid onto the two page surfaces. Typography matches
// her vibe-coded mockup (recon/ekta-assets/powering-global-education-through-print-
// .png): clean BOLD NAVY Inter Tight — left page a big display headline, right page
// a headline → two mid lines → a small paragraph.
//
// LANE 16 — the character-by-character typing reveal (scrub-driven, sound-cued) is
// GONE per the client: the copy renders STATIC, present immediately. The reveal
// engine, the per-glyph spans, the caret and the typingSound cue are removed; the
// homography that maps flat text onto the paper's perspective is what remains (and
// is why Hero still uses this component). The page text is decorative here
// (aria-hidden) — Hero carries the real semantic <h1> with the same headline copy.
//
// WHY THIS ARCHITECTURE (note for whoever regenerates art later): the old lettered
// asset (qfp-book-pages.webp) is kept in the repo untouched. Because the base is
// blank and the copy is live text mapped onto two tunable page quads, swapping in
// any future blank-book render is trivial — only re-tune LEFT_QUAD / RIGHT_QUAD to
// the new page corners; no re-lettering, no new bitmap pipeline.
//
// Each page is a CSS matrix3d homography: a flat logical plane (PLANE_W×PLANE_H)
// is projected onto the four measured page corners so text follows the paper's
// perspective tilt and scales with the book at any viewport.

const PLANE_W = 1000
const PLANE_H = 1120

// Page-corner targets as fractions of the book-image box (2830×1770). Order:
// tl, tr, br, bl. Tuned so the text plane sits ON the paper, inset from the edges.
const LEFT_QUAD = { tl: [0.200, 0.205], tr: [0.470, 0.205], br: [0.468, 0.705], bl: [0.150, 0.700] }
const RIGHT_QUAD = { tl: [0.505, 0.205], tr: [0.782, 0.205], br: [0.832, 0.700], bl: [0.507, 0.705] }

const INK = '#0F2444' // navy — her page-copy ink

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
  const src = [[0, 0], [w, 0], [w, h], [0, h]]
  const dst = ['tl', 'tr', 'br', 'bl'].map((k) => [quad[k][0] * box.w, quad[k][1] * box.h])
  const t = mul(basis(dst), adj(basis(src)))
  for (let i = 0; i < 9; i++) t[i] /= t[8]
  return `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]].join(',')})`
}

const STYLE = `
/* justify-content:flex-start — copy begins at the TOP of each page's safe area
   (just below the page curve / top margin, set by the plane's padding-top) and
   flows downward like real typeset print, ending roughly mid-page. */
.tb-plane{position:absolute;top:0;left:0;transform-origin:0 0;color:${INK};
  font-family:'Inter Tight','Inter',sans-serif;display:flex;flex-direction:column;
  justify-content:flex-start;box-sizing:border-box}
.tb-line{white-space:nowrap}
.tb-lhead{font-size:118px;font-weight:800;line-height:1.0;letter-spacing:-0.03em}
.tb-rhead{font-size:88px;font-weight:800;line-height:1.02;letter-spacing:-0.03em}
.tb-rmid{font-size:52px;font-weight:700;line-height:1.16;letter-spacing:-0.02em}
.tb-rpara{font-size:38px;font-weight:400;line-height:1.24;letter-spacing:-0.01em}
.tb-gap{height:46px}
.tb-gap-sm{height:24px}
`

// STATIC page-copy renderer. No props, no imperative handle — Hero mounts it once
// and it draws the finished pages. Decorative (aria-hidden); the accessible
// headline lives in Hero's real <h1>.
export default function TypingBookOverlay() {
  const { t } = useTranslation('home')
  const rootRef = useRef(null)
  const [box, setBox] = useState(null) // rendered book-image box size in px

  const left = t('hero.book.left', { returnObjects: true })
  const rightHead = t('hero.book.rightHead', { returnObjects: true })
  const rightMid = t('hero.book.rightMid', { returnObjects: true })
  const rightPara = t('hero.book.rightPara', { returnObjects: true })

  // Left page (display block) then right page (headline → mid → paragraph). Plain
  // text lines — no per-glyph spans now that the typing reveal is gone.
  const content = useMemo(() => {
    const line = (text, cls, key) => (
      <div className={`tb-line ${cls}`} key={key}>{String(text)}</div>
    )
    const arr = (lines, cls, tag) => (Array.isArray(lines) ? lines : []).map((ln, i) => line(ln, cls, `${tag}${i}`))
    const leftPlane = arr(left, 'tb-lhead', 'l')
    const rightPlane = [
      ...arr(rightHead, 'tb-rhead', 'rh'),
      <div className="tb-gap" key="g1" />,
      ...arr(rightMid, 'tb-rmid', 'rm'),
      <div className="tb-gap-sm" key="g2" />,
      ...arr(rightPara, 'tb-rpara', 'rp'),
    ]
    return { leftPlane, rightPlane }
  }, [left, rightHead, rightMid, rightPara])

  // Measure the book-image box (this overlay is inset-0 over it) so the page quads
  // land in px. Recompute on resize → matrices below follow.
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

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      {/* Left page plane — big display block. */}
      <div className="tb-plane" style={{ width: PLANE_W, height: PLANE_H, padding: '14px 40px 90px 64px', transform: leftMatrix || 'scale(0)', opacity: leftMatrix ? 1 : 0 }}>
        {content.leftPlane}
      </div>
      {/* Right page plane — headline → mid lines → paragraph, anchored top. */}
      <div className="tb-plane" style={{ width: PLANE_W, height: PLANE_H, padding: '14px 44px 90px 58px', transform: rightMatrix || 'scale(0)', opacity: rightMatrix ? 1 : 0 }}>
        {content.rightPlane}
      </div>
    </div>
  )
}
