import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './JourneyTimeline.css'

// ── THE PRESS RUN — the About-page journey timeline ───────────────────────────
// A scroll-DRIVEN pinned timeline, ported from the "Press Run" design (Claude
// Design project 96a8ef9e). The section pins (position:sticky) inside a tall
// wrapper; the wrapper's scroll progress 0→1 drives the whole run. A press-head
// travels the gold line (left→right on desktop, top→down on mobile); the line
// draws to wherever the head is; each milestone "prints" — ink-dot stamp + ripple,
// year pill, single-stroke medallion, card slide, one-time gold title shimmer —
// exactly as the head crosses its position. Scroll back and the head rewinds and
// every node un-prints in reverse. At progress 1 the head parks, the idle states
// begin (travelling pulse, floating medallions, breathing head glow) and the pin
// releases so the page continues.
//
// The driver is a requestAnimationFrame loop that reads window scroll against the
// wrapper's bounds — NO scroll library, NO wheel hijacking / preventDefault, so
// native wheel, touch and keyboard scrolling all keep working; the tall wrapper is
// what naturally holds the page until the run completes. The visual keyframes are
// the design's, expressed as WAAPI animations and SAMPLED by scroll progress
// (their currentTime is scrubbed to progress×TL) — which is also what makes the
// rewind free and continuous. There is no timer and no IntersectionObserver
// auto-play. Everything lives in one useEffect with full teardown.
//
// prefers-reduced-motion: no pin, no scroll-drive — the wrapper collapses to
// normal height (CSS) and the section renders as a static block in final state.
//
// ADAPTATION NOTES: palette routes through tokens (navy/gold/gold-2/cream/cream-2
// (=the design's beige #F0EBE0)/ink); small mono text uses --gold-text/navy for AA;
// a few emboss / world-map gradient stops with no token equivalent stay literal.
// Fonts already match the repo (Inter Tight / Inter / DM Mono); only swap is the
// design's IBM Plex Mono → DM Mono. Copy comes from ourStory.timeline in all three
// locales; the mono eyebrow + console readout stay decorative latin; the lead
// heading is the translated section heading; numerals count up in every language.

const TL = 1000 // the run expressed in per-mille of scroll progress (progress×TL)
const EZ = 'cubic-bezier(0.22,1,0.36,1)'
const CONSOLE_TEXT = 'PASS 01 · STOPS 05 · REG ⌖ OK'
const CONSOLE_END = 0.2 // console finishes typing within the first 20% of progress
const clamp01 = (v) => Math.max(0, Math.min(1, v))

// Five single-stroke medallion glyphs, one per stop, in stop order:
// 2014 flag · 2015-17 globe · 2018 facility · 2021-23 gears · 2024-26 aperture.
const ICONS = [
  [
    { t: 'path', d: 'M5.5 20.5V4' },
    { t: 'path', d: 'M5.5 4.8C7.7 3.4 9.8 5.8 12 5.1c2.2-.7 4.2-.5 6.5.5v8.2c-2.3-1-4.3-1.2-6.5-.5-2.2.7-4.3-1.7-6.5-.3' },
  ],
  [
    { t: 'circle', cx: 12, cy: 12, r: 8.6 },
    { t: 'path', d: 'M3.4 12h17.2' },
    { t: 'path', d: 'M12 3.4c-3.2 2.5-3.2 14.7 0 17.2' },
    { t: 'path', d: 'M12 3.4c3.2 2.5 3.2 14.7 0 17.2' },
  ],
  [
    { t: 'path', d: 'M3.5 20.5h17' },
    { t: 'path', d: 'M6 20.5V7l6.5-2.8v16.3' },
    { t: 'path', d: 'M12.5 9.5l5.5 1.9v9.1' },
    { t: 'path', d: 'M8.8 9.2h1' },
    { t: 'path', d: 'M8.8 12.2h1' },
    { t: 'path', d: 'M8.8 15.2h1' },
    { t: 'path', d: 'M15.2 13.8h.9' },
    { t: 'path', d: 'M15.2 16.8h.9' },
  ],
  [
    { t: 'circle', cx: 9, cy: 9.5, r: 3.1 },
    { t: 'path', d: 'M13.1 9.5H15' },
    { t: 'path', d: 'M4.9 9.5H3' },
    { t: 'path', d: 'M11.05 13.05 12 14.7' },
    { t: 'path', d: 'M6.95 13.05 6 14.7' },
    { t: 'path', d: 'M11.05 5.95 12 4.3' },
    { t: 'path', d: 'M6.95 5.95 6 4.3' },
    { t: 'circle', cx: 17, cy: 16.5, r: 2.2 },
    { t: 'path', d: 'M19.2 16.5h1.4' },
    { t: 'path', d: 'M14.8 16.5h-1.4' },
    { t: 'path', d: 'M17 18.7v1.4' },
    { t: 'path', d: 'M17 14.3v-1.4' },
  ],
  [
    { t: 'circle', cx: 12, cy: 12, r: 8.4 },
    { t: 'circle', cx: 12, cy: 12, r: 4.6 },
    { t: 'circle', cx: 12, cy: 12, r: 1.1 },
    { t: 'path', d: 'M12 1.6v2.1' },
    { t: 'path', d: 'M12 20.3v2.1' },
    { t: 'path', d: 'M1.6 12h2.1' },
    { t: 'path', d: 'M20.3 12h2.1' },
  ],
]

function RegMark() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" className="prun-reg" aria-hidden="true">
      <circle cx="12" cy="12" r="4.6" />
      <path d="M12 2.4v4.2" />
      <path d="M12 17.4v4.2" />
      <path d="M2.4 12h4.2" />
      <path d="M17.4 12h4.2" />
    </svg>
  )
}

// Render a milestone description, wrapping every digit-group in a count-up span so
// numerals count up in any language; the exact source substring is restored on
// finish (French "300 000" grouping stays correct, EN "300,000", etc.).
function renderDesc(desc) {
  if (typeof desc !== 'string') return desc
  const re = /[0-9](?:[0-9.,    ]*[0-9])?/g
  const out = []
  let last = 0
  let m
  let key = 0
  while ((m = re.exec(desc)) !== null) {
    if (m.index > last) out.push(desc.slice(last, m.index))
    const raw = m[0]
    const target = parseInt(raw.replace(/[^0-9]/g, ''), 10)
    const sepMatch = raw.match(/[^0-9]/)
    out.push(
      <span key={`c${key++}`} data-count={target} data-sep={sepMatch ? sepMatch[0] : ''}>
        {raw}
      </span>,
    )
    last = re.lastIndex
  }
  if (last < desc.length) out.push(desc.slice(last))
  return out
}

// Faint dotted world-map behind the timeline (decorative, aria-hidden).
function buildMap(container) {
  if (!container || container.firstChild) return
  const M = [
    '........' + '....####' + '..######' + '#.......' + '........' + '....####' + '####....',
    '........' + '########' + '#.######' + '##......' + '........' + '....####' + '#####...',
    '.....###' + '########' + '##.#####' + '#.......' + '....####' + '########' + '#######.',
    '..####.#' + '########' + '##..####' + '..#..###' + '########' + '########' + '#######.',
    '.#####.#' + '########' + '##......' + '.....###' + '########' + '########' + '########',
    '....####' + '########' + '###.....' + '..#.####' + '########' + '########' + '#####...',
    '.....###' + '########' + '###.....' + '..######' + '########' + '########' + '###.....',
    '.....###' + '########' + '##......' + '..######' + '########' + '..######' + '###.....',
    '......##' + '########' + '#.......' + '.#######' + '########' + '########' + '###.....',
    '........' + '######..' + '........' + '.#######' + '########' + '#######.' + '........',
    '........' + '.#####..' + '#.......' + '########' + '#######.' + '######.#' + '........',
    '........' + '...####.' + '##.....#' + '########' + '#####...' + '##.#####' + '........',
    '........' + '.....###' + '###.....' + '.#######' + '####....' + '#..##.#.' + '........',
    '........' + '.......#' + '####....' + '....####' + '####....' + '...####.' + '#.##....',
    '........' + '.......#' + '######..' + '.....###' + '###.....' + '...#####' + '.####...',
    '........' + '.......#' + '#######.' + '.....###' + '###.....' + '....###.' + '.###....',
    '........' + '........' + '#######.' + '.....###' + '###.....' + '.......#' + '###.....',
    '........' + '........' + '.#####..' + '.....###' + '##.#....' + '.....###' + '#####...',
    '........' + '........' + '.####...' + '.....###' + '#.......' + '.....###' + '#####...',
    '........' + '........' + '####....' + '......##' + '........' + '......##' + '####....',
    '........' + '........' + '###.....' + '........' + '........' + '........' + '.##...##',
    '........' + '........' + '##......' + '........' + '........' + '........' + '...#..#.',
    '........' + '........' + '##......' + '........' + '........' + '........' + '........',
    '........' + '........' + '#.......' + '........' + '........' + '........' + '........',
  ]
  let dots = ''
  M.forEach((row, r) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '#') dots += `<circle cx="${i * 10 + 5}" cy="${r * 10 + 5}" r="2.1"></circle>`
    }
  })
  container.innerHTML =
    '<svg viewBox="0 0 560 240" class="prun-map-svg" aria-hidden="true">' + dots + '</svg>'
}

// Group an integer with the separator detected in the source token.
function groupNum(n, sep) {
  if (!sep) return String(n)
  const s = String(n)
  let out = ''
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += sep
    out += s[i]
  }
  return out
}

export default function JourneyTimeline() {
  const { t } = useTranslation('ourStory')
  const stops = t('timeline.stops', { returnObjects: true })
  const wrapRef = useRef(null)
  const rootRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const root = rootRef.current
    if (!wrap || !root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const q = (s) => root.querySelector(s)
    const qa = (s) => Array.from(root.querySelectorAll(s))
    const mmV = window.matchMedia('(max-width: 1023px)') // vertical layout + axis

    const cs = getComputedStyle(root)
    const GOLD = cs.getPropertyValue('--gold').trim() || '#B06F15'
    const GOLD2 = cs.getPropertyValue('--gold-2').trim() || '#B18120'
    const NAVY = cs.getPropertyValue('--navy').trim() || '#030C31'

    const SK = q('[data-pr-skew]')
    const L = q('[data-pr-line]')
    const P = q('[data-pr-head]')
    const PG = q('[data-pr-headglow]')
    const PU = q('[data-pr-pulse]')
    const C = q('[data-pr-console]')
    const TR = q('[data-pr-track]')
    const MAP = q('[data-pr-map]')

    buildMap(MAP)

    const stopEls = qa('[data-pr-stop]').map((el) => ({
      el,
      side: el.getAttribute('data-pr-side'),
      dot: el.querySelector('[data-pr-dot]'),
      ripple: el.querySelector('[data-pr-ripple]'),
      pill: el.querySelector('[data-pr-pill]'),
      icon: el.querySelector('[data-pr-icon]'),
      paths: Array.from(el.querySelectorAll('[data-pr-icon] path, [data-pr-icon] circle')),
      card: el.querySelector('[data-pr-card]'),
      title: el.querySelector('[data-pr-title]'),
      counts: Array.from(el.querySelectorAll('[data-count]')).map((sp) => ({
        sp,
        target: +sp.getAttribute('data-count'),
        sep: sp.getAttribute('data-sep') || '',
        text: sp.textContent,
        state: 'done',
      })),
      hover: null,
      F: 0,
    }))

    // hover: the card lifts via CSS; the dot ripples and warms here.
    const hoverCleanups = []
    stopEls.forEach((st) => {
      const enter = () => {
        if (reduced) return
        st.ripple.animate([{ transform: 'scale(0.35)', opacity: 0.55 }, { transform: 'scale(2.7)', opacity: 0 }], { duration: 750, easing: EZ })
        if (st.hover) { try { st.hover.cancel() } catch (e) { /* noop */ } }
        st.hover = st.dot.animate([{ backgroundColor: GOLD }, { backgroundColor: GOLD2 }], { duration: 200, fill: 'forwards', easing: 'ease-out' })
      }
      const leave = () => {
        if (st.hover) { const h = st.hover; h.reverse(); h.onfinish = () => { try { h.cancel() } catch (e) { /* noop */ } }; st.hover = null }
      }
      st.card.addEventListener('mouseenter', enter)
      st.card.addEventListener('mouseleave', leave)
      hoverCleanups.push(() => { st.card.removeEventListener('mouseenter', enter); st.card.removeEventListener('mouseleave', leave) })
    })

    // Reduced motion: no pin (CSS collapses the wrapper), no scroll-drive. The DOM
    // already renders in its settled final state, so we just wire hover and leave.
    if (reduced) {
      return () => { hoverCleanups.forEach((fn) => fn()) }
    }

    const S = { anims: [], idles: [], built: false, idling: false, lastP: -1, raf: 0, running: false }

    const addA = (el, kf, opts) => {
      const a = el.animate(kf, Object.assign({ fill: 'both' }, opts))
      a.pause()
      S.anims.push(a)
      return a
    }

    // Build the run as paused WAAPI animations scrubbed by progress×TL. Head + line
    // travel LINEARLY across the whole run so the head position tracks scroll 1:1;
    // each stop fires at F = its position-fraction × TL, i.e. exactly as the head
    // crosses it. Micro-sequences (dot, ripple, pill, icon-stroke, card, shimmer)
    // are the design's, in per-mille units after F.
    const buildTimeline = () => {
      const vert = mmV.matches
      const A = vert ? 'translateY' : 'translateX'
      const tr = TR.getBoundingClientRect()
      const full = vert ? TR.scrollHeight : tr.width
      const D = full - 30
      addA(L, [{ transform: vert ? 'scaleY(0)' : 'scaleX(0)' }, { transform: vert ? 'scaleY(1)' : 'scaleX(1)' }], { duration: TL, delay: 0, easing: 'linear' })
      addA(P, [{ opacity: 0 }, { opacity: 1 }], { duration: 25, delay: 0, easing: 'ease-out' })
      addA(P, [{ transform: A + '(' + -D + 'px)' }, { transform: A + '(0px)' }], { duration: TL, delay: 0, easing: 'linear' })
      stopEls.forEach((st) => {
        const dr = st.dot.getBoundingClientRect()
        const c = vert ? dr.top + dr.height / 2 - tr.top : dr.left + dr.width / 2 - tr.left
        const fr = clamp01(c / full)
        const F = fr * TL
        st.F = F
        addA(st.dot, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.62 }, { transform: 'scale(1)', opacity: 1 }], { duration: 55, delay: F, easing: EZ })
        addA(st.ripple, [{ transform: 'scale(0.35)', opacity: 0.55 }, { transform: 'scale(2.7)', opacity: 0 }], { duration: 120, delay: F, easing: EZ })
        addA(st.pill, [{ opacity: 0, transform: 'scaleY(0.4)' }, { opacity: 1, transform: 'scaleY(1)' }], { duration: 55, delay: F + 12, easing: EZ })
        addA(st.icon, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 60, delay: F + 26, easing: EZ })
        st.paths.forEach((p) => {
          let len = 60
          try { len = p.getTotalLength() } catch (e) { /* pre-layout */ }
          addA(p, [{ strokeDasharray: len + ' ' + len, strokeDashoffset: len }, { strokeDasharray: len + ' ' + len, strokeDashoffset: 0 }], { duration: 65, delay: F + 30, easing: EZ })
        })
        const slide = vert ? 'translateX(24px)' : st.side === 'a' ? 'translateY(-24px)' : 'translateY(24px)'
        addA(st.card, [{ opacity: 0, transform: slide }, { opacity: 1, transform: 'none' }], { duration: 70, delay: F + 40, easing: EZ })
        const el = st.title
        el.style.backgroundImage = `linear-gradient(115deg, ${NAVY} 42%, ${GOLD2} 50%, ${NAVY} 58%)`
        el.style.backgroundSize = '220% 100%'
        el.style.webkitBackgroundClip = 'text'
        el.style.backgroundClip = 'text'
        el.style.color = 'transparent'
        addA(el, [{ backgroundPosition: '110% 0' }, { backgroundPosition: '-60% 0' }], { duration: 110, delay: F + 70, easing: 'ease-in-out' })
      })
      S.built = true
    }

    const cancelTimeline = () => {
      S.anims.forEach((a) => { try { a.cancel() } catch (e) { /* noop */ } })
      S.anims = []
      stopEls.forEach((st) => {
        const el = st.title
        el.style.backgroundImage = ''
        el.style.backgroundSize = ''
        el.style.backgroundPosition = ''
        el.style.webkitBackgroundClip = ''
        el.style.backgroundClip = ''
        el.style.color = ''
      })
      S.built = false
    }

    const updateJS = (T) => {
      if (C) {
        const n = Math.floor(clamp01(T / (CONSOLE_END * TL)) * CONSOLE_TEXT.length)
        const want = T >= TL - 1 ? CONSOLE_TEXT : n <= 0 ? '' : CONSOLE_TEXT.slice(0, n) + (n < CONSOLE_TEXT.length ? '▍' : '')
        if (C.textContent !== want) C.textContent = want
      }
      stopEls.forEach((st) => {
        st.counts.forEach((c) => {
          const lc = (T - (st.F + 45)) / 110
          const done = T >= TL - 1 || lc >= 1
          if (done) {
            if (c.state !== 'done') {
              c.sp.textContent = c.text
              c.sp.style.fontFamily = ''
              c.sp.style.fontSize = ''
              c.sp.style.minWidth = ''
              c.sp.style.display = ''
              c.state = 'done'
            }
          } else {
            if (c.state !== 'run') {
              const w = c.sp.getBoundingClientRect().width
              c.sp.style.display = 'inline-block'
              c.sp.style.minWidth = w + 'px'
              c.sp.style.fontFamily = "'DM Mono', ui-monospace, monospace"
              c.sp.style.fontSize = '0.95em'
              c.state = 'run'
            }
            const k = clamp01(lc)
            const eased = 1 - Math.pow(1 - k, 3)
            const want = groupNum(Math.round(eased * c.target), c.sep)
            if (c.sp.textContent !== want) c.sp.textContent = want
          }
        })
      })
    }

    const startIdles = () => {
      if (S.idling) return
      S.idling = true
      const vert = mmV.matches
      const tr = TR.getBoundingClientRect()
      const D = vert ? TR.scrollHeight : tr.width
      const A = vert ? 'translateY' : 'translateX'
      S.idles.push(PU.animate([
        { transform: A + '(-130px)', opacity: 0 },
        { opacity: 0.35, offset: 0.05 },
        { transform: A + '(' + D + 'px)', opacity: 0.35, offset: 0.37 },
        { transform: A + '(' + D + 'px)', opacity: 0, offset: 0.4 },
        { transform: A + '(' + D + 'px)', opacity: 0 },
      ], { duration: 6000, iterations: Infinity, easing: 'linear' }))
      S.idles.push(PG.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 1600, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }))
      stopEls.forEach((st, i) => {
        S.idles.push(st.icon.animate([{ transform: 'translateY(1.5px)' }, { transform: 'translateY(-1.5px)' }], { duration: 3000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out', delay: -i * 650 }))
      })
    }
    const stopIdles = () => {
      S.idles.forEach((a) => { try { a.cancel() } catch (e) { /* noop */ } })
      S.idles = []
      S.idling = false
    }

    const setTime = (T) => {
      if (T >= TL - 1) {
        if (S.built) cancelTimeline()
        updateJS(TL)
        if (!S.idling) startIdles()
        return
      }
      if (!S.built) buildTimeline()
      if (S.idling) stopIdles()
      S.anims.forEach((a) => { a.currentTime = T })
      updateJS(T)
    }

    // Mobile/vertical: the vertical run is taller than the pinned viewport, so pan
    // the content up with progress (a filmstrip) — the head travels down the line
    // as the timeline scrolls past inside the pin.
    const panVertical = (p) => {
      const overflow = Math.max(0, SK.scrollHeight - root.clientHeight + 48)
      SK.style.transform = overflow ? `translateY(${(-overflow * p).toFixed(1)}px)` : ''
    }

    // progress 0→1 across the pin region (wrapper height minus one viewport).
    const getP = () => {
      const r = wrap.getBoundingClientRect()
      const span = r.height - window.innerHeight
      if (span <= 0) return r.top <= 0 ? 1 : 0
      return clamp01(-r.top / span)
    }

    const tick = () => {
      const p = getP()
      if (p !== S.lastP) {
        S.lastP = p
        setTime(p * TL)
        if (mmV.matches) panVertical(p)
        else SK.style.transform = ''
        S.raf = requestAnimationFrame(tick)
      } else {
        S.running = false // idle: nothing changed, stop the loop until next scroll
      }
    }
    const kick = () => { if (!S.running) { S.running = true; S.raf = requestAnimationFrame(tick) } }

    const onResize = () => {
      stopIdles()
      cancelTimeline()
      S.lastP = -1
      kick()
    }

    // Pre-build so the first painted frame is the hidden start state (no flash),
    // then a fonts-ready re-measure keeps stop positions honest.
    buildTimeline()
    S.anims.forEach((a) => { a.currentTime = 0 })
    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (alive) onResize() }).catch(() => { /* noop */ })
    }

    window.addEventListener('scroll', kick, { passive: true })
    window.addEventListener('resize', onResize)
    kick() // initial sample for the current scroll position

    // Replay — scroll back to the wrapper's start; the scroll-drive rewinds the run.
    const RB = q('[data-pr-replay]')
    const onReplay = () => {
      const top = window.scrollY + wrap.getBoundingClientRect().top
      window.scrollTo({ top, behavior: 'smooth' })
    }
    if (RB) RB.addEventListener('click', onReplay)

    return () => {
      alive = false
      if (S.raf) cancelAnimationFrame(S.raf)
      cancelTimeline()
      stopIdles()
      window.removeEventListener('scroll', kick)
      window.removeEventListener('resize', onResize)
      if (RB) RB.removeEventListener('click', onReplay)
      hoverCleanups.forEach((fn) => fn())
    }
  }, [])

  const heading = t('timeline.eyebrow')

  return (
    <div ref={wrapRef} className="prun-scroll">
      <section ref={rootRef} data-theme="light" className="prun" aria-label={heading}>
        {/* faint dotted world-map + print-grain, both decorative and aria-hidden */}
        <div data-pr-map className="prun-map" aria-hidden="true" />
        <div className="prun-noise" aria-hidden="true" />

        <div data-pr-skew className="prun-skew">
          <header className="prun-header">
            <div className="prun-eyebrow">
              <RegMark />
              <span className="prun-eyebrow-text">OUR JOURNEY · 2014—2026</span>
              <RegMark />
            </div>
            <h2 className="prun-lead">{heading}</h2>
          </header>

          <div data-pr-track className="prun-track">
            <div data-pr-line className="prun-line" aria-hidden="true" />
            <div data-pr-pulse className="prun-pulse" aria-hidden="true" />
            <div data-pr-head className="prun-head" aria-hidden="true">
              <div data-pr-headglow className="prun-headglow" />
              <div data-pr-slit className="prun-slit" />
            </div>

            <ol data-pr-stops className="prun-stops">
              {stops.map((s, i) => {
                const side = i % 2 === 0 ? 'a' : 'b'
                const card = (
                  <div data-pr-card data-pr-o="c" className="prun-card">
                    <h3 data-pr-title className="prun-title">{s.title}</h3>
                    <p className="prun-body">{renderDesc(s.desc)}</p>
                  </div>
                )
                const icon = (
                  <div data-pr-icon data-pr-o="i" className="prun-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="22" height="22" className="prun-icon-svg">
                      {ICONS[i % ICONS.length].map((el, j) =>
                        el.t === 'circle'
                          ? <circle key={j} cx={el.cx} cy={el.cy} r={el.r} />
                          : <path key={j} d={el.d} />,
                      )}
                    </svg>
                  </div>
                )
                const pill = <div data-pr-pill data-pr-o="p" className="prun-pill">{s.year}</div>
                return (
                  <li data-pr-stop data-pr-side={side} className="prun-stop" key={i}>
                    <div data-pr-dotwrap className="prun-dotwrap" aria-hidden="true">
                      <div data-pr-ripple className="prun-ripple" />
                      <div data-pr-dot className="prun-dot" />
                    </div>
                    <div data-pr-wrap className={`prun-wrap prun-wrap--${side}`}>
                      {side === 'a' ? <>{card}{icon}{pill}</> : <>{pill}{icon}{card}</>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div data-pr-console className="prun-console" aria-hidden="true">{CONSOLE_TEXT}</div>
        <button data-pr-replay type="button" className="prun-replay" aria-label="Replay timeline animation">
          <svg viewBox="0 0 24 24" width="12" height="12" className="prun-replay-ic" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>REPLAY</span>
        </button>
      </section>
    </div>
  )
}
