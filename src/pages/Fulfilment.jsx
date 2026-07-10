import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '@/components/Seo'
import CountUp from '@/components/CountUp'
import VideoBackdrop from '@/components/VideoBackdrop'
import SectionCurve from '@/components/SectionCurve'
import { DotField, PaperGrain } from '@/components/atmosphere'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────────────────────────────────────
// /fulfilment — "One System, Start to Finish."
// Structure + rhythm reskinned from flexis-mobility.com into QFP System B.
// Native scroll (the homepage owns Lenis; inner routes are plain scroll). Every
// section carries data-theme so the fixed SiteNav flips ink/paper under it.
//
// Two compliance gates, both OFF by default:
//   VIDEO_READY            — hero ambient video slot. Poster shows until the
//                            client delivers /qfp/fulfil/hero.mp4 (+ captions).
//   SHOW_RESTRICTED_CLIENTS — the trust marquee is permission-safe (ministries /
//                            programmes only). Named commercial clients (HDFC,
//                            ZEE, Reliance) stay OUT of the DOM until sign-off.
// ─────────────────────────────────────────────────────────────────────────────
const VIDEO_READY = true
const VIDEO_SRC = '/qfp/fulfil/hero.mp4'
const SHOW_RESTRICTED_CLIENTS = false

const BASE = '/qfp/fulfil'

// ── stroke icons (marquee + value grid). pathLength="1" lets GSAP stroke-draw
// any shape uniformly; resting/reduced state renders solid. ───────────────────
const I = {
  bank: <path d="M3 9.5 12 4l9 5.5M5 10v9M19 10v9M9 19v-6h6v6M3 21h18" />,
  pin: <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  globe: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z" />,
  book: <path d="M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2ZM4 5.5V20M9 8h6M9 11h4" />,
  layers: <path d="M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />,
  monitor: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
}

// value-grid icons — all shapes tagged .ff-vi-draw with pathLength for the draw-in
const VIcon = {
  warehouse: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 10 12 4l9 6" />
      <path className="ff-vi-draw" pathLength="1" d="M5 10v10h14V10" />
      <path className="ff-vi-draw" pathLength="1" d="M8 20v-6h8v6" />
      <path className="ff-vi-draw" pathLength="1" d="M8 14h8" />
    </>
  ),
  carton: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 8 12 4l9 4-9 4-9-4Z" />
      <path className="ff-vi-draw" pathLength="1" d="M3 8v8l9 4 9-4V8" />
      <path className="ff-vi-draw" pathLength="1" d="M12 12v8" />
    </>
  ),
  printer: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M7 8V4h10v4" />
      <path className="ff-vi-draw" pathLength="1" d="M5 8h14a2 2 0 0 1 2 2v6h-4M5 16H3v-6a2 2 0 0 1 2-2Z" />
      <path className="ff-vi-draw" pathLength="1" d="M7 14h10v6H7z" />
    </>
  ),
  anchor: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M12 7v13" />
      <path className="ff-vi-draw" pathLength="1" d="M9 4.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
      <path className="ff-vi-draw" pathLength="1" d="M5 12H3c0 5 4 8 9 8s9-3 9-8h-2" />
      <path className="ff-vi-draw" pathLength="1" d="M8 11H4M20 11h-4" />
    </>
  ),
  containers: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 9h8v11H3zM13 9h8v11h-8Z" />
      <path className="ff-vi-draw" pathLength="1" d="M6 9V6h12v3M7 12v5M17 12v5" />
    </>
  ),
  clock: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
      <path className="ff-vi-draw" pathLength="1" d="M12 7v5l3.5 2" />
    </>
  ),
}

// ── data ──────────────────────────────────────────────────────────────────────
// These "safe" partners are all government / ministry / programme names — gated
// behind SHOW_MINISTRY_NAMES (permission pending). If the switch is off AND no
// restricted clients are shown, PARTNERS is empty and the whole marquee section
// hides cleanly (see TrustMarquee) rather than leaving an empty strip.
const SAFE_PARTNERS = [
  { label: 'Tanzania Institute of Education', sub: 'National Curriculum', icon: 'bank' },
  { label: 'Ghana — USAID Programmes', sub: 'Education Supply', icon: 'pin' },
  { label: 'Ivory Coast', sub: 'Ministry Tender', icon: 'globe' },
  { label: 'Maharashtra Bal Bharti', sub: 'State Textbook Bureau', icon: 'book' },
  { label: 'World Bank Programmes', sub: 'Funded Projects', icon: 'layers' },
  { label: 'UN AID Programmes', sub: 'Global Distribution', icon: 'globe' },
  { label: 'Government Ministry Tenders', sub: 'Public Sector', icon: 'monitor' },
]
// Named commercial clients — gated behind SHOW_RESTRICTED_CLIENTS (kept OUT of DOM).
const RESTRICTED_PARTNERS = [
  { label: 'HDFC Bank Ltd', sub: 'Corporate', icon: 'bank' },
  { label: 'ZEE Learn / Kidzee', sub: 'Education', icon: 'globe' },
]
const MINISTRY_PARTNERS = SHOW_MINISTRY_NAMES ? SAFE_PARTNERS : []
const PARTNERS = SHOW_RESTRICTED_CLIENTS ? [...MINISTRY_PARTNERS, ...RESTRICTED_PARTNERS] : MINISTRY_PARTNERS

const CARDS = [
  { n: '01', name: 'Kitting & Assembly', src: `${BASE}/card-01.webp`,
    text: 'Components collated, built and checked into finished kits — ready the day they are needed.' },
  { n: '02', name: 'Warehousing & Storage', src: `${BASE}/card-02.webp`,
    text: 'State-of-the-art storage houses your books securely for as long as the programme runs.' },
  { n: '03', name: 'Last-Mile Delivery', src: `${BASE}/card-03.webp`,
    text: 'Streamlined logistics carry every consignment the final mile, to the door that matters.' },
]

const VALUES = [
  { icon: 'warehouse', num: 100000, grouping: true, unit: 'sq ft', label: 'Dedicated warehouse facility, built for long-dwell storage.' },
  { icon: 'carton', word: 'In-House', label: 'Corrugated & e-flute cartons, produced on site.' },
  { icon: 'printer', num: 5, unit: '-colour', label: 'Carton printing for retail-ready displays & shipping.' },
  { icon: 'anchor', word: 'JNPT', label: "Minutes from India's largest container port." },
  { icon: 'containers', num: 800, suffix: '+', unit: '/ year', label: 'Export containers shipped, and climbing.' },
  { icon: 'clock', num: 98, suffix: '%', unit: 'on-time', label: 'Delivery, every single year.' },
]

const FEATURES = [
  {
    n: '01', eyebrow: 'Storage', title: 'The Warehouse', src: `${BASE}/feature-01.webp`,
    body: 'A dedicated 100,000 sq. ft warehouse anchors everything downstream — state-of-the-art storage that houses finished product securely for extended periods, ready to move the moment a programme calls.',
    more: 'Racked, barcoded and organised for fast retrieval, the floor is engineered for long-dwell storage and high-volume throughput alike, with automated collating feeding straight into kitting.',
  },
  {
    n: '02', eyebrow: 'Build', title: 'Kitting & Assembly', src: `${BASE}/feature-02.webp`,
    body: 'End-to-end kitting and assembly turns loose components into finished, checked kits — collated, built and quality-verified under one roof so nothing ships incomplete.',
    more: 'Automated collating and shrink-wrapping lines process up to 10,000 kits a day, each assembled to a repeatable spec and inspected before it leaves the floor.',
  },
  {
    n: '03', eyebrow: 'Protect', title: 'In-House Packaging', src: `${BASE}/feature-03.webp`,
    body: 'Corrugated and e-flute cartons are produced in-house with advanced 5-colour printing — custom-designed packaging engineered for retail displays and safe transit.',
    more: 'Making our own board and cartons means we control fit, strength and finish end-to-end, so retail-ready packaging and export cartons come off the same controlled line.',
  },
  {
    n: '04', eyebrow: 'Deliver', title: 'Global Shipping', src: `${BASE}/feature-04.webp`,
    body: 'Streamlined logistics manage last-mile delivery and export dispatch — books handled from our floor to their destination across 25+ countries and four continents.',
    more: 'Sited minutes from JNPT, India’s largest container port, we ship 800+ export containers a year with a 98% on-time record, every single year.',
  },
]

const STAGES = [
  { n: '01', verb: 'Pack', word: 'Precise', line: 'Cartons cut, printed and packed to spec, in-house.' },
  { n: '02', verb: 'Store', word: 'Secure', line: 'Racked and barcoded in a 100,000 sq ft facility.' },
  { n: '03', verb: 'Ship', word: 'On Time', line: 'Export containers dispatched minutes from JNPT port.' },
]

// ── components ────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section data-theme="dark" className="ff-hero" aria-labelledby="ff-h1">
      <div className="ff-hero-media" aria-hidden="true">
        <div className="ff-hero-poster" style={{ backgroundImage: `url(${BASE}/hero-poster.webp)` }} />
        {VIDEO_READY && (
          <VideoBackdrop className="ff-hero-video is-ready" src={VIDEO_SRC} poster={`${BASE}/hero-poster.webp`} />
        )}
      </div>
      <div className="ff-hero-scrim" aria-hidden="true" />
      <div className="ff-hero-inner">
        <p className="ff-shared-eyebrow ff-hero-eyebrow ff-reveal">Warehousing &amp; Fulfilment</p>
        <h1 id="ff-h1" className="ff-hero-h1 ff-reveal">
          <span className="ff-hw">One</span>
          <span className="ff-hw">System,</span>
          <br />
          <span className="ff-hw ff-hw-light">Start</span>
          <span className="ff-hw ff-hw-light">to</span>
          <span className="ff-hw">Finish.</span>
        </h1>
        <p className="ff-hero-sub ff-reveal">
          Print, pack, warehouse, ship — your books handled under one roof until they reach theirs.
        </p>
      </div>
      <div className="ff-hero-cue" aria-hidden="true">
        <span>Scroll</span>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}

function MqIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{I[type]}</svg>
  )
}

function TrustMarquee({ reduced }) {
  const track = useRef(null)
  // Every partner here is a gated ministry/programme name; if all are hidden the
  // strip has nothing to show, so drop the whole section (no empty marquee).
  const empty = PARTNERS.length === 0
  useLayoutEffect(() => {
    if (reduced || !track.current) return
    const anim = track.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 34000, iterations: Infinity, easing: 'linear' },
    )
    const host = track.current.parentElement
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let enter, leave
    if (canHover && host) {
      enter = () => { anim.playbackRate = 0 }
      leave = () => { anim.playbackRate = 1 }
      host.addEventListener('pointerenter', enter)
      host.addEventListener('pointerleave', leave)
    }
    return () => {
      anim.cancel()
      if (host && enter) { host.removeEventListener('pointerenter', enter); host.removeEventListener('pointerleave', leave) }
    }
  }, [reduced])

  if (empty) return null

  const Seq = ({ clone }) => (
    <div className="ff-mq-seq" aria-hidden={clone || undefined}>
      {PARTNERS.map((p, i) => (
        <div className="ff-mq-item" key={`${clone ? 'c' : 'b'}-${i}`}>
          <span className="ff-mq-ico"><MqIcon type={p.icon} /></span>
          <span>
            <span className="ff-mq-label">{p.label}</span>
            <span className="ff-mq-sub">{p.sub}</span>
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <section data-theme="light" className="ff-trust" aria-labelledby="ff-trust-title">
      <SectionCurve position="top" fill="#f0ebe0" />
      <PaperGrain />
      <div className="ff-trust-head">
        <p className="ff-shared-eyebrow ff-trust-eyebrow ff-reveal">They trust us</p>
        <h2 id="ff-trust-title" className="ff-trust-title ff-reveal">
          Ministries and programmes that ship with us.
        </h2>
      </div>
      <div className="ff-mq">
        <div className="ff-mq-track" ref={track} style={reduced ? { transform: 'none' } : undefined}>
          <Seq />
          {!reduced && <Seq clone />}
        </div>
      </div>
    </section>
  )
}

function Conviction() {
  const q1 = 'We believe'.split(' ')
  const q2 = 'delivery is part of printing.'.split(' ')
  return (
    <section data-theme="light" className="ff-conv" aria-labelledby="ff-conv-title">
      <SectionCurve position="top" fill="#fdfaf4" />
      <PaperGrain />
      <div className="ff-conv-inner">
        <p className="ff-shared-eyebrow ff-conv-eyebrow ff-reveal">Our conviction</p>
        <h2 id="ff-conv-title" className="ff-conv-quote ff-reveal">
          {q1.map((w, i) => <span className="ff-cw ff-cw-light" key={`a${i}`}>{w}</span>)}
          {q2.map((w, i) => <span className="ff-cw ff-cw-bold" key={`b${i}`}>{w}</span>)}
        </h2>
        <div className="ff-cards">
          {CARDS.map((c) => (
            <article className="ff-card ff-reveal" key={c.n}>
              <div className="ff-card-media" style={{ backgroundImage: `url(${c.src})` }} aria-hidden="true" />
              <div className="ff-card-scrim" aria-hidden="true" />
              <div className="ff-card-body">
                <span className="ff-card-index">{c.n}</span>
                <h3 className="ff-card-name">{c.name}</h3>
                <p className="ff-card-text">{c.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueGrid() {
  return (
    <section data-theme="dark" className="ff-value" aria-labelledby="ff-value-title">
      <SectionCurve position="top" fill="#0f2444" />
      <DotField tone="navy" />
      <div className="ff-value-inner">
        <p className="ff-shared-eyebrow ff-value-eyebrow ff-reveal">Why trust our fulfilment</p>
        <h2 id="ff-value-title" className="ff-value-title ff-reveal">
          A single roof engineered for scale, speed and safe transit.
        </h2>
        <div className="ff-value-grid">
          {VALUES.map((v) => (
            <div className="ff-vi ff-reveal" key={v.icon}>
              <span className="ff-vi-ico" aria-hidden="true">
                <svg viewBox="0 0 24 24">{VIcon[v.icon]}</svg>
              </span>
              <div className="ff-vi-num">
                {v.word ? (
                  <span>{v.word}</span>
                ) : (
                  <CountUp value={v.num} suffix={v.suffix || ''} grouping={!!v.grouping} duration={1400} />
                )}
                {v.unit && <span className="ff-vi-unit">{v.unit}</span>}
              </div>
              <p className="ff-vi-label">{v.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureRow({ f, i }) {
  const [open, setOpen] = useState(false)
  const rev = i % 2 === 1
  return (
    <div className={`ff-feat ff-reveal ${rev ? 'ff-feat--rev' : ''}`}>
      <div className="ff-feat-media" style={{ backgroundImage: `url(${f.src})` }}>
        <span className="ff-feat-index">{f.n}</span>
      </div>
      <div className="ff-feat-copy">
        <p className="ff-shared-eyebrow ff-feat-eyebrow">{f.eyebrow}</p>
        <h3 className="ff-feat-title">{f.title}</h3>
        <p className="ff-feat-body">{f.body}</p>
        <button
          type="button"
          className="ff-feat-more"
          aria-expanded={open}
          aria-controls={`ff-panel-${f.n}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show less' : 'Learn more'}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <div id={`ff-panel-${f.n}`} className={`ff-feat-panel ${open ? 'is-open' : ''}`} role="region" aria-label={`${f.title} — more`}>
          <div><p>{f.more}</p></div>
        </div>
      </div>
    </div>
  )
}

function Features() {
  return (
    <section data-theme="light" className="ff-features" aria-label="How fulfilment works, step by step">
      <SectionCurve position="top" fill="#fdfaf4" />
      <PaperGrain />
      <div className="ff-features-inner">
        {FEATURES.map((f, i) => <FeatureRow key={f.n} f={f} i={i} />)}
      </div>
    </section>
  )
}

function Journey() {
  return (
    <section data-theme="dark" className="ff-journey" aria-labelledby="ff-journey-title">
      <SectionCurve position="top" fill="#0f2444" />
      <div className="ff-journey-media" style={{ backgroundImage: `url(${BASE}/journey.webp)` }} aria-hidden="true" />
      <div className="ff-journey-scrim" aria-hidden="true" />
      <div className="ff-journey-inner">
        <p className="ff-shared-eyebrow ff-journey-eyebrow ff-reveal">From Press to Port</p>
        <h2 id="ff-journey-title" className="ff-journey-title ff-reveal">
          One continuous journey, watched every step.
        </h2>
        <div className="ff-stages">
          {STAGES.map((s) => (
            <div className="ff-stage ff-reveal" key={s.n}>
              <span className="ff-stage-num">{s.n}</span>
              <p className="ff-stage-verb">{s.verb}</p>
              <p className="ff-stage-word">{s.word}</p>
              <p className="ff-stage-line">{s.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section data-theme="light" className="ff-cta" aria-labelledby="ff-cta-title">
      <SectionCurve position="top" fill="#f0ebe0" />
      <PaperGrain />
      <p className="ff-shared-eyebrow ff-cta-eyebrow ff-reveal">One roof, start to finish</p>
      <h2 id="ff-cta-title" className="ff-cta-title ff-reveal">Let&apos;s move your books.</h2>
      <p className="ff-cta-sub ff-reveal">
        Tell us what you are printing and where it needs to land. We handle the rest — packed, stored and shipped.
      </p>
      <Link to="/contact" className="ff-cta-pill ff-reveal">
        Start a conversation
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </section>
  )
}

export default function Fulfilment() {
  const root = useRef(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // generic reveal — every .ff-reveal rises in when its section enters
      gsap.utils.toArray('.ff-reveal').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 22 })
        gsap.to(el, {
          autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      // stroke-draw the value-grid icons as the grid enters
      const draws = gsap.utils.toArray('.ff-vi-draw')
      if (draws.length) {
        gsap.set(draws, { strokeDasharray: 1, strokeDashoffset: 1 })
        gsap.to(draws, {
          strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut', stagger: 0.05,
          scrollTrigger: { trigger: '.ff-value-grid', start: 'top 78%', once: true },
        })
      }
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: 'Warehousing & Fulfilment', item: 'https://www.quarterfoldltd.com/fulfilment' },
    ],
  }

  return (
    <main id="main" ref={root}>
      <Seo
        title="Warehousing & Fulfilment | Quarterfold Printabilities"
        description="Kitting, 100,000 sq ft warehousing, in-house 5-colour cartons and last-mile shipping — your books handled under one roof, from press to port."
        jsonLd={breadcrumb}
      />
      <Hero />
      <TrustMarquee reduced={reduced} />
      <Conviction />
      <ValueGrid />
      <Features />
      <Journey />
      <CTA />
    </main>
  )
}
