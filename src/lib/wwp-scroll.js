// ── What We Print anchor scroll ──────────────────────────────────────────────
// Extracted out of src/pages/Home.jsx so SiteNav (always-mounted shared chrome)
// doesn't statically import the Home page component itself. Home.jsx is now
// React.lazy()-loaded (see src/App.jsx); a static `import { scrollToWwp } from
// '@/pages/Home'` in SiteNav would fold Home's entire chunk back into the
// shared bundle every route loads, silently defeating that split. Pure DOM
// helpers only — no dependency on Home's own component internals.
//
// The exact target: the "Formats and Categories" heading sits flush under the
// sticky nav — section top pinned to the nav's bottom edge, no overshoot past
// the heading, no undershoot showing the section above. The math below is the
// single source of truth; SiteNav uses the IDENTICAL routine for its own
// re-click path so a label click and a cross-route hash always land in the
// same place.

// Nav offset for anchor landing. The header is now NON-STICKY (normal flow), so
// once the page scrolls it no longer occupies the top of the viewport — anchor
// targets should land flush at the viewport top, not under an 86px band. Returns
// 0 accordingly (kept as a function so callers/settle-checks stay unchanged).
export function wwpNavHeight() {
  return 0
}

// Scroll so #what-we-print's top sits exactly under the nav. For a per-card anchor
// (cardId = "wwp-<key>") the VERTICAL position is identical to the label target —
// only the horizontal row is scrolled to bring the card into view (no vertical
// drift, which scrollIntoView(block:'nearest') would introduce). Returns false if
// the section isn't in the DOM yet, so callers can retry.
export function scrollToWwp(cardId, reduced) {
  const section = document.getElementById('what-we-print')
  if (!section) return false

  const behavior = reduced ? 'auto' : 'smooth'
  const navH = wwpNavHeight()
  const y = Math.max(0, window.scrollY + section.getBoundingClientRect().top - navH)

  // Use the page's own Lenis instance when it's running so we cooperate with the
  // smooth-scroll engine; fall back to native scrollTo (reduced-motion / no Lenis).
  const lenis = typeof window !== 'undefined' ? window.__lenis : null
  if (lenis) lenis.scrollTo(y, { immediate: reduced, force: true })
  else window.scrollTo({ top: y, behavior })

  // Horizontal: center the target card in the row without touching page scroll.
  if (cardId) {
    const card = document.getElementById(cardId)
    const vp = document.querySelector('.wwp-viewport')
    if (card && vp) {
      const cardRect = card.getBoundingClientRect()
      const vpRect = vp.getBoundingClientRect()
      const left = Math.max(
        0,
        vp.scrollLeft + cardRect.left - vpRect.left - (vp.clientWidth - cardRect.width) / 2,
      )
      vp.scrollTo({ left, behavior })
    }
  }
  return true
}
