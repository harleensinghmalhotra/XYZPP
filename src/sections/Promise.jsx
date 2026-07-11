import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── Our Promise ──────────────────────────────────────────────────────────────
// Replaces the Mandela video quote. A quiet, cinematic pull-quote on deep navy.
// "Fluid Motion" kinetic reveal: as the section scrolls in, the quote reveals
// word-by-word — each word rises + fades + blur→sharp, staggered L→R, SCRUBBED
// to scroll position. Monochrome cream; emphasis is WEIGHT only (light 300 vs
// bold 700), never colour. Weights are STATIC — only opacity/transform/filter
// animate (animating font-weight would reflow). Gold appears ONLY on the small
// eyebrow + attribution labels, never on the quote.
//
// Read-the-bold-alone test: bold words = "mission is education. ensure nothing gets in its way."

// Split translated segments into per-word tokens for the kinetic L→R reveal.
// Emphasis (bold vs light) is carried per segment; word order comes from the
// active language so the "read-the-bold-alone" line survives translation.
function segmentsToWords(segments) {
  return segments.flatMap((seg, si) =>
    seg.text.split(' ').map((w, wi) => ({ w, bold: seg.bold, key: `${si}-${wi}` })),
  )
}

// ── The Sentence Assembly Line ────────────────────────────────────────────────
// Ekta killed the wavy background; Harry's replacement turns the promise copy
// into quiet machinery. The five subline units — Printing · Kitting · Quality
// checks · Warehousing · Shipment (pulled VERBATIM from the locale support line,
// split on periods; FR = Impression · Assemblage · Contrôles qualité · Entreposage
// · Expédition) — ride a hairline gold conveyor on the section's right half. Each
// word slides in, pauses at a station where a miniature customs stamp (the exact
// shelf-book stamp language: a gold ring + dashed perforation + a ✶ star) presses
// down and leaves a small gold seal on the word, then the word exits as the next
// enters. Continuous, calm, staggered — alive but never busy.
//
// CSS/SVG transforms only — NO WebGL, near-zero GPU cost. The whole thing is
// decorative (aria-hidden): the real, screen-reader-read words already live in
// the .promise-support paragraph on the left. Reduced motion → a static neat
// stack of all five words, each already stamped, no movement.

// The mini customs stamp — the shelf-book stamp language shrunk to a seal head.
function MiniStamp() {
  return (
    <svg className="pl-stamp-svg" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.3 2.6" opacity="0.6" />
      <text x="20" y="24.6" textAnchor="middle" className="pl-stamp-star">✶</text>
    </svg>
  )
}

// Build the belt geometry for a measured box: a shallow gold sag curve (structural
// geometry, NOT a straight glowing line), belt-edge tick marks, and two small
// station brackets where the stamp lands. Returns the path strings + the belt
// function y(x) so travelling words stay glued to the curve.
function buildTrack(W, H) {
  const baseY = H * 0.44
  const sag = H * 0.13
  const beltY = (x) => baseY + sag * Math.sin(Math.PI * Math.min(Math.max(x / W, 0), 1))
  let beltD = ''
  const N = 48
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * W
    beltD += (i ? 'L' : 'M') + x.toFixed(1) + ',' + beltY(x).toFixed(1) + ' '
  }
  let ticksD = ''
  for (let k = 1; k < 12; k++) {
    const x = (k / 12) * W
    const y = beltY(x)
    ticksD += 'M' + x.toFixed(1) + ',' + (y + 3).toFixed(1) + 'L' + x.toFixed(1) + ',' + (y + 9).toFixed(1) + ' '
  }
  const xs = W * 0.5
  const ys = beltY(xs)
  const stationD =
    'M' + (xs - 15).toFixed(1) + ',' + (ys - 1).toFixed(1) + 'L' + (xs - 8).toFixed(1) + ',' + (ys - 1).toFixed(1) +
    ' M' + (xs + 8).toFixed(1) + ',' + (ys - 1).toFixed(1) + 'L' + (xs + 15).toFixed(1) + ',' + (ys - 1).toFixed(1)
  return { beltY, beltD, ticksD, stationD }
}

function PromiseLine({ words, reduced }) {
  const box = useRef(null)
  const svg = useRef(null)
  const belt = useRef(null)
  const ticks = useRef(null)
  const station = useRef(null)
  const stamp = useRef(null)
  const wordEls = useRef([])
  const sealEls = useRef([])

  useEffect(() => {
    const boxEl = box.current
    if (!boxEl) return
    let ctx = null
    let io = null

    const build = () => {
      if (ctx) { ctx.revert(); ctx = null }
      if (io) { io.disconnect(); io = null }
      const rect = boxEl.getBoundingClientRect()
      const W = Math.max(1, rect.width)
      const H = Math.max(1, rect.height)
      const track = buildTrack(W, H)
      svg.current.setAttribute('viewBox', `0 0 ${W} ${H}`)
      belt.current.setAttribute('d', track.beltD)
      ticks.current.setAttribute('d', track.ticksD)
      station.current.setAttribute('d', track.stationD)
      if (reduced) return // static composition: track only; words placed by CSS

      ctx = gsap.context(() => {
        const beltY = track.beltY
        const enterDur = 1.0, sealDur = 0.2, hold = 0.4, travelDur = 1.0, exitDur = 0.9
        const L = enterDur + sealDur + hold + travelDur + exitDur
        const STAGGER = 2.3
        const P = words.length * STAGGER // full-loop period → seamless retile
        const cStart = -0.12 * W, cStation = 0.5 * W, cMid = 0.8 * W, cEnd = 1.16 * W

        const master = gsap.timeline()

        wordEls.current.forEach((el, i) => {
          if (!el) return
          const seal = sealEls.current[i]
          const w = el.offsetWidth
          const h = el.offsetHeight
          const tx = (cx) => cx - w / 2                 // translateX so the word is centred on cx
          const topY = (cx) => beltY(cx) - h / 2        // translateY so its middle sits on the belt
          const follow = () => { const cx = gsap.getProperty(el, 'x') + w / 2; gsap.set(el, { y: topY(cx) }) }

          const tl = gsap.timeline({ repeat: -1, repeatDelay: P - L })
          tl.set(el, { x: tx(cStart), y: topY(cStart), scale: 0.86, autoAlpha: 0, transformOrigin: '50% 50%' })
            .set(seal, { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 60%' })
            // slide in to the station
            .to(el, { x: tx(cStation), scale: 1, autoAlpha: 1, duration: enterDur, ease: 'power2.out', onUpdate: follow })
            // the stamp lands here (driven by the stamp timeline) → the seal blooms
            .to(seal, { autoAlpha: 1, scale: 1, duration: sealDur, ease: 'back.out(2.2)' })
            .to(el, { duration: hold })                 // dwell under the stamp
            // continue down the belt
            .to(el, { x: tx(cMid), scale: 0.97, duration: travelDur, ease: 'sine.inOut', onUpdate: follow })
            // exit off the right end
            .to(el, { x: tx(cEnd), scale: 0.9, autoAlpha: 0, duration: exitDur, ease: 'power1.in', onUpdate: follow })
          master.add(tl, i * STAGGER)
        })

        // the shared stamp presses once per word arrival (every STAGGER seconds),
        // first press timed to the first word reaching the station.
        const firstEl = wordEls.current[0]
        const hRef = firstEl ? firstEl.offsetHeight : 22
        const slamCY = beltY(cStation) - hRef / 2 - 5 // stamp centre just above the word
        const lift = 24
        gsap.set(stamp.current, { x: cStation - 20, y: slamCY - 20 - lift, scale: 0.8, autoAlpha: 0, transformOrigin: '50% 100%' })
        const stampTL = gsap.timeline({ repeat: -1 })
        stampTL
          .to(stamp.current, { y: slamCY - 20, scale: 1, autoAlpha: 1, duration: 0.12, ease: 'power3.in' }) // slam
          .to(stamp.current, { scale: 0.92, duration: 0.08, ease: 'power2.out' })                            // impact settle
          .to(stamp.current, { y: slamCY - 20 - lift, scale: 0.8, autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }) // lift
          .to(stamp.current, { duration: STAGGER - 0.5 })                                                    // wait for next word
        master.add(stampTL, enterDur)

        // pause the whole line while the section is off screen (perf)
        io = new IntersectionObserver(([e]) => master.paused(!e.isIntersecting), { threshold: 0.01 })
        io.observe(boxEl)
      }, boxEl)
    }

    build()
    const onResize = () => build()
    window.addEventListener('resize', onResize)
    // rebuild once webfonts settle so word widths are exact
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build)
    return () => {
      window.removeEventListener('resize', onResize)
      if (io) io.disconnect()
      if (ctx) ctx.revert()
    }
  }, [reduced, words])

  return (
    <div className={`promise-line${reduced ? ' promise-line--static' : ''}`} ref={box} aria-hidden="true">
      <svg className="pl-track" ref={svg} preserveAspectRatio="none">
        <path className="pl-belt" ref={belt} />
        <path className="pl-ticks" ref={ticks} />
        <path className="pl-station" ref={station} />
      </svg>
      {reduced ? (
        <div className="pl-row">
          {words.map((word, i) => (
            <div className="pl-word pl-word--static" key={i}>
              <span className="pl-word-t">{word}</span>
              <span className="pl-seal">✶</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="pl-stamp" ref={stamp}><MiniStamp /></div>
          {words.map((word, i) => (
            <div className="pl-word" key={i} ref={(el) => (wordEls.current[i] = el)}>
              <span className="pl-word-t">{word}</span>
              <span className="pl-seal" ref={(el) => (sealEls.current[i] = el)}>✶</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function PromiseSection() {
  const { t } = useTranslation('home')
  const root = useRef(null)
  const bg = useRef(null)
  const [reduced] = useState(prefersReduced)

  const segments = t('promise.segments', { returnObjects: true })
  const WORDS = segmentsToWords(Array.isArray(segments) ? segments : [])

  // The five assembly-line units are the period-delimited stages of the promise
  // subline — pulled verbatim from the active locale, nothing invented.
  const support = t('promise.support')
  const LINE_WORDS = support.split('.').map((s) => s.trim()).filter(Boolean).slice(0, 5)

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const words = q('.pq-w')

      // Hidden initial state set in a layout effect (no flash). CSS resting state
      // is the FINAL state, so reduced-motion / no-JS shows the quote instantly.
      gsap.set(q('.promise-eyebrow'), { autoAlpha: 0, y: 12 })
      gsap.set(words, { autoAlpha: 0, yPercent: 70, filter: 'blur(9px)' })
      gsap.set([q('.promise-support'), q('.promise-attr')], { autoAlpha: 0, y: 16 })

      // Scrubbed timeline — the playhead tracks scroll position; the word stagger
      // becomes a left-to-right progressive reveal as the section rises into view.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top 82%', end: 'top 24%', scrub: 0.6 },
      })
      tl.to(q('.promise-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5 })
        .to(words, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.5 }, 0.25)
        .to(q('.promise-support'), { autoAlpha: 1, y: 0, duration: 0.5 }, '>-0.15')
        .to(q('.promise-attr'), { autoAlpha: 1, y: 0, duration: 0.5 }, '>-0.25')

      // faint depth layer drifts on a parallax offset
      gsap.to(bg.current, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="promise" ref={root} data-theme="dark" className="promise" aria-label={t('promise.aria')}>
      <div className="promise-bg" ref={bg} aria-hidden="true" />
      <PromiseLine words={LINE_WORDS} reduced={reduced} />
      <div className="promise-inner">
        <p className="promise-eyebrow">{t('promise.eyebrow')}</p>
        <blockquote className="promise-quote">
          {WORDS.map(({ w, bold, key }) => (
            <span key={key} className={`pq-w ${bold ? 'pq-bold' : 'pq-light'}`}>{w}</span>
          ))}
        </blockquote>
        <p className="promise-support">{t('promise.support')}</p>
        <p className="promise-attr">{t('promise.attribution')}</p>
      </div>
    </section>
  )
}
