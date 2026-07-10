import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CountUp from '@/components/CountUp'
import SectionCurve from '@/components/SectionCurve'
import { WavyBackground, DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'
import './PrintOnDemand.css'

/* /print-on-demand — replaces the ShellPage. A "Build Your Book" configurator
   modelled on Lightship's "Build your AE.1" experience (sticky visual · scrolling
   option groups · persistent live summary), reskinned for self-publishers and
   indie authors in QFP System B. NO prices anywhere — the output is a spec summary
   that feeds a quote request on /contact. Warm, one-to-one tone. */

/* ── option data ─────────────────────────────────────────────────────────────── */
const FORMATS = [
  { id: 'paperback', name: 'Paperback', desc: 'Soft, flexible cover — the classic trade look readers reach for.' },
  { id: 'hardcover', name: 'Hardcover', desc: 'Rigid boards and a squared spine — a keepsake made to last.' },
  { id: 'landscape', name: 'Landscape', desc: 'Wide format that lets photography and illustration breathe.' },
]
const SIZES = [
  { id: '5x8', name: '5 × 8 in', sub: 'Pocket novel' },
  { id: '6x9', name: '6 × 9 in', sub: 'Trade standard' },
  { id: '8x10', name: '8 × 10 in', sub: 'Illustrated' },
  { id: 'a4', name: 'A4', sub: '210 × 297 mm' },
]
const PAPERS = [
  { id: 'cream', name: 'Cream 80gsm', desc: 'Warm, easy on the eyes — the natural home for a novel.' },
  { id: 'white', name: 'White 100gsm', desc: 'Bright and crisp, so fine text and line art stay sharp.' },
  { id: 'art', name: 'Art 150gsm', desc: 'Smooth coated stock that makes full-colour images sing.' },
]
const BINDINGS = [
  { id: 'perfect', name: 'Perfect Bound', desc: 'Glued square spine — clean, economical, print-ready.' },
  { id: 'sewn', name: 'Section-Sewn', desc: 'Stitched signatures that open flat and endure re-reads.' },
  { id: 'wiro', name: 'Wiro', desc: 'Twin-loop coil that lies perfectly flat — great for workbooks.' },
]
const FINISHES = [
  { id: 'matte', name: 'Matte Lamination', desc: 'Soft, tactile, glare-free — understated and modern.' },
  { id: 'gloss', name: 'Gloss Lamination', desc: 'High shine that makes cover colours pop off the shelf.' },
  { id: 'layflat', name: 'Lay-Flat Lamination', desc: 'Durable satin film that resists scuffs and fingerprints.' },
]
const QUANTITIES = [
  { id: '1', name: '1 copy', sub: 'Single book' },
  { id: '10', name: '10 copies', sub: 'Author proofs' },
  { id: '50', name: '50 copies', sub: 'Launch batch' },
  { id: '250', name: '250 copies', sub: 'Short run' },
  { id: '500', name: '500+ copies', sub: 'Full run' },
]

const LABELS = {
  format: Object.fromEntries(FORMATS.map((o) => [o.id, o.name])),
  size: Object.fromEntries(SIZES.map((o) => [o.id, o.name])),
  paper: Object.fromEntries(PAPERS.map((o) => [o.id, o.name])),
  binding: Object.fromEntries(BINDINGS.map((o) => [o.id, o.name])),
  finish: Object.fromEntries(FINISHES.map((o) => [o.id, o.name])),
  quantity: Object.fromEntries(QUANTITIES.map((o) => [o.id, o.name])),
}
const SUMMARY_SUB = {
  format: { paperback: 'Soft cover', hardcover: 'Case bound', landscape: 'Wide format' },
  size: { '5x8': 'Pocket novel', '6x9': 'Trade standard', '8x10': 'Illustrated', a4: '210 × 297 mm' },
  paper: { cream: 'Uncoated, warm', white: 'Uncoated, bright', art: 'Coated, smooth' },
  binding: { perfect: 'Glued spine', sewn: 'Stitched, lay-flat', wiro: 'Twin-loop coil' },
  finish: { matte: 'Soft-touch film', gloss: 'High-shine film', layflat: 'Satin film' },
  quantity: { '1': 'Single book', '10': 'Author proofs', '50': 'Launch batch', '250': 'Short run', '500': 'Full run' },
}

/* ── preview geometry ────────────────────────────────────────────────────────── */
const SIZE_RATIO = { '5x8': 0.625, '6x9': 0.667, '8x10': 0.8, a4: 0.707 }
const PAPER_EDGE = {
  cream: { edge: '#f3ead4', line: 'rgba(15,36,68,0.16)' },
  white: { edge: '#fbfaf6', line: 'rgba(15,36,68,0.12)' },
  art: { edge: '#eef0ea', line: 'rgba(15,36,68,0.14)' },
}
function bookDims(format, size) {
  const r = SIZE_RATIO[size] ?? 0.66
  if (format === 'landscape') {
    const bw = 350
    return { bw, bh: Math.round(bw * r), thick: 30 }
  }
  const bh = format === 'hardcover' ? 338 : 328
  const thick = format === 'hardcover' ? 44 : 30
  return { bw: Math.round(bh * r), bh, thick }
}
function ghostCount(q) {
  const n = Number(q)
  if (n <= 1) return 0
  if (n <= 10) return 2
  if (n <= 50) return 3
  return 4
}

/* ── icons (stroke-draw, System-B) ───────────────────────────────────────────── */
function Ico({ d, children, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {children ?? <path d={d} />}
    </svg>
  )
}
const FMT_ICON = {
  paperback: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M8 20V7" /></>,
  hardcover: <><path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" /><path d="M4 4a3 3 0 0 0-1 2.3V18" /><path d="M7 8h9M7 11h9" /></>,
  landscape: <><path d="M3 7h15a3 3 0 0 1 3 3v7H6a3 3 0 0 1-3-3V7Z" /><path d="M6 17V10" /></>,
}
const BIND_ICON = {
  perfect: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 4v16" /></>,
  sewn: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 6h0M9 9h0M9 12h0M9 15h0M9 18h0" strokeDasharray="0.1 3" /></>,
  wiro: <><rect x="7" y="4" width="11" height="16" rx="1" /><path d="M4 6c3 0 3 2 0 2M4 10c3 0 3 2 0 2M4 14c3 0 3 2 0 2" /></>,
}
const FIN_ICON = {
  matte: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  gloss: <><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path d="M8 8c1.5-1.5 3.5-2 5-1.5" /></>,
  layflat: <><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path d="M6 12h12" /></>,
}
const INCLUDED = [
  { name: 'Free digital proof', desc: 'See a colour-accurate proof and sign off before we print a single page.', ico: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" /></> },
  { name: 'Hand quality check', desc: 'Every copy is inspected for colour, trim and binding by a real person.', ico: <><path d="M20 7 10 17l-5-5" /><path d="M4 20h16" /></> },
  { name: 'Secure packing', desc: 'Books are wrapped to arrive crisp — no dinged corners, no scuffs.', ico: <><path d="M3 8 12 3l9 5v8l-9 5-9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></> },
  { name: 'Doorstep delivery', desc: 'Tracked shipping to your door, whether it is one book or five hundred.', ico: <><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17.5" cy="17" r="1.6" /></> },
]
const HOW = [
  { step: 'Step 01', name: 'Upload', desc: 'Send your print-ready files — or your manuscript and cover. We check them for you.', ico: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></> },
  { step: 'Step 02', name: 'Approve Proof', desc: 'We send a colour-accurate proof. Nothing prints until you are happy with it.', ico: <><path d="M4 5h16v11H4z" /><path d="M9 20h6" /><path d="m8 10 2.5 2.5L16 7" /></> },
  { step: 'Step 03', name: 'We Print & Ship', desc: 'Your book runs on the same presses as our millions, then ships to your door.', ico: <><path d="M6 9V4h9l3 3v2" /><path d="M6 18H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-2" /><rect x="8" y="15" width="8" height="5" rx="1" /></> },
]

/* ── accessible single-select group (radiogroup + roving tabindex + arrows) ───── */
function OptionGroup({ groupId, labelId, options, value, onChange, className, children }) {
  const refs = useRef([])
  const idx = options.findIndex((o) => o.id === value)
  const onKeyDown = (e) => {
    const last = options.length - 1
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = idx >= last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = idx <= 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next !== null) {
      e.preventDefault()
      onChange(options[next].id)
      refs.current[next]?.focus()
    }
  }
  return (
    <div className={className} role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
      {options.map((o, i) => {
        const checked = o.id === value
        return (
          <button
            key={o.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : idx === -1 && i === 0 ? 0 : -1}
            className="pod-chip"
            onClick={() => onChange(o.id)}
            data-tight={className?.includes('tight') || undefined}
          >
            {children(o, checked)}
            <span className="pod-chip-tick" aria-hidden="true">
              <svg viewBox="0 0 12 12"><path d="m2 6 2.6 2.6L10 3.4" /></svg>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function PrintOnDemand() {
  const [cfg, setCfg] = useState({
    format: 'paperback',
    size: '6x9',
    paper: 'cream',
    binding: 'perfect',
    finish: 'matte',
    quantity: '1',
  })
  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }))

  const dims = bookDims(cfg.format, cfg.size)
  const edge = PAPER_EDGE[cfg.paper]
  const ghosts = ghostCount(cfg.quantity)
  const qtyLabel = LABELS.quantity[cfg.quantity]

  // carry the full spec to /contact as readable URL params
  const params = new URLSearchParams({
    intent: 'print-on-demand',
    format: LABELS.format[cfg.format],
    size: LABELS.size[cfg.size],
    paper: LABELS.paper[cfg.paper],
    binding: LABELS.binding[cfg.binding],
    finish: LABELS.finish[cfg.finish],
    quantity: LABELS.quantity[cfg.quantity],
  })
  const contactHref = `/contact?${params.toString()}`

  // SEO — title, meta description, BreadcrumbList (managed for this route only)
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Print on Demand | Quarterfold Printabilities'
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    meta?.setAttribute(
      'content',
      'Build your book online — pick format, size, paper, binding and finish. From a single copy to a short run, printed to our millions-scale standard.',
    )
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
        { '@type': 'ListItem', position: 2, name: 'Print on Demand', item: '/print-on-demand' },
      ],
    })
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc)
      ld.remove()
    }
  }, [])

  const summaryRows = [
    ['Format', LABELS.format[cfg.format], SUMMARY_SUB.format[cfg.format]],
    ['Size', LABELS.size[cfg.size], SUMMARY_SUB.size[cfg.size]],
    ['Paper', LABELS.paper[cfg.paper], SUMMARY_SUB.paper[cfg.paper]],
    ['Binding', LABELS.binding[cfg.binding], SUMMARY_SUB.binding[cfg.binding]],
    ['Finish', LABELS.finish[cfg.finish], SUMMARY_SUB.finish[cfg.finish]],
    ['Quantity', LABELS.quantity[cfg.quantity], SUMMARY_SUB.quantity[cfg.quantity]],
  ]

  return (
    <main id="main" className="pod">
      {/* 1 · HERO */}
      <section className="pod-hero" data-theme="light">
        <PaperGrain opacity={0.05} />
        <div className="pod-hero-inner">
          <p className="pod-eyebrow">Print on Demand</p>
          <h1 className="pod-h1">
            Your Book. <em>Exactly</em> as You Imagined.
          </h1>
          <p className="pod-hero-sub">
            From a single copy to a short run — printed to the same standard as our millions. Choose
            how your book looks and feels, and we’ll turn your files into finished copies you’ll be
            proud to hold.
          </p>
          <a href="#build" className="pod-hero-cta">
            Start building
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="m6 13 6 6 6-6" />
            </svg>
          </a>
        </div>
      </section>

      {/* 2 · BUILD YOUR BOOK */}
      <section className="pod-build" id="build" data-theme="light" aria-labelledby="pod-build-title">
        <div className="pod-build-inner">
          <div className="pod-build-head">
            <p className="pod-eyebrow">The Configurator</p>
            <h2 className="pod-build-title" id="pod-build-title">Build your book</h2>
            <p className="pod-build-lede">
              Make each choice below. The preview and your spec sheet update as you go — no prices,
              no commitment, just the book you have in mind.
            </p>
          </div>

          <div className="pod-config">
            {/* LEFT — live preview */}
            <div className="pod-preview" aria-hidden="true">
              <span className="pod-preview-tag">Live preview</span>
              <div className="pod-stage">
                <div style={{ position: 'relative' }}>
                  {Array.from({ length: ghosts }).map((_, i) => (
                    <span
                      key={i}
                      className="pod-stack-ghost"
                      style={{
                        width: dims.bw,
                        height: dims.bh,
                        transform: `translate(${(i + 1) * 10}px, ${(i + 1) * 12}px)`,
                        zIndex: -1 - i,
                        opacity: 0.9 - i * 0.14,
                      }}
                    />
                  ))}
                  <div
                    className="pod-book"
                    data-format={cfg.format}
                    data-binding={cfg.binding}
                    data-finish={cfg.finish}
                    style={{
                      '--bw': `${dims.bw}px`,
                      '--bh': `${dims.bh}px`,
                      '--thick': `${dims.thick}px`,
                      '--edge': edge.edge,
                      '--edge-line': edge.line,
                    }}
                  >
                    <div className="pod-face pod-back" />
                    <div className="pod-face pod-fore" />
                    <div className="pod-face pod-top" />
                    <div className="pod-face pod-spine">
                      <span className="pod-headband top" />
                      <span className="pod-headband bottom" />
                      <span className="pod-coil">
                        <svg viewBox="0 0 20 320" preserveAspectRatio="none">
                          {Array.from({ length: 13 }).map((_, i) => {
                            const y = 16 + i * 23
                            return (
                              <g key={i} stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round">
                                <circle cx="11" cy={y} r="2.4" />
                                <path d={`M4 ${y - 6} C 15 ${y - 6}, 15 ${y + 6}, 4 ${y + 6}`} />
                              </g>
                            )
                          })}
                        </svg>
                      </span>
                    </div>
                    <div className="pod-face pod-front">
                      <span className="pod-sheen" />
                      <span className="pod-matte" />
                    </div>
                  </div>
                </div>
              </div>
              {Number(cfg.quantity) > 1 && (
                <span className="pod-qty-badge">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 7h13v11H4zM8 7V4h13v11h-3" />
                  </svg>
                  {qtyLabel}
                </span>
              )}
              <p className="pod-preview-caption">
                {LABELS.format[cfg.format]} · {LABELS.size[cfg.size]} · {LABELS.finish[cfg.finish]}
              </p>
            </div>

            {/* CENTRE — the six steps */}
            <div className="pod-steps">
              <Step num="①" title="Format" help="How the book is bound and held." id="step-format">
                <OptionGroup groupId="format" labelId="step-format" options={FORMATS} value={cfg.format} onChange={set('format')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{FMT_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-desc">{o.desc}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num="②" title="Size" help="Standard trims — no setup fuss." id="step-size">
                <OptionGroup groupId="size" labelId="step-size" options={SIZES} value={cfg.size} onChange={set('size')} className="pod-opts chips tight">
                  {(o) => (
                    <>
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-sub">{o.sub}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num="③" title="Paper" help="How the pages feel in the hand." id="step-paper">
                <OptionGroup groupId="paper" labelId="step-paper" options={PAPERS} value={cfg.paper} onChange={set('paper')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-sw" style={{ background: PAPER_EDGE[o.id].edge }} />
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-desc">{o.desc}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num="④" title="Binding" help="What holds the pages together." id="step-binding">
                <OptionGroup groupId="binding" labelId="step-binding" options={BINDINGS} value={cfg.binding} onChange={set('binding')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{BIND_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-desc">{o.desc}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num="⑤" title="Finish" help="The surface of your cover." id="step-finish">
                <OptionGroup groupId="finish" labelId="step-finish" options={FINISHES} value={cfg.finish} onChange={set('finish')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{FIN_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-desc">{o.desc}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num="⑥" title="Quantity" help="One copy or a short run." id="step-quantity">
                <OptionGroup groupId="quantity" labelId="step-quantity" options={QUANTITIES} value={cfg.quantity} onChange={set('quantity')} className="pod-opts chips tight">
                  {(o) => (
                    <>
                      <span className="pod-chip-name">{o.name}</span>
                      <span className="pod-chip-sub">{o.sub}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              {/* included with every order */}
              <div className="pod-included">
                <p className="pod-included-head">Included with every order</p>
                <ul className="pod-included-grid">
                  {INCLUDED.map((it) => (
                    <li className="pod-incl" key={it.name}>
                      <span className="pod-incl-ico">
                        <svg viewBox="0 0 24 24" aria-hidden="true">{it.ico}</svg>
                      </span>
                      <div>
                        <p className="pod-incl-name">{it.name}</p>
                        <p className="pod-incl-desc">{it.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT — sticky live summary */}
            <aside className="pod-summary" aria-label="Your book specification">
              <p className="pod-summary-eyebrow">Your spec</p>
              <h3 className="pod-summary-title">This book</h3>
              <ul className="pod-summary-list">
                {summaryRows.map(([k, v, sub]) => (
                  <li className="pod-summary-row" key={k}>
                    <span className="pod-summary-key">{k}</span>
                    <span className="pod-summary-val">
                      {v}
                      {sub && <span className="sub">{sub}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to={contactHref} className="pod-request">
                Request This Book
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <p className="pod-summary-note">
                No prices, no obligation — we’ll send a tailored quote and a free proof. Prefer to
                talk it through? <Link to="/contact">Speak to us.</Link>
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* 3 · HOW IT WORKS */}
      <section className="pod-how" data-theme="light" aria-labelledby="pod-how-title">
        <SectionCurve position="top" fill="#f0ebe0" />
        <PaperGrain opacity={0.05} />
        <div className="pod-how-inner">
          <div className="pod-how-head">
            <p className="pod-eyebrow">How it works</p>
            <h2 className="pod-how-title" id="pod-how-title">Three steps to finished copies</h2>
          </div>
          <div className="pod-how-grid">
            {HOW.map((s) => (
              <article className="pod-how-card" key={s.name}>
                <span className="pod-how-step">{s.step}</span>
                <span className="pod-how-ico"><svg viewBox="0 0 24 24" aria-hidden="true">{s.ico}</svg></span>
                <h3 className="pod-how-name">{s.name}</h3>
                <p className="pod-how-desc">{s.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · REASSURANCE BAND */}
      <section className="pod-band" data-theme="dark" aria-labelledby="pod-band-title">
        <SectionCurve position="top" fill="#0f2444" />
        <WavyBackground className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
        <SectionCurve position="bottom" fill="#0f2444" />
        <div className="pod-band-inner">
          <p className="pod-eyebrow" style={{ color: '#c89a3c' }}>The same presses</p>
          <p className="pod-band-quote" id="pod-band-title">
            One book gets the same presses as <em>one million.</em>
          </p>
          <p className="pod-band-sub">
            There is no “small order” shortcut here. Whether you print a single proof or a full run,
            your book moves through the same colour-managed presses and the same hands that produce
            our millions of books a year.
          </p>
          <ul className="pod-band-stats">
            <li className="pod-stat">
              <div className="pod-stat-num"><CountUp value={1} /></div>
              <p className="pod-stat-lbl">Copy — our smallest run</p>
            </li>
            <li className="pod-stat">
              <div className="pod-stat-num"><CountUp value={8} suffix="M+" /></div>
              <p className="pod-stat-lbl">Books a year on the same presses</p>
            </li>
            <li className="pod-stat">
              <div className="pod-stat-num">Days</div>
              <p className="pod-stat-lbl">Not weeks — sample turnaround</p>
            </li>
          </ul>
        </div>
      </section>

      {/* 5 · CTA */}
      <section className="pod-cta" data-theme="light" aria-labelledby="pod-cta-title">
        <PaperGrain opacity={0.05} />
        <div className="pod-cta-inner">
          <p className="pod-eyebrow">Take it slowly</p>
          <h2 className="pod-cta-title" id="pod-cta-title">Not sure yet? Order a sample first.</h2>
          <p className="pod-cta-sub">
            Hold the paper, check the colour, feel the binding — then decide. Tell us what you’re
            making and we’ll help you get a single sample copy into your hands.
          </p>
          <Link to="/contact?intent=print-on-demand-sample" className="pod-cta-btn">
            Order a sample
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}

function Step({ num, title, help, id, children }) {
  return (
    <section className="pod-step" id={`${id}-sec`} aria-labelledby={id}>
      <div className="pod-step-head">
        <span className="pod-step-num" aria-hidden="true">{num}</span>
        <h3 className="pod-step-title" id={id}>{title}</h3>
        <span className="pod-step-help">{help}</span>
      </div>
      {children}
    </section>
  )
}
