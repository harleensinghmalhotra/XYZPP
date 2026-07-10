import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import CountUp from '@/components/CountUp'
import Seo from '@/components/Seo'
import './InfrastructurePage.css'

gsap.registerPlugin(ScrollTrigger)

// ── /infrastructure — "Built for Scale. Engineered for Trust." ───────────────
// Structure + rhythm reskinned from dispel.com into QFP brand System B:
//   1 statement hero (navy) + dual CTA · 2 certification trust strip (cream)
//   3 capability accordion + tall side image + embedded quote (beige)
//   4 machine cards, 2 large + 2 small (cream) · 5 measurable-results band + video (navy)
//   6 recognition plaques (beige) · 7 facility gallery, photos only (cream) · 8 CTA (beige)
// Every image + the walkthrough video are PENDING from the client: each surface is
// a premium navy placeholder that a delivered asset drops into with zero code change.
//   public/qfp/infra/facility-0{1..3}.webp   (accordion side image)
//   public/qfp/infra/gallery-0{1..4}.webp     (facility strip)
//   public/qfp/infra/walkthrough.mp4 + .vtt   (then flip VIDEO_READY → true)

// Walkthrough video gate (reused from the homepage Infrastructure section). Stays
// false until the client delivers the MP4. COMPLIANCE: the final video must ship
// with closed captions (walkthrough.vtt) + a text transcript BEFORE this flips on.
const VIDEO_READY = false
const VIDEO_SRC = '/qfp/infra/walkthrough.mp4'
const VIDEO_VTT = '/qfp/infra/walkthrough.vtt'

const CERTS = [
  { name: 'FSC Chain of Custody', sub: 'Responsible paper sourcing', logo: 'fsc.webp', code: 'TUVDC-COC-101258' },
  { name: 'ISO 9001:2015', sub: 'Quality management', logo: 'iso.webp' },
  { name: 'ISO 14001:2015', sub: 'Environmental management', logo: 'iso.webp' },
  { name: 'Sedex Member', sub: 'Ethical trade audit', logo: 'sedex.webp' },
  { name: 'Star Export House', sub: 'Govt. of India', typographic: true },
]

const CAPABILITIES = [
  {
    k: 'print',
    label: 'Print Capacity',
    body: 'A twenty-web machine tower alongside five sheet-fed presses and three Lineomatic lines, engineered for large-volume textbook runs.',
    photoNote: 'PHOTO · PRESS HALL, PRINTING TOWERS',
  },
  {
    k: 'bind',
    label: 'Binding & Finishing',
    body: 'Seventeen folders, ten binding and stitching lines and six automatic thread-sewing machines finish every book to spec.',
    photoNote: 'PHOTO · BINDERY & FINISHING LINES',
  },
  {
    k: 'ware',
    label: 'Warehousing & Dispatch',
    body: 'Two fulfilment centres run automated collating, kitting and shrink-wrapping, up to 10,000 kits processed every single day.',
    photoNote: 'PHOTO · WAREHOUSE & DISPATCH',
  },
]

const MACHINES = [
  {
    size: 'large',
    name: '20-Web Offset Tower',
    spec: 'A twenty-unit web-offset tower runs long textbook forms at full speed, register held tight across every signature.',
    icon: 'tower',
  },
  {
    size: 'large',
    name: 'Sheet-Fed Fleet, 5 Presses',
    spec: 'Five sheet-fed presses handle covers, short runs and colour-critical work where finish and fidelity matter most.',
    icon: 'press',
  },
  {
    size: 'small',
    name: '3 Lineomatic Exercise-Book Lines',
    spec: 'Three Lineomatic lines rule, fold and stitch exercise books end to end at volume.',
    icon: 'book',
  },
  {
    size: 'small',
    name: 'In-house Corrugated & E-flute Cartons',
    spec: 'Cartons are made in-house, so every shipment leaves in packaging built for its load.',
    icon: 'carton',
  },
]

const STATS = [
  { value: 250000, suffix: '', label: 'Sq ft engineered', foot: 'Across six facilities' },
  { value: 6, suffix: '', label: 'Print & fulfilment sites', foot: 'Four print, two warehouse' },
  { value: 25, suffix: 'M+', label: 'Books a year', foot: 'Shipped to 25+ countries' },
  { value: 600, suffix: '+', label: 'People on the floor', foot: 'Trained to one standard' },
]

const AWARDS = [
  { name: 'Highest Book Exporter', body: 'CAPEXIL, Government of India, awarded across consecutive years.', kicker: 'CAPEXIL · GOVT. OF INDIA' },
  { name: 'PrintWeek Honours', body: 'Recognised by PrintWeek for production quality and scale.', kicker: 'PRINTWEEK INDIA' },
  { name: 'Dun & Bradstreet', body: 'Listed among India’s leading print and publishing businesses.', kicker: 'D&B RECOGNITION' },
]

const GALLERY = [
  { n: '01', cap: 'PRESS HALL' },
  { n: '02', cap: 'BINDERY' },
  { n: '03', cap: 'WAREHOUSE' },
  { n: '04', cap: 'DISPATCH' },
]

// Stroke-draw icons — pathLength="1" normalises every path so one dash rule draws
// them all. Icons render fully under reduced motion (see CSS).
function MachineIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1 }
  return (
    <svg className="inf-mi-icon" viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      {name === 'tower' && (
        <>
          <rect x="10" y="6" width="28" height="36" rx="2" {...common} />
          <path d="M17 14h14M17 22h14M17 30h14" {...common} />
          <circle cx="24" cy="24" r="6" {...common} />
        </>
      )}
      {name === 'press' && (
        <>
          <path d="M8 30h32M8 30V16a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v14" {...common} />
          <path d="M14 30v8h20v-8M20 14v-4h8v4" {...common} />
          <path d="M18 22h12" {...common} />
        </>
      )}
      {name === 'book' && (
        <>
          <path d="M24 12v26" {...common} />
          <path d="M24 12C20 9 14 9 9 10v25c5-1 11-1 15 2 4-3 10-3 15-2V10c-5-1-11-1-15 2Z" {...common} />
        </>
      )}
      {name === 'carton' && (
        <>
          <path d="M24 6 8 14v20l16 8 16-8V14L24 6Z" {...common} />
          <path d="M8 14l16 8 16-8M24 22v20M24 22 16 10M32 10l-8 4" {...common} />
        </>
      )}
    </svg>
  )
}

// Silent drop-in photo surface: navy duotone placeholder under the real image, so a
// delivered .webp covers it with zero code change (a missing file just reveals it).
function InfraPhoto({ src, note, className = '' }) {
  return (
    <div className={`inf-photo ${className}`}>
      <div className="inf-photo-base" aria-hidden="true" />
      <span className="inf-photo-note" aria-hidden="true">{note}</span>
      {src && (
        <div className="inf-photo-img" aria-hidden="true" style={{ backgroundImage: `url(${src})` }} />
      )}
    </div>
  )
}

export default function InfrastructurePage() {
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [active, setActive] = useState(0) // capability accordion
  const [videoOpen, setVideoOpen] = useState(false)
  const closeRef = useRef(null)

  // video dialog: Esc closes, lock body scroll, focus the close button on open
  useEffect(() => {
    if (!videoOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setVideoOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [videoOpen])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const reveal = (sel, opts = {}) => {
        const els = q(sel)
        if (!els.length) return
        gsap.set(els, { autoAlpha: 0, y: 24 })
        gsap.to(els, {
          autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
          stagger: opts.stagger || 0, clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: opts.trigger || els[0], start: opts.start || 'top 82%', once: true },
        })
      }

      reveal('.inf-hero-eyebrow, .inf-hero-title, .inf-hero-sub, .inf-hero-ctas', { trigger: '.inf-hero', start: 'top 90%', stagger: 0.08 })
      reveal('.inf-hero-stat', { trigger: '.inf-hero', start: 'top 88%' })
      reveal('.inf-strip-item', { trigger: '.inf-strip', stagger: 0.07 })
      reveal('.inf-acc-row', { trigger: '.inf-acc', stagger: 0.1 })
      reveal('.inf-acc-visual', { trigger: '.inf-acc' })
      reveal('.inf-machine', { trigger: '.inf-machines', stagger: 0.12, start: 'top 78%' })
      reveal('.inf-results-head, .inf-stat', { trigger: '.inf-results', stagger: 0.08 })
      reveal('.inf-video', { trigger: '.inf-results', start: 'top 72%' })
      reveal('.inf-award', { trigger: '.inf-recognition', stagger: 0.1 })
      reveal('.inf-gallery-item', { trigger: '.inf-gallery', stagger: 0.08 })
      reveal('.inf-cta-inner', { trigger: '.inf-cta', start: 'top 84%' })

      // stroke-draw the machine icons once the grid enters
      ScrollTrigger.create({
        trigger: '.inf-machines', start: 'top 78%', once: true,
        onEnter: () => q('.inf-machine').forEach((el) => el.classList.add('is-in')),
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const canonical = 'https://quarterfoldltd.com/infrastructure'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: 'Infrastructure', item: canonical },
    ],
  }

  return (
    <main id="main" ref={root} className="inf">
      <Seo
        title="Print Infrastructure | Quarterfold Printabilities"
        description="Four print facilities and two warehouses across Navi Mumbai. 250,000 sq ft engineered so your books ship on time, every time."
        jsonLd={jsonLd}
      />

      {/* ── 1 · HERO (navy) ─────────────────────────────────────────────── */}
      <section data-theme="dark" className="inf-hero" aria-labelledby="inf-h1">
        <div className="inf-hero-beam" aria-hidden="true" />
        <div className="inf-wrap inf-hero-grid">
          <div className="inf-hero-copy">
            <p className="inf-hero-eyebrow">Infrastructure</p>
            <h1 id="inf-h1" className="inf-hero-title">
              Built for Scale. <span className="inf-hero-title-accent">Engineered for Trust.</span>
            </h1>
            <p className="inf-hero-sub">
              Four print facilities and two warehouses across Navi Mumbai. 250,000 sq ft engineered
              for one thing: books that ship on time.
            </p>
            <div className="inf-hero-ctas">
              <Link to="/contact" className="inf-btn inf-btn--gold">Request a Quote</Link>
              <a href="/#process" className="inf-btn inf-btn--ghost">
                See our process
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>
          </div>

          {/* single foil moment on the page — the flagship stat */}
          <div className="inf-hero-stat" aria-label="250,000 square feet engineered across six facilities">
            <span className="inf-hero-foil" aria-hidden="true">250,000</span>
            <span className="inf-hero-stat-unit">SQ FT</span>
            <span className="inf-hero-stat-foot">Engineered across six facilities in Navi Mumbai</span>
          </div>
        </div>
      </section>

      {/* ── 2 · TRUST STRIP — certifications (cream) ─────────────────────── */}
      <section data-theme="light" className="inf-strip" aria-labelledby="inf-strip-h">
        <div className="inf-wrap">
          <h2 id="inf-strip-h" className="inf-strip-eyebrow">Certified, audited and renewed</h2>
          <ul className="inf-strip-row">
            {CERTS.map((c) => (
              <li key={c.name} className="inf-strip-item">
                <div className="inf-strip-mark">
                  {c.typographic ? (
                    <span className="inf-strip-star" aria-hidden="true">★</span>
                  ) : (
                    <img src={`/qfp/certs/${c.logo}`} alt={`${c.name} certification`} loading="lazy" decoding="async" />
                  )}
                </div>
                <p className="inf-strip-name">{c.name}</p>
                <p className="inf-strip-sub">{c.sub}</p>
                {/* COMPLIANCE: the FSC licence code must render with the mark — never omit. */}
                {c.code && <p className="inf-strip-code">Licence {c.code}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 3 · CAPABILITY ACCORDION (beige) ────────────────────────────── */}
      <section data-theme="light" className="inf-acc" aria-labelledby="inf-acc-h">
        <div className="inf-wrap inf-acc-grid">
          <div className="inf-acc-copy">
            <p className="inf-eyebrow">What runs the floor</p>
            <h2 id="inf-acc-h" className="inf-h2">Three capabilities, one line.</h2>
            <div className="inf-acc-rows">
              {CAPABILITIES.map((cap, i) => {
                const open = active === i
                return (
                  <div key={cap.k} className={`inf-acc-row${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="inf-acc-head"
                      aria-expanded={open}
                      aria-controls={`inf-acc-panel-${cap.k}`}
                      onClick={() => setActive(i)}
                    >
                      <span className="inf-acc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="inf-acc-label">{cap.label}</span>
                      <span className="inf-acc-chev" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </span>
                    </button>
                    <div id={`inf-acc-panel-${cap.k}`} className="inf-acc-panel" role="region" aria-label={cap.label} hidden={!open}>
                      <p>{cap.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="inf-acc-visual">
            <InfraPhoto
              src={`/qfp/infra/facility-0${active + 1}.webp`}
              note={CAPABILITIES[active].photoNote}
              className="inf-acc-photo"
            />
            {/* embedded stat quote card — echoes dispel's overlaid quote */}
            <div className="inf-acc-quote">
              <span className="inf-acc-quote-num"><CountUp value={98} suffix="%" /></span>
              <span className="inf-acc-quote-text">on-time delivery, year after year.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · MACHINE CARDS — 2 large + 2 small (cream) ───────────────── */}
      <section data-theme="light" className="inf-mach-sec" aria-labelledby="inf-mach-h">
        <div className="inf-wrap">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">On the press floor</p>
            <h2 id="inf-mach-h" className="inf-h2">The machines behind the volume.</h2>
          </div>
          <div className="inf-machines">
            {MACHINES.map((m) => (
              <article key={m.name} className={`inf-machine inf-machine--${m.size}`}>
                <span className="inf-mi">
                  <MachineIcon name={m.icon} />
                </span>
                <h3 className="inf-machine-name">{m.name}</h3>
                <p className="inf-machine-spec">{m.spec}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · MEASURABLE RESULTS + video (navy) ───────────────────────── */}
      <section data-theme="dark" className="inf-results" aria-labelledby="inf-res-h">
        <div className="inf-results-beam" aria-hidden="true" />
        <div className="inf-wrap inf-results-grid">
          <div className="inf-results-left">
            <div className="inf-results-head">
              <p className="inf-eyebrow inf-eyebrow--ondark">Real capacity</p>
              <h2 id="inf-res-h" className="inf-h2 inf-h2--ondark">Measured, not estimated.</h2>
              <p className="inf-results-sub">
                Not a projection. The plant that prints and ships, counted across four print
                facilities and two warehouses.
              </p>
            </div>
            <div className="inf-stats">
              {STATS.map((s) => (
                <div key={s.label} className="inf-stat">
                  <span className="inf-stat-num">
                    <CountUp value={s.value} suffix={s.suffix} grouping />
                  </span>
                  <span className="inf-stat-label">{s.label}</span>
                  <span className="inf-stat-foot">{s.foot}</span>
                </div>
              ))}
            </div>
          </div>

          {/* video walkthrough — VIDEO_READY gate (poster placeholder until footage lands) */}
          <div className="inf-video">
            <button
              type="button"
              className="inf-video-thumb"
              onClick={() => setVideoOpen(true)}
              data-pending={!VIDEO_READY}
              aria-label={VIDEO_READY ? 'Play facilities walkthrough video' : 'Preview facilities walkthrough, video coming soon'}
            >
              <span className="inf-video-note" aria-hidden="true">VIDEO · INSIDE OUR FACILITIES</span>
              <span className="inf-play" aria-hidden="true">
                <span className="inf-play-ring" />
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" /></svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 6 · RECOGNITION — typographic plaques (beige) ───────────────── */}
      <section data-theme="light" className="inf-recognition" aria-labelledby="inf-rec-h">
        <div className="inf-wrap">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">Recognition</p>
            <h2 id="inf-rec-h" className="inf-h2">Awarded for the work, year on year.</h2>
          </div>
          <div className="inf-awards">
            {AWARDS.map((a) => (
              <article key={a.name} className="inf-award">
                <span className="inf-award-seal" aria-hidden="true">
                  <svg viewBox="0 0 48 48" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20c-2 8 3 15 12 17M36 20c2 8-3 15-12 17" pathLength="1" />
                    <circle cx="24" cy="15" r="6" pathLength="1" />
                    <path d="M24 21v6" pathLength="1" />
                  </svg>
                </span>
                <p className="inf-award-kicker">{a.kicker}</p>
                <h3 className="inf-award-name">{a.name}</h3>
                <p className="inf-award-body">{a.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · GALLERY — facility photos only, no testimonials (cream) ─── */}
      <section data-theme="light" className="inf-gallery" aria-labelledby="inf-gal-h">
        <div className="inf-wrap">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">Inside the facilities</p>
            <h2 id="inf-gal-h" className="inf-h2">A look across the floor.</h2>
          </div>
          <div className="inf-gallery-strip">
            {GALLERY.map((g) => (
              <figure key={g.n} className="inf-gallery-item">
                <InfraPhoto src={`/qfp/infra/gallery-0${g.n.slice(-1)}.webp`} note={`PHOTO · ${g.cap}`} className="inf-gallery-photo" />
                <figcaption className="inf-gallery-cap">{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · CTA (beige) ─────────────────────────────────────────────── */}
      <section data-theme="light" className="inf-cta" aria-labelledby="inf-cta-h">
        <div className="inf-wrap inf-cta-inner">
          <h2 id="inf-cta-h" className="inf-cta-title">See it in person or on a call.</h2>
          <p className="inf-cta-sub">
            Tour the floor, meet the team, and get a quote scoped to your run.
          </p>
          <Link to="/contact" className="inf-btn inf-btn--gold inf-btn--lg">Request a Quote</Link>
        </div>
      </section>

      {/* ── VIDEO DIALOG — backdrop blur + navy scrim; Esc / click-out close ─ */}
      {videoOpen && (
        <div
          className="inf-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Facilities walkthrough video"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoOpen(false) }}
        >
          <div className="inf-dialog-panel">
            <button ref={closeRef} type="button" className="inf-dialog-close" onClick={() => setVideoOpen(false)} aria-label="Close video">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {VIDEO_READY ? (
              // COMPLIANCE: ship with <track kind="captions"> + linked transcript before go-live.
              <video className="inf-dialog-video" src={VIDEO_SRC} controls autoPlay playsInline crossOrigin="anonymous">
                <track kind="captions" src={VIDEO_VTT} srcLang="en" label="English" default />
              </video>
            ) : (
              <div className="inf-dialog-ph" aria-hidden="true">
                <span className="inf-video-note">VIDEO · INSIDE OUR FACILITIES</span>
                <span className="inf-dialog-soon">Walkthrough footage coming soon</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
