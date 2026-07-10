import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Awards & Press — pixel-faithful port of the approved Claude Design export ──
// Navy plaque cards with gold-foil names, a CAPEXIL/press label row, and the
// Forbes press-clipping card. One approved change vs the export: the "RECOGNITION"
// eyebrow LOSES its gold dash/hairline. Only motion added: a subtle stagger reveal
// on the four cards (the export is static); reduced-motion → static.

const CARDS = [
  { key: 'pw24', img: 'award-01.webp', ph: 'PrintWeek 2024 ceremony photo', label: 'INDUSTRY AWARD', name: 'PrintWeek 2024', body: 'Book Education Company of the Year' },
  { key: 'pw23', img: 'award-02.webp', ph: 'PrintWeek 2023 ceremony photo', label: 'INDUSTRY AWARD', name: 'PrintWeek 2023', body: 'Export Company of the Year' },
  { key: 'forbes', forbes: true, label: 'PRESS FEATURE', name: 'Forbes India', body: 'D.Gems 2024' },
  { key: 'capexil', img: 'award-04.webp', ph: 'CAPEXIL ceremony photo', label: 'EXPORT HONOR', name: 'CAPEXIL', body: 'Highest Exporter, 3 Consecutive Years' },
]

// The Forbes card's photo zone IS a designed press clipping (no photo needed).
function ForbesClipping() {
  return (
    <div className="aw-clip">
      <div className="aw-clip-head">
        <span className="aw-clip-masthead">Forbes India</span>
        <span className="aw-clip-date">DEC 2024</span>
      </div>
      <div className="aw-clip-rule" />
      <div className="aw-clip-headline">The D.Gems List, 2024</div>
      <div className="aw-clip-lines">
        <span style={{ width: '100%' }} />
        <span style={{ width: '93%' }} />
        <span style={{ width: '98%' }} />
        <span style={{ width: '58%' }} />
      </div>
    </div>
  )
}

// Silent drop-in photo: real webp reveals on load and hides the elegant frame
// placeholder; a 404 keeps the placeholder (zero code change when the file lands).
function AwardPhoto({ img, ph }) {
  const [ok, setOk] = useState(false)
  return (
    <>
      <img
        className="aw-photo-img"
        src={`/qfp/awards/${img}`}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ opacity: ok ? 1 : 0 }}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
      />
      {!ok && <div className="aw-photo-ph" aria-hidden="true"><span>{ph}</span></div>}
    </>
  )
}

export default function Awards() {
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.aw-head, .aw-more'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.plq'), { autoAlpha: 0, y: 28 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 72%', once: true } })
      tl.to(q('.aw-head'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        // clearProps hands the cards back to CSS so :hover lift/sheen work
        .to(q('.plq'), { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.15)
        .to(q('.aw-more'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.5)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="awards" ref={root} data-theme="dark" className="aw" aria-labelledby="aw-title">
      {/* lighting spans the FULL section — beams emerge from the top edges */}
      <div className="aw-glow" aria-hidden="true" />
      <div className="aw-carpet" aria-hidden="true" />
      <div className="aw-vignette" aria-hidden="true" />
      <div className="aw-inner">
        <div className="aw-content">
          {/* header — eyebrow (dash removed) + heading */}
          <div className="aw-head">
            <p className="aw-eyebrow">Recognition</p>
            <h2 id="aw-title" className="aw-title">Awards &amp; Press.</h2>
          </div>

          {/* four plaque cards */}
          <div className="aw-grid">
            {CARDS.map((c) => (
              <article className="plq" key={c.key}>
                <div className="aw-photo">
                  {c.forbes ? <ForbesClipping /> : <AwardPhoto img={c.img} ph={c.ph} />}
                  <div className="plq-tint" aria-hidden="true" />
                  <div className="plq-sheen" aria-hidden="true" />
                </div>
                <div className="aw-body">
                  <div className="aw-label">{c.label}</div>
                  <h3 className="aw-name">{c.name}</h3>
                  <p className="aw-desc">{c.body}</p>
                </div>
              </article>
            ))}
          </div>

          {/* explore link, bottom-right */}
          <div className="aw-more">
            <a href="#" className="aw-more-link">EXPLORE MORE AWARDS &amp; PRESS →</a>
          </div>
        </div>
      </div>
    </section>
  )
}
