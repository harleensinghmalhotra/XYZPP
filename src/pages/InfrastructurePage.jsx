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
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
import CTAButton from '@/components/CTAButton'
import PageHero, { splitTitle } from '@/components/PageHero'
import { DotField, PaperGrain } from '@/components/atmosphere'
import LightRays from '@/components/LightRays'
import { Books } from '@phosphor-icons/react'
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

// Walkthrough video — plays the SAME "Inside Our Facilities" file the homepage slot
// uses (site-assets/homepage/video/facilities.*), not a duplicate copy, so both pages
// stay in lock-step when the asset is re-cut. It ships with closed captions (facilities.vtt),
// meeting the same accessibility bar as the homepage slot.
const VIDEO_READY = true
const VIDEO_SRC = '/site-assets/homepage/video/facilities.mp4'
const VIDEO_VTT = '/site-assets/homepage/video/facilities.vtt'
const VIDEO_POSTER = '/site-assets/homepage/video/facilities-poster.jpg'

// Data carries stable keys + non-translatable values (logos, codes, icons, numbers).
// User-facing labels/subs/specs/captions resolve via t(`<group>.<key>...`) at render.
// (The certification trust strip is now the shared homepage <Certifications /> — see §2.)

const CAPABILITIES = [
  { k: 'print' },
  { k: 'bind' },
  { k: 'ware' },
]

// The ledger's defining mark per machine — a numeral pulled straight from the client
// copy (non-translatable, like a code): "22 … web offset towers" → 22, "6 … sheetfed
// presses" → 6. Binding & Book Finishing is a whole equipment line with no single
// headline count, so it carries a Phosphor Books glyph (bind:true) rather than picking
// one number out of many and reading as if that were the whole story.
const MACHINES = [
  { k: 'tower', mark: '22' },
  { k: 'press', mark: '6' },
  { k: 'book', bind: true },
]

// Premium finishing services — the client's list, in her order. No counts attach to
// these (they're capabilities, not machine tallies), so each renders as a hairline
// cell with a gold DM-Mono index in the ledger's cream+gold vocabulary. Names resolve
// via t(`finish.items.<k>`); the index is decorative sequencing, not a client number.
const FINISH = ['foiling', 'embossing', 'spotuv', 'dripuv', 'lamination', 'diecutting', 'windowpatching', 'coatings', 'decorative']

const STATS = [
  { k: 'sqft', value: 300000, suffix: '' },
  { k: 'sites', value: 3, suffix: '' },
  { k: 'books', value: 75, suffix: 'M' },
  { k: 'people', value: 600, suffix: '+' },
]

// Recognition is now the shared homepage <Awards /> component (see §6) — the page's
// own plaque rail was retired per client 22-07.

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
      // §2 Certifications + §6 Awards are the shared homepage components — they own their
      // OWN entrance animations, so no reveal() is wired for them here.
      // §3 capability triptych reveals via CSS `.is-in` (IntersectionObserver above).
      reveal('.inf-ledger-row', { trigger: '.inf-ledger', stagger: 0.1, start: 'top 80%' })
      reveal('.inf-finish-cell', { trigger: '.inf-finish-grid', stagger: 0.05, start: 'top 82%' })
      reveal('.inf-results-head, .inf-stat', { trigger: '.inf-results', stagger: 0.08 })
      reveal('.inf-video', { trigger: '.inf-results', start: 'top 72%' })
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

      {/* ── 1B · FACILITY BOOK — SAME wrapper as the homepage ───────────────
          Nested in the homepage's cream `.infra` section context (+ .infra-inner) so
          the navy rounded stage floats on cream exactly like the homepage — not merged
          with the navy hero above nor invaded by the Certifications cream dome below. */}
      <section data-theme="light" className="infra inf-facilitybook">
        <div className="infra-inner">
          <FacilityBook />
        </div>
      </section>

      {/* ── 2 · CERTIFICATIONS — shared homepage <Certifications /> (client 22-07) ──
          Replaces the page's old custom trust strip. flatBottom: the capability triptych
          (§3) below carries its OWN cream top-curve, so the certs navy sweep-arc is
          suppressed here to avoid a clashing double curve. The shared component keeps the
          FSC licence code with its mark (same compliance bar as the retired strip).
          flatTop too: no cream dome to invade the navy facility-book stage above. ── */}
      <Certifications flatTop flatBottom />

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
            <div className="inf-tri-frame-img" style={{ backgroundImage: 'url(/site-assets/infrastructure/facility/facility-01.webp)' }} />
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
                  {m.bind
                    ? <Books size={56} weight="light" />
                    : <span className="inf-ledger-num">{m.mark}</span>}
                </div>
                <h3 className="inf-ledger-name">{t(`machines.items.${m.k}.name`)}</h3>
                <p className="inf-ledger-spec">{t(`machines.items.${m.k}.spec`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4B · PREMIUM FINISHING — value-added services grid (cream) ──────
          The client's finishing list carries no per-item counts, so a numeral
          ledger would force invented numbers; instead each capability is a
          hairline cell with a gold DM-Mono index — the ledger's cream + gold
          vocabulary laid out as a clean grid. A gold top-hairline separates it
          from the machine ledger above (both cream), per the bible's gold rule. */}
      <section data-theme="light" className="inf-finish-sec" aria-labelledby="inf-fin-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('finish.eyebrow')}</p>
            <h2 id="inf-fin-h" className="inf-h2">{t('finish.title')}</h2>
          </div>
          <ul className="inf-finish-grid">
            {FINISH.map((k, i) => (
              <li key={k} className="inf-finish-cell">
                <span className="inf-finish-mark" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="inf-finish-name">{t(`finish.items.${k}`)}</span>
              </li>
            ))}
          </ul>
          <p className="inf-finish-note">{t('finish.note')}</p>
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
              {/* Poster = the shared homepage "Inside Our Facilities" still. */}
              <span className="inf-video-img" aria-hidden="true" style={{ backgroundImage: `url(${VIDEO_POSTER})` }} />
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

      {/* ── 6 · RECOGNITION — shared homepage <Awards /> (client 22-07) ────
          Replaces the page's old custom recognition rail with the exact homepage
          Awards section (Broadway spotlights, navy gold-bordered plaques, gold-foil
          names). Flows on from the navy Results band (both navy, flush) into the cream
          Gallery below. Position within the page layout is preserved. ── */}
      <Awards />

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
                <InfraPhoto src={`/site-assets/infrastructure/gallery/gallery-0${g.n.slice(-1)}.webp`} note={t('gallery.photoNote', { caption: cap })} className="inf-gallery-photo" />
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
          <CTAButton to="/contact">{t('cta.button')}</CTAButton>
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
              <video className="inf-dialog-video" src={VIDEO_SRC} poster={VIDEO_POSTER} controls autoPlay playsInline>
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
