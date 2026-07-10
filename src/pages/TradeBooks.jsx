import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'

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

// Structural data only — all human-readable copy (name, story, craft, materials,
// options, feature labels) is resolved through the `tradeBooks` namespace via t().
// `key` maps to categories.<key>.*; `icon` doubles as the features.<icon> label key.
const CATS = [
  {
    key: 'coffee-table',
    swatch: '#24344F',
    gallery: ['/qfp/trade/coffee-table-01.webp', '/qfp/trade/coffee-table-02.webp', '/qfp/trade/coffee-table-03.webp'],
    features: ['case', 'foil', 'uv'],
  },
  {
    key: 'notebooks',
    swatch: '#0F2444',
    gallery: ['/qfp/trade/notebooks-01.webp', '/qfp/trade/notebooks-02.webp', '/qfp/trade/notebooks-03.webp'],
    features: ['perfect', 'emboss', 'formats'],
  },
  {
    key: 'diaries',
    swatch: '#3A2C1A',
    gallery: ['/qfp/trade/diaries-01.webp', '/qfp/trade/diaries-02.webp', '/qfp/trade/diaries-03.webp'],
    features: ['case', 'foil', 'emboss'],
  },
  {
    key: 'calendars',
    swatch: '#1B3A6B',
    gallery: ['/qfp/trade/calendars-01.webp', '/qfp/trade/calendars-02.webp', '/qfp/trade/calendars-03.webp'],
    features: ['saddle', 'fourc', 'formats'],
  },
  {
    key: 'autobiographies',
    swatch: '#16203A',
    gallery: ['/qfp/trade/autobiographies-01.webp', '/qfp/trade/autobiographies-02.webp', '/qfp/trade/autobiographies-03.webp'],
    features: ['case', 'offset', 'foil'],
  },
  {
    key: 'novels',
    swatch: '#2A3B57',
    gallery: ['/qfp/trade/novels-01.webp', '/qfp/trade/novels-02.webp', '/qfp/trade/novels-03.webp'],
    features: ['perfect', 'offset', 'litho'],
  },
]

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

export default function TradeBooks() {
  const { t } = useTranslation('tradeBooks')
  const [active, setActive] = useState(0)
  const [shot, setShot] = useState(0) // which gallery slot is shown large
  const galleryRef = useRef(null)

  const cat = CATS[active]
  const catName = t(`categories.${cat.key}.name`)
  const accItems = [
    { id: 'craft', title: t('accordion.craft'), body: t(`categories.${cat.key}.craft`) },
    { id: 'materials', title: t('accordion.materials'), body: t(`categories.${cat.key}.materials`) },
    { id: 'options', title: t('accordion.options'), body: t(`categories.${cat.key}.options`) },
    { id: 'delivery', title: t('accordion.delivery'), body: t('delivery') },
  ]

  // per-route SEO — title < 60ch, meta < 155ch, BreadcrumbList JSON-LD.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.whatWePrint'), item: 'https://www.quarterfoldltd.com/trade-books' },
      { '@type': 'ListItem', position: 3, name: t('seo.breadcrumb.tradeBooks'), item: 'https://www.quarterfoldltd.com/trade-books' },
    ],
  }

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
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={jsonLd} />
      {/* 1 ── PRODUCT EXPERIENCE ─────────────────────────────────────────── */}
      <section
        data-theme="light"
        className="tb-exp"
        ref={galleryRef}
        aria-label={t('experience.regionLabel')}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <PaperGrain />
        <EdgeGlow tone="warm" />
        <div className="tb-exp-grid" style={{ position: 'relative', zIndex: 1 }}>
          {/* LEFT — sticky gallery */}
          <div className="tb-gallery">
            <figure className="tb-stage">
              <img
                key={cat.gallery[shot]}
                src={cat.gallery[shot]}
                alt={t('gallery.imageAlt', { name: catName, index: shot + 1 })}
                className="tb-stage-img"
                width="1200"
                height="1500"
              />
              <figcaption className="tb-stage-tag">
                <span className="tb-stage-dot" style={{ background: cat.swatch }} aria-hidden="true" />
                {catName}
              </figcaption>
            </figure>
            <div className="tb-thumbs" role="tablist" aria-label={t('gallery.viewsLabel', { name: catName })}>
              {cat.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  role="tab"
                  aria-selected={shot === i}
                  aria-label={t('gallery.viewLabel', { index: i + 1 })}
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
            <p className="tb-eyebrow" data-reveal>
              {t('hero.eyebrow')}
              <span className="tb-badge">{t('hero.badge')}</span>
            </p>
            <h1 className="tb-h1" data-textreveal>{t('hero.title')}</h1>
            <p className="tb-lede" data-reveal>
              <span className="tb-lede-light">{t('hero.ledeLight')}</span>
              <span className="tb-lede-bold">{t('hero.ledeBold')}</span>
            </p>

            {/* active category subheading (swaps) */}
            <div className="tb-active" aria-live="polite">
              <span className="tb-active-name">{catName}</span>
              <span className="tb-active-story">{t(`categories.${cat.key}.story`)}</span>
            </div>

            {/* THE SWATCHES — category switcher (fctry's colourway row) */}
            <div className="tb-swatches" role="group" aria-label={t('switcher.groupLabel')}>
              {CATS.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  className={`tb-swatch focus-ring ${active === i ? 'is-active' : ''}`}
                  aria-pressed={active === i}
                  onClick={() => pick(i)}
                >
                  <span className="tb-swatch-chip" style={{ '--chip': c.swatch }} aria-hidden="true" />
                  <span className="tb-swatch-label">{t(`categories.${c.key}.name`)}</span>
                </button>
              ))}
            </div>

            {/* feature icon trio (swaps per category) */}
            <ul className="tb-feats">
              {cat.features.map((f) => (
                <li key={f} className="tb-feat">
                  <span className="tb-feat-ico"><FeatureIcon name={f} /></span>
                  <span className="tb-feat-label">{t(`features.${f}`)}</span>
                </li>
              ))}
            </ul>

            {/* CTA — no cart/price; Request a Quote → /contact */}
            <div className="tb-cta-row">
              <Link to="/contact" className="tb-quote focus-ring">
                {t('cta.requestQuote')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#tb-range" className="tb-spec focus-ring">
                {t('cta.compareRange')}
              </a>
            </div>

            {/* 2 ── ACCORDION BLOCKS ──────────────────────────────────────── */}
            <Accordion items={accItems} />
          </div>
        </div>
      </section>

      {/* 3 ── LIFESTYLE BREAK ────────────────────────────────────────────── */}
      <section data-theme="dark" className="tb-life" aria-label={t('life.regionLabel')}>
        <img src="/qfp/trade/lifestyle.webp" alt="" aria-hidden="true" className="tb-life-img" />
        <div className="tb-life-scrim" aria-hidden="true" />
        <DotField tone="navy" />
        <SectionCurve position="top" fill="#FDFAF4" />
        <SectionCurve position="bottom" fill="#FDFAF4" />
        <p className="tb-life-line" style={{ position: 'relative', zIndex: 2 }} data-reveal>
          <span className="tb-life-light">{t('life.light')}</span>
          <span className="tb-life-bold">{t('life.bold')}</span>
        </p>
      </section>

      {/* 4 ── RANGE BAR (fctry collection strip) ─────────────────────────── */}
      <section
        id="tb-range"
        data-theme="light"
        className="tb-range"
        aria-label={t('range.regionLabel')}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <PaperGrain />
        <div className="tb-range-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div className="tb-range-head" data-reveal>
            <p className="tb-range-eyebrow">{t('range.eyebrow')}</p>
            <p className="tb-range-sub">{t('range.sub')}</p>
          </div>

          {/* in-page category jumps */}
          <div className="tb-range-cats">
            {CATS.map((c, i) => (
              <button
                key={c.key}
                type="button"
                data-reveal
                className={`tb-range-cat focus-ring ${active === i ? 'is-active' : ''}`}
                onClick={() => jumpTo(i)}
              >
                <span className="tb-range-chip" style={{ '--chip': c.swatch }} aria-hidden="true" />
                {t(`categories.${c.key}.name`)}
              </button>
            ))}
          </div>

          {/* sibling pages */}
          <div className="tb-range-sibs">
            <Link to="/educational-books" className="tb-sib focus-ring" data-reveal>
              <span className="tb-sib-eyebrow">{t('range.siblingEyebrow')}</span>
              <span className="tb-sib-name">{t('range.educational')}</span>
              <span className="tb-sib-go" aria-hidden="true">
                {t('range.visit')}
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </Link>
            <Link to="/print-on-demand" className="tb-sib focus-ring" data-reveal>
              <span className="tb-sib-eyebrow">{t('range.siblingEyebrow')}</span>
              <span className="tb-sib-name">{t('range.pod')}</span>
              <span className="tb-sib-go" aria-hidden="true">
                {t('range.visit')}
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5 ── CTA BAND ───────────────────────────────────────────────────── */}
      <section
        data-theme="light"
        className="tb-close"
        aria-label={t('close.regionLabel')}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <SectionCurve position="top" fill="#F0EBE0" />
        <PaperGrain />
        <EdgeGlow tone="warm" />
        <div className="tb-close-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <p className="tb-close-eyebrow" data-reveal>{t('close.eyebrow')}</p>
            <h2 className="tb-close-h" data-textreveal>{t('close.title')}</h2>
          </div>
          <Link to="/contact" className="tb-close-pill focus-ring" data-reveal>
            {t('close.requestQuote')}
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h9M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}
