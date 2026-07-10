import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Certifications — faithful port of Alternativ's certs section, QFP content ──
// Signature: the cream section sweeps in on a giant dome/arc over the section above
// and the next dark section arcs in below. Three functional filter pills, a slow
// rotating seal, and a flat hairline-card carousel (scroll / drag + arrow buttons).

// Filter pills → which cards they reveal (default: all shown, first pill active).
const PILLS = [
  { key: 'certifications', label: 'Certifications', tint: 'gold' },
  { key: 'environment', label: 'Environment', tint: 'olive' },
  { key: 'social', label: 'Social responsibility', tint: 'navy' },
]

const CERTS = [
  {
    key: 'fsc',
    cats: ['environment'],
    eyebrow: 'Forest Stewardship Council',
    title: 'FSC Chain of Custody',
    logo: 'fsc.webp',
    // COMPLIANCE LAW: the FSC licence code must render with the FSC mark on every
    // surface it appears — the card cannot ship without it.
    code: 'TUVDC-COC-101258',
    body: 'FSC Chain of Custody certification tracks certified material through every step of the supply chain. It confirms that the paper we print on is sourced from responsibly managed forests meeting strict environmental and social standards. Each job can be traced from forest to finished book.',
  },
  {
    key: 'iso9001',
    cats: ['certifications'],
    eyebrow: 'Quality Management',
    title: 'ISO 9001:2015',
    logo: 'iso.webp',
    body: 'ISO 9001:2015 is the international standard for quality management systems. It certifies that our processes are documented, monitored and continually improved to meet customer and regulatory requirements. Independent audits renew the certification and hold every facility to the same benchmark.',
  },
  {
    key: 'iso14001',
    cats: ['environment'],
    eyebrow: 'Environmental Management',
    title: 'ISO 14001:2015',
    logo: 'iso.webp',
    body: 'ISO 14001:2015 sets the framework for a certified environmental management system. It requires us to identify, control and continually reduce the environmental impact of our operations — from waste and energy to emissions. Compliance is verified through regular external assessment.',
  },
  {
    key: 'sedex',
    cats: ['social'],
    eyebrow: 'Ethical Trade Audit',
    title: 'Sedex Member',
    logo: 'sedex.webp',
    body: 'Sedex membership underpins our commitment to ethical and responsible sourcing. Through the SMETA audit our labour standards, health and safety, environment and business ethics are independently assessed. Findings are shared transparently with customers on the Sedex platform.',
  },
  {
    key: 'star',
    cats: ['certifications'],
    eyebrow: 'Govt. of India',
    title: 'Star Export House',
    typographic: true,
    body: 'Star Export House is a status awarded by the Government of India’s Directorate General of Foreign Trade to recognised, high-performing exporters. It reflects a sustained record of export excellence and reliability, and it streamlines customs and trade procedures for the shipments we deliver worldwide.',
  },
]

function CheckMark() {
  return (
    <svg className="cert-check" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 10.4l2.6 2.6L14 7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Certifications() {
  const root = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [active, setActive] = useState(null) // null → all shown (first pill styled active)
  const [arrows, setArrows] = useState({ prev: false, next: true })

  const visible = active ? CERTS.filter((c) => c.cats.includes(active)) : CERTS

  // arrow enable/disable from scroll position
  const syncArrows = () => {
    const el = viewport.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setArrows({ prev: el.scrollLeft > 4, next: el.scrollLeft < max - 4 })
  }
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    el.scrollTo({ left: 0 })
    // let layout settle after a filter change, then re-read the extents
    const id = requestAnimationFrame(syncArrows)
    return () => cancelAnimationFrame(id)
  }, [active])

  const nudge = (dir) => {
    const el = viewport.current
    if (!el) return
    const card = el.querySelector('.cert-card')
    const step = card ? card.offsetWidth + 20 : 360
    el.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' })
  }

  // drag-to-scroll (pointer) — feels like the reference carousel
  useEffect(() => {
    const el = viewport.current
    if (!el) return
    let down = false, startX = 0, startLeft = 0, moved = false
    const onDown = (e) => { down = true; moved = false; startX = e.clientX; startLeft = el.scrollLeft; el.setPointerCapture?.(e.pointerId) }
    const onMove = (e) => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; el.scrollLeft = startLeft - dx }
    const onUp = (e) => { down = false; el.releasePointerCapture?.(e.pointerId) }
    // swallow click after a drag so cards/arrows don't misfire
    const onClick = (e) => { if (moved) { e.preventDefault(); e.stopPropagation() } }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('click', onClick, true)
    el.addEventListener('scroll', syncArrows, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('click', onClick, true)
      el.removeEventListener('scroll', syncArrows)
    }
  }, [])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.certs-pills, .certs-title, .certs-sub, .certs-seal'), { autoAlpha: 0, y: 18 })
      gsap.set(q('.cert-card'), { autoAlpha: 0, y: 28 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 68%', once: true } })
      tl.to(q('.certs-pills'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.certs-seal'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.05)
        .to(q('.certs-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.1)
        .to(q('.certs-sub'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.2)
        .to(q('.cert-card'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.25)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="certifications" ref={root} data-theme="light" className="certs" aria-labelledby="certs-title">
      {/* signature curve — cream dome sweeping over the section above */}
      <svg className="certs-arc-top" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,160 L1440,160 L1440,108 Q720,-34 0,108 Z" fill="#fdfaf4" />
      </svg>

      <div className="certs-inner">
        <div className="certs-top">
          {/* filter pills */}
          <div className="certs-pills" role="group" aria-label="Filter certifications">
            {PILLS.map((p, i) => {
              const isActive = active === p.key || (active === null && i === 0)
              return (
                <button
                  key={p.key}
                  type="button"
                  data-filter={p.key}
                  className={`certs-pill certs-pill--${p.tint}${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActive((prev) => (prev === p.key ? null : p.key))}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* rotating seal */}
          <div className="certs-seal" aria-hidden="true">
            <svg className="certs-seal-ring" viewBox="0 0 200 200">
              <defs>
                <path id="certSealPath" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text>
                <textPath href="#certSealPath" startOffset="0">
                  TRUST · RESPONSIBILITY · TRUST · RESPONSIBILITY ·&nbsp;
                </textPath>
              </text>
            </svg>
            <span className="certs-seal-core">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 4 13c0-5 4-8 9-9 0 6-2 11-9 12" />
                <path d="M4 21c1.5-4 4-6.5 7.5-8" />
              </svg>
            </span>
          </div>
        </div>

        {/* headline */}
        <div className="certs-head">
          <h2 id="certs-title" className="certs-title">Certified for Quality.</h2>
          <p className="certs-sub">
            Quality products, environmental consciousness and ethical trade — audited, certified, and renewed.
          </p>
        </div>

        {/* card carousel */}
        <div className="certs-carousel">
          <div className="certs-viewport" ref={viewport} tabIndex={0} role="group" aria-label="Certifications carousel (scroll or use arrow keys)">
            <div className="certs-track">
              {visible.map((c) => (
                <article className="cert-card" key={c.key}>
                  <div className="cert-card-eyebrow">
                    <CheckMark />
                    <span>{c.eyebrow}</span>
                  </div>

                  <div className="cert-card-mark">
                    {c.typographic ? (
                      <div className="cert-star" aria-label="Star Export House">
                        <span className="cert-star-glyph" aria-hidden="true">★</span>
                        <span className="cert-star-word">STAR EXPORT<br />HOUSE</span>
                      </div>
                    ) : (
                      <img src={`/qfp/certs/${c.logo}`} alt={`${c.title} logo`} loading="lazy" decoding="async" />
                    )}
                    <div className="cert-card-title">{c.title}</div>
                    {c.code && <div className="cert-card-code">Licence {c.code}</div>}
                  </div>

                  <p className="cert-card-body">{c.body}</p>
                </article>
              ))}
            </div>
          </div>

          {/* prev / next arrows — grey inactive, navy active */}
          <div className="certs-arrows">
            <button type="button" className="certs-arrow" onClick={() => nudge(-1)} disabled={!arrows.prev} aria-label="Previous certifications">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" className="certs-arrow" onClick={() => nudge(1)} disabled={!arrows.next} aria-label="Next certifications">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* signature curve — the next dark section (techniques strip) arcs in below */}
      <svg className="certs-arc-bottom" viewBox="0 0 1440 150" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,150 L1440,150 L1440,70 Q720,-10 0,70 Z" fill="#0f2444" />
      </svg>
    </section>
  )
}
