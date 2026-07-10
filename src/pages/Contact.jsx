import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

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
const TILES = [
  { key: 'call', icon: 'phone', kicker: 'Call us', line: PHONE_DISPLAY, sub: 'Mon–Sat, business hours', href: `tel:${PHONE_TEL}` },
  { key: 'info', icon: 'mail', kicker: 'General', line: EMAIL_INFO, sub: 'For anything and everything', href: `mailto:${EMAIL_INFO}` },
  { key: 'enq', icon: 'send', kicker: 'Enquiries', line: EMAIL_ENQ, sub: 'Quotes and project briefs', href: `mailto:${EMAIL_ENQ}` },
  { key: 'wa', icon: 'whatsapp', kicker: 'WhatsApp', line: 'Message us', sub: 'Quick questions, fast replies', href: WA_URL, tone: 'olive', external: true },
  { key: 'quote', icon: 'quote', kicker: 'Fastest route', line: 'Request a Quote', sub: 'Jump to the enquiry form', href: '#enquiry', tone: 'gold' },
]

const ENQUIRY_TYPES = [
  'Request a Quote',
  'Educational Programme or Tender',
  'Trade Books',
  'Print on Demand',
  'Other',
]

const COUNTRIES = [
  'India', 'Nigeria', 'Ghana', 'Tanzania', 'Kenya', 'Uganda', 'Ivory Coast',
  'DR Congo', 'South Africa', 'United Kingdom', 'United States', 'Canada',
  'United Arab Emirates', 'Other',
]

// ── FAQ — audience tabs. Answers strictly from live-site copy + homepage facts. ──
const FAQ_TABS = [
  {
    key: 'publishers',
    label: 'For Publishers',
    items: [
      {
        q: 'Do you print for publishers outside India?',
        a: 'Yes. We serve 250+ publishers worldwide and export more than 800 containers a year to 25+ countries, working with many of the top publishers in India.',
      },
      {
        q: 'What print certifications do you hold?',
        a: 'We are FSC certified under licence TUVDC COC 101258, alongside ISO and Sedex, so your titles can carry recognised responsible-sourcing and audited-supply marks.',
      },
      {
        q: 'Can you handle large offset runs?',
        a: 'Yes. Our five facilities across 250,000 sq ft print more than 25 million books a year on web-offset and sheet-fed presses, so we scale comfortably to long runs.',
      },
      {
        q: 'Do you manage export and shipping?',
        a: 'We handle containerised export, customs documentation and delivery, moving 800+ containers a year to ministries, distributors and publishers across 25+ countries.',
      },
    ],
  },
  {
    key: 'institutions',
    label: 'For Institutions & Programmes',
    items: [
      {
        q: 'Do you work with governments and ministries on tenders?',
        a: 'Yes. We deliver national textbook programmes for ministries of education, and are a print partner on World Bank and USAID funded programmes.',
      },
      {
        q: 'Which countries have you printed national programmes for?',
        a: 'We have printed curriculum programmes across 10+ African countries, including Tanzania, Ghana, Nigeria, Ivory Coast and DR Congo.',
      },
      {
        q: 'Are programme books produced responsibly?',
        a: 'Yes. We are FSC certified under licence TUVDC COC 101258, so programme books can be printed on responsibly sourced paper for tenders that require it.',
      },
      {
        q: 'How quickly can you scale for a national rollout?',
        a: 'With five facilities, 250,000 sq ft and capacity for 25 million+ books a year, we scale from a single curriculum edition to a full national rollout.',
      },
    ],
  },
  {
    key: 'self',
    label: 'For Self-Publishers',
    items: [
      {
        q: 'Do you print single copies or short runs?',
        a: 'Yes. Our print-on-demand service is built for self-publishers and independent authors, from a single book to short runs.',
      },
      {
        q: 'Can I see a sample before a full run?',
        a: 'Yes. We can produce samples so you can check trim size, paper and binding before committing to a full print run.',
      },
      {
        q: 'What formats can you produce?',
        a: 'From paperbacks and hardbacks to premium notebooks, diaries and coffee-table books, with hard, soft and leather bindings.',
      },
      {
        q: 'How do I get a quote for one title?',
        a: 'Send your specification, trim size, page count, paper, binding and quantity, using the enquiry form above and we will come back within one business day.',
      },
    ],
  },
]

const initialForm = {
  first: '', last: '', email: '', phone: '', company: '', country: '',
  enquiry: '', message: '', consent: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
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
      enquiry: 'Print on Demand',
      message: `Book specification from Print on Demand:\n${spec}`,
    }))
  }, [location])

  // ── SEO: title, meta description, BreadcrumbList + Organization JSON-LD ──
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Contact Us | Quarterfold Printabilities'
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    if (meta) meta.setAttribute('content', 'Talk to Quarterfold about your print programme. Call, email or WhatsApp us, or send an enquiry and hear back within one business day. Offices in Navi Mumbai.')

    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.quarterfoldltd.com/' },
          { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://www.quarterfoldltd.com/contact' },
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
  }, [])

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
    if (!form.first.trim()) e.first = 'Enter your first name.'
    if (!form.last.trim()) e.last = 'Enter your last name.'
    if (!form.email.trim()) e.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!form.country) e.country = 'Select your country.'
    if (!form.enquiry) e.enquiry = 'Choose what your enquiry is about.'
    if (!form.message.trim()) e.message = 'Tell us a little about what you need.'
    if (!form.consent) e.consent = 'Please agree to the privacy policy so we can reply.'
    return e
  }

  const buildMailto = () => {
    const lines = [
      `Name: ${form.first} ${form.last}`.trim(),
      `Email: ${form.email}`,
      form.phone && `Phone: ${form.phone}`,
      form.company && `Company / Organisation: ${form.company}`,
      `Country: ${form.country}`,
      `Enquiry type: ${form.enquiry}`,
      '',
      form.message,
    ].filter((l) => l !== false && l != null)
    const subject = `Enquiry: ${form.enquiry} — ${form.first} ${form.last}`.trim()
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
      {/* ── 1. HERO (navy, compact) ── */}
      <section data-theme="dark" className="ctc-hero" aria-labelledby="ctc-h1">
        <div className="ctc-hero-inner">
          <nav className="ctc-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">»</span>
            <span aria-current="page">Contact</span>
          </nav>
          <h1 id="ctc-h1" className="ctc-h1">Contact Us</h1>
          <p className="ctc-hero-line">
            Whether you&apos;re a ministry, a publisher, or an author with one book,
            we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ── 2. MAP (static, cookieless) ── */}
      <section data-theme="dark" className="ctc-map" aria-label="Where we are">
        <img
          src="/qfp/contact/map.webp"
          alt="Map showing Quarterfold's two locations in Navi Mumbai, India: the Vashi head office and the Taloja main factory."
          className="ctc-map-img"
          loading="lazy"
          draggable="false"
        />
        <div className="ctc-map-overlay">
          <span className="ctc-map-kicker">Navi Mumbai, India</span>
          <a className="ctc-map-btn focus-ring" href={MAPS_HEAD} target="_blank" rel="noreferrer">
            Open in Google Maps
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" /><path d="M8 7h9v9" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── 3. WELCOME STATEMENT ── */}
      <section data-theme="light" className="ctc-welcome">
        <div className="ctc-welcome-inner ctc-reveal">
          <p className="ctc-eyebrow">We&apos;d love to hear from you</p>
          <h2 className="ctc-welcome-head">
            One partner for the whole print journey, from a national textbook
            programme to a first run of one book.
          </h2>
          <p className="ctc-welcome-sub">
            Tell us what you&apos;re printing and we&apos;ll come back within one
            business day. Pick whichever way is easiest below, or send the enquiry
            form and we&apos;ll take it from there.
          </p>
        </div>
      </section>

      {/* ── 4. QUICK-ACTION TILES ── */}
      <section data-theme="light" className="ctc-tiles-sec" aria-label="Ways to reach us">
        <div className="ctc-tiles">
          {TILES.map((t) => {
            const props = t.external
              ? { href: t.href, target: '_blank', rel: 'noreferrer' }
              : { href: t.href }
            return (
              <a
                key={t.key}
                className={`ctc-tile focus-ring${t.tone ? ` ctc-tile-${t.tone}` : ''}`}
                {...props}
              >
                <span className="ctc-tile-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">{ICONS[t.icon]}</svg>
                </span>
                <span className="ctc-tile-kicker">{t.kicker}</span>
                <span className="ctc-tile-line">
                  {t.line.includes('@')
                    ? (() => { const [u, d] = t.line.split('@'); return <>{u}@<wbr />{d}</> })()
                    : t.line}
                </span>
                <span className="ctc-tile-sub">{t.sub}</span>
              </a>
            )
          })}
        </div>
      </section>

      {/* ── 5. ADDRESSES & HOURS (navy) ── */}
      <section data-theme="dark" className="ctc-addr" aria-labelledby="ctc-addr-title">
        <div className="ctc-addr-inner">
          <div className="ctc-addr-head ctc-reveal">
            <p className="ctc-eyebrow gold">Our locations</p>
            <h2 id="ctc-addr-title" className="ctc-addr-title">Two sites in Navi Mumbai.</h2>
          </div>

          <div className="ctc-addr-grid">
            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">Head Office</h3>
              <p className="ctc-addr-lines">
                1207, Cyber One IT Park,<br />
                Sector 30 A, Vashi,<br />
                Navi Mumbai 400703, India
              </p>
              <a className="ctc-addr-link focus-ring" href={MAPS_HEAD} target="_blank" rel="noreferrer">Directions</a>
            </article>

            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">Main Factory</h3>
              <p className="ctc-addr-lines">
                Plot No. B-8, Taloja MIDC,<br />
                Navi Mumbai 410208, India
              </p>
              <a className="ctc-addr-link focus-ring" href={MAPS_FACTORY} target="_blank" rel="noreferrer">Directions</a>
            </article>

            <article className="ctc-addr-card ctc-reveal">
              <h3 className="ctc-addr-name">Business Hours</h3>
              <p className="ctc-addr-lines">
                Monday to Saturday<br />
                9:30am – 6:30pm IST
              </p>
              {/* TODO(Harry): confirm exact business hours — placeholder Mon–Sat above. */}
              <p className="ctc-addr-flag">Hours to be confirmed</p>
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
      <section id="enquiry" data-theme="light" className="ctc-form-sec" aria-labelledby="ctc-form-title">
        <div className="ctc-form-inner">
          <div className="ctc-form-intro ctc-reveal">
            <p className="ctc-eyebrow">Send an enquiry</p>
            <h2 id="ctc-form-title" className="ctc-form-title">Tell us about your project.</h2>
            <p className="ctc-form-lede">
              A few details are all we need to come back with the right person and a
              realistic answer. Fields marked with an asterisk are required.
            </p>
          </div>

          {submitted ? (
            <div className="ctc-success" role="status" aria-live="polite">
              <span className="ctc-success-mark" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7" /></svg>
              </span>
              <h3 className="ctc-success-title">Thank you, your enquiry is ready to send.</h3>
              <p className="ctc-success-sub">
                Your email app should have opened with everything filled in. If it
                didn&apos;t, use the button below and we&apos;ll reply within one
                business day.
              </p>
              <a className="ctc-btn focus-ring" href={mailtoUrl || `mailto:${EMAIL_ENQ}`}>
                Open your email app
              </a>
            </div>
          ) : (
            <form className="ctc-form" onSubmit={onSubmit} noValidate>
              {/* aria-live summary so screen readers hear when a submit fails */}
              <div className="sr-only" role="alert" aria-live="assertive">
                {Object.keys(errors).length
                  ? `There ${Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems`} with the form. Please review the highlighted fields.`
                  : ''}
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-first">First name <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-first" name="first" type="text" autoComplete="given-name"
                    value={form.first} onChange={(e) => setField('first', e.target.value)} {...aria('first')} />
                  {err('first')}
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-last">Last name <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-last" name="last" type="text" autoComplete="family-name"
                    value={form.last} onChange={(e) => setField('last', e.target.value)} {...aria('last')} />
                  {err('last')}
                </div>
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-email">Email <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-email" name="email" type="email" autoComplete="email"
                    value={form.email} onChange={(e) => setField('email', e.target.value)} {...aria('email')} />
                  {err('email')}
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-phone">Phone</label>
                  <input id="f-phone" name="phone" type="tel" autoComplete="tel"
                    value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
                </div>
              </div>

              <div className="ctc-row">
                <div className="ctc-field">
                  <label htmlFor="f-company">Company / Organisation</label>
                  <input id="f-company" name="company" type="text" autoComplete="organization"
                    value={form.company} onChange={(e) => setField('company', e.target.value)} />
                </div>
                <div className="ctc-field">
                  <label htmlFor="f-country">Country <span className="ctc-req" aria-hidden="true">*</span></label>
                  <select id="f-country" name="country" value={form.country}
                    onChange={(e) => setField('country', e.target.value)} {...aria('country')}>
                    <option value="" disabled>Select a country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {err('country')}
                </div>
              </div>

              <div className="ctc-field">
                <label htmlFor="f-enquiry">What&apos;s your enquiry about? <span className="ctc-req" aria-hidden="true">*</span></label>
                <select id="f-enquiry" name="enquiry" value={form.enquiry}
                  onChange={(e) => setField('enquiry', e.target.value)} {...aria('enquiry')}>
                  <option value="" disabled>Choose one</option>
                  {ENQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {err('enquiry')}
              </div>

              <div className="ctc-field">
                <label htmlFor="f-message">Message <span className="ctc-req" aria-hidden="true">*</span></label>
                <textarea id="f-message" name="message" rows={6}
                  value={form.message} onChange={(e) => setField('message', e.target.value)}
                  placeholder="Trim size, page count, paper, binding, quantity, delivery country, whatever you have."
                  {...aria('message')} />
                {err('message')}
              </div>

              <div className={`ctc-consent${errors.consent ? ' has-err' : ''}`}>
                <input id="f-consent" name="consent" type="checkbox"
                  checked={form.consent} onChange={(e) => setField('consent', e.target.checked)}
                  {...aria('consent')} />
                <label htmlFor="f-consent">
                  I agree that Quarterfold may use these details to respond to my
                  enquiry, in line with the{' '}
                  <Link to="/legal/privacy">Privacy Policy</Link>. <span className="ctc-req" aria-hidden="true">*</span>
                </label>
              </div>
              {err('consent')}

              <button type="submit" className="ctc-submit focus-ring">
                Send enquiry
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5 7 7-7 7" /></svg>
              </button>

              <p className="ctc-dpa">
                We only use what you send here to reply to your enquiry. We never
                sell your details. See our <Link to="/legal/privacy">Privacy Policy</Link>{' '}
                for how we handle your data.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── 7. FAQ (audience tabs) ── */}
      <section data-theme="light" className="ctc-faq" aria-labelledby="ctc-faq-title">
        <div className="ctc-faq-inner">
          <div className="ctc-reveal">
            <p className="ctc-eyebrow">Questions, answered</p>
            <h2 id="ctc-faq-title" className="ctc-faq-title">Frequently asked questions.</h2>
          </div>

          <div className="ctc-tabs" role="tablist" aria-label="FAQ audiences">
            {FAQ_TABS.map((t, i) => (
              <button
                key={t.key}
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={tab === i}
                aria-controls={`panel-${t.key}`}
                tabIndex={tab === i ? 0 : -1}
                className={`ctc-tab focus-ring${tab === i ? ' is-active' : ''}`}
                onClick={() => { setTab(i); setOpenQ(`${t.key}-0`) }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {FAQ_TABS.map((t, i) => (
            <div
              key={t.key}
              role="tabpanel"
              id={`panel-${t.key}`}
              aria-labelledby={`tab-${t.key}`}
              hidden={tab !== i}
              className="ctc-faq-list"
            >
              {t.items.map((item, j) => {
                const id = `${t.key}-${j}`
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
                        <span>{item.q}</span>
                        <svg className="ctc-qa-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                      </button>
                    </h3>
                    <div id={`a-${id}`} className="ctc-qa-a" role="region" aria-labelledby={`q-${id}`} hidden={!open}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </section>

      {/* ── 8. CTA BAND (beige) — quiet email closer ── */}
      <section data-theme="light" className="ctc-closer">
        <div className="ctc-closer-inner ctc-reveal">
          <p className="ctc-closer-line">Prefer email?</p>
          <a className="ctc-closer-mail focus-ring" href={`mailto:${EMAIL_ENQ}`}>{EMAIL_ENQ}</a>
        </div>
      </section>
    </main>
  )
}
