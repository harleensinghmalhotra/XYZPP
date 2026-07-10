// Phase 2.7 — the "alive" runtime. One tiny module, mounted once by SiteLayout,
// that powers three site-wide behaviours over the pages' existing markup:
//   1. Scroll reveals   — [data-reveal] fades/rises in once on enter (staggered).
//   2. Text moments      — [data-textreveal] headings split into rising words.
//   3. Magnetic pills     — gold/navy CTAs drift a few px toward the pointer.
// Everything degrades: without JS the CSS keeps content visible; under
// prefers-reduced-motion nothing moves — reveals resolve instantly, no magnet.
//
// Design law (Emil): entrances ease-out, exits faster, <300ms for UI feedback,
// no layout properties animated, hover/magnet gated behind (hover:hover).

const REVEAL_STAGGER = 75 // ms between siblings — one calm rhythm site-wide
const MAG_STRENGTH = 0.25 // pointer-follow factor
const MAG_MAX = 10 // px — the whole pull radius stays subtle

// Every gold + navy CTA that should feel magnetic. Kept in sync with index.css.
const MAGNETIC_SELECTOR = [
  '.edu-cta-pill', '.ff-cta-pill', '.tb-close-pill', '.tb-quote',
  '.ctc-submit', '.ctc-map-btn', '.pod-request', '.inf-btn--gold',
  '.pod-hero-cta', '.pod-cta-btn', '.ctc-btn', '[data-magnetic]',
].join(',')

const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches
const reducedMotion = () => mq('(prefers-reduced-motion: reduce)')
const canHover = () => mq('(hover: hover) and (pointer: fine)')

// Split a heading's contents into word-spans without destroying inline markup
// (accent <em>/<span> children ride as a single word). Idempotent.
function splitWords(el) {
  if (el.dataset.split === '1') return
  el.dataset.split = '1'
  let i = 0
  const wrap = (node) => {
    const span = document.createElement('span')
    span.className = 'aw-word'
    span.style.setProperty('--word-delay', `${i * 55}ms`)
    i += 1
    node.replaceWith(span)
    span.appendChild(node)
    return span
  }
  Array.from(el.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/)
      if (!node.textContent.trim()) return
      const frag = document.createDocumentFragment()
      parts.forEach((p) => {
        if (!p) return
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return }
        const span = document.createElement('span')
        span.className = 'aw-word'
        span.style.setProperty('--word-delay', `${i * 55}ms`)
        i += 1
        span.textContent = p
        frag.appendChild(span)
      })
      node.replaceWith(frag)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      wrap(node)
    }
  })
}

export function initAlive() {
  if (typeof document === 'undefined') return () => {}
  const root = document.documentElement
  root.classList.add('alive-ready')
  const reduced = reducedMotion()

  // Assign an intra-group stagger delay to reveal elements that share a parent,
  // so grids cascade without any per-page bookkeeping.
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'))
  const groupCounts = new Map()
  revealEls.forEach((el) => {
    if (el.style.getPropertyValue('--reveal-delay')) return
    const key = el.parentElement
    const n = groupCounts.get(key) || 0
    groupCounts.set(key, n + 1)
    const cap = Math.min(n, 6) // cap the cascade so long lists never feel slow
    el.style.setProperty('--reveal-delay', `${cap * REVEAL_STAGGER}ms`)
  })

  // Prepare text-reveal headings.
  const textEls = Array.from(document.querySelectorAll('[data-textreveal]'))
  textEls.forEach(splitWords)

  // Reduced motion → resolve everything to its visible state, no observers.
  if (reduced) {
    revealEls.forEach((el) => el.classList.add('is-in'))
    textEls.forEach((el) => el.classList.add('is-in'))
    return () => {}
  }

  // One observer for reveals + text moments. Fire once, then unobserve.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  )
  revealEls.forEach((el) => io.observe(el))
  textEls.forEach((el) => io.observe(el))

  // Magnetic pills — pointer-follow via the `translate` property so it layers on
  // top of each pill's CSS transform (hover lift / :active press) without
  // clobbering it. Only on true hover devices.
  const magCleanups = []
  if (canHover()) {
    document.querySelectorAll(MAGNETIC_SELECTOR).forEach((el) => {
      const onMove = (ev) => {
        const r = el.getBoundingClientRect()
        const dx = ev.clientX - (r.left + r.width / 2)
        const dy = ev.clientY - (r.top + r.height / 2)
        const x = Math.max(-MAG_MAX, Math.min(MAG_MAX, dx * MAG_STRENGTH))
        const y = Math.max(-MAG_MAX, Math.min(MAG_MAX, dy * MAG_STRENGTH))
        el.style.translate = `${x}px ${y}px`
      }
      const onLeave = () => { el.style.translate = '0px 0px' }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      magCleanups.push(() => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
        el.style.translate = ''
      })
    })
  }

  return () => {
    io.disconnect()
    magCleanups.forEach((fn) => fn())
  }
}
