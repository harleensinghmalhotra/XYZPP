import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '@/components/Seo'
import CountUp from '@/components/CountUp'
import VideoBackdrop from '@/components/VideoBackdrop'
import SectionCurve from '@/components/SectionCurve'
import { DotField, PaperGrain } from '@/components/atmosphere'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'

gsap.registerPlugin(ScrollTrigger)

// ─────────────────────────────────────────────────────────────────────────────
// /fulfilment — "One System, Start to Finish."
// Structure + rhythm reskinned from flexis-mobility.com into QFP System B.
// Native scroll (the homepage owns Lenis; inner routes are plain scroll). Every
// section carries data-theme so the fixed SiteNav flips ink/paper under it.
//
// Two compliance gates, both OFF by default:
//   VIDEO_READY            — hero ambient video slot. Poster shows until the
//                            client delivers /qfp/fulfil/hero.mp4 (+ captions).
//   SHOW_RESTRICTED_CLIENTS — the trust marquee is permission-safe (ministries /
//                            programmes only). Named commercial clients (HDFC,
//                            ZEE, Reliance) stay OUT of the DOM until sign-off.
// ─────────────────────────────────────────────────────────────────────────────
const VIDEO_READY = true
const VIDEO_SRC = '/qfp/fulfil/hero.mp4'
const SHOW_RESTRICTED_CLIENTS = false

const BASE = '/qfp/fulfil'

// ── stroke icons (marquee + value grid). pathLength="1" lets GSAP stroke-draw
// any shape uniformly; resting/reduced state renders solid. ───────────────────
const I = {
  bank: <path d="M3 9.5 12 4l9 5.5M5 10v9M19 10v9M9 19v-6h6v6M3 21h18" />,
  pin: <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  globe: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3Z" />,
  book: <path d="M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2ZM4 5.5V20M9 8h6M9 11h4" />,
  layers: <path d="M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" />,
  monitor: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
}

// value-grid icons — all shapes tagged .ff-vi-draw with pathLength for the draw-in
const VIcon = {
  warehouse: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 10 12 4l9 6" />
      <path className="ff-vi-draw" pathLength="1" d="M5 10v10h14V10" />
      <path className="ff-vi-draw" pathLength="1" d="M8 20v-6h8v6" />
      <path className="ff-vi-draw" pathLength="1" d="M8 14h8" />
    </>
  ),
  carton: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 8 12 4l9 4-9 4-9-4Z" />
      <path className="ff-vi-draw" pathLength="1" d="M3 8v8l9 4 9-4V8" />
      <path className="ff-vi-draw" pathLength="1" d="M12 12v8" />
    </>
  ),
  printer: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M7 8V4h10v4" />
      <path className="ff-vi-draw" pathLength="1" d="M5 8h14a2 2 0 0 1 2 2v6h-4M5 16H3v-6a2 2 0 0 1 2-2Z" />
      <path className="ff-vi-draw" pathLength="1" d="M7 14h10v6H7z" />
    </>
  ),
  anchor: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M12 7v13" />
      <path className="ff-vi-draw" pathLength="1" d="M9 4.5a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z" />
      <path className="ff-vi-draw" pathLength="1" d="M5 12H3c0 5 4 8 9 8s9-3 9-8h-2" />
      <path className="ff-vi-draw" pathLength="1" d="M8 11H4M20 11h-4" />
    </>
  ),
  containers: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M3 9h8v11H3zM13 9h8v11h-8Z" />
      <path className="ff-vi-draw" pathLength="1" d="M6 9V6h12v3M7 12v5M17 12v5" />
    </>
  ),
  clock: (
    <>
      <path className="ff-vi-draw" pathLength="1" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
      <path className="ff-vi-draw" pathLength="1" d="M12 7v5l3.5 2" />
    </>
  ),
}

// ── data ──────────────────────────────────────────────────────────────────────
// These "safe" partners are all government / ministry / programme names — gated
// behind SHOW_MINISTRY_NAMES (permission pending). If the switch is off AND no
// restricted clients are shown, PARTNERS is empty and the whole marquee section
// hides cleanly (see TrustMarquee) rather than leaving an empty strip.
// key → resolves partners.<key>.label / .sub; icons/brand identity stay hardcoded.
const SAFE_PARTNERS = [
  { key: 'tie', icon: 'bank' },
  { key: 'ghana', icon: 'pin' },
  { key: 'ivory', icon: 'globe' },
  { key: 'balbharti', icon: 'book' },
  { key: 'worldbank', icon: 'layers' },
  { key: 'un', icon: 'globe' },
  { key: 'ministry', icon: 'monitor' },
]
// Named commercial clients — gated behind SHOW_RESTRICTED_CLIENTS (kept OUT of DOM).
const RESTRICTED_PARTNERS = [
  { key: 'hdfc', icon: 'bank' },
  { key: 'zee', icon: 'globe' },
]
const MINISTRY_PARTNERS = SHOW_MINISTRY_NAMES ? SAFE_PARTNERS : []
const PARTNERS = SHOW_RESTRICTED_CLIENTS ? [...MINISTRY_PARTNERS, ...RESTRICTED_PARTNERS] : MINISTRY_PARTNERS

// Translatable text (name/text) resolves via cards.<n>.*; image/index hardcoded.
const CARDS = [
  { n: '01', src: `${BASE}/card-01.webp` },
  { n: '02', src: `${BASE}/card-02.webp` },
  { n: '03', src: `${BASE}/card-03.webp` },
]

// Numbers/suffix stay numeric; unit + label resolve via values.<icon>.*; word too.
const VALUES = [
  { icon: 'warehouse', num: 100000, grouping: true },
  { icon: 'carton', hasWord: true },
  { icon: 'printer', num: 5 },
  { icon: 'anchor', hasWord: true },
  { icon: 'containers', num: 800, suffix: '+' },
  { icon: 'clock', num: 98, suffix: '%' },
]

// eyebrow/title/body/more resolve via features.<n>.*; image/index hardcoded.
const FEATURES = [
  { n: '01', src: `${BASE}/feature-01.webp` },
  { n: '02', src: `${BASE}/feature-02.webp` },
  { n: '03', src: `${BASE}/feature-03.webp` },
  { n: '04', src: `${BASE}/feature-04.webp` },
]

// verb/word/line resolve via stages.<n>.*; index hardcoded.
const STAGES = [{ n: '01' }, { n: '02' }, { n: '03' }]

// ── components ────────────────────────────────────────────────────────────────
function Hero() {
  const { t } = useTranslation('fulfilment')
  return (
    <section data-theme="dark" className="ff-hero" aria-labelledby="ff-h1">
      <div className="ff-hero-media" aria-hidden="true">
        <div className="ff-hero-poster" style={{ backgroundImage: `url(${BASE}/hero-poster.webp)` }} />
        {VIDEO_READY && (
          <VideoBackdrop className="ff-hero-video is-ready" src={VIDEO_SRC} poster={`${BASE}/hero-poster.webp`} />
        )}
      </div>
      <div className="ff-hero-scrim" aria-hidden="true" />
      <div className="ff-hero-inner">
        <p className="ff-shared-eyebrow ff-hero-eyebrow ff-reveal">{t('hero.eyebrow')}</p>
        <h1 id="ff-h1" className="ff-hero-h1 ff-reveal">
          <span className="ff-hw">{t('hero.title.one')}</span>
          <span className="ff-hw">{t('hero.title.system')}</span>
          <br />
          <span className="ff-hw ff-hw-light">{t('hero.title.start')}</span>
          <span className="ff-hw ff-hw-light">{t('hero.title.to')}</span>
          <span className="ff-hw">{t('hero.title.finish')}</span>
        </h1>
        <p className="ff-hero-sub ff-reveal">
          {t('hero.sub')}
        </p>
      </div>
      <div className="ff-hero-cue" aria-hidden="true">
        <span>{t('hero.cue')}</span>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}

function MqIcon({ type }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{I[type]}</svg>
  )
}

function TrustMarquee({ reduced }) {
  const { t } = useTranslation('fulfilment')
  const track = useRef(null)
  // Every partner here is a gated ministry/programme name; if all are hidden the
  // strip has nothing to show, so drop the whole section (no empty marquee).
  const empty = PARTNERS.length === 0
  useLayoutEffect(() => {
    if (reduced || !track.current) return
    const anim = track.current.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }],
      { duration: 34000, iterations: Infinity, easing: 'linear' },
    )
    const host = track.current.parentElement
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let enter, leave
    if (canHover && host) {
      enter = () => { anim.playbackRate = 0 }
      leave = () => { anim.playbackRate = 1 }
      host.addEventListener('pointerenter', enter)
      host.addEventListener('pointerleave', leave)
    }
    return () => {
      anim.cancel()
      if (host && enter) { host.removeEventListener('pointerenter', enter); host.removeEventListener('pointerleave', leave) }
    }
  }, [reduced])

  if (empty) return null

  const Seq = ({ clone }) => (
    <div className="ff-mq-seq" aria-hidden={clone || undefined}>
      {PARTNERS.map((p, i) => (
        <div className="ff-mq-item" key={`${clone ? 'c' : 'b'}-${i}`}>
          <span className="ff-mq-ico"><MqIcon type={p.icon} /></span>
          <span>
            <span className="ff-mq-label">{t(`partners.${p.key}.label`)}</span>
            <span className="ff-mq-sub">{t(`partners.${p.key}.sub`)}</span>
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <section data-theme="light" className="ff-trust" aria-labelledby="ff-trust-title">
      <SectionCurve position="top" fill="#f0ebe0" />
      <PaperGrain />
      <div className="ff-trust-head">
        <p className="ff-shared-eyebrow ff-trust-eyebrow ff-reveal">{t('trust.eyebrow')}</p>
        <h2 id="ff-trust-title" className="ff-trust-title ff-reveal">
          {t('trust.title')}
        </h2>
      </div>
      <div className="ff-mq">
        <div className="ff-mq-track" ref={track} style={reduced ? { transform: 'none' } : undefined}>
          <Seq />
          {!reduced && <Seq clone />}
        </div>
      </div>
    </section>
  )
}

function Conviction() {
  const { t } = useTranslation('fulfilment')
  const q1 = t('conviction.quoteLight').split(' ')
  const q2 = t('conviction.quoteBold').split(' ')
  return (
    <section data-theme="light" className="ff-conv" aria-labelledby="ff-conv-title">
      <SectionCurve position="top" fill="#fdfaf4" />
      <PaperGrain />
      <div className="ff-conv-inner">
        <p className="ff-shared-eyebrow ff-conv-eyebrow ff-reveal">{t('conviction.eyebrow')}</p>
        <h2 id="ff-conv-title" className="ff-conv-quote ff-reveal">
          {q1.map((w, i) => <span className="ff-cw ff-cw-light" key={`a${i}`}>{w}</span>)}
          {q2.map((w, i) => <span className="ff-cw ff-cw-bold" key={`b${i}`}>{w}</span>)}
        </h2>
        <div className="ff-cards">
          {CARDS.map((c) => (
            <article className="ff-card ff-reveal" key={c.n}>
              <div className="ff-card-media" style={{ backgroundImage: `url(${c.src})` }} aria-hidden="true" />
              <div className="ff-card-scrim" aria-hidden="true" />
              <div className="ff-card-body">
                <span className="ff-card-index">{c.n}</span>
                <h3 className="ff-card-name">{t(`cards.${c.n}.name`)}</h3>
                <p className="ff-card-text">{t(`cards.${c.n}.text`)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ValueGrid() {
  const { t } = useTranslation('fulfilment')
  return (
    <section data-theme="dark" className="ff-value" aria-labelledby="ff-value-title">
      <SectionCurve position="top" fill="#fdfaf4" inward />
      <DotField tone="navy" />
      <div className="ff-value-inner">
        <p className="ff-shared-eyebrow ff-value-eyebrow ff-reveal">{t('value.eyebrow')}</p>
        <h2 id="ff-value-title" className="ff-value-title ff-reveal">
          {t('value.title')}
        </h2>
        <div className="ff-value-grid">
          {VALUES.map((v) => {
            const unit = t(`values.${v.icon}.unit`, { defaultValue: '' })
            return (
              <div className="ff-vi ff-reveal" key={v.icon}>
                <span className="ff-vi-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24">{VIcon[v.icon]}</svg>
                </span>
                <div className="ff-vi-num">
                  {v.hasWord ? (
                    <span>{t(`values.${v.icon}.word`)}</span>
                  ) : (
                    <CountUp value={v.num} suffix={v.suffix || ''} grouping={!!v.grouping} duration={1400} />
                  )}
                  {unit && <span className="ff-vi-unit">{unit}</span>}
                </div>
                <p className="ff-vi-label">{t(`values.${v.icon}.label`)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FeatureRow({ f, i }) {
  const { t } = useTranslation('fulfilment')
  const [open, setOpen] = useState(false)
  const rev = i % 2 === 1
  const title = t(`features.${f.n}.title`)
  return (
    <div className={`ff-feat ff-reveal ${rev ? 'ff-feat--rev' : ''}`}>
      <div className="ff-feat-media" style={{ backgroundImage: `url(${f.src})` }}>
        <span className="ff-feat-index">{f.n}</span>
      </div>
      <div className="ff-feat-copy">
        <p className="ff-shared-eyebrow ff-feat-eyebrow">{t(`features.${f.n}.eyebrow`)}</p>
        <h3 className="ff-feat-title">{title}</h3>
        <p className="ff-feat-body">{t(`features.${f.n}.body`)}</p>
        <button
          type="button"
          className="ff-feat-more"
          aria-expanded={open}
          aria-controls={`ff-panel-${f.n}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('feature.showLess') : t('feature.learnMore')}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
        <div id={`ff-panel-${f.n}`} className={`ff-feat-panel ${open ? 'is-open' : ''}`} role="region" aria-label={t('feature.panelLabel', { title })}>
          <div><p>{t(`features.${f.n}.more`)}</p></div>
        </div>
      </div>
    </div>
  )
}

function Features() {
  const { t } = useTranslation('fulfilment')
  return (
    <section data-theme="light" className="ff-features" aria-label={t('sections.featuresLabel')}>
      <SectionCurve position="top" fill="#fdfaf4" />
      <PaperGrain />
      <div className="ff-features-inner">
        {FEATURES.map((f, i) => <FeatureRow key={f.n} f={f} i={i} />)}
      </div>
    </section>
  )
}

function Journey() {
  const { t } = useTranslation('fulfilment')
  return (
    <section data-theme="dark" className="ff-journey" aria-labelledby="ff-journey-title">
      <SectionCurve position="top" fill="#fdfaf4" inward />
      <div className="ff-journey-media" style={{ backgroundImage: `url(${BASE}/journey.webp)` }} aria-hidden="true" />
      <div className="ff-journey-scrim" aria-hidden="true" />
      <div className="ff-journey-inner">
        <p className="ff-shared-eyebrow ff-journey-eyebrow ff-reveal">{t('journey.eyebrow')}</p>
        <h2 id="ff-journey-title" className="ff-journey-title ff-reveal">
          {t('journey.title')}
        </h2>
        <div className="ff-stages">
          {STAGES.map((s) => (
            <div className="ff-stage ff-reveal" key={s.n}>
              <span className="ff-stage-num">{s.n}</span>
              <p className="ff-stage-verb">{t(`stages.${s.n}.verb`)}</p>
              <p className="ff-stage-word">{t(`stages.${s.n}.word`)}</p>
              <p className="ff-stage-line">{t(`stages.${s.n}.line`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  const { t } = useTranslation('fulfilment')
  return (
    <section data-theme="light" className="ff-cta" aria-labelledby="ff-cta-title">
      <SectionCurve position="top" fill="#f0ebe0" />
      <PaperGrain />
      <p className="ff-shared-eyebrow ff-cta-eyebrow ff-reveal">{t('cta.eyebrow')}</p>
      <h2 id="ff-cta-title" className="ff-cta-title ff-reveal">{t('cta.title')}</h2>
      <p className="ff-cta-sub ff-reveal">
        {t('cta.sub')}
      </p>
      <Link to="/contact" className="ff-cta-pill ff-reveal">
        {t('cta.pill')}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </section>
  )
}

export default function Fulfilment() {
  const { t } = useTranslation('fulfilment')
  const root = useRef(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // generic reveal — every .ff-reveal rises in when its section enters
      gsap.utils.toArray('.ff-reveal').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 22 })
        gsap.to(el, {
          autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      // stroke-draw the value-grid icons as the grid enters
      const draws = gsap.utils.toArray('.ff-vi-draw')
      if (draws.length) {
        gsap.set(draws, { strokeDasharray: 1, strokeDashoffset: 1 })
        gsap.to(draws, {
          strokeDashoffset: 0, duration: 1.1, ease: 'power1.inOut', stagger: 0.05,
          scrollTrigger: { trigger: '.ff-value-grid', start: 'top 78%', once: true },
        })
      }
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.fulfilment'), item: 'https://www.quarterfoldltd.com/fulfilment' },
    ],
  }

  return (
    <main id="main" ref={root}>
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />
      <Hero />
      <TrustMarquee reduced={reduced} />
      <Conviction />
      <ValueGrid />
      <Features />
      <Journey />
      <CTA />
    </main>
  )
}
