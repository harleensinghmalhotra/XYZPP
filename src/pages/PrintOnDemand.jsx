import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import SectionCurve from '@/components/SectionCurve'
import PageHero, { splitTitle } from '@/components/PageHero'
import CTAButton from '@/components/CTAButton'
import { DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'
import { CARDS } from '@/sections/WhatWePrint'
import Seo from '@/components/Seo'
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
const FORMATS = [{ id: 'paperback' }, { id: 'hardcover' }]
const SIZES = [{ id: 'a5' }, { id: 'b5' }, { id: 'a4' }]
const PAPERS = [
  { id: 'white70' }, { id: 'cream70' },
  { id: 'white80' }, { id: 'cream80' },
  { id: 'matt100' }, { id: 'gloss100' },
]
const BINDINGS = [{ id: 'perfect' }, { id: 'sewn' }, { id: 'saddle' }]
const FINISHES = [{ id: 'matte' }, { id: 'gloss' }]
const QUANTITIES = [{ id: '1' }, { id: '10' }, { id: '50' }, { id: '250' }, { id: '500' }]
/* number-hero shown on the quantity chips (the full "1 copy" label still drives the
   summary row, the qty badge and the /contact params — this is chip display only). */
const QTY_HERO = { 1: '1', 10: '10', 50: '50', 250: '250', 500: '500+' }

/* ── preview geometry ──────────────────────────────────────────────────────────
   SIZE_RATIO is width ÷ height per trim (drives the preview proportions). A5 and B5
   share the ISO √2 ratio, so SIZE_SCALE renders each trim at its true relative size
   (A5 < B5 < A4) — otherwise A5 and B5 would look identical. A4 uses its primary
   8.25 × 11.00 in figure. */
const SIZE_RATIO = { a5: 0.705, b5: 0.704, a4: 0.75 }
const SIZE_SCALE = { a5: 0.84, b5: 0.92, a4: 1 }
/* Every paper id MUST have an entry here — the page reads it for the book's
   page-block tint and the swatch. Colour signals the STOCK (white / cream / art); the
   leaf period + PAPER_BULK thickness (below) signal the WEIGHT (70 / 80 / 100 gsm), so
   no two papers ever render an identical page edge. PAPER_FALLBACK guards both lookup
   sites so a future id mismatch degrades to a neutral cream edge instead of throwing. */
const PAPER_EDGE = {
  white70:  { edge: '#fdfcf8', line: 'rgba(3,12,49,0.10)', period: '1.6px' },
  cream70:  { edge: '#f5edda', line: 'rgba(3,12,49,0.15)', period: '1.6px' },
  white80:  { edge: '#f8f5ee', line: 'rgba(3,12,49,0.13)', period: '2px' },
  cream80:  { edge: '#efe3ca', line: 'rgba(3,12,49,0.18)', period: '2px' },
  matt100:  { edge: '#e7ebe9', line: 'rgba(3,12,49,0.17)', period: '2.6px' },
  gloss100: { edge: '#eef4f9', line: 'rgba(3,12,49,0.13)', period: '2.6px' },
}
const PAPER_FALLBACK = { edge: '#f3ead4', line: 'rgba(3,12,49,0.16)', period: '2px' }
/* Weight → page-block bulk: heavier stock makes a visibly thicker book. Drives --thick
   via bookDims so 70 / 80 / 100 gsm each read as a different thickness at the same trim. */
const PAPER_BULK = {
  white70: 0.82, cream70: 0.84,
  white80: 1.0,  cream80: 1.03,
  matt100: 1.24, gloss100: 1.22,
}
function bookDims(format, size, paper) {
  const r = SIZE_RATIO[size] ?? 0.707
  const s = SIZE_SCALE[size] ?? 0.92
  const bh = Math.round((format === 'hardcover' ? 344 : 334) * s)
  const baseThick = format === 'hardcover' ? 44 : 30
  const thick = Math.max(15, Math.round(baseThick * (PAPER_BULK[paper] ?? 1)))
  return { bw: Math.round(bh * r), bh, thick }
}
function ghostCount(q) {
  const n = Number(q)
  if (n <= 1) return 0
  if (n <= 10) return 2
  if (n <= 50) return 3
  if (n <= 250) return 4
  return 5
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
}
const BIND_ICON = {
  perfect: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 4v16" /></>,
  sewn: <><rect x="6" y="4" width="12" height="16" rx="1" /><path d="M9 6h0M9 9h0M9 12h0M9 15h0M9 18h0" strokeDasharray="0.1 3" /></>,
  /* saddle stitch — an open booklet with two staples across the centre fold */
  saddle: <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="M12 5v14" /><path d="M10.5 9h3M10.5 15h3" /></>,
}
const FIN_ICON = {
  matte: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  gloss: <><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path d="M8 8c1.5-1.5 3.5-2 5-1.5" /></>,
}
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

/* Web3Forms — public-safe access key (same live endpoint as the Contact form). The
   "Request This Book" step posts the full builder spec + a minimal name/email/notes. */
const WEB3FORMS_KEY = '4f37deec-ff06-4475-ba51-8fe9df9b46b4'
const WEB3FORMS_URL = 'https://api.web3forms.com/submit'
const EMAIL_ENQ = 'enquiry@quarterfoldltd.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Lenient international phone check — allowed chars only, 7–15 digits after stripping.
const PHONE_CHARS_RE = /^[0-9+\-()\s]+$/
const isValidPhone = (v) => {
  const s = (v || '').trim()
  if (!PHONE_CHARS_RE.test(s)) return false
  const d = s.replace(/\D/g, '')
  return d.length >= 7 && d.length <= 15
}

/* ── Uploadcare direct upload ────────────────────────────────────────────────────
   Optional artwork/brief attachment. The browser uploads straight to Uploadcare with
   the public key only (no backend, no secret), then the resulting CDN link rides along
   as a plain text field in the existing Web3Forms submission. Web3Forms' free tier
   cannot carry attachments, so a hosted link is the mechanism.
   UPLOADCARE_CDN_BASE is this project's public delivery domain (Uploadcare dashboard →
   Delivery tab). New Uploadcare accounts serve from a per-project *.ucarecd.net
   subdomain rather than the legacy ucarecdn.com, and the value is not derivable from
   the key — it must be the exact base shown in that tab. Must end with a slash. */
const UPLOADCARE_PUB_KEY = 'a6e0ef37b180782394f8'
const UPLOADCARE_UPLOAD_URL = 'https://upload.uploadcare.com/base/'
const UPLOADCARE_CDN_BASE = 'https://64frdhu94e.ucarecd.net/' // project's public delivery domain (Delivery tab). NOT the secure 64frdhu94e.s.ucarecd.net variant — signed URLs stay off.
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024 // 10 MB, mirrors the account's max file size
const UPLOAD_MAX_FILES = 3
const UPLOAD_ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'zip']
// input accept hint — extensions plus MIME types the browser can match on
const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.zip,application/pdf,image/jpeg,image/png,application/zip'
const UPLOAD_ERR_KEY = {
  wrongType: 'summary.uploadWrongType',
  tooBig: 'summary.uploadTooBig',
  tooMany: 'summary.uploadTooMany',
}

// Validate before uploading so an oversized or wrong-type file fails instantly.
// Returns an error code ('wrongType' | 'tooBig') or null; the component maps it to copy.
function validateUploadFile(file) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!UPLOAD_ALLOWED_EXT.includes(ext)) return 'wrongType'
  if (file.size > UPLOAD_MAX_BYTES) return 'tooBig'
  return null
}

// Build the public download link from the returned file uuid, keeping the original
// filename as the last path segment so the client's email link reads clearly.
const uploadcareCdnUrl = (uuid, name) =>
  `${UPLOADCARE_CDN_BASE}${uuid}/${encodeURIComponent(name)}`

// POST one file to the Uploadcare base upload endpoint. XHR (not fetch) so we can
// surface upload progress. Resolves with the stored file uuid. Uploadcare is not
// CORS-blocked, so this runs from the browser with only the public key.
function uploadToUploadcare(file, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUB_KEY)
    fd.append('UPLOADCARE_STORE', 'auto')
    fd.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', UPLOADCARE_UPLOAD_URL)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data && data.file) return resolve(data.file)
        } catch { /* fall through to reject */ }
        return reject(new Error('bad-response'))
      }
      reject(new Error(`status-${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('network'))
    xhr.onabort = () => reject(new Error('abort'))
    xhr.send(fd)
  })
}

export default function PrintOnDemand() {
  const { t } = useTranslation('printOnDemand')
  const { t: tw } = useTranslation('homeWwp')   // category names for the Explore band
  // "Request This Book" — reveal a minimal contact step, then post spec to Web3Forms.
  const [reqOpen, setReqOpen] = useState(false)
  const [reqStatus, setReqStatus] = useState('idle') // idle | submitting | success | error
  const [req, setReq] = useState({ name: '', email: '', phone: '', notes: '', consent: false })
  const [reqErr, setReqErr] = useState({})
  const reqRef = useRef(null)
  // Optional attachments — each: { id, name, size, status: 'uploading'|'done'|'error', progress, url }
  const [uploads, setUploads] = useState([])
  const [uploadErr, setUploadErr] = useState(null)   // 'wrongType' | 'tooBig' | 'tooMany' | null
  const [uploadLive, setUploadLive] = useState('')   // screen-reader announcement of the latest change
  const fileMap = useRef(new Map())                  // id → File, for retry without stale closures
  const uploadSeq = useRef(0)                         // stable per-file ids
  const [cfg, setCfg] = useState({
    format: 'paperback',
    size: 'a5',
    paper: 'cream80',
    binding: 'perfect',
    finish: 'matte',
    quantity: '1',
  })
  const set = (k) => (v) => setCfg((c) => ({ ...c, [k]: v }))

  // resolve an option's display label via the printOnDemand namespace
  const optLabel = (group, id) => t(`options.${group}.${id}.label`)

  // book geometry + page-block tint + copy count, recomputed on every config change
  const dims = bookDims(cfg.format, cfg.size, cfg.paper)
  const edge = PAPER_EDGE[cfg.paper] ?? PAPER_FALLBACK
  const ghosts = ghostCount(cfg.quantity)
  const qtyLabel = optLabel('quantity', cfg.quantity)

  // ── spec-panel change feedback ──────────────────────────────────────────────
  // The static book no longer morphs, so feedback lives in the spec panel: when
  // a builder option changes we note which key changed and bump a nonce. The
  // matching row is remounted (keyed by the nonce) so its one-shot flash replays.
  const prevCfg = useRef(cfg)
  const [flash, setFlash] = useState({ key: null, n: 0 })
  useEffect(() => {
    const changed = Object.keys(cfg).find((k) => cfg[k] !== prevCfg.current[k])
    prevCfg.current = cfg
    if (changed) setFlash((f) => ({ key: changed, n: f.n + 1 }))
  }, [cfg])

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

  // SEO — breadcrumb + Service JSON-LD; title/description/canonical/OG/Twitter via <Seo>.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: 'https://quarterfoldltd.com/print-on-demand' },
    ],
  }
  // Name/description straight from this page's own SEO copy (seo.title minus the
  // brand suffix, seo.description verbatim) -- provider @id references the one
  // canonical Organization node declared on the homepage (Home.jsx).
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Print on demand book printing',
    name: 'Print on Demand',
    description: t('seo.description'),
    provider: { '@id': 'https://quarterfoldltd.com/#organization' },
    url: 'https://quarterfoldltd.com/print-on-demand',
  }

  const summaryRows = [
    ['format', optLabel('format', cfg.format), t(`options.format.${cfg.format}.sub`)],
    ['size', optLabel('size', cfg.size), t(`options.size.${cfg.size}.sub`)],
    ['paper', optLabel('paper', cfg.paper), t(`options.paper.${cfg.paper}.sub`)],
    ['binding', optLabel('binding', cfg.binding), t(`options.binding.${cfg.binding}.sub`)],
    ['finish', optLabel('finish', cfg.finish), t(`options.finish.${cfg.finish}.sub`)],
    ['quantity', optLabel('quantity', cfg.quantity), t(`options.quantity.${cfg.quantity}.sub`)],
  ]

  const setReqField = (k, v) => {
    setReq((r) => ({ ...r, [k]: v }))
    if (reqErr[k]) setReqErr((e) => { const n = { ...e }; delete n[k]; return n })
  }

  // ── attachments ────────────────────────────────────────────────────────────
  // Upload starts the moment a file is chosen so progress shows before submit. The
  // field is optional and never blocks the form: a failed or pending upload is simply
  // left out of the payload at submit time.
  const beginUpload = (file, id) => {
    fileMap.current.set(id, file)
    uploadToUploadcare(file, (pct) =>
      setUploads((list) => list.map((u) => (u.id === id ? { ...u, progress: pct } : u))),
    )
      .then((uuid) => {
        setUploads((list) =>
          list.map((u) => (u.id === id ? { ...u, status: 'done', progress: 100, url: uploadcareCdnUrl(uuid, file.name) } : u)),
        )
        setUploadLive(t('summary.uploadStatusDone', { name: file.name }))
      })
      .catch(() => {
        setUploads((list) => list.map((u) => (u.id === id ? { ...u, status: 'error' } : u)))
        setUploadLive(t('summary.uploadStatusFailed', { name: file.name }))
      })
  }

  const onPickFiles = (ev) => {
    const picked = Array.from(ev.target.files || [])
    ev.target.value = '' // reset so the same file can be re-picked after a remove
    if (!picked.length) return
    setUploadErr(null)
    const remaining = UPLOAD_MAX_FILES - uploads.length
    let toAdd = picked
    if (picked.length > remaining) {
      setUploadErr('tooMany')
      toAdd = picked.slice(0, Math.max(0, remaining))
    }
    for (const file of toAdd) {
      const bad = validateUploadFile(file)
      if (bad) { setUploadErr(bad); continue }
      const id = `u${uploadSeq.current++}`
      setUploads((list) => [...list, { id, name: file.name, size: file.size, status: 'uploading', progress: 0, url: null }])
      setUploadLive(t('summary.uploadStatusStart', { name: file.name }))
      beginUpload(file, id)
    }
  }

  const retryUpload = (id) => {
    const file = fileMap.current.get(id)
    if (!file) return
    setUploadErr(null)
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, status: 'uploading', progress: 0 } : u)))
    beginUpload(file, id)
  }

  const removeUpload = (id) => {
    setUploads((list) => list.filter((u) => u.id !== id))
    fileMap.current.delete(id)
    setUploadErr(null)
  }

  const submitReq = async (ev) => {
    ev.preventDefault()
    const hp = ev.currentTarget?.elements?.botcheck?.value
    const e = {}
    if (!req.name.trim()) e.name = t('summary.reqErrName')
    if (!req.email.trim()) e.email = t('summary.reqErrEmail')
    else if (!EMAIL_RE.test(req.email.trim())) e.email = t('summary.reqErrEmailInvalid')
    if (!req.phone.trim()) e.phone = t('summary.reqErrPhone')
    else if (!isValidPhone(req.phone)) e.phone = t('summary.reqErrPhoneInvalid')
    if (!req.consent) e.consent = t('summary.reqConsentErr')
    setReqErr(e)
    if (Object.keys(e).length) {
      reqRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    if (hp) { setReqStatus('success'); return }
    setReqStatus('submitting')
    const spec = summaryRows.map(([k, v]) => `${t(`summary.keys.${k}`)}: ${v}`).join('\n')
    // Optional attachment links — only fully-uploaded files ride along; a failed or
    // still-uploading file is left out so it can never block the submission. "None"
    // reads more clearly than an empty line in the received email.
    const fileUrls = uploads.filter((u) => u.status === 'done' && u.url).map((u) => u.url)
    const attachedFiles = fileUrls.length ? fileUrls.join('\n') : 'None'
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'Print on Demand Request',
          from_name: 'QFP Website',
          botcheck: '',
          name: req.name,
          email: req.email,
          phone: req.phone,
          notes: req.notes,
          attached_files: attachedFiles,
          format: optLabel('format', cfg.format),
          size: optLabel('size', cfg.size),
          paper: optLabel('paper', cfg.paper),
          binding: optLabel('binding', cfg.binding),
          finish: optLabel('finish', cfg.finish),
          quantity: optLabel('quantity', cfg.quantity),
          message: `Print on Demand, book specification\n${spec}\n\nNotes: ${req.notes || 'None'}`,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) setReqStatus('success')
      else setReqStatus('error')
    } catch {
      setReqStatus('error')
    }
  }

  return (
    <main id="main" className="pod">
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={[breadcrumbJsonLd, serviceJsonLd]} />
      {/* 1 · HERO */}
      {(() => {
        const [l1, l2] = splitTitle(t('hero.title'))
        return (
          <PageHero id="pod-h1" eyebrow={t('hero.eyebrow')} line1={l1} line2={l2} minVh={62}>
            <div className="ph-ctas" style={{ marginTop: 'clamp(24px, 4vh, 36px)' }}>
              <CTAButton href="#build" dark arrow={false}>
                {t('hero.cta')}
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></svg>
              </CTAButton>
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
                      '--edge-period': edge.period,
                    }}
                  >
                    <div className="pod-face pod-back" />
                    <div className="pod-face pod-fore" />
                    <div className="pod-face pod-top" />
                    <div className="pod-face pod-spine">
                      <span className="pod-headband top" />
                      <span className="pod-headband bottom" />
                      {/* saddle-stitch staples across the folded spine (shown only for
                          data-binding=saddle) */}
                      <span className="pod-staple top" />
                      <span className="pod-staple bottom" />
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
                <OptionGroup groupId="format" labelId="step-format" options={FORMATS} value={cfg.format} onChange={set('format')} className="pod-opts cols-2">
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
                <OptionGroup groupId="paper" labelId="step-paper" options={PAPERS} value={cfg.paper} onChange={set('paper')} className="pod-opts cols-2">
                  {(o) => (
                    <>
                      <span className="pod-chip-sw" style={{ background: (PAPER_EDGE[o.id] ?? PAPER_FALLBACK).edge }} />
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
                <OptionGroup groupId="finish" labelId="step-finish" options={FINISHES} value={cfg.finish} onChange={set('finish')} className="pod-opts cols-2">
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
            </div>

            {/* RIGHT — sticky live summary */}
            <aside className="pod-summary" aria-label={t('summary.ariaLabel')}>
              <p className="pod-summary-eyebrow">{t('summary.eyebrow')}</p>
              <h3 className="pod-summary-title">{t('summary.title')}</h3>
              <ul className="pod-summary-list">
                {summaryRows.map(([k, v, sub]) => {
                  const isFlash = flash.key === k
                  return (
                    // remount on flash (keyed by nonce) so the one-shot pulse/pop/ping replays
                    <li className="pod-summary-row" key={isFlash ? `${k}-${flash.n}` : k} data-flash={isFlash ? '' : undefined}>
                      <span className="pod-summary-key">{t(`summary.keys.${k}`)}</span>
                      <span className="pod-summary-val">
                        <span className="pod-flash-dot" aria-hidden="true" />
                        {v}
                        {sub && <span className="sub">{sub}</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {reqStatus === 'success' ? (
                <div className="pod-req-done" role="status" aria-live="polite">
                  <span className="pod-req-check" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L19 7" /></svg>
                  </span>
                  <p className="pod-req-done-title">{t('summary.reqSuccessTitle')}</p>
                  <p className="pod-req-done-sub">{t('summary.reqSuccess')}</p>
                </div>
              ) : reqOpen ? (
                <form className="pod-req" ref={reqRef} onSubmit={submitReq} noValidate>
                  <p className="pod-req-title">{t('summary.reqTitle')}</p>
                  <input type="text" name="botcheck" className="pod-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <div className="pod-req-field">
                    <label htmlFor="pod-req-name">{t('summary.reqName')} <span className="pod-req-star" aria-hidden="true">*</span></label>
                    <input id="pod-req-name" name="name" type="text" autoComplete="name"
                      value={req.name} onChange={(e) => setReqField('name', e.target.value)}
                      aria-invalid={reqErr.name ? 'true' : undefined}
                      aria-describedby={reqErr.name ? 'pod-req-name-e' : undefined} />
                    {reqErr.name && <span className="pod-req-err" id="pod-req-name-e">{reqErr.name}</span>}
                  </div>
                  <div className="pod-req-field">
                    <label htmlFor="pod-req-email">{t('summary.reqEmail')} <span className="pod-req-star" aria-hidden="true">*</span></label>
                    <input id="pod-req-email" name="email" type="email" autoComplete="email"
                      value={req.email} onChange={(e) => setReqField('email', e.target.value)}
                      aria-invalid={reqErr.email ? 'true' : undefined}
                      aria-describedby={reqErr.email ? 'pod-req-email-e' : undefined} />
                    {reqErr.email && <span className="pod-req-err" id="pod-req-email-e">{reqErr.email}</span>}
                  </div>
                  <div className="pod-req-field">
                    <label htmlFor="pod-req-phone">{t('summary.reqPhone')} <span className="pod-req-star" aria-hidden="true">*</span></label>
                    <input id="pod-req-phone" name="phone" type="tel" autoComplete="tel"
                      value={req.phone} onChange={(e) => setReqField('phone', e.target.value)}
                      aria-invalid={reqErr.phone ? 'true' : undefined}
                      aria-describedby={reqErr.phone ? 'pod-req-phone-e' : undefined} />
                    {reqErr.phone && <span className="pod-req-err" id="pod-req-phone-e">{reqErr.phone}</span>}
                  </div>
                  <div className="pod-req-field">
                    <label htmlFor="pod-req-notes">{t('summary.reqNotes')}</label>
                    <textarea id="pod-req-notes" name="notes" rows={3}
                      value={req.notes} onChange={(e) => setReqField('notes', e.target.value)}
                      placeholder={t('summary.reqNotesPlaceholder')} />
                  </div>
                  <div className="pod-req-field pod-upload">
                    <span className="pod-upload-label" id="pod-upload-label">{t('summary.uploadLabel')}</span>
                    <p className="pod-upload-help" id="pod-upload-help">{t('summary.uploadHelp')}</p>
                    <label className="pod-upload-drop">
                      <input
                        type="file"
                        className="pod-upload-input"
                        accept={UPLOAD_ACCEPT}
                        multiple
                        onChange={onPickFiles}
                        disabled={uploads.length >= UPLOAD_MAX_FILES}
                        aria-labelledby="pod-upload-label"
                        aria-describedby={`pod-upload-help${uploadErr ? ' pod-upload-err' : ''}`}
                        aria-invalid={uploadErr ? 'true' : undefined}
                      />
                      <span className="pod-upload-cta" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                        </svg>
                        {t('summary.uploadChoose')}
                      </span>
                    </label>
                    {uploads.length > 0 && (
                      <ul className="pod-upload-list">
                        {uploads.map((u) => (
                          <li key={u.id} className="pod-upload-item" data-status={u.status}>
                            <span className="pod-upload-file">
                              <span className="pod-upload-name">{u.name}</span>
                              {u.status === 'uploading' && (
                                <span className="pod-upload-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.progress}
                                  aria-label={t('summary.uploadUploading', { pct: u.progress })}>
                                  <span className="pod-upload-bar-fill" style={{ width: `${u.progress}%` }} />
                                </span>
                              )}
                              <span className="pod-upload-state">
                                {u.status === 'uploading' && t('summary.uploadUploading', { pct: u.progress })}
                                {u.status === 'done' && t('summary.uploadUploaded')}
                                {u.status === 'error' && t('summary.uploadFailed')}
                              </span>
                            </span>
                            {u.status === 'error' && (
                              <button type="button" className="pod-upload-act" onClick={() => retryUpload(u.id)}>
                                {t('summary.uploadRetry')}
                              </button>
                            )}
                            {u.status !== 'uploading' && (
                              <button type="button" className="pod-upload-remove" onClick={() => removeUpload(u.id)}
                                aria-label={t('summary.uploadRemoveAria', { name: u.name })}>
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {uploadErr && <span className="pod-req-err" id="pod-upload-err" role="alert">{t(UPLOAD_ERR_KEY[uploadErr])}</span>}
                    <span className="pod-upload-sr" role="status" aria-live="polite">{uploadLive}</span>
                  </div>
                  <div className={`pod-req-consent${reqErr.consent ? ' has-err' : ''}`}>
                    <input id="pod-req-consent" name="consent" type="checkbox"
                      checked={req.consent} onChange={(e) => setReqField('consent', e.target.checked)}
                      aria-invalid={reqErr.consent ? 'true' : undefined}
                      aria-describedby={reqErr.consent ? 'pod-req-consent-e' : undefined} />
                    <label htmlFor="pod-req-consent">
                      <Trans t={t} i18nKey="summary.reqConsent" components={{ 1: <Link to="/legal/privacy" /> }} /> <span className="pod-req-star" aria-hidden="true">*</span>
                    </label>
                  </div>
                  {reqErr.consent && <span className="pod-req-err" id="pod-req-consent-e">{reqErr.consent}</span>}
                  {reqStatus === 'error' && (
                    <p className="pod-req-error" role="alert" aria-live="assertive">
                      <Trans t={t} i18nKey="summary.reqError" components={{ 1: <a href={`mailto:${EMAIL_ENQ}`} /> }} />
                    </p>
                  )}
                  <CTAButton type="submit" dark arrow={false} className="w-full justify-center"
                    disabled={reqStatus === 'submitting' || !req.consent}
                    aria-disabled={reqStatus === 'submitting' || !req.consent ? 'true' : undefined}
                    aria-busy={reqStatus === 'submitting'}>
                    {reqStatus === 'submitting' ? (
                      <><span className="pod-spin" aria-hidden="true" />{t('summary.reqSending')}</>
                    ) : (
                      <>
                        {reqStatus === 'error' ? t('summary.reqRetry') : t('summary.reqSend')}
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                      </>
                    )}
                  </CTAButton>
                  <button type="button" className="pod-req-cancel" onClick={() => setReqOpen(false)}>
                    {t('summary.reqCancel')}
                  </button>
                </form>
              ) : (
                <CTAButton type="button" dark className="w-full justify-center" onClick={() => setReqOpen(true)}>
                  {t('summary.request')}
                </CTAButton>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* 3 · EXPLORE CATEGORIES — reuses the What We Print category data (same keys +
          images); each tile links to that category on the homepage What We Print band.
          The reassurance band that used to sit above this was removed (client); a top
          curve carries the cream Build section into the beige Explore band. */}
      <section className="pod-explore" data-theme="light" aria-labelledby="pod-explore-title">
        <SectionCurve position="top" fill="#fdfaf4" inward />
        <PaperGrain opacity={0.05} />
        <div className="pod-explore-inner">
          <h2 className="pod-explore-title" id="pod-explore-title" data-textreveal>{t('explore.title')}</h2>
          <ul className="pod-cat-grid">
            {CARDS.filter((c) => c.key !== 'pod').map((c) => (
              <li key={c.key} data-reveal>
                <Link to={`/#wwp-${c.key}`} className="pod-cat">
                  <span className="pod-cat-thumb">
                    <img src={c.img} alt="" aria-hidden="true" loading="lazy" draggable="false" />
                  </span>
                  <span className="pod-cat-name">{tw(`cards.${c.key}.name`)}</span>
                </Link>
              </li>
            ))}
          </ul>
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
