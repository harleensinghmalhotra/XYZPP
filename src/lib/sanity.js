import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import {projectId, dataset} from '../../studio/projectConfig.js'

// ── Sanity read client ────────────────────────────────────────────────────────
// projectId + dataset come from studio/projectConfig.js — the single source of
// truth shared with the studio. No token: the `production` dataset is public and
// the site only reads. useCdn:true serves the fast, cached API.
export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-07-19',
  useCdn: true,
})

// Image URL builder (hotspot/crop-aware). Callers chain .width().auto('format').
const builder = imageUrlBuilder(client)
export const urlFor = (source) => builder.image(source)

// Date meta in the newsroom's DM-Mono style, localised to the active language.
// Accepts a full ISO datetime (publishedAt); mirrors the retired mock's format.
export function formatDate(iso, lang = 'en') {
  const opts = {day: '2-digit', month: 'short', year: 'numeric'}
  try {
    return new Intl.DateTimeFormat(lang, opts).format(new Date(iso))
  } catch {
    return new Intl.DateTimeFormat('en', opts).format(new Date(iso))
  }
}

// ── Reveal async content ──────────────────────────────────────────────────────
// alive.js (src/lib/alive.js) wires the [data-reveal] entrance ONCE at app mount,
// so nodes injected later — our async Sanity cards/blocks — never get observed and
// would sit at their opacity:0 resting state forever. This re-runs the exact same
// reveal (75ms sibling stagger capped at 6, same IO thresholds) over any
// not-yet-revealed [data-reveal] within `root`. Reduced motion resolves instantly.
// Call from a useEffect once data has rendered; returns a cleanup fn.
export function revealDynamic(root) {
  if (typeof document === 'undefined') return () => {}
  const scope = root || document
  const els = Array.from(scope.querySelectorAll('[data-reveal]:not(.is-in)'))
  if (!els.length) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('is-in'))
    return () => {}
  }
  const groupCounts = new Map()
  els.forEach((el) => {
    if (el.style.getPropertyValue('--reveal-delay')) return
    const key = el.parentElement
    const n = groupCounts.get(key) || 0
    groupCounts.set(key, n + 1)
    el.style.setProperty('--reveal-delay', `${Math.min(n, 6) * 75}ms`)
  })
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      }),
    {threshold: 0.12, rootMargin: '0px 0px -8% 0px'},
  )
  els.forEach((el) => io.observe(el))
  return () => io.disconnect()
}
