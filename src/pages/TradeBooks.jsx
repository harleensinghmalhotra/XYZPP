import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// ── /trade-books ─────────────────────────────────────────────────────────────
// fctrylab.com product-page anatomy, reskinned into QFP System B and adapted for
// a RANGE: fctry's colour-variant swatch row becomes our CATEGORY SWITCHER. One
// immersive product experience; the six categories behave like "colourways" —
// clicking a swatch swaps the sticky gallery + copy client-side (no route change).
//
// Palette LAW — System B only: navy #0F2444, gold #9B7420/#C89A3C/#836013 (accent),
// cream #FDFAF4, beige #F0EBE0, ink #1C2019. Fonts: Inter Tight / Inter / DM Mono.
// B2B showcase: no prices, no cart, no sizes — "Request a Quote" → /contact.
// All copy is drawn from recon/qfp-live-pages/trade-books.md + the homepage
// print-craft marquee terms; nothing is invented.

const CATS = [
  {
    key: 'coffee-table',
    name: 'Coffee-Table Books',
    swatch: '#24344F',
    story: 'Made to be left out, not shelved.',
    gallery: ['/qfp/trade/coffee-table-01.webp', '/qfp/trade/coffee-table-02.webp', '/qfp/trade/coffee-table-03.webp'],
    features: [
      { icon: 'case', label: 'Case Binding' },
      { icon: 'foil', label: 'Foil Blocking' },
      { icon: 'uv', label: 'Spot UV' },
    ],
    craft:
      'Case-bound and hand-finished, with foil blocking and embossing on cloth and board covers — the expert binding that lets a large-format book lie flat and open true.',
    materials:
      'Premium coated and uncoated paper stocks, printed 4-colour process on offset presses, then dressed with metallic foils and spot UV.',
    options:
      'Portrait or landscape formats, custom trim sizes, matte or gloss lamination, and specialty finishes to order.',
  },
  {
    key: 'notebooks',
    name: 'Premium Notebooks',
    swatch: '#0F2444',
    story: 'A blank page worth keeping.',
    gallery: ['/qfp/trade/notebooks-01.webp', '/qfp/trade/notebooks-02.webp', '/qfp/trade/notebooks-03.webp'],
    features: [
      { icon: 'perfect', label: 'Perfect Bound' },
      { icon: 'emboss', label: 'Embossing' },
      { icon: 'formats', label: 'Custom Formats' },
    ],
    craft:
      'Perfect bound or case bound, with debossed and embossed covers and foil-blocked detailing — counterbooks, pads and branded stationery built to be used daily.',
    materials:
      'Premium paper stocks with ruled, dotted or plain interiors; leatherette, cloth and board covers finished with foil.',
    options:
      'A6 to A4 and bespoke sizes, rounded corners, elastic closures and ribbon markers, printed or blind-blocked.',
  },
  {
    key: 'diaries',
    name: 'Leather Diaries',
    swatch: '#3A2C1A',
    story: 'A year, bound in leather.',
    gallery: ['/qfp/trade/diaries-01.webp', '/qfp/trade/diaries-02.webp', '/qfp/trade/diaries-03.webp'],
    features: [
      { icon: 'case', label: 'Case Binding' },
      { icon: 'foil', label: 'Foil Blocking' },
      { icon: 'emboss', label: 'Embossing' },
    ],
    craft:
      'Luxury leather-case, hard-bound and soft-bound builds, foil blocked and embossed by hand — the expert binding techniques that make a diary last a year and beyond.',
    materials:
      'Genuine and bonded leather cases over premium paper stocks, with gilt and matte foil edging.',
    options:
      'Dated or undated, week-to-view or day-per-page, with elastic bands, pen loops and personalised foil.',
  },
  {
    key: 'calendars',
    name: 'Calendars',
    swatch: '#1B3A6B',
    story: 'Twelve months, printed to last.',
    gallery: ['/qfp/trade/calendars-01.webp', '/qfp/trade/calendars-02.webp', '/qfp/trade/calendars-03.webp'],
    features: [
      { icon: 'saddle', label: 'Saddle Stitch' },
      { icon: 'fourc', label: '4-Colour Process' },
      { icon: 'formats', label: 'Custom Formats' },
    ],
    craft:
      'Saddle-stitched and wire-bound wall calendars, printed 4-colour process with foil and spot UV accents on the cover month.',
    materials:
      'Heavyweight coated stocks for the image months, board backing, and metal or wire-o binding.',
    options:
      'Wall, desk and landscape formats, custom grids, and bespoke trim sizes to order.',
  },
  {
    key: 'autobiographies',
    name: 'Autobiographies',
    swatch: '#16203A',
    story: 'A life, set in type.',
    gallery: ['/qfp/trade/autobiographies-01.webp', '/qfp/trade/autobiographies-02.webp', '/qfp/trade/autobiographies-03.webp'],
    features: [
      { icon: 'case', label: 'Case Binding' },
      { icon: 'offset', label: 'Offset Printing' },
      { icon: 'foil', label: 'Foil Blocking' },
    ],
    craft:
      "Case bound with printed or foil-blocked jackets, offset printed and hand-finished — heritage and collector's editions built to be kept.",
    materials:
      'Cream and white book-wove paper stocks, printed cloth or board covers, head and tail bands, and foiled spines.',
    options:
      'Royal, demy and custom trim sizes, dust jackets, ribbon markers and slipcases to order.',
  },
  {
    key: 'novels',
    name: 'Novels',
    swatch: '#2A3B57',
    story: 'Perfectly bound, cover to cover.',
    gallery: ['/qfp/trade/novels-01.webp', '/qfp/trade/novels-02.webp', '/qfp/trade/novels-03.webp'],
    features: [
      { icon: 'perfect', label: 'Perfect Bound' },
      { icon: 'offset', label: 'Offset Printing' },
      { icon: 'litho', label: 'Lithography' },
    ],
    craft:
      'Perfect bound on offset and lithographic presses — trade paperbacks and hardbacks, printed clean and bound to open flat.',
    materials:
      'Book-wove and bulk paper stocks, matte or gloss laminated covers, with foil and spot UV options.',
    options:
      'A-format to royal, French flaps, custom trims, and short or long print runs.',
  },
]

const DELIVERY =
  'Export-ready from our Taloja and Vashi facilities — printed, packed, palletised and shipped to educational and trade partners in 25+ countries.'

// ── stroke-draw feature icons (line-art, gold, ≥24px) ────────────────────────
function FeatureIcon({ name }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'case': // bound book, stitched spine
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 5.5h6.5v13H4z" /><path {...p} d="M20 5.5h-6.5v13H20z" /><path {...p} d="M12 5.5v13" /><path {...p} strokeDasharray="1.4 1.6" d="M12 6.6v10.8" /></svg>)
    case 'perfect': // stacked pages, glued spine
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="4" y="6" width="16" height="12" rx="1.2" /><path {...p} d="M7 6v12" /><path {...p} d="M10 9.5h7M10 12h7M10 14.5h5" /></svg>)
    case 'foil': // foil stamp + sparkle
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="4.5" y="4.5" width="15" height="15" rx="2" /><path {...p} d="M12 8.2l1.5 2.3 2.3 1.5-2.3 1.5L12 15.8l-1.5-2.3L8.2 12l2.3-1.5z" /></svg>)
    case 'uv': // droplet + shine (spot varnish)
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M12 4c3 3.6 5 6.3 5 9a5 5 0 1 1-10 0c0-2.7 2-5.4 5-9z" /><path {...p} d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" /></svg>)
    case 'emboss': // raised concentric panel
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="4" y="4" width="16" height="16" rx="2" /><rect {...p} x="8" y="8" width="8" height="8" rx="1.4" /><path {...p} d="M10.4 13.6l1.6-3 1.6 3" /></svg>)
    case 'saddle': // saddle-stitch staples
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 6.5c4-2 12-2 16 0v11c-4-2-12-2-16 0z" /><path {...p} d="M12 5.5v13" /><path {...p} d="M12 8.5h3M12 15.5h3" /></svg>)
    case 'fourc': // overlapping CMYK circles
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><circle {...p} cx="9" cy="10" r="4" /><circle {...p} cx="15" cy="10" r="4" /><circle {...p} cx="12" cy="15" r="4" /></svg>)
    case 'offset': // press cylinder + feed
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse {...p} cx="12" cy="9" rx="7" ry="3" /><path {...p} d="M5 9v4c0 1.7 3.1 3 7 3s7-1.3 7-3V9" /><path {...p} d="M12 16v4M8.5 20h7" /></svg>)
    case 'litho': // plate + waves
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="4" y="5" width="16" height="14" rx="1.6" /><path {...p} d="M6.5 11c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0M6.5 14.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0" /></svg>)
    case 'formats': // nested frames / resize
      return (<svg viewBox="0 0 24 24" aria-hidden="true"><rect {...p} x="4" y="4" width="11" height="11" rx="1.2" /><rect {...p} x="9" y="9" width="11" height="11" rx="1.2" /></svg>)
    default:
      return null
  }
}

// chevron for accordion
const Chevron = () => (
  <svg width="15" height="15" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="tb-acc-chev">
    <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function Accordion({ items }) {
  const [open, setOpen] = useState('craft')
  return (
    <div className="tb-acc">
      {items.map((it) => {
        const isOpen = open === it.id
        return (
          <div key={it.id} className={`tb-acc-item ${isOpen ? 'is-open' : ''}`}>
            <h3 className="tb-acc-h">
              <button
                type="button"
                className="tb-acc-btn focus-ring"
                aria-expanded={isOpen}
                aria-controls={`tb-panel-${it.id}`}
                id={`tb-btn-${it.id}`}
                onClick={() => setOpen(isOpen ? '' : it.id)}
              >
                <span className="tb-acc-title">{it.title}</span>
                <Chevron />
              </button>
            </h3>
            <div
              id={`tb-panel-${it.id}`}
              role="region"
              aria-labelledby={`tb-btn-${it.id}`}
              className="tb-acc-panel"
              hidden={!isOpen}
            >
              <p className="tb-acc-body">{it.body}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// per-route SEO — title < 60ch, meta < 155ch, BreadcrumbList JSON-LD.
function useSeo() {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Trade Book Printing | Quarterfold Printabilities'
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta ? meta.getAttribute('content') : null
    if (meta)
      meta.setAttribute(
        'content',
        'Premium trade-book printing by Quarterfold: coffee-table books, notebooks, leather diaries, calendars, autobiographies and novels. Request a quote.',
      )
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.id = 'tb-breadcrumb'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.quarterfoldltd.com/' },
        { '@type': 'ListItem', position: 2, name: 'What We Print', item: 'https://www.quarterfoldltd.com/trade-books' },
        { '@type': 'ListItem', position: 3, name: 'Trade Books', item: 'https://www.quarterfoldltd.com/trade-books' },
      ],
    })
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc)
      document.getElementById('tb-breadcrumb')?.remove()
    }
  }, [])
}

export default function TradeBooks() {
  const [active, setActive] = useState(0)
  const [shot, setShot] = useState(0) // which gallery slot is shown large
  const galleryRef = useRef(null)
  useSeo()

  const cat = CATS[active]
  const accItems = [
    { id: 'craft', title: 'The Craft', body: cat.craft },
    { id: 'materials', title: 'The Materials', body: cat.materials },
    { id: 'options', title: 'The Options', body: cat.options },
    { id: 'delivery', title: 'Delivery', body: DELIVERY },
  ]

  const pick = (i) => {
    setActive(i)
    setShot(0)
  }

  const jumpTo = (i) => {
    pick(i)
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main id="main" className="tb">
      {/* 1 ── PRODUCT EXPERIENCE ─────────────────────────────────────────── */}
      <section data-theme="light" className="tb-exp" ref={galleryRef} aria-label="Trade Books product experience">
        <div className="tb-exp-grid">
          {/* LEFT — sticky gallery */}
          <div className="tb-gallery">
            <figure className="tb-stage">
              <img
                key={cat.gallery[shot]}
                src={cat.gallery[shot]}
                alt={`${cat.name} — Quarterfold trade book, view ${shot + 1}`}
                className="tb-stage-img"
                width="1200"
                height="1500"
              />
              <figcaption className="tb-stage-tag">
                <span className="tb-stage-dot" style={{ background: cat.swatch }} aria-hidden="true" />
                {cat.name}
              </figcaption>
            </figure>
            <div className="tb-thumbs" role="tablist" aria-label={`${cat.name} views`}>
              {cat.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  aria-selected={shot === i}
                  aria-label={`View ${i + 1}`}
                  className={`tb-thumb focus-ring ${shot === i ? 'is-active' : ''}`}
                  onClick={() => setShot(i)}
                >
                  <img src={g} alt="" aria-hidden="true" width="1200" height="1500" />
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — product panel */}
          <div className="tb-panel">
            <p className="tb-eyebrow">
              Trade Books
              <span className="tb-badge">Export-Grade</span>
            </p>
            <h1 className="tb-h1">Trade Books</h1>
            <p className="tb-lede">
              <span className="tb-lede-light">Some books inform. </span>
              <span className="tb-lede-bold">These are bound to be kept.</span>
            </p>

            {/* active category subheading (swaps) */}
            <div className="tb-active" aria-live="polite">
              <span className="tb-active-name">{cat.name}</span>
              <span className="tb-active-story">{cat.story}</span>
            </div>

            {/* THE SWATCHES — category switcher (fctry's colourway row) */}
            <div className="tb-swatches" role="group" aria-label="Choose a trade-book category">
              {CATS.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  className={`tb-swatch focus-ring ${active === i ? 'is-active' : ''}`}
                  aria-pressed={active === i}
                  onClick={() => pick(i)}
                >
                  <span className="tb-swatch-chip" style={{ '--chip': c.swatch }} aria-hidden="true" />
                  <span className="tb-swatch-label">{c.name}</span>
                </button>
              ))}
            </div>

            {/* feature icon trio (swaps per category) */}
            <ul className="tb-feats">
              {cat.features.map((f) => (
                <li key={f.label} className="tb-feat">
                  <span className="tb-feat-ico"><FeatureIcon name={f.icon} /></span>
                  <span className="tb-feat-label">{f.label}</span>
                </li>
              ))}
            </ul>

            {/* CTA — no cart/price; Request a Quote → /contact */}
            <div className="tb-cta-row">
              <Link to="/contact" className="tb-quote focus-ring">
                Request a Quote
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#tb-range" className="tb-spec focus-ring">
                Compare the Range
              </a>
            </div>

            {/* 2 ── ACCORDION BLOCKS ──────────────────────────────────────── */}
            <Accordion items={accItems} />
          </div>
        </div>
      </section>

      {/* 3 ── LIFESTYLE BREAK ────────────────────────────────────────────── */}
      <section data-theme="dark" className="tb-life" aria-label="Trade Books, kept">
        <img src="/qfp/trade/lifestyle.webp" alt="" aria-hidden="true" className="tb-life-img" />
        <div className="tb-life-scrim" aria-hidden="true" />
        <p className="tb-life-line">
          <span className="tb-life-light">Some books inform. </span>
          <span className="tb-life-bold">These are kept.</span>
        </p>
      </section>

      {/* 4 ── RANGE BAR (fctry collection strip) ─────────────────────────── */}
      <section id="tb-range" data-theme="light" className="tb-range" aria-label="Explore the range">
        <div className="tb-range-inner">
          <div className="tb-range-head">
            <p className="tb-range-eyebrow">Explore the Range</p>
            <p className="tb-range-sub">Jump between categories, or step across to a sibling service.</p>
          </div>

          {/* in-page category jumps */}
          <div className="tb-range-cats">
            {CATS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                className={`tb-range-cat focus-ring ${active === i ? 'is-active' : ''}`}
                onClick={() => jumpTo(i)}
              >
                <span className="tb-range-chip" style={{ '--chip': c.swatch }} aria-hidden="true" />
                {c.name}
              </button>
            ))}
          </div>

          {/* sibling pages */}
          <div className="tb-range-sibs">
            <Link to="/educational-books" className="tb-sib focus-ring">
              <span className="tb-sib-eyebrow">Sibling Service</span>
              <span className="tb-sib-name">Educational Books</span>
              <span className="tb-sib-go" aria-hidden="true">
                Visit
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </Link>
            <Link to="/print-on-demand" className="tb-sib focus-ring">
              <span className="tb-sib-eyebrow">Sibling Service</span>
              <span className="tb-sib-name">Print on Demand</span>
              <span className="tb-sib-go" aria-hidden="true">
                Visit
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5 ── CTA BAND ───────────────────────────────────────────────────── */}
      <section data-theme="light" className="tb-close" aria-label="Start a trade-book project">
        <div className="tb-close-inner">
          <div>
            <p className="tb-close-eyebrow">Made to order</p>
            <h2 className="tb-close-h">Let&apos;s craft your edition.</h2>
          </div>
          <Link to="/contact" className="tb-close-pill focus-ring">
            Request a Quote
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}
