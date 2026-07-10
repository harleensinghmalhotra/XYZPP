import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import WavyBackground from '@/components/WavyBackground'

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

const SEGMENTS = [
  { bold: false, text: 'Your' },
  { bold: true, text: 'mission is education.' },
  { bold: false, text: 'Ours is to' },
  { bold: true, text: 'ensure nothing gets in its way.' },
]
const WORDS = SEGMENTS.flatMap((seg, si) =>
  seg.text.split(' ').map((w, wi) => ({ w, bold: seg.bold, key: `${si}-${wi}` })),
)

export default function PromiseSection() {
  const root = useRef(null)
  const bg = useRef(null)
  const [reduced] = useState(prefersReduced)

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
    <section id="promise" ref={root} data-theme="dark" className="promise" aria-label="Our promise">
      <WavyBackground className="promise-waves" />
      <div className="promise-bg" ref={bg} aria-hidden="true" />
      <div className="promise-inner">
        <p className="promise-eyebrow">Our Promise</p>
        <blockquote className="promise-quote">
          {WORDS.map(({ w, bold, key }) => (
            <span key={key} className={`pq-w ${bold ? 'pq-bold' : 'pq-light'}`}>{w}</span>
          ))}
        </blockquote>
        <p className="promise-support">
          Printing. Kitting. Quality checks. Warehousing. Shipment. One system, start
          to finish, with nothing left to chance.
        </p>
        <p className="promise-attr">Quarterfold Printabilities&nbsp;·&nbsp;Est. 2014</p>
      </div>
    </section>
  )
}
