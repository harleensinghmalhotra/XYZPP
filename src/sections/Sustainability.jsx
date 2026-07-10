import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Sustainability — "Responsible by Practice." ──────────────────────────────
// A section with stature (~80vh): a living olive display panel LEFT, editorial
// text RIGHT. While Harry's cutout is pending, the panel ships a real showpiece —
// a stroke-drawn paper+leaf motif with floating micro-stat chips. When
// public/qfp/sustain/hero-cutout.png lands, the <img> loads and the section
// toggles to the 3D cutout pop (motif + chips give way) — zero code change.

const BULLETS = [
  'Near zero waste press floors, offcuts recovered and reused across every facility',
  'FSC certified paper sourcing built into how we buy, not an add on',
  'ISO 14001:2015 certified environmental management system across our facilities',
  'Responsible disposal of ink, chemicals and press waste, audited and documented',
]

const CHIPS = [
  { text: '0 waste-to-landfill target', cls: 'sustain-chip--a' },
  { text: 'FSC certified', cls: 'sustain-chip--b' },
  { text: 'ISO 14001:2015', cls: 'sustain-chip--c' },
]

function Leaf() {
  return (
    <svg className="sustain-leaf" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
      <path d="M4 21c1.5-4 4-6.5 7.5-8" />
    </svg>
  )
}

// Layered paper sheets fanning + a leaf emerging — authored for stroke-draw
// (every stroke is a .pdraw path measured with getTotalLength in JS).
function Motif() {
  const sheet = 'M12,0 H92 A12,12 0 0 1 104,12 V124 A12,12 0 0 1 92,136 H12 A12,12 0 0 1 0,124 V12 A12,12 0 0 1 12,0 Z'
  return (
    <svg className="sustain-motif" viewBox="0 0 240 240" fill="none" aria-hidden="true">
      {/* back sheet */}
      <g transform="translate(52,58) rotate(-10)">
        <path className="pdraw" d={sheet} />
      </g>
      {/* front sheet + text lines */}
      <g transform="translate(84,50) rotate(8)">
        <path className="pdraw" d={sheet} />
        <path className="pdraw" d="M22,50 H84" />
        <path className="pdraw" d="M22,70 H88" />
        <path className="pdraw" d="M22,90 H64" />
        <path className="pdraw" d="M22,110 H80" />
      </g>
      {/* leaf emerging from the top */}
      <g transform="translate(150,30) rotate(6) scale(2.4)">
        <path className="pdraw" d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
        <path className="pdraw" d="M4 21c1.5-4 4-6.5 7.5-8" />
      </g>
    </svg>
  )
}

export default function Sustainability() {
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [imgOk, setImgOk] = useState(false)

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.sustain-eyebrow, .sustain-title, .sustain-intro'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.sustain-media'), { autoAlpha: 0, y: 24, scale: 0.98 })
      gsap.set(q('.sustain-item'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.sustain-chip'), { autoAlpha: 0 })

      // measure every motif stroke and hold it un-drawn (the press-line ink-in trick)
      const draws = q('.sustain-motif .pdraw')
      draws.forEach((p) => { const L = p.getTotalLength() || 1; gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }) })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true } })
      tl.to(q('.sustain-media'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0)
        .to(draws, { strokeDashoffset: 0, duration: 0.95, stagger: 0.06, ease: 'power2.out' }, 0.2)
        .to(q('.sustain-chip'), { autoAlpha: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, 0.7)
        .to(q('.sustain-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.15)
        .to(q('.sustain-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.22)
        .to(q('.sustain-intro'), { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.32)
        .to(q('.sustain-item'), { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.09, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.4)

      // slow parallax drift on the chips (2–4px, staggered periods)
      q('.sustain-chip').forEach((chip, i) => {
        gsap.to(chip, { y: i % 2 ? 4 : -4, x: i === 1 ? 3 : 0, duration: 2.6 + i * 0.7, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1 + i * 0.2 })
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="sustainability" ref={root} data-theme="light" className="sustain" aria-labelledby="sustain-title">
      <div className="sustain-inner">
        {/* LEFT — living olive panel (motif + chips), or the cutout pop when it lands */}
        <div className={`sustain-media${imgOk ? ' has-cutout' : ''}`}>
          <div className="sustain-panel">
            {!imgOk && (
              <>
                <Motif />
                {CHIPS.map((c) => (
                  <span key={c.text} className={`sustain-chip ${c.cls}`}>{c.text}</span>
                ))}
              </>
            )}
          </div>
          <img
            className="sustain-cutout"
            src="/qfp/sustain/hero-cutout.png"
            alt="Stack of recycled paper"
            loading="lazy"
            decoding="async"
            style={{ opacity: imgOk ? 1 : 0 }}
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
          />
        </div>

        {/* RIGHT — editorial text */}
        <div className="sustain-body">
          <p className="sustain-eyebrow">Environmental Responsibility</p>
          <h2 id="sustain-title" className="sustain-title">Responsible by Practice.</h2>
          <p className="sustain-intro">
            We are a printing company first, but the way we run our floors already reflects a lot of what
            sustainability asks for.
          </p>
          <ul className="sustain-list">
            {BULLETS.map((b) => (
              <li className="sustain-item" key={b}>
                <Leaf />
                <span className="sustain-item-text">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
