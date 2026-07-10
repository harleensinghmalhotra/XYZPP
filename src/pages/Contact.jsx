import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import SectionCurve from '@/components/SectionCurve'
import { WavyBackground, DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'

gsap.registerPlugin(ScrollTrigger)

// ── /contact ─────────────────────────────────────────────────────────────────
// The conversion page. Every other page's primary CTA lands here. Structure is
// modelled on grb.uk.com/about-us/contact (hero → map → welcome → quick actions →
// addresses & hours → enquiry form → audience-tabbed FAQ → quiet email closer),
// fully reskinned into brand System B (navy / gold / cream, Inter Tight / Inter /
// DM Mono). Native scroll — Lenis lives only on "/". No live Google Maps iframe
// (cookieless-safe): a styled static map + an "Open in Google Maps" link instead.

// ── Canonical contact data (recon/qfp-live-pages/footer-contact.md) ──
const PHONE_DISPLAY = '(+91) 829 199 9922'
const PHONE_FOIL = '+91 829 199 9922'      // hero foil anchor (unparenthesised)
const PHONE_TEL = '+918291999922'          // tel: / wa.me digits
const EMAIL_INFO = 'info@quarterfoldltd.com'
const EMAIL_ENQ = 'enquiry@quarterfoldltd.com'
const WA_URL = `https://wa.me/${PHONE_TEL.replace('+', '')}`
const MAPS_HEAD = 'https://www.google.com/maps/search/?api=1&query=Cyber+One+IT+Park+Sector+30A+Vashi+Navi+Mumbai+400703'
const MAPS_FACTORY = 'https://www.google.com/maps/search/?api=1&query=Taloja+MIDC+Navi+Mumbai+410208'

// small stroke-draw line icons (24×24, authored so getTotalLength() can drive draw-on)
let _k = 0
const P = (d) => <path key={`p${_k++}`} className="ctc-draw" d={d} />
const C = (cx, cy, r) => <circle key={`c${_k++}`} className="ctc-draw" cx={cx} cy={cy} r={r} />
const ICONS = {
  phone: [P('M6.5 4h3l1.4 4-2 1.4a11 11 0 0 0 5.2 5.2l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z')],
  mail: [P('M4 6.5h16v11H4Z'), P('M4.4 7l7.6 5.6L19.6 7')],
  send: [P('M4.5 12.5 20 5l-6 15-2.5-6.5L4.5 12.5Z'), P('M11.5 13 20 5')],
  whatsapp: [C(12, 12, 8.6), P('M9 8.6c-.3 0-.7.1-.9.5-.3.5-.9 1.6.3 3.4a9 9 0 0 0 3.9 3.2c1.6.6 1.9.4 2.3.3.5-.1 1.3-.7 1.4-1.2.1-.5.1-.9 0-1-.1-.1-.3-.2-.6-.4l-1.3-.6c-.2 0-.4-.1-.6.1l-.6.7c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-2.6-2.5c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.1-.3 0-.5l-.6-1.4c-.1-.3-.3-.3-.5-.3H9Z')],
  quote: [P('M8 4h8a1.5 1.5 0 0 1 1.5 1.5V20l-2.5-1.6L12.5 20 10 18.4 7.5 20V5.5A1.5 1.5 0 0 1 8 4Z'), P('M9.5 8.5h5'), P('M9.5 12h5')],
}

// ── Quick-action tiles (GRB's action cards, reskinned) ──
// `line` here holds only the hardcoded values (phone / emails); the human-readable
// tiles (WhatsApp, quote) resolve their line via t(`tiles.<key>.line`). Kicker and
// sub always come from the namespace.
const TILES = [
  { key: 'call', icon: 'phone', line: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
  { key: 'info', icon: 'mail', line: EMAIL_INFO, href: `mailto:${EMAIL_INFO}` },
  { key: 'enq', icon: 'send', line: EMAIL_ENQ, href: `mailto:${EMAIL_ENQ}` },
  { key: 'wa', icon: 'whatsapp', href: WA_URL, tone: 'olive', external: true },
  { key: 'quote', icon: 'quote', href: '#enquiry', tone: 'gold' },
]

// Enquiry-type option keys — the machine value (stored in form.enquiry / mailto) is
// the stable enum key; the label shown to the user is resolved via t().
const ENQUIRY_TYPES = ['quote', 'programme', 'trade', 'pod', 'other']

const COUNTRIES = [
  'India', 'Nigeria', 'Ghana', 'Tanzania', 'Kenya', 'Uganda', 'Ivory Coast',
  'DR Congo', 'South Africa', 'United Kingdom', 'United States', 'Canada',
  'United Arab Emirates', 'Other',
]

// ── FAQ — audience tabs. Structure only: each tab has a stable key and a fixed
// number of Q/A items. Labels, questions and answers resolve through the namespace
// via t(`faq.tabs.<key>`) and t(`faq.items.<key>-<i>.q|a`).
const FAQ_TABS = [
  { key: 'publishers', count: 4 },
  { key: 'institutions', count: 4 },
  { key: 'self', count: 4 },
]

const initialForm = {
  first: '', last: '', email: '', phone: '', company: '', country: '',
  enquiry: '', message: '', consent: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const { t, i18n } = useTranslation('contact')
  const reduced = prefersReduced()
  const root = useRef(null)
  const location = useLocation()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [mailtoUrl, setMailtoUrl] = useState('')
  const [tab, setTab] = useState(0)
  const [openQ, setOpenQ] = useState('publishers-0')

  // ── Prefill from /print-on-demand hand-off (URL ?spec= or router state.spec) ──
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const spec = location.state?.spec || params.get('spec')
    if (!spec) return
    setForm((f) => ({
      ...f,
      enquiry: 'pod',
      message: `Book specification from Print on Demand:\n${spec}`,
    }))
  }, [location])

  // ── SEO: title, meta description, BreadcrumbList + Organization JSON-LD ──
  useEffect(() => {
    const prevTitle = document.title
    document.title = t('seo.title')
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    if (meta) meta.setAttribute('content', t('seo.description'))

    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
          { '@type': 'ListItem', position: 2, name: t('breadcrumb.contact'), item: 'https://www.quarterfoldltd.com/contact' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Quarterfold Printabilities Private Limited',
        url: 'https://www.quarterfoldltd.com/',
        email: EMAIL_ENQ,
        telephone: PHONE_TEL,
        address: [
          {
            '@type': 'PostalAddress',
            name: 'Head Office',
            streetAddress: '1207, Cyber One IT Park, Sector 30 A, Vashi',
            addressLocality: 'Navi Mumbai',
            postalCode: '400703',
            addressRegion: 'Maharashtra',
            addressCountry: 'IN',
          },
          {
            '@type': 'PostalAddress',
            name: 'Main Factory',
            streetAddress: 'Plot No. B-8, Taloja MIDC',
            addressLocality: 'Navi Mumbai',
            postalCode: '410208',
            addressRegion: 'Maharashtra',
            addressCountry: 'IN',
          },
        ],
      },
    ])
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc)
      ld.remove()
    }
  }, [t, i18n.language])

  // ── GSAP: tile-icon stroke-draw + light fade-up reveals (reduced-motion off) ──
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      el.querySelectorAll('.ctc-draw').forEach((p) => {
        const L = p.getTotalLength?.() || 0
        if (!L) return
        if (reduced) { gsap.set(p, { strokeDasharray: 'none', strokeDashoffset: 0 }); return }
        gsap.set(p, { strokeDasharray: L, strokeDashoffset: L })
      })
      if (reduced) return
      el.querySelectorAll('.ctc-tile').forEach((tile) => {
        gsap.to(tile.querySelectorAll('.ctc-draw'), {
          strokeDashoffset: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06,
          scrollTrigger: { trigger: tile, start: 'top 88%', once: true },
        })
      })
      gsap.utils.toArray('.ctc-reveal').forEach((node) => {
        gsap.from(node, {
          y: 26, autoAlpha: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: node, start: 'top 86%', once: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const setField = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n })
  }

  const validate = () => {
    const e = {}
    if (!form.first.trim()) e.first = t('errors.first')
    if (!form.last.trim()) e.last = t('errors.last')
    if (!form.email.trim()) e.email = t('errors.emailRequired')
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('errors.emailInvalid')
    if (!form.country) e.country = t('errors.country')
    if (!form.enquiry) e.enquiry = t('errors.enquiry')
    if (!form.message.trim()) e.message = t('errors.message')
    if (!form.consent) e.consent = t('errors.consent')
    return e
  }

  const buildMailto = () => {
    const enquiryLabel = form.enquiry ? t(`enquiryTypes.${form.enquiry}`) : ''
    const lines = [
      `${t('mailto.name')}: ${form.first} ${form.last}`.trim(),
      `${t('mailto.email')}: ${form.email}`,
      form.phone && `${t('mailto.phone')}: ${form.phone}`,
      form.company && `${t('mailto.company')}: ${form.company}`,
      `${t('mailto.country')}: ${form.country}`,
      `${t('mailto.enquiryType')}: ${enquiryLabel}`,
      '',
      form.message,
    ].filter((l) => l !== false && l != null)
    const subject = `${t('mailto.subject')}: ${enquiryLabel}, ${form.first} ${form.last}`.trim()
    return `mailto:${EMAIL_ENQ}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      // move focus to the first field in error so the error is announced
      const order = ['first', 'last', 'email', 'country', 'enquiry', 'message', 'consent']
      const firstBad = order.find((k) => e[k])
      root.current?.querySelector(`[name="${firstBad}"]`)?.focus()
      return
    }
    // TODO(backend): POST this payload to the real enquiry endpoint once it exists
    // (e.g. /api/enquiry). Until then we validate client-side, show the success
    // state, and hand off to a prefilled mailto so nothing is lost.
    const url = buildMailto()
    setMailtoUrl(url)
    setSubmitted(true)
    window.location.href = url
  }

  const err = (name) =>
    errors[name] ? <span className="ctc-err" id={`err-${name}`}>{errors[name]}</span> : null
  const aria = (name) => ({
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  })

  return (
    <main id="main" ref={root}>
      {/* ── 1. HERO (navy) — anatomy mirrored from /infrastructure ── */}
      <section data-theme="dark" className="ctc-hero relative overflow-hidden" aria-labelledby="ctc-h1">
        <WavyBackground className="ctc-hero-waves" />
        <div className="ctc-hero-beam" aria-hidden="true" />
        <div className="ctc-hero-inner ctc-hero-grid relative z-10">
          <div className="ctc-hero-copy">
            <nav className="ctc-crumb" aria-label={t('breadcrumb.label')}>
              <Link to="/">{t('breadcrumb.home')}</Link>
              <span aria-hidden="true">»</span>
              <span aria-current="page">{t('breadcrumb.contact')}</span>
            </nav>
            <p className="ctc-hero-eyebrow">{t('hero.eyebrow')}</p>
            <h1 id="ctc-h1" data-textreveal className="ctc-h1">
              <Trans t={t} i18nKey="hero.title" components={{ strong: <span className="ctc-h1-accent" /> }} />
            </h1>
            <p className="ctc-hero-line" data-reveal>
              {t('hero.line')}
            </p>
          </div>

          {/* right-side foil anchor — phone number LARGE, echoing infra's flagship stat */}
          <div className="ctc-hero-stat" aria-label={t('hero.callAriaLabel')}>
            <a className="ctc-hero-foil" href={`tel:${PHONE_TEL}`}>{PHONE_FOIL}</a>
            <span className="ctc-hero-stat-label">{t('hero.callLabel')}</span>
            <span className="ctc-hero-stat-foot">{t('hero.callFoot')}</span>
          </div>
        </div>
      </section>

      {/* ── 2. LOCATION STRIP (navy, compact) — replaces the oversized static map ── */}
      <section data-theme="dark" className="ctc-loc" aria-label={t('map.regionLabel')}>
        <div className="ctc-loc-inner">
          <p className="ctc-loc-eyebrow">{t('map.kicker')}</p>
          <div className="ctc-loc-grid">
            <article className="ctc-loc-item">
              <span className="ctc-loc-pin" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" />
                </svg>
              </span>
              <div className="ctc-loc-body">
                <p className="ctc-loc-name">{t('addr.head.name')}</p>
                <p className="ctc-loc-addr">1207, Cyber One IT Park, Sector 30 A, Vashi · Navi Mumbai 400703</p>
                <a className="ctc-loc-link focus-ring" href={MAPS_HEAD} target="_blank" rel="noreferrer">
                  {t('map.openInMaps')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" /><path d="M8 7h9v9" />
                  </svg>
                </a>
              </div>
            </article>

            <article className="ctc-loc-item">
              <span className="ctc-loc-pin" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" />
                </svg>
              </span>
              <div className="ctc-loc-body">
                <p className="ctc-loc-name">{t('addr.factory.name')}</p>
                <p className="ctc-loc-addr">Plot No. B-8, Taloja MIDC · Navi Mumbai 410208</p>
                <a className="ctc-loc-link focus-ring" href={MAPS_FACTORY} target="_blank" rel="noreferrer">
                  {t('map.openInMaps')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" /><path d="M8 7h9v9" />
                  </svg>
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3. WELCOME STATEMENT ── */}
      <section data-theme="light" className="ctc-welcome relative overflow-hidden">
        <SectionCurve position="top" fill="#fdfaf4" />
        <PaperGrain />
        <div className="ctc-welcome-inner ctc-reveal relative z-10">
          <p className="ctc-eyebrow">{t('welcome.eyebrow')}</p>
          <h2 className="ctc-welcome-head">
            {t('welcome.head')}
          </h2>
          <p className="ctc-welcome-sub">
            {t('welcome.sub')}
          </p>
        </div>
      </section>

      {/* ── 4. QUICK-ACTION TILES ── */}
      <section data-theme="light" className="ctc-tiles-sec relative overflow-hidden" aria-label={t('tiles.regionLabel')}>
        <PaperGrain />
        <div className="ctc-tiles relative z-10">
          {TILES.map((tile) => {
            const props = tile.external
              ? { href: tile.href, target: '_blank', rel: 'noreferrer' }
              : { href: tile.href }
            // Hardcoded (phone / email) line stays as-is; otherwise resolve via t().
            const line = tile.line ?? t(`tiles.${tile.key}.line`)
            return (
              <a
                key={tile.key}
                className={`ctc-tile focus-ring${tile.tone ? ` ctc-tile-${tile.tone}` : ''}`}
                {...props}
              >
                <span className="ctc-tile-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">{ICONS[tile.icon]}</svg>
                </span>
                <span className="ctc-tile-kicker">{t(`tiles.${tile.key}.kicker`)}</span>
                <span className="ctc-tile-line">
                  {line.includes('@')
                    ? (() => { const [u, d] = line.split('@'); return <>{u}@<wbr />{d}</> })()
                    : line}
                </span>
                <span className="ctc-tile-sub">{t(`tiles.${tile.key}.sub`)}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── 5. ADDRESSES & HOURS (navy) ── */}
      <section data-theme="dark" className="ctc-addr relative overflow-hidden" aria-labelledby="ctc-addr-title">
        <SectionCurve position="top" fill="#fdfaf4" />
        {/* Real QFP facility exterior (navy duotone) — grounds "our locations" in the actual building */}
        <img
          src="/qfp/contact/facility-navy.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          draggable="false"
          className="ctc-addr-bg pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <EdgeGlow />
        <div className="ctc-addr-inner relative z-10">
          <div className="ctc-addr-head ctc-reveal">
            <p className="ctc-eyebrow gold">{t('addr.eyebrow')}</p>
            <h2 id="ctc-addr-title" className="ctc-addr-title">{t('addr.title')}</h2>
          </div>

          <div className="ctc-addr-grid">
            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">{t('addr.head.name')}</h3>
              <p className="ctc-addr-lines">
                1207, Cyber One IT Park,<br />
                Sector 30 A, Vashi,<br />
                Navi Mumbai 400703, India
              </p>
              <a className="ctc-addr-link focus-ring" href={MAPS_HEAD} target="_blank" rel="noreferrer">{t('addr.head.directions')}</a>
            </article>

            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">{t('addr.factory.name')}</h3>
              <p className="ctc-addr-lines">
                Plot No. B-8, Taloja MIDC,<br />
                Navi Mumbai 410208, India
              </p>
              <a className="ctc-addr-link focus-ring" href={MAPS_FACTORY} target="_blank" rel="noreferrer">{t('addr.factory.directions')}</a>
            </article>

            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">{t('addr.hours.name')}</h3>
              <p className="ctc-addr-lines">
                <Trans t={t} i18nKey="addr.hours.lines" components={{ 1: <br /> }} />
              </p>
              {/* TODO(Harry): confirm exact business hours — placeholder Mon–Sat above. */}
              <p className="ctc-addr-flag">{t('addr.hours.flag')}</p>
            </article>
          </div>

          {/* Compliance line — registered entity + CIN + registered office (DM Mono, 11px floor) */}
          <p className="ctc-compliance">
            Quarterfold Printabilities Private Limited · CIN U74999MH2020PTC337494 ·
            Registered Office: Office No 1207, Plot No 4 &amp; 6, Sector 30A, Navi
            Mumbai 400705
          </p>
        </div>
      </section>

      {/* ── 6. ENQUIRY FORM ── */}
      <section id="enquiry" data-theme="light" className="ctc-form-sec relative overflow-hidden" aria-labelledby="ctc-form-title">
        <SectionCurve position="top" fill="#f0ebe0" />
        <PaperGrain />
        <div className="ctc-form-inner relative z-10">
          <div className="ctc-form-intro ctc-reveal">
            <p className="ctc-eyebrow">{t('form.eyebrow')}</p>
            <h2 id="ctc-form-title" className="ctc-form-title">{t('form.title')}</h2>
            <p className="ctc-form-lede">
              {t('form.lede')}
            </p>
          </div>

          {submitted ? (
            <div className="ctc-success" role="status" aria-live="polite">
              <span className="ctc-success-mark" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7" /></svg>
              </span>
              <h3 className="ctc-success-title">{t('success.title')}</h3>
              <p className="ctc-success-sub">
                {t('success.sub')}
              </p>
              <a className="ctc-btn focus-ring" href={mailtoUrl || `mailto:${EMAIL_ENQ}`}>
                {t('success.button')}
              </a>
            </div>
          ) : (
            <form className="ctc-form" onSubmit={onSubmit} noValidate>
              {/* aria-live summary so screen readers hear when a submit fails */}
              <div className="sr-only" role="alert" aria-live="assertive">
                {Object.keys(errors).length
                  ? (Object.keys(errors).length === 1
                      ? t('errors.summaryOne')
                      : t('errors.summaryMany', { count: Object.keys(errors).length }))
                  : ''}
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-first">{t('form.firstName')} <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-first" name="first" type="text" autoComplete="given-name"
                    value={form.first} onChange={(e) => setField('first', e.target.value)} {...aria('first')} />
                  {err('first')}
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-last">{t('form.lastName')} <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-last" name="last" type="text" autoComplete="family-name"
                    value={form.last} onChange={(e) => setField('last', e.target.value)} {...aria('last')} />
                  {err('last')}
                </div>
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-email">{t('form.email')} <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-email" name="email" type="email" autoComplete="email"
                    value={form.email} onChange={(e) => setField('email', e.target.value)} {...aria('email')} />
                  {err('email')}
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-phone">{t('form.phone')}</label>
                  <input id="f-phone" name="phone" type="tel" autoComplete="tel"
                    value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                </div>
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-company">{t('form.company')}</label>
                  <input id="f-company" name="company" type="text" autoComplete="organization"
                    value={form.company} onChange={(e) => setField('company', e.target.value)} />
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-country">{t('form.country')} <span className="ctc-req" aria-hidden="true">*</span></label>
                  <select id="f-country" name="country" value={form.country}
                    onChange={(e) => setField('country', e.target.value)} {...aria('country')}>
                    <option value="" disabled>{t('form.countryPlaceholder')}</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {err('country')}
                </div>
              </div>

              <div className="ctc-field">
                <label htmlFor="f-enquiry">{t('form.enquiryLabel')} <span className="ctc-req" aria-hidden="true">*</span></label>
                <select id="f-enquiry" name="enquiry" value={form.enquiry}
                  onChange={(e) => setField('enquiry', e.target.value)} {...aria('enquiry')}>
                  <option value="" disabled>{t('form.enquiryPlaceholder')}</option>
                  {ENQUIRY_TYPES.map((k) => <option key={k} value={k}>{t(`enquiryTypes.${k}`)}</option>)}
                </select>
                {err('enquiry')}
              </div>

              <div className="ctc-field">
                <label htmlFor="f-message">{t('form.message')} <span className="ctc-req" aria-hidden="true">*</span></label>
                <textarea id="f-message" name="message" rows={6}
                  value={form.message} onChange={(e) => setField('message', e.target.value)}
                  placeholder={t('form.messagePlaceholder')}
                  {...aria('message')} />
                {err('message')}
              </div>

              <div className={`ctc-consent${errors.consent ? ' has-err' : ''}`}>
                <input id="f-consent" name="consent" type="checkbox"
                  checked={form.consent} onChange={(e) => setField('consent', e.target.checked)}
                  {...aria('consent')} />
                <label htmlFor="f-consent">
                  <Trans t={t} i18nKey="form.consent" components={{ 1: <Link to="/legal/privacy" /> }} /> <span className="ctc-req" aria-hidden="true">*</span>
                </label>
              </div>
              {err('consent')}

              <button type="submit" className="ctc-submit focus-ring">
                {t('form.submit')}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5 7 7-7 7" /></svg>
              </button>

              <p className="ctc-dpa">
                <Trans t={t} i18nKey="form.dpa" components={{ 1: <Link to="/legal/privacy" /> }} />
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── 7. FAQ (audience tabs) ── */}
      <section data-theme="light" className="ctc-faq relative overflow-hidden" aria-labelledby="ctc-faq-title">
        <SectionCurve position="top" fill="#fdfaf4" />
        <PaperGrain />
        <div className="ctc-faq-inner relative z-10">
          <div className="ctc-reveal">
            <p className="ctc-eyebrow">{t('faq.eyebrow')}</p>
            <h2 id="ctc-faq-title" className="ctc-faq-title">{t('faq.title')}</h2>
          </div>

          <div className="ctc-tabs" role="tablist" aria-label={t('faq.tablistLabel')}>
            {FAQ_TABS.map((tabDef, i) => (
              <button
                key={tabDef.key}
                role="tab"
                id={`tab-${tabDef.key}`}
                aria-selected={tab === i}
                aria-controls={`panel-${tabDef.key}`}
                tabIndex={tab === i ? 0 : -1}
                className={`ctc-tab focus-ring${tab === i ? ' is-active' : ''}`}
                onClick={() => { setTab(i); setOpenQ(`${tabDef.key}-0`) }}
              >
                {t(`faq.tabs.${tabDef.key}`)}
              </button>
            ))}
          </div>

          {FAQ_TABS.map((tabDef, i) => (
            <div
              key={tabDef.key}
              role="tabpanel"
              id={`panel-${tabDef.key}`}
              aria-labelledby={`tab-${tabDef.key}`}
              hidden={tab !== i}
              className="ctc-faq-list"
            >
              {Array.from({ length: tabDef.count }, (_, j) => {
                const id = `${tabDef.key}-${j}`
                const open = openQ === id
                return (
                  <div className={`ctc-qa${open ? ' is-open' : ''}`} key={id}>
                    <h3 className="ctc-qa-h">
                      <button
                        type="button"
                        className="ctc-qa-btn focus-ring"
                        aria-expanded={open}
                        aria-controls={`a-${id}`}
                        onClick={() => setOpenQ(open ? '' : id)}
                      >
                        <span>{t(`faq.items.${id}.q`)}</span>
                        <svg className="ctc-qa-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    </h3>
                    <div id={`a-${id}`} className="ctc-qa-a" role="region" aria-labelledby={`q-${id}`} hidden={!open}>
                      <p>{t(`faq.items.${id}.a`)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. CTA BAND (beige) — quiet email closer ── */}
      <section data-theme="light" className="ctc-closer relative overflow-hidden">
        <SectionCurve position="top" fill="#f0ebe0" />
        <PaperGrain />
        <div className="ctc-closer-inner ctc-reveal relative z-10">
          <p className="ctc-closer-line">{t('closer.line')}</p>
          <a className="ctc-closer-mail focus-ring" href={`mailto:${EMAIL_ENQ}`}>{EMAIL_ENQ}</a>
        </div>
      </section>
    </main>
  )
}
