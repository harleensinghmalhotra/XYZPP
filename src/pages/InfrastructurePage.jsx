import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import CountUp from '@/components/CountUp'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { WavyBackground, DotField, PaperGrain } from '@/components/atmosphere'
import LightRays from '@/components/LightRays'
import './InfrastructurePage.css'

gsap.registerPlugin(ScrollTrigger)

// ── /infrastructure — "Built for Scale. Engineered for Trust." ───────────────
// Structure + rhythm reskinned from dispel.com into QFP brand System B:
//   1 statement hero (navy) + dual CTA · 2 certification trust strip (cream)
//   3 capability accordion + tall side image + embedded quote (beige)
//   4 machine cards, 2 large + 2 small (cream) · 5 measurable-results band + video (navy)
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

const MACHINES = [
  { k: 'tower', size: 'large', icon: 'tower' },
  { k: 'press', size: 'large', icon: 'press' },
  { k: 'book', size: 'small', icon: 'book' },
  { k: 'carton', size: 'small', icon: 'carton' },
]

const STATS = [
  { k: 'sqft', value: 250000, suffix: '' },
  { k: 'sites', value: 6, suffix: '' },
  { k: 'books', value: 25, suffix: 'M+' },
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

// Stroke-draw icons — pathLength="1" normalises every path so one dash rule draws
// them all. Icons render fully under reduced motion (see CSS).
function MachineIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1 }
  return (
    <svg className="inf-mi-icon" viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      {name === 'tower' && (
        <>
          <rect x="10" y="6" width="28" height="36" rx="2" {...common} />
          <path d="M17 14h14M17 22h14M17 30h14" {...common} />
          <circle cx="24" cy="24" r="6" {...common} />
        </>
      )}
      {name === 'press' && (
        <>
          <path d="M8 30h32M8 30V16a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v14" {...common} />
          <path d="M14 30v8h20v-8M20 14v-4h8v4" {...common} />
          <path d="M18 22h12" {...common} />
        </>
      )}
      {name === 'book' && (
        <>
          <path d="M24 12v26" {...common} />
          <path d="M24 12C20 9 14 9 9 10v25c5-1 11-1 15 2 4-3 10-3 15-2V10c-5-1-11-1-15 2Z" {...common} />
        </>
      )}
      {name === 'carton' && (
        <>
          <path d="M24 6 8 14v20l16 8 16-8V14L24 6Z" {...common} />
          <path d="M8 14l16 8 16-8M24 22v20M24 22 16 10M32 10l-8 4" {...common} />
        </>
      )}
    </svg>
  )
}

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

export default function InfrastructurePage() {
  const { t } = useTranslation('infrastructurePage')
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [active, setActive] = useState(0) // capability accordion
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

      reveal('.inf-hero-eyebrow, .inf-hero-title, .inf-hero-sub, .inf-hero-ctas', { trigger: '.inf-hero', start: 'top 90%', stagger: 0.08 })
      reveal('.inf-hero-stat', { trigger: '.inf-hero', start: 'top 88%' })
      reveal('.inf-strip-item', { trigger: '.inf-strip', stagger: 0.07 })
      reveal('.inf-acc-row', { trigger: '.inf-acc', stagger: 0.1 })
      reveal('.inf-acc-visual', { trigger: '.inf-acc' })
      reveal('.inf-machine', { trigger: '.inf-machines', stagger: 0.12, start: 'top 78%' })
      reveal('.inf-results-head, .inf-stat', { trigger: '.inf-results', stagger: 0.08 })
      reveal('.inf-video', { trigger: '.inf-results', start: 'top 72%' })
      reveal('.inf-recognition .aw-head', { trigger: '.inf-recognition', start: 'top 80%' })
      reveal('.inf-recognition .plq', { trigger: '.inf-recognition', stagger: 0.12, start: 'top 74%' })
      reveal('.inf-gallery-item', { trigger: '.inf-gallery', stagger: 0.08 })
      reveal('.inf-cta-inner', { trigger: '.inf-cta', start: 'top 84%' })

      // stroke-draw the machine icons once the grid enters
      ScrollTrigger.create({
        trigger: '.inf-machines', start: 'top 78%', once: true,
        onEnter: () => q('.inf-machine').forEach((el) => el.classList.add('is-in')),
      })
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

      {/* ── 1 · HERO (navy) ─────────────────────────────────────────────── */}
      <section data-theme="dark" className="inf-hero" aria-labelledby="inf-h1">
        <WavyBackground className="inf-waves" />
        <div className="inf-hero-beam" aria-hidden="true" />
        <div className="inf-wrap inf-hero-grid inf-z">
          <div className="inf-hero-copy">
            <p className="inf-hero-eyebrow">{t('hero.eyebrow')}</p>
            <h1 id="inf-h1" className="inf-hero-title">
              <Trans t={t} i18nKey="hero.title" components={{ strong: <span className="inf-hero-title-accent" /> }} />
            </h1>
            <p className="inf-hero-sub">
              {t('hero.sub')}
            </p>
            <div className="inf-hero-ctas">
              <Link to="/contact" className="inf-btn inf-btn--gold">{t('hero.ctaQuote')}</Link>
              <a href="/#process" className="inf-btn inf-btn--ghost">
                {t('hero.ctaProcess')}
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>
          </div>

          {/* single foil moment on the page — the flagship stat */}
          <div className="inf-hero-stat" aria-label={t('hero.statAriaLabel')}>
            <span className="inf-hero-foil" aria-hidden="true">250,000</span>
            <span className="inf-hero-stat-unit">{t('hero.statUnit')}</span>
            <span className="inf-hero-stat-foot">{t('hero.statFoot')}</span>
          </div>
        </div>
        <SectionCurve position="bottom" fill="#fdfaf4" />
      </section>

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

      {/* ── 3 · CAPABILITY ACCORDION (beige) ────────────────────────────── */}
      <section data-theme="light" className="inf-acc" aria-labelledby="inf-acc-h">
        <PaperGrain />
        <DotField tone="warm" />
        <div className="inf-wrap inf-acc-grid inf-z">
          <div className="inf-acc-copy">
            <p className="inf-eyebrow">{t('acc.eyebrow')}</p>
            <h2 id="inf-acc-h" className="inf-h2">{t('acc.title')}</h2>
            <div className="inf-acc-rows">
              {CAPABILITIES.map((cap, i) => {
                const open = active === i
                const label = t(`acc.capabilities.${cap.k}.label`)
                return (
                  <div key={cap.k} className={`inf-acc-row${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="inf-acc-head"
                      aria-expanded={open}
                      aria-controls={`inf-acc-panel-${cap.k}`}
                      onClick={() => setActive(i)}
                    >
                      <span className="inf-acc-num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="inf-acc-label">{label}</span>
                      <span className="inf-acc-chev" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </span>
                    </button>
                    <div id={`inf-acc-panel-${cap.k}`} className="inf-acc-panel" role="region" aria-label={label} hidden={!open}>
                      <p>{t(`acc.capabilities.${cap.k}.body`)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="inf-acc-visual">
            <InfraPhoto
              src={`/qfp/infra/facility-0${active + 1}.webp`}
              note={t(`acc.capabilities.${CAPABILITIES[active].k}.photoNote`)}
              className="inf-acc-photo"
            />
            {/* embedded stat quote card — echoes dispel's overlaid quote */}
            <div className="inf-acc-quote">
              <span className="inf-acc-quote-num"><CountUp value={98} suffix="%" /></span>
              <span className="inf-acc-quote-text">{t('acc.quoteText')}</span>
            </div>
          </div>
        </div>
        <SectionCurve position="bottom" fill="#f0ebe0" />
      </section>

      {/* ── 4 · MACHINE CARDS — 2 large + 2 small (cream) ───────────────── */}
      <section data-theme="light" className="inf-mach-sec" aria-labelledby="inf-mach-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('machines.eyebrow')}</p>
            <h2 id="inf-mach-h" className="inf-h2">{t('machines.title')}</h2>
          </div>
          <div className="inf-machines">
            {MACHINES.map((m) => (
              <article key={m.k} className={`inf-machine inf-machine--${m.size}`}>
                <span className="inf-mi">
                  <MachineIcon name={m.icon} />
                </span>
                <h3 className="inf-machine-name">{t(`machines.items.${m.k}.name`)}</h3>
                <p className="inf-machine-spec">{t(`machines.items.${m.k}.spec`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 · MEASURABLE RESULTS + video (navy) ───────────────────────── */}
      <section data-theme="dark" className="inf-results" aria-labelledby="inf-res-h">
        <SectionCurve position="top" fill="#fdfaf4" />
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
          <div className="aw-content">
            <div className="aw-head">
              <p className="aw-eyebrow">{t('recognition.eyebrow')}</p>
              <h2 id="inf-rec-h" className="aw-title">{t('recognition.title')}</h2>
            </div>
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
        <SectionCurve position="bottom" fill="#fdfaf4" />
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
          <Link to="/contact" className="inf-btn inf-btn--gold inf-btn--lg">{t('cta.button')}</Link>
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
