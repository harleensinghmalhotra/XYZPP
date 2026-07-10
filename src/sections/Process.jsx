import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── One Continuous Process — Paper-Feed Press Line (v2) ──────────────────────
// A printing press in motion. A compact gold print-head rides ONLY on the rail
// (never dips into content). As it crosses each node: a soft gold impression
// beam pulses down over that stage (light passing, not a solid object), and the
// stage's custom icon INKS ITSELF into existence via stroke-draw (navy→gold),
// while its label cross-fades in. The head runs past the last node into empty
// rail and fades — the resting frame is a clean fully-inked line, no parked
// roller. Reduced-motion / narrow → fully-printed, fully-drawn final state.

// Custom line icons, authored for stroke-draw. Real path lengths are measured in
// JS (getTotalLength) and set as dasharray/offset — reliable across browsers.
let _pk = 0
const P = (d) => <path key={`p${_pk++}`} className="pdraw" d={d} />
const C = (cx, cy, r) => <circle key={`c${_pk++}`} className="pdraw" cx={cx} cy={cy} r={r} />
const ICONS = {
  printer: [P('M7 9V4h10v5'), P('M5 9h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z'), P('M7 17v4h10v-4')],
  seal: [C(12, 12, 8.5), P('M8.2 12.3l2.7 2.7 4.9-5.6')],
  box: [P('M12 3l8.5 4.4v9.2L12 21l-8.5-4.4V7.4Z'), P('M3.5 7.4 12 11.8l8.5-4.4'), P('M12 11.8V21')],
  warehouse: [P('M3 21V9.2L12 4l9 5.2V21'), P('M2 21h20'), P('M9.3 21v-6.2h5.4V21')],
  truck: [P('M3 7h10.5v9H3Z'), P('M13.5 10h4.1l3.4 3.2V16h-7.5'), C(7, 18, 1.9), C(17.3, 18, 1.9)],
  shield: [P('M12 3l7 2.9V11c0 4.6-3 7.6-7 9.2-4-1.6-7-4.6-7-9.2V5.9Z'), P('M8.7 11.6 11 13.9l4.4-4.7')],
}

const STAGES = [
  { icon: 'printer', name: 'Print', desc: 'Offset and sheet-fed production, calibrated for colour at volume.' },
  { icon: 'seal', name: 'Quality', desc: 'Double quality checks, so it reaches you as expected.' },
  { icon: 'box', name: 'Fulfillment', desc: 'Kitting, collating and packing, tailored to your project.' },
  { icon: 'warehouse', name: 'Warehouse', desc: 'Climate-appropriate storage, released on your timeline.' },
  { icon: 'truck', name: 'Ship', desc: 'Documentation, customs and delivery to 25+ countries.' },
  { icon: 'shield', name: "You're Covered", desc: 'We handle everything, you focus on your mission.' },
]

const OVERSHOOT = 46 // px the head runs past the last node into empty rail

export default function Process() {
  const root = useRef(null)
  const sheet = useRef(null)
  const feed = useRef(null)
  const track = useRef(null)
  const fill = useRef(null)
  const head = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return

    const positionPress = () => {
      if (!sheet.current || !track.current || !fill.current || !head.current) return
      const nodes = el.querySelectorAll('.press-node')
      if (nodes.length < 2) return
      const base = sheet.current.getBoundingClientRect()
      const a = nodes[0].getBoundingClientRect()
      const b = nodes[nodes.length - 1].getBoundingClientRect()
      const left = a.left + a.width / 2 - base.left
      const right = b.left + b.width / 2 - base.left
      const top = a.top + a.height / 2 - base.top
      for (const line of [track.current, fill.current]) {
        line.style.left = `${left}px`
        line.style.width = `${right - left}px`
        line.style.top = `${top}px`
      }
      if (feed.current) feed.current.style.top = `${top}px`
      head.current.style.left = `${left}px`
      head.current.style.top = `${top}px`
    }

    const ctx = gsap.context(() => {
      positionPress()
      if (reduced) return

      const mm = gsap.matchMedia()
      mm.add('(min-width: 901px)', () => {
        const stages = [...el.querySelectorAll('.press-stage')]
        const nodes = el.querySelectorAll('.press-node')
        const cores = el.querySelectorAll('.press-core')
        const flashes = el.querySelectorAll('.press-flash')
        const marks = el.querySelectorAll('.press-mark')
        const iconSvgs = el.querySelectorAll('.press-icon svg')
        const labels = el.querySelectorAll('.press-label')
        const allDraw = el.querySelectorAll('.pdraw')
        const grain = el.querySelector('.press-grain')

        // node centres relative to the sheet → precise head/ink timing
        const sr = sheet.current.getBoundingClientRect()
        const cx = [...nodes].map((n) => { const r = n.getBoundingClientRect(); return r.left + r.width / 2 - sr.left })
        const dist = cx[cx.length - 1] - cx[0]
        const headTravel = dist + OVERSHOOT

        // animate-FROM states (CSS holds the printed/drawn final truth)
        gsap.set(fill.current, { scaleX: 0 })
        gsap.set(head.current, { x: 0, autoAlpha: 0 })
        gsap.set(nodes, { borderColor: 'rgba(15,36,68,0.22)' })
        gsap.set(cores, { autoAlpha: 0, scale: 0.4 })
        // measure each stroke and set it fully un-drawn (dash = length, offset = length)
        allDraw.forEach((pth) => {
          const L = pth.getTotalLength() || 1
          gsap.set(pth, { strokeDasharray: L, strokeDashoffset: L })
        })
        gsap.set(iconSvgs, { color: '#0f2444' })
        gsap.set(labels, { autoAlpha: 0.26, y: 8 })
        gsap.set(flashes, { autoAlpha: 0 })
        gsap.set(marks, { scaleX: 0, autoAlpha: 0 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            // full travel (stage 1→6) completes while the whole band is still
            // on screen: start as the top enters, END with the section centred.
            trigger: el, start: 'top 82%', end: 'center center', scrub: 0.5,
            invalidateOnRefresh: true, onRefresh: positionPress,
          },
        })
        // head travels the rail, fill trails it to the last node, grain drifts
        tl.to(head.current, { x: headTravel, duration: 1 }, 0)
          .to(fill.current, { scaleX: 1, duration: dist / headTravel }, 0)
          .to(head.current, { autoAlpha: 1, duration: 0.04 }, 0)
          .to(head.current, { autoAlpha: 0, duration: 0.06 }, 0.94) // fade out past node 6
        if (grain) tl.to(grain, { xPercent: -6, duration: 1 }, 0)

        stages.forEach((st, i) => {
          const at = (cx[i] - cx[0]) / headTravel // progress when the head arrives
          const draw = st.querySelectorAll('.pdraw')
          tl.to(nodes[i], { borderColor: '#9b7420', duration: 0.03 }, at)
            .to(cores[i], { autoAlpha: 1, scale: 1, duration: 0.05, ease: 'power2.out' }, at)
            .to(nodes[i], { keyframes: { scale: [1, 1.14, 1] }, duration: 0.11, ease: 'power2.out' }, at)
            // impression beam: light passing over the stage, fades immediately
            .to(flashes[i], { keyframes: { autoAlpha: [0, 0.18, 0] }, duration: 0.15, ease: 'power1.inOut' }, at)
            // the icon inks itself into existence
            .to(draw, { strokeDashoffset: 0, duration: 0.2, stagger: 0.018, ease: 'power2.out' }, at)
            .to(iconSvgs[i], { color: '#9b7420', duration: 0.1, ease: 'none' }, at + 0.11)
            // the impression the beam leaves behind — sets and stays
            .to(marks[i], { scaleX: 1, autoAlpha: 1, duration: 0.1, ease: 'power2.out' }, at + 0.06)
            .to(labels[i], { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power2.out' }, at + 0.02)
        })
        return () => tl.scrollTrigger?.kill()
      })
    }, root)

    window.addEventListener('resize', positionPress)
    return () => {
      window.removeEventListener('resize', positionPress)
      ctx.revert()
    }
  }, [reduced])

  return (
    <section id="process" ref={root} data-theme="light" className="press" aria-labelledby="press-title">
      <div className="press-inner">
        <header className="press-head-copy">
          <h2 id="press-title" className="press-title">One Continuous Process.</h2>
          <p className="press-sub">
            One partner. One workflow. We take care of everything so you can focus on your mission.
          </p>
        </header>

        <div className="press-bed">
          <span className="press-roller press-roller--l" aria-hidden="true" />
          <span className="press-roller press-roller--r" aria-hidden="true" />

          <div className="press-sheet" ref={sheet}>
            <span className="press-grain" aria-hidden="true" />
            <span className="press-feed" ref={feed} aria-hidden="true" />
            <span className="press-track" ref={track} aria-hidden="true" />
            <span className="press-fill" ref={fill} aria-hidden="true" />
            <span className="press-headbar" ref={head} aria-hidden="true"><i /><i /></span>

            <ol className="press-stages">
              {STAGES.map((s) => (
                <li className="press-stage" key={s.name}>
                  <span className="press-flash" aria-hidden="true" />
                  <span className="press-node" aria-hidden="true"><span className="press-core" /></span>
                  <div className="press-copy">
                    <span className="press-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none">{ICONS[s.icon]}</svg>
                    </span>
                    <span className="press-mark" aria-hidden="true" />
                    <div className="press-label">
                      <h3 className="press-name">{s.name}</h3>
                      <p className="press-desc">{s.desc}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
