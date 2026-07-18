import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import CountUp from '@/components/CountUp'
import SectionCurve from '@/components/SectionCurve'
import PageHero, { splitTitle } from '@/components/PageHero'
import { DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'
import './PrintOnDemand.css'

/* /print-on-demand — replaces the ShellPage. A "Build Your Book" configurator
   modelled on Lightship's "Build your AE.1" experience (sticky visual · scrolling
   option groups · persistent live summary), reskinned for self-publishers and
   indie authors in QFP System B. NO prices anywhere — the output is a spec summary
   that feeds a quote request on /contact. Warm, one-to-one tone. */

/* ── option data ─────────────────────────────────────────────────────────────────
   Each option carries only its stable enum id; every user-facing string (label,
   description, summary sub-label) is resolved at render time via
   t(`options.<group>.<id>.label|desc|sub`). Group ids drive OptionGroup rendering
   and the summary rows. */
const FORMATS = [{ id: 'paperback' }, { id: 'hardcover' }, { id: 'landscape' }]
const SIZES = [{ id: '5x8' }, { id: '6x9' }, { id: '8x10' }, { id: 'a4' }]
const PAPERS = [{ id: 'cream' }, { id: 'white' }, { id: 'art' }]
const BINDINGS = [{ id: 'perfect' }, { id: 'sewn' }, { id: 'wiro' }]
const FINISHES = [{ id: 'matte' }, { id: 'gloss' }, { id: 'layflat' }]
const QUANTITIES = [{ id: '1' }, { id: '10' }, { id: '50' }, { id: '250' }, { id: '500' }]
/* number-hero shown on the quantity chips (the full "1 copy" label still drives the
   summary row, the qty badge and the /contact params — this is chip display only). */
const QTY_HERO = { 1: '1', 10: '10', 50: '50', 250: '250', 500: '500+' }

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
  { key: 'proof', ico: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" /></> },
  { key: 'check', ico: <><path d="M20 7 10 17l-5-5" /><path d="M4 20h16" /></> },
  { key: 'packing', ico: <><path d="M3 8 12 3l9 5v8l-9 5-9-5V8Z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></> },
  { key: 'delivery', ico: <><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="17" r="1.6" /><circle cx="17.5" cy="17" r="1.6" /></> },
]
const HOW = [
  { key: 'upload', ico: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></> },
  { key: 'approve', ico: <><path d="M4 5h16v11H4z" /><path d="M9 20h6" /><path d="m8 10 2.5 2.5L16 7" /></> },
  { key: 'ship', ico: <><path d="M6 9V4h9l3 3v2" /><path d="M6 18H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-2" /><rect x="8" y="15" width="8" height="5" rx="1" /></> },
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
  const { t } = useTranslation('printOnDemand')
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
  // resolve an option's display label via the printOnDemand namespace
  const optLabel = (group, id) => t(`options.${group}.${id}.label`)
  const qtyLabel = optLabel('quantity', cfg.quantity)

  // carry the full spec to /contact as readable (translated) URL params
  const params = new URLSearchParams({
    intent: 'print-on-demand',
    format: optLabel('format', cfg.format),
    size: optLabel('size', cfg.size),
    paper: optLabel('paper', cfg.paper),
    binding: optLabel('binding', cfg.binding),
    finish: optLabel('finish', cfg.finish),
    quantity: optLabel('quantity', cfg.quantity),
  })
  const contactHref = `/contact?${params.toString()}`

  // SEO — title, meta description, BreadcrumbList (managed for this route only)
  useEffect(() => {
    const prevTitle = document.title
    document.title = t('seo.title')
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    meta?.setAttribute('content', t('seo.description'))
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: '/' },
        { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: '/print-on-demand' },
      ],
    })
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc)
      ld.remove()
    }
  }, [t])

  const summaryRows = [
    ['format', optLabel('format', cfg.format), t(`options.format.${cfg.format}.sub`)],
    ['size', optLabel('size', cfg.size), t(`options.size.${cfg.size}.sub`)],
    ['paper', optLabel('paper', cfg.paper), t(`options.paper.${cfg.paper}.sub`)],
    ['binding', optLabel('binding', cfg.binding), t(`options.binding.${cfg.binding}.sub`)],
    ['finish', optLabel('finish', cfg.finish), t(`options.finish.${cfg.finish}.sub`)],
    ['quantity', optLabel('quantity', cfg.quantity), t(`options.quantity.${cfg.quantity}.sub`)],
  ]

  return (
    <main id="main" className="pod">
      {/* 1 · HERO */}
      {(() => {
        const [l1, l2] = splitTitle(t('hero.title'))
        return (
          <PageHero id="pod-h1" eyebrow={t('hero.eyebrow')} line1={l1} line2={l2} subline={t('hero.sub')} minVh={62}>
            <div className="ph-stat" aria-label={t('hero.statAria')}>
              <span className="ph-stat-num" aria-hidden="true">{t('hero.statNum')}</span>
              <span className="ph-stat-label">{t('hero.statUnit')}</span>
              <span className="ph-stat-foot">{t('hero.statFoot')}</span>
            </div>
            <div className="ph-ctas" style={{ marginTop: 'clamp(24px, 4vh, 36px)' }}>
              <a href="#build" className="u-btn u-btn--gold">
                {t('hero.cta')}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>
              </a>
            </div>
          </PageHero>
        )
      })()}

      {/* 2 · BUILD YOUR BOOK */}
      <section className="pod-build" id="build" data-theme="light" aria-labelledby="pod-build-title">
        <div className="pod-build-inner">
          <div className="pod-build-head">
            <p className="pod-eyebrow">{t('build.eyebrow')}</p>
            <h2 className="pod-build-title" id="pod-build-title">{t('build.title')}</h2>
            <p className="pod-build-lede">
              {t('build.lede')}
            </p>
          </div>

          <div className="pod-config">
            {/* LEFT — live preview */}
            <div className="pod-preview" aria-hidden="true">
              <span className="pod-preview-tag">{t('build.previewTag')}</span>
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
                {optLabel('format', cfg.format)}{t('build.previewCaptionSep')}
                {optLabel('size', cfg.size)}{t('build.previewCaptionSep')}
                {optLabel('finish', cfg.finish)}
              </p>
            </div>

            {/* CENTRE — the six steps */}
            <div className="pod-steps">
              <Step num={t('steps.format.num')} title={t('steps.format.title')} help={t('steps.format.help')} id="step-format">
                <OptionGroup groupId="format" labelId="step-format" options={FORMATS} value={cfg.format} onChange={set('format')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{FMT_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{t(`options.format.${o.id}.label`)}</span>
                      <span className="pod-chip-desc">{t(`options.format.${o.id}.desc`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num={t('steps.size.num')} title={t('steps.size.title')} help={t('steps.size.help')} id="step-size">
                <OptionGroup groupId="size" labelId="step-size" options={SIZES} value={cfg.size} onChange={set('size')} className="pod-opts chips size">
                  {(o) => (
                    <>
                      <span className="pod-chip-hero">{t(`options.size.${o.id}.label`)}</span>
                      <span className="pod-chip-sub">{t(`options.size.${o.id}.sub`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num={t('steps.paper.num')} title={t('steps.paper.title')} help={t('steps.paper.help')} id="step-paper">
                <OptionGroup groupId="paper" labelId="step-paper" options={PAPERS} value={cfg.paper} onChange={set('paper')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-sw" style={{ background: PAPER_EDGE[o.id].edge }} />
                      <span className="pod-chip-name">{t(`options.paper.${o.id}.label`)}</span>
                      <span className="pod-chip-desc">{t(`options.paper.${o.id}.desc`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num={t('steps.binding.num')} title={t('steps.binding.title')} help={t('steps.binding.help')} id="step-binding">
                <OptionGroup groupId="binding" labelId="step-binding" options={BINDINGS} value={cfg.binding} onChange={set('binding')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{BIND_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{t(`options.binding.${o.id}.label`)}</span>
                      <span className="pod-chip-desc">{t(`options.binding.${o.id}.desc`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num={t('steps.finish.num')} title={t('steps.finish.title')} help={t('steps.finish.help')} id="step-finish">
                <OptionGroup groupId="finish" labelId="step-finish" options={FINISHES} value={cfg.finish} onChange={set('finish')} className="pod-opts cols-3">
                  {(o) => (
                    <>
                      <span className="pod-chip-ico"><Ico size={30}>{FIN_ICON[o.id]}</Ico></span>
                      <span className="pod-chip-name">{t(`options.finish.${o.id}.label`)}</span>
                      <span className="pod-chip-desc">{t(`options.finish.${o.id}.desc`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              <Step num={t('steps.quantity.num')} title={t('steps.quantity.title')} help={t('steps.quantity.help')} id="step-quantity">
                <OptionGroup groupId="quantity" labelId="step-quantity" options={QUANTITIES} value={cfg.quantity} onChange={set('quantity')} className="pod-opts chips qty">
                  {(o) => (
                    <>
                      <span className="pod-chip-hero">{QTY_HERO[o.id]}</span>
                      <span className="pod-chip-sub">{t(`options.quantity.${o.id}.sub`)}</span>
                    </>
                  )}
                </OptionGroup>
              </Step>

              {/* included with every order */}
              <div className="pod-included">
                <p className="pod-included-head">{t('included.head')}</p>
                <ul className="pod-included-grid">
                  {INCLUDED.map((it) => (
                    <li className="pod-incl" key={it.key}>
                      <span className="pod-incl-ico">
                        <svg viewBox="0 0 24 24" aria-hidden="true">{it.ico}</svg>
                      </span>
                      <div>
                        <p className="pod-incl-name">{t(`included.${it.key}.name`)}</p>
                        <p className="pod-incl-desc">{t(`included.${it.key}.desc`)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RIGHT — sticky live summary */}
            <aside className="pod-summary" aria-label={t('summary.ariaLabel')}>
              <p className="pod-summary-eyebrow">{t('summary.eyebrow')}</p>
              <h3 className="pod-summary-title">{t('summary.title')}</h3>
              <ul className="pod-summary-list">
                {summaryRows.map(([k, v, sub]) => (
                  <li className="pod-summary-row" key={k}>
                    <span className="pod-summary-key">{t(`summary.keys.${k}`)}</span>
                    <span className="pod-summary-val">
                      {v}
                      {sub && <span className="sub">{sub}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to={contactHref} className="pod-request">
                {t('summary.request')}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <p className="pod-summary-note">
                <Trans t={t} i18nKey="summary.note" components={{ 1: <Link to="/contact" /> }} />
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
          <div className="pod-how-head" data-reveal>
            <p className="pod-eyebrow">{t('how.eyebrow')}</p>
            <h2 className="pod-how-title" id="pod-how-title">{t('how.title')}</h2>
          </div>
          <div className="pod-how-grid">
            {HOW.map((s) => (
              <article className="pod-how-card" key={s.key} data-reveal>
                <span className="pod-how-step">{t(`how.${s.key}.step`)}</span>
                <span className="pod-how-ico"><svg viewBox="0 0 24 24" aria-hidden="true">{s.ico}</svg></span>
                <h3 className="pod-how-name">{t(`how.${s.key}.name`)}</h3>
                <p className="pod-how-desc">{t(`how.${s.key}.desc`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · REASSURANCE BAND */}
      <section className="pod-band" data-theme="dark" aria-labelledby="pod-band-title">
        <SectionCurve position="top" fill="#f0ebe0" inward />
        <SectionCurve position="bottom" fill="#f0ebe0" inward />
        <div className="pod-band-inner">
          <p className="pod-eyebrow" style={{ color: '#D99637' }} data-reveal>{t('band.eyebrow')}</p>
          <p className="pod-band-quote" id="pod-band-title" data-reveal>
            <Trans t={t} i18nKey="band.quote" components={{ em: <em /> }} />
          </p>
          <p className="pod-band-sub" data-reveal>
            {t('band.sub')}
          </p>
          <ul className="pod-band-stats">
            <li className="pod-stat" data-reveal>
              <div className="pod-stat-num"><CountUp value={1} /></div>
              <p className="pod-stat-lbl">{t('band.stat1Label')}</p>
            </li>
            <li className="pod-stat" data-reveal>
              <div className="pod-stat-num"><CountUp value={8} suffix="M+" /></div>
              <p className="pod-stat-lbl">{t('band.stat2Label')}</p>
            </li>
            <li className="pod-stat" data-reveal>
              <div className="pod-stat-num">{t('band.stat3Num')}</div>
              <p className="pod-stat-lbl">{t('band.stat3Label')}</p>
            </li>
          </ul>
        </div>
      </section>

      {/* 5 · CTA */}
      <section className="pod-cta" data-theme="light" aria-labelledby="pod-cta-title">
        <PaperGrain opacity={0.05} />
        <div className="pod-cta-inner">
          <p className="pod-eyebrow" data-reveal>{t('cta.eyebrow')}</p>
          <h2 className="pod-cta-title" id="pod-cta-title" data-textreveal>{t('cta.title')}</h2>
          <p className="pod-cta-sub" data-reveal>
            {t('cta.sub')}
          </p>
          <Link to="/contact?intent=print-on-demand-sample" className="pod-cta-btn" data-reveal>
            {t('cta.btn')}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  )
}

/* Step header — DM Mono eyebrow kicker (no circled-number badges) → title → helper.
   `num` is a localised "Step 01" / "Étape 01" string, uppercased in CSS. */
function Step({ num, title, help, id, children }) {
  return (
    <section className="pod-step" id={`${id}-sec`} aria-labelledby={id}>
      <div className="pod-step-head">
        <span className="pod-step-kicker" aria-hidden="true">{num}</span>
        <h3 className="pod-step-title" id={id}>{title}</h3>
        <p className="pod-step-help">{help}</p>
      </div>
      {children}
    </section>
  )
}
