import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import CountUp from '@/components/CountUp'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import FacilityBook from '@/components/FacilityBook'
import PageHero, { splitTitle } from '@/components/PageHero'
import { DotField, PaperGrain } from '@/components/atmosphere'
import LightRays from '@/components/LightRays'
import { Package } from '@phosphor-icons/react'
import './InfrastructurePage.css'

gsap.registerPlugin(ScrollTrigger)

// ── /infrastructure — "Built for Scale. Engineered for Trust." ───────────────
// Structure + rhythm reskinned from dispel.com into QFP brand System B:
//   1 statement hero (navy) + dual CTA · 2 certification trust strip (cream)
//   3 capability TRIPTYCH — three gold-hairline spines + 98% stat + press-hall frame (navy)
//   4 machine LEDGER — four hairline rows, big gold numeral / mark (cream)
//   5 measurable-results band + video (navy)
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

// Data carries stable keys + non-translatable values (logos, codes, icons, numbers).
// User-facing labels/subs/specs/captions resolve via t(`<group>.<key>...`) at render.
const CERTS = [
  { k: 'fsc', logo: 'fsc.webp', code: 'TUVDC-COC-101258' },
  { k: 'iso9001', logo: 'iso.webp' },
  { k: 'iso14001', logo: 'iso.webp' },
  { k: 'sedex', logo: 'sedex.webp' },
  { k: 'starExport', typographic: true },
]

const CAPABILITIES = [
  { k: 'print' },
  { k: 'bind' },
  { k: 'ware' },
]

// The ledger's defining mark per machine — a numeral derived straight from the
// existing copy (non-translatable, like a code): "20-Web…" → 20, "…5 Presses" → 5,
// "3 Lineomatic…" → 3. The cartons entry names no count, so it carries a Phosphor
// Package glyph instead (pkg:true) rather than an invented number.
const MACHINES = [
  { k: 'tower', mark: '20' },
  { k: 'press', mark: '5' },
  { k: 'book', mark: '3' },
  { k: 'carton', pkg: true },
]

const STATS = [
  { k: 'sqft', value: 300000, suffix: '' },
  { k: 'sites', value: 3, suffix: '' },
  { k: 'books', value: 75, suffix: 'M' },
  { k: 'people', value: 600, suffix: '+' },
]

// Recognition plaques reuse the HOMEPAGE Awards visual language (.aw/.plq, gold-foil
// names, press-clipping). Two items carry the real ceremony photos already shipped for
// the homepage (CAPEXIL → award-04, PrintWeek → award-01); D&B — a listing, not a
// ceremony — takes the designed press-clipping treatment (the homepage's Forbes card).
const AWARDS = [
  { k: 'capexil', img: 'award-04.webp' },
  { k: 'printweek', img: 'award-01.webp' },
  { k: 'dnb', clipping: true },
]

const GALLERY = [
  { n: '01', k: 'pressHall' },
  { n: '02', k: 'bindery' },
  { n: '03', k: 'warehouse' },
  { n: '04', k: 'dispatch' },
]

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

// ── Recognition plaque internals — ported from the homepage Awards section so the
// treatment is pixel-identical (same .aw-photo frame, same gold placeholder, same
// press-clipping). Photo: real ceremony webp reveals on load and hides the elegant
// gold-framed placeholder; a 404 keeps the placeholder (zero code change if a file moves).
function PlaquePhoto({ img, ph }) {
  const [ok, setOk] = useState(false)
  return (
    <>
      <img
        className="aw-photo-img"
        src={`/qfp/awards/${img}`}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ opacity: ok ? 1 : 0 }}
        onLoad={() => setOk(true)}
        onError={() => setOk(false)}
      />
      {!ok && <div className="aw-photo-ph" aria-hidden="true"><span>{ph}</span></div>}
    </>
  )
}

// D&B is a business-register listing, not a ceremony — so its photo zone IS a designed
// press clipping (the homepage's Forbes-card device), no image needed.
function PlaqueClipping({ t }) {
  return (
    <div className="aw-clip">
      <div className="aw-clip-head">
        <span className="aw-clip-masthead">{t('recognition.awards.dnb.clipMasthead')}</span>
        <span className="aw-clip-date">{t('recognition.awards.dnb.clipDate')}</span>
      </div>
      <div className="aw-clip-rule" />
      <div className="aw-clip-headline">{t('recognition.awards.dnb.clipHeadline')}</div>
      <div className="aw-clip-lines">
        <span style={{ width: '100%' }} />
        <span style={{ width: '93%' }} />
        <span style={{ width: '98%' }} />
        <span style={{ width: '58%' }} />
      </div>
    </div>
  )
}

// Recognition rail — the homepage Awards anatomy replicated 1:1 (in-territory, so
// the homepage stays untouched): left-aligned .aw-head-text + paging arrows, an
// .aw-viewport scroller wrapping a flex .aw-grid of .plq plaques. Same arrow chip
// (.wwp-arrow), same scroll mechanics as Awards.jsx — with three cards filling the
// row on desktop the arrows sit disabled (exactly the homepage's rendered state),
// and they light up when a narrower viewport shows fewer than three at a time.
function RecognitionRail({ t }) {
  const viewport = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const cardStep = () => {
    const vp = viewport.current
    if (!vp) return 0
    const cards = vp.querySelectorAll('.plq')
    if (cards.length >= 2) {
      return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
    }
    return cards[0]?.getBoundingClientRect().width ?? 0
  }
  const scrollRow = (dir) => {
    const vp = viewport.current
    if (!vp) return
    vp.scrollBy({ left: dir * cardStep(), behavior: prefersReduced() ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    const vp = viewport.current
    if (!vp) return
    const update = () => {
      const max = vp.scrollWidth - vp.clientWidth
      setAtStart(vp.scrollLeft <= 1)
      setAtEnd(vp.scrollLeft >= max - 1) // no overflow → both ends true → both disabled
    }
    update()
    vp.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { vp.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  return (
    <div className="aw-content">
      <div className="aw-head">
        <div className="aw-head-text">
          <p className="aw-eyebrow">{t('recognition.eyebrow')}</p>
          <h2 id="inf-rec-h" className="aw-title">{t('recognition.title')}</h2>
        </div>
        <div className="wwp-arrows aw-arrows">
          <button type="button" className="wwp-arrow focus-ring" onClick={() => scrollRow(-1)} disabled={atStart} aria-label={t('recognition.scrollPrev')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          </button>
          <button type="button" className="wwp-arrow focus-ring" onClick={() => scrollRow(1)} disabled={atEnd} aria-label={t('recognition.scrollNext')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <div className="aw-viewport" ref={viewport} role="region" aria-label={t('recognition.rowLabel')} tabIndex={0}>
        <div className="aw-grid">
          {AWARDS.map((a) => (
            <article className="plq" key={a.k}>
              <div className="aw-photo">
                {a.clipping
                  ? <PlaqueClipping t={t} />
                  : <PlaquePhoto img={a.img} ph={t(`recognition.awards.${a.k}.kicker`)} />}
                <div className="plq-tint" aria-hidden="true" />
                <div className="plq-sheen" aria-hidden="true" />
              </div>
              <div className="aw-body">
                <div className="aw-label">{t(`recognition.awards.${a.k}.kicker`)}</div>
                <h3 className="aw-name">{t(`recognition.awards.${a.k}.name`)}</h3>
                <p className="aw-desc">{t(`recognition.awards.${a.k}.body`)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function InfrastructurePage() {
  const { t } = useTranslation('infrastructurePage')
  const root = useRef(null)
  const triRef = useRef(null) // capability triptych — CSS reveal container
  const [reduced] = useState(prefersReduced)
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

  // §3 capability triptych — hairlines draw + columns fade-stagger via the CSS
  // `.is-in` gate (About-MVV mechanism). Reduced motion mounts already-in (see JSX).
  useEffect(() => {
    if (reduced) return
    const el = triRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() }
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

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

      // (hero reveals now handled by PageHero via alive.js data-reveal/textreveal)
      reveal('.inf-strip-item', { trigger: '.inf-strip', stagger: 0.07 })
      // §3 capability triptych reveals via CSS `.is-in` (IntersectionObserver above).
      reveal('.inf-ledger-row', { trigger: '.inf-ledger', stagger: 0.1, start: 'top 80%' })
      reveal('.inf-results-head, .inf-stat', { trigger: '.inf-results', stagger: 0.08 })
      reveal('.inf-video', { trigger: '.inf-results', start: 'top 72%' })
      reveal('.inf-recognition .aw-head', { trigger: '.inf-recognition', start: 'top 80%' })
      reveal('.inf-recognition .plq', { trigger: '.inf-recognition', stagger: 0.12, start: 'top 74%' })
      reveal('.inf-gallery-item', { trigger: '.inf-gallery', stagger: 0.08 })
      reveal('.inf-cta-inner', { trigger: '.inf-cta', start: 'top 84%' })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const canonical = 'https://quarterfoldltd.com/infrastructure'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: canonical },
    ],
  }

  return (
    <main id="main" ref={root} className="inf">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={jsonLd}
      />

      {/* ── 1 · TWO-LINE HERO (navy) — replaces the giant display band ────── */}
      {(() => {
        const [l1, l2] = splitTitle(t('hero.title'))
        return <PageHero id="inf-h1" eyebrow={t('hero.eyebrow')} line1={l1} line2={l2} minVh={60} />
      })()}

      {/* ── 1B · FACILITY BOOK — interactive page-turner ────────────────── */}
      <FacilityBook />

      {/* ── 2 · TRUST STRIP — certifications (cream) ─────────────────────── */}
      <section data-theme="light" className="inf-strip" aria-labelledby="inf-strip-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <h2 id="inf-strip-h" className="inf-strip-eyebrow">{t('strip.eyebrow')}</h2>
          <ul className="inf-strip-row">
            {CERTS.map((c) => {
              const name = t(`strip.certs.${c.k}.name`)
              return (
              <li key={c.k} className="inf-strip-item">
                <div className="inf-strip-mark">
                  {c.typographic ? (
                    <span className="inf-strip-star" aria-hidden="true">★</span>
                  ) : (
                    <img src={`/qfp/certs/${c.logo}`} alt={t('strip.certAlt', { name })} loading="lazy" decoding="async" />
                  )}
                </div>
                <p className="inf-strip-name">{name}</p>
                <p className="inf-strip-sub">{t(`strip.certs.${c.k}.sub`)}</p>
                {/* COMPLIANCE: the FSC licence code must render with the mark — never omit. */}
                {c.code && <p className="inf-strip-code">{t('strip.licence', { code: c.code })}</p>}
              </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ── 3 · CAPABILITY TRIPTYCH (navy) — About-MVV vocabulary ───────────
          One flat #0e1b46 band folded into three spines split by two drawn gold
          hairlines. NO 01/02/03 indices, NO ghost numerals (MVV site law). Each
          column: DM Mono gold capability name → Inter cream statement, equal
          optical weight. The 98% stat punctuates below (homepage stat anatomy),
          then a full-width press-hall frame closes the band. Curves inward per
          bible so the cream neighbours dip in, never a navy sliver. ─────────── */}
      <section
        ref={triRef}
        data-theme="dark"
        className={`inf-tri${reduced ? ' is-in' : ''}`}
        aria-labelledby="inf-tri-h"
      >
        <SectionCurve position="top" fill="#fdfaf4" inward />
        <div className="inf-wrap inf-z">
          <div className="inf-tri-head">
            <p className="inf-eyebrow inf-eyebrow--ondark">{t('acc.eyebrow')}</p>
            <h2 id="inf-tri-h" className="inf-h2 inf-h2--ondark">{t('acc.title')}</h2>
          </div>

          <div className="inf-tri-cols">
            {CAPABILITIES.map((cap, i) => (
              <div className="inf-tri-col" key={cap.k} style={{ '--col-i': i }}>
                <div className="inf-tri-col-body">
                  <p className="inf-tri-label">{t(`acc.capabilities.${cap.k}.label`)}</p>
                  <p className="inf-tri-text">{t(`acc.capabilities.${cap.k}.body`)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 98% stat — centred punctuation row, homepage stat anatomy (big flat
              gold numeral + DM Mono label). 98 is a fixed brand figure. */}
          <div className="inf-tri-stat">
            <span className="inf-tri-stat-num"><CountUp value={98} suffix="%" /></span>
            <span className="inf-tri-stat-label">{t('acc.quoteText')}</span>
          </div>

          {/* full-width press-hall frame — hairline, no label; silent drop-in for
              facility-01.webp (a delivered asset covers the navy base, zero code
              change; a 404 simply leaves the framed navy placeholder). */}
          <div className="inf-tri-frame" aria-hidden="true">
            <div className="inf-tri-frame-img" style={{ backgroundImage: 'url(/qfp/infra/facility-01.webp)' }} />
          </div>
        </div>
        <SectionCurve position="bottom" fill="#fdfaf4" inward />
      </section>

      {/* ── 4 · MACHINE LEDGER — full-width hairline rows (cream) ───────────
          Editorial, About-chapter anatomy. Each machine is one ledger row split
          into three locked zones: the defining numeral / mark BIG in gold ·
          machine name · spec (max 44ch). Rows reveal in stagger; on hover the
          row's top hairline warms gold, drawn scaleX from the left. ────────── */}
      <section data-theme="light" className="inf-ledger-sec" aria-labelledby="inf-mach-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('machines.eyebrow')}</p>
            <h2 id="inf-mach-h" className="inf-h2">{t('machines.title')}</h2>
          </div>
          <div className="inf-ledger">
            {MACHINES.map((m) => (
              <article key={m.k} className="inf-ledger-row">
                <span className="inf-ledger-rule" aria-hidden="true" />
                <div className="inf-ledger-mark" aria-hidden="true">
                  {m.pkg
                    ? <Package size={56} weight="light" />
                    : <span className="inf-ledger-num">{m.mark}</span>}
                </div>
                <h3 className="inf-ledger-name">{t(`machines.items.${m.k}.name`)}</h3>
                <p className="inf-ledger-spec">{t(`machines.items.${m.k}.spec`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · MEASURABLE RESULTS + video (navy) ───────────────────────── */}
      <section data-theme="dark" className="inf-results" aria-labelledby="inf-res-h">
        <SectionCurve position="top" fill="#fdfaf4" inward />
        <div className="inf-results-beam" aria-hidden="true" />
        <DotField tone="navy" />
        {/* LIGHT RAYS — factory light raking the results band. Sole WebGL here; the
            beam/dots are 2D. Gold, top-center, low-sat, slight noise, no pulse. */}
        <LightRays className="inf-results-rays" rayLength={1.5} lightSpread={0.9} />
        <div className="inf-wrap inf-results-grid inf-z">
          <div className="inf-results-left">
            <div className="inf-results-head">
              <p className="inf-eyebrow inf-eyebrow--ondark">{t('results.eyebrow')}</p>
              <h2 id="inf-res-h" className="inf-h2 inf-h2--ondark">{t('results.title')}</h2>
              <p className="inf-results-sub">
                {t('results.sub')}
              </p>
            </div>
            <div className="inf-stats">
              {STATS.map((s) => (
                <div key={s.k} className="inf-stat">
                  <span className="inf-stat-num">
                    <CountUp value={s.value} suffix={s.suffix} grouping />
                  </span>
                  <span className="inf-stat-label">{t(`results.stats.${s.k}.label`)}</span>
                  <span className="inf-stat-foot">{t(`results.stats.${s.k}.foot`)}</span>
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
              aria-label={VIDEO_READY ? t('results.videoPlayLabel') : t('results.videoPendingLabel')}
            >
              {/* Silent drop-in poster: a delivered walkthrough poster covers this with zero code change. */}
              <span className="inf-video-img" aria-hidden="true" style={{ backgroundImage: 'url(/qfp/infra/walkthrough-poster.webp)' }} />
              <span className="inf-video-scrim" aria-hidden="true" />
              <span className="inf-video-note" aria-hidden="true">{t('results.videoNote')}</span>
              <span className="inf-play" aria-hidden="true">
                <span className="inf-play-ring" />
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" /></svg>
              </span>
            </button>
          </div>
        </div>
        {/* No bottom curve here — Results flows seamlessly into the navy Recognition
            plaques below; the navy→cream sweep happens at the foot of Recognition. */}
      </section>

      {/* ── 6 · RECOGNITION — homepage Awards plaque language, 3-up (navy) ─
          Reuses the homepage Awards section verbatim: Broadway spotlights, navy
          gold-bordered plaques, ceremony photos + a press-clipping, gold-foil names.
          Flows on from the navy Results band as one "honour hall" chapter, then the
          signature curve sweeps navy → cream into the gallery below. */}
      <section data-theme="dark" className="aw inf-recognition" aria-labelledby="inf-rec-h">
        <div className="aw-glow" aria-hidden="true" />
        <div className="aw-carpet" aria-hidden="true" />
        <div className="aw-vignette" aria-hidden="true" />
        <div className="aw-inner">
          <RecognitionRail t={t} />
        </div>
        <SectionCurve position="bottom" fill="#fdfaf4" inward />
      </section>

      {/* ── 7 · GALLERY — facility photos only, no testimonials (cream) ─── */}
      <section data-theme="light" className="inf-gallery" aria-labelledby="inf-gal-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('gallery.eyebrow')}</p>
            <h2 id="inf-gal-h" className="inf-h2">{t('gallery.title')}</h2>
          </div>
          <div className="inf-gallery-strip">
            {GALLERY.map((g) => {
              const cap = t(`gallery.items.${g.k}`)
              return (
              <figure key={g.n} className="inf-gallery-item">
                <InfraPhoto src={`/qfp/infra/gallery-0${g.n.slice(-1)}.webp`} note={t('gallery.photoNote', { caption: cap })} className="inf-gallery-photo" />
                <figcaption className="inf-gallery-cap">{cap}</figcaption>
              </figure>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 8 · CTA (beige) ─────────────────────────────────────────────── */}
      <section data-theme="light" className="inf-cta" aria-labelledby="inf-cta-h">
        <PaperGrain />
        <SectionCurve position="top" fill="#f0ebe0" />
        <div className="inf-wrap inf-cta-inner inf-z">
          <h2 id="inf-cta-h" className="inf-cta-title">{t('cta.title')}</h2>
          <p className="inf-cta-sub">
            {t('cta.sub')}
          </p>
          <Link to="/contact" className="u-btn u-btn--solid">{t('cta.button')}</Link>
        </div>
      </section>

      {/* ── VIDEO DIALOG — backdrop blur + navy scrim; Esc / click-out close ─ */}
      {videoOpen && (
        <div
          className="inf-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={t('dialog.ariaLabel')}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoOpen(false) }}
        >
          <div className="inf-dialog-panel">
            <button ref={closeRef} type="button" className="inf-dialog-close" onClick={() => setVideoOpen(false)} aria-label={t('dialog.closeLabel')}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            {VIDEO_READY ? (
              // COMPLIANCE: ship with <track kind="captions"> + linked transcript before go-live.
              <video className="inf-dialog-video" src={VIDEO_SRC} controls autoPlay playsInline crossOrigin="anonymous">
                <track kind="captions" src={VIDEO_VTT} srcLang="en" label={t('dialog.captionsLabel')} default />
              </video>
            ) : (
              <div className="inf-dialog-ph" aria-hidden="true">
                <span className="inf-video-note">{t('dialog.videoNote')}</span>
                <span className="inf-dialog-soon">{t('dialog.comingSoon')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
