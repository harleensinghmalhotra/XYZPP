import {createClient} from '@sanity/client'
// Named export — the default export is a deprecation-wrapped alias that logs a console
// warning on use; createImageUrlBuilder is the current, warning-free entry point.
import {createImageUrlBuilder} from '@sanity/image-url'
import {projectId, dataset} from '../../studio/projectConfig.js'

// ── Sanity read client ────────────────────────────────────────────────────────
// projectId + dataset come from studio/projectConfig.js — the single source of
// truth shared with the studio.
//
// Under Sanity's newer access model the `production` dataset's legacy "public"
// flag no longer grants anonymous document reads, so a tokenless client gets 0
// posts. We read with a READ-ONLY Viewer token supplied via env
// (VITE_SANITY_READ_TOKEN). The token is optional and the setup degrades
// gracefully: with no token the client stays exactly as before — anonymous and
// CDN-cached (useCdn:true). When a token IS present it must hit the live API,
// because Sanity's CDN does not serve authenticated reads — so useCdn flips off.
const readToken = import.meta.env.VITE_SANITY_READ_TOKEN || undefined

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-07-19',
  useCdn: !readToken,
  // The read token is a DELIBERATE, read-only Viewer token (see above). Sanity warns
  // about browser tokens by default; this acknowledges the intentional trade-off and
  // silences the console warning per Sanity docs.
  ...(readToken ? {token: readToken, ignoreBrowserTokenWarning: true} : {}),
})

// Image URL builder (hotspot/crop-aware). Callers chain .width().auto('format').
const builder = createImageUrlBuilder(client)
export const urlFor = (source) => builder.image(source)

// Clamp any i18n language to a supported GROQ locale key (en | fr | es). The
// newsroom stores field-level translations under exactly these keys; anything
// else (or a region-tagged code like "en-US") resolves to English, and the
// GROQ `coalesce(field[$lang], field.en)` gives a second EN safety net per field.
export function groqLang(lang) {
  return lang === 'fr' || lang === 'es' ? lang : 'en'
}

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
