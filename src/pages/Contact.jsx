import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import SectionCurve from '@/components/SectionCurve'
import PageHero, { splitTitle } from '@/components/PageHero'
import CTAButton from '@/components/CTAButton'
import { DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'

gsap.registerPlugin(ScrollTrigger)

// ── /contact ─────────────────────────────────────────────────────────────────
// The conversion page. Every other page's primary CTA lands here. Structure is
// modelled on grb.uk.com/about-us/contact (hero → map → welcome → quick actions →
// addresses & hours → enquiry form → audience-tabbed FAQ → quiet email closer),
// fully reskinned into brand System B (navy / gold / cream, Inter Tight / Inter /
// DM Mono). Native scroll — Lenis lives only on "/". No live Google Maps iframe
// (cookieless-safe): a styled static map + an "Open in Google Maps" link instead.

// ── Canonical contact data ──
const PHONE_DISPLAY = '(+91) 829 199 9922'
const PHONE_FOIL = '+91 829 199 9922'      // hero foil anchor (unparenthesised)
const PHONE_TEL = '+918291999922'          // tel: / wa.me digits
const EMAIL_INFO = 'info@quarterfoldltd.com'
const EMAIL_ENQ = 'enquiry@quarterfoldltd.com'
const WA_URL = `https://wa.me/${PHONE_TEL.replace('+', '')}`
const MAPS_HEAD = 'https://www.google.com/maps/search/?api=1&query=Cyber+One+IT+Park+Sector+30A+Vashi+Navi+Mumbai+400703'
const MAPS_FACTORY = 'https://www.google.com/maps/search/?api=1&query=Taloja+MIDC+Navi+Mumbai+410208'

// Web3Forms — public-safe access key (delivery endpoint for the live enquiry form).
// NOTE(WhatsApp): WA_URL points at the canonical business number above; no separate
// WhatsApp Business line has been confirmed. If a dedicated WA number lands, swap it.
const WEB3FORMS_KEY = '4f37deec-ff06-4475-ba51-8fe9df9b46b4'
const WEB3FORMS_URL = 'https://api.web3forms.com/submit'

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

// ── "The Desk" — one composed navy panel split by gold hairlines into channel
// cells. Top row: three direct-reach cells (CALL / GENERAL / ENQUIRIES) whose value
// is a hardcoded phone/email. Bottom row: two wider action cells (WHATSAPP / QUOTE)
// whose value + note resolve via t(`tiles.<key>.line|sub`); label = t(`tiles.<key>.kicker`).
const DESK_TOP = [
  { key: 'call', icon: 'phone', value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
  { key: 'info', icon: 'mail', value: EMAIL_INFO, href: `mailto:${EMAIL_INFO}` },
  { key: 'enq', icon: 'send', value: EMAIL_ENQ, href: `mailto:${EMAIL_ENQ}` },
]
const DESK_BOTTOM = [
  { key: 'wa', icon: 'whatsapp', href: WA_URL, external: true, action: true },
  { key: 'quote', icon: 'quote', href: '#enquiry', action: true },
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
// Lenient international phone check — allowed chars only, 7–15 digits after stripping.
const PHONE_CHARS_RE = /^[0-9+\-()\s]+$/
const isValidPhone = (v) => {
  const s = (v || '').trim()
  if (!PHONE_CHARS_RE.test(s)) return false
  const d = s.replace(/\D/g, '')
  return d.length >= 7 && d.length <= 15
}

export default function Contact() {
  const { t, i18n } = useTranslation('contact')
  const reduced = prefersReduced()
  const root = useRef(null)
  const location = useLocation()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  // 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle')
  const [tab, setTab] = useState(0)
  const [openQ, setOpenQ] = useState('publishers-0')

  // Desk seam geometry — the horizontal hairline sits at the boundary between the
  // top (3-cell) and bottom (2-cell) rows; measured so the drawn SVG lines land on
  // the real cell edges at any width / language.
  const deskRef = useRef(null)
  const deskTopRef = useRef(null)
  const [seamY, setSeamY] = useState(50)

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

  // ── Desk seam geometry — keep the SVG horizontal hairline on the real row
  // boundary at any width / language (native scroll, no ScrollTrigger needed). ──
  useLayoutEffect(() => {
    const measure = () => {
      const d = deskRef.current, tr = deskTopRef.current
      if (!d || !tr) return
      const dh = d.getBoundingClientRect().height
      const th = tr.getBoundingClientRect().height
      if (dh > 0) setSeamY(Math.min(99, Math.max(1, (th / dh) * 100)))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [i18n.language])

  // ── GSAP: icon stroke-draw + desk hairline draw + light fade-up reveals ──
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
      // desk hairlines — draw perimeter + interior seams on scroll-in
      const desk = el.querySelector('.ctc-desk')
      if (desk) {
        const seams = desk.querySelectorAll('.ctc-seam')
        seams.forEach((p) => {
          const L = p.getTotalLength?.() || 0
          if (!L) return
          if (reduced) { gsap.set(p, { strokeDasharray: 'none', strokeDashoffset: 0 }); return }
          gsap.set(p, { strokeDasharray: L, strokeDashoffset: L })
        })
        if (!reduced) {
          gsap.to(seams, {
            strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', stagger: 0.08,
            scrollTrigger: { trigger: desk, start: 'top 84%', once: true },
          })
          gsap.from(desk.querySelectorAll('.ctc-cell'), {
            y: 22, autoAlpha: 0, duration: 0.7, ease: 'power2.out', stagger: 0.07, delay: 0.15,
            scrollTrigger: { trigger: desk, start: 'top 84%', once: true },
          })
        }
      }
      if (reduced) return
      // channel-cell icons draw with the cells
      el.querySelectorAll('.ctc-cell').forEach((cell) => {
        gsap.to(cell.querySelectorAll('.ctc-draw'), {
          strokeDashoffset: 0, duration: 0.7, ease: 'power2.out', stagger: 0.06,
          scrollTrigger: { trigger: cell, start: 'top 92%', once: true },
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
    if (!form.phone.trim()) e.phone = t('errors.phoneRequired')
    else if (!isValidPhone(form.phone)) e.phone = t('errors.phoneInvalid')
    if (!form.country) e.country = t('errors.country')
    if (!form.enquiry) e.enquiry = t('errors.enquiry')
    if (!form.message.trim()) e.message = t('errors.message')
    if (!form.consent) e.consent = t('errors.consent')
    return e
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    // honeypot — a real user never fills this; if it's filled, feign success and drop.
    const hp = ev.currentTarget?.elements?.botcheck?.value
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) {
      // move focus to the first field in error so the error is announced
      const order = ['first', 'last', 'email', 'phone', 'country', 'enquiry', 'message', 'consent']
      const firstBad = order.find((k) => e[k])
      root.current?.querySelector(`[name="${firstBad}"]`)?.focus()
      return
    }
    if (hp) { setForm(initialForm); setStatus('success'); return }

    setStatus('submitting')
    const enquiryLabel = t(`enquiryTypes.${form.enquiry}`)
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Website Enquiry — Contact Form',
          from_name: 'QFP Website',
          botcheck: '',
          name: `${form.first} ${form.last}`.trim(),
          email: form.email,
          phone: form.phone,
          company: form.company,
          country: form.country,
          enquiry_type: enquiryLabel,
          message: form.message,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setForm(initialForm)
        setErrors({})
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const renderCell = (cell) => {
    const value = cell.value ?? t(`tiles.${cell.key}.line`)
    const props = cell.external
      ? { href: cell.href, target: '_blank', rel: 'noreferrer' }
      : { href: cell.href }
    return (
      <a key={cell.key} className={`ctc-cell focus-ring${cell.action ? ' ctc-cell--action' : ''}`} {...props}>
        <span className="ctc-cell-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">{ICONS[cell.icon]}</svg>
        </span>
        <span className="ctc-cell-label">{t(`tiles.${cell.key}.kicker`)}</span>
        <span className="ctc-cell-value">
          {value.includes('@')
            ? (() => { const [u, d] = value.split('@'); return <>{u}@<wbr />{d}</> })()
            : value}
        </span>
        <span className="ctc-cell-note">{t(`tiles.${cell.key}.sub`)}</span>
        {cell.action && (
          <span className="ctc-cell-arrow" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </span>
        )}
      </a>
    )
  }

  const err = (name) =>
    errors[name] ? <span className="ctc-err" id={`err-${name}`}>{errors[name]}</span> : null
  const aria = (name) => ({
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  })

  return (
    <main id="main" ref={root}>
      {/* ── 1. HERO (navy) — centered two-line band; phone stat moves below ── */}
      {(() => {
        const [l1, l2] = splitTitle(t('hero.title'))
        return (
          <PageHero id="ctc-h1" eyebrow={t('hero.eyebrow')} line1={l1} line2={l2} subline={t('hero.line')} minVh={62}>
            <div className="ph-stat" aria-label={t('hero.callAriaLabel')}>
              <div className="ctc-hero-reach">
                <a className="ph-stat-num ph-stat-num--text" href={`tel:${PHONE_TEL}`}>{PHONE_FOIL}</a>
                <span className="ctc-chips">
                  <a className="ctc-chip focus-ring" href={WA_URL} target="_blank" rel="noopener noreferrer" aria-label={t('hero.waAria')}>
                    <span className="ctc-chip-glare" aria-hidden="true" />
                    <svg className="ctc-chip-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                  <a className="ctc-chip focus-ring" href={`mailto:${EMAIL_INFO}`} aria-label={t('hero.emailAria')}>
                    <span className="ctc-chip-glare" aria-hidden="true" />
                    <svg className="ctc-chip-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                      <rect x="3" y="5" width="18" height="14" rx="2.2" />
                      <path d="m3.6 6.7 8.4 5.8 8.4-5.8" />
                    </svg>
                  </a>
                </span>
              </div>
              <span className="ph-stat-label">{t('hero.callLabel')}</span>
              <span className="ph-stat-foot">{t('hero.callFoot')}</span>
            </div>
          </PageHero>
        )
      })()}

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

      {/* ── 4. THE DESK — one composed navy panel, gold hairlines, channel cells ── */}
      <section data-theme="light" className="ctc-desk-sec relative overflow-hidden" aria-label={t('tiles.regionLabel')}>
        <PaperGrain />
        <div className="ctc-desk-wrap relative z-10">
          <p className="ctc-eyebrow ctc-reveal">{t('tiles.regionLabel')}</p>
          <div className="ctc-desk" ref={deskRef}>
            {/* drawn hairlines — perimeter + interior seams land on the real cell edges */}
            <svg className="ctc-desk-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <rect className="ctc-seam" x="0.4" y="0.4" width="99.2" height="99.2" />
              <path className="ctc-seam" d={`M0 ${seamY} H100`} />
              <path className="ctc-seam" d={`M33.333 0 V${seamY}`} />
              <path className="ctc-seam" d={`M66.666 0 V${seamY}`} />
              <path className="ctc-seam" d={`M50 ${seamY} V100`} />
            </svg>

            <div className="ctc-desk-row ctc-desk-row--top" ref={deskTopRef}>
              {DESK_TOP.map((cell) => renderCell(cell))}
            </div>
            <div className="ctc-desk-row ctc-desk-row--bottom">
              {DESK_BOTTOM.map((cell) => renderCell(cell))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. ADDRESSES & HOURS (navy) ── */}
      <section data-theme="dark" className="ctc-addr relative overflow-hidden" aria-labelledby="ctc-addr-title">
        <SectionCurve position="top" fill="#fdfaf4" inward />
        {/* Real QFP facility exterior (navy duotone) — grounds "our locations" in the actual building */}
        <img
          src="/site-assets/contact/facility-navy.webp"
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
              {/* TODO: confirm exact business hours — placeholder Mon–Sat above. */}
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

          {status === 'success' ? (
            <div className="ctc-success" role="status" aria-live="polite">
              <span className="ctc-success-mark" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7" /></svg>
              </span>
              <h3 className="ctc-success-title">{t('success.title')}</h3>
              <p className="ctc-success-sub">
                {t('success.sub')}
              </p>
              <button type="button" className="u-btn u-btn--outline" onClick={() => setStatus('idle')}>
                {t('success.again')}
              </button>
            </div>
          ) : (
            <form className="ctc-form" onSubmit={onSubmit} noValidate>
              {/* honeypot — kept off-screen; a filled value means a bot */}
              <input type="text" name="botcheck" className="ctc-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
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
                  <label htmlFor="f-phone">{t('form.phone')} <span className="ctc-req" aria-hidden="true">*</span></label>
                  <input id="f-phone" name="phone" type="tel" autoComplete="tel"
                    value={form.phone} onChange={(e) => setField('phone', e.target.value)} {...aria('phone')} />
                  {err('phone')}
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

              {status === 'error' && (
                <div className="ctc-formerr" role="alert" aria-live="assertive">
                  <span className="ctc-formerr-mark" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5" /><path d="M12 16h0" /><circle cx="12" cy="12" r="9" /></svg>
                  </span>
                  <span>
                    <strong>{t('form.errorTitle')}</strong>
                    <Trans t={t} i18nKey="form.errorText" components={{ 1: <a href={`mailto:${EMAIL_ENQ}`} /> }} />
                  </span>
                </div>
              )}

              <CTAButton type="submit" arrow={false}
                disabled={status === 'submitting' || !form.consent}
                aria-disabled={status === 'submitting' || !form.consent ? 'true' : undefined}
                aria-busy={status === 'submitting'}>
                {status === 'submitting' ? (
                  <><span className="ctc-spin" aria-hidden="true" />{t('form.submitting')}</>
                ) : (
                  <>
                    {status === 'error' ? t('form.retry') : t('form.submit')}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5 7 7-7 7" /></svg>
                  </>
                )}
              </CTAButton>

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
