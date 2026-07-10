import { useEffect, useLayoutEffect, useRef } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain, WavyBackground } from '@/components/atmosphere'
import LightRays from '@/components/LightRays'
import { prefersReduced } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'

gsap.registerPlugin(ScrollTrigger)

// ── /educational-books ───────────────────────────────────────────────────────
// QFP's flagship credibility page. Re-themed toward /infrastructure's confident
// dark language: a navy statement hero (wave atmosphere · gold DM-Mono eyebrow ·
// mixed cream/gold H1 · dual CTA · single giant foil stat) opens the page, then a
// light 4-step process, a navy impact roll, and a warm CTA. Two hero stickers
// (plane + bookstack) survive from the old marimba hero as living accents.
// Motion is GSAP + a light pointer-parallax; everything freezes under reduced
// motion. This route is native-scroll (Lenis lives only on "/").

// Small stroke-draw line icons, authored so getTotalLength() can drive a draw-on.
let _k = 0
const P = (d) => <path key={`p${_k++}`} className="edu-draw" d={d} />
const C = (cx, cy, r) => <circle key={`c${_k++}`} className="edu-draw" cx={cx} cy={cy} r={r} />

// process step icons (24×24)
const STEP_ICONS = {
  tender: [P('M8 4h8a1.5 1.5 0 0 1 1.5 1.5V20l-2.5-1.6L12.5 20 10 18.4 7.5 20V5.5A1.5 1.5 0 0 1 8 4Z'), P('M9.5 8.5h5'), P('M9.5 12h5')],
  print: [P('M7.5 8.5V4h9v4.5'), P('M6 8.5h12a2 2 0 0 1 2 2V15a1.5 1.5 0 0 1-1.5 1.5H16'), P('M7.5 13.5h9V20h-9Z'), C(17.4, 11.2, 0.6)],
  export: [P('M3.5 8.5h9v8h-9Z'), P('M12.5 11h3.6l3.4 3.1v2.4h-7'), C(7, 18.5, 1.7), C(16.6, 18.5, 1.7), P('M12.5 6.2l2-2 2 2')],
  classroom: [P('M4 20V9.5L12 5l8 4.5V20'), P('M2.6 20h18.8'), P('M9.5 20v-5h5v5'), C(12, 10.4, 1.4)],
}

// name/desc resolved via t(`process.steps.<icon>.…`); icon key doubles as the i18n key.
const STEPS = [
  { n: '01', icon: 'tender' },
  { n: '02', icon: 'print' },
  { n: '03', icon: 'export' },
  { n: '04', icon: 'classroom' },
]

// Africa programme footprint (educational-books.md) + ministry milestone figures
// (homepage.md). No client corporate names anywhere on this page.
// `figureSafe` neutralises the named programme (UBEC / World Bank / USAID) when
// SHOW_MINISTRY_NAMES is off — the country tile stays, only the programme name
// drops, so the grid keeps its shape.
// name resolved via t(`impact.countries.<id>`); figures via t(`impact.figures.<figure>`).
// `figureSafe` names the compliance-neutralised figure key (used when SHOW_MINISTRY_NAMES
// is off); the country tile stays either way so the grid keeps its shape.
const COUNTRIES = [
  { id: 'tanzania', figure: 'tanzania', key: true },
  { id: 'ghana', figure: 'ghana', figureSafe: 'ghanaSafe', key: true },
  { id: 'nigeria', figure: 'nigeria', figureSafe: 'nigeriaSafe', key: true },
  { id: 'ivoryCoast', figure: 'ivoryCoast', key: true },
  { id: 'drCongo', figure: 'drCongo', key: true },
  { id: 'senegal', figure: 'nationalProgramme' },
  { id: 'cameroon', figure: 'nationalProgramme' },
  { id: 'benin', figure: 'nationalProgramme' },
  { id: 'uganda', figure: 'nationalProgramme' },
  { id: 'ethiopia', figure: 'nationalProgramme' },
]

// The two surviving hero stickers (plane + bookstack) — living accents over the
// navy hero, hugging opposite corners so they clear the copy + foil-stat columns.
// vw/vh anchored, translate-centred. depth = pointer-parallax factor.
const FLOATS = [
  { src: '/qfp/hero/qfp-prop-plane.webp', w: 96, top: '19%', left: '90%', depth: 2.4, bob: 'edu-bob-r', dur: 7 },
  { src: '/qfp/hero/qfp-prop-bookstack.webp', w: 128, top: '85%', left: '8%', depth: 1.6, bob: 'edu-bob', dur: 8 },
]

function GoldSeal() {
  return (
    <span className="edu-awards-seal" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="6" /><path d="M8.5 15.5 7 21l5-2.4L17 21l-1.5-5.5" />
      </svg>
    </span>
  )
}

export default function EducationalBooks() {
  const { t } = useTranslation('educationalBooks')
  const reduced = prefersReduced()
  const root = useRef(null)
  const heroRef = useRef(null)

  // ── SEO: title, meta description, BreadcrumbList JSON-LD ──
  useEffect(() => {
    const prevTitle = document.title
    document.title = t('seo.title')
    const meta = document.querySelector('meta[name="description"]')
    const prevDesc = meta?.getAttribute('content')
    if (meta) meta.setAttribute('content', t('seo.description'))

    const ld = document.createElement('script')
    ld.type = 'application/ld+json'
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: 'https://www.quarterfoldltd.com/' },
        { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: 'https://www.quarterfoldltd.com/educational-books' },
      ],
    })
    document.head.appendChild(ld)
    return () => {
      document.title = prevTitle
      if (meta && prevDesc != null) meta.setAttribute('content', prevDesc)
      ld.remove()
    }
  }, [t])

  // ── Pointer parallax on the hero stickers (rAF-throttled, reduced-motion off) ──
  useEffect(() => {
    if (reduced) return
    const hero = heroRef.current
    if (!hero) return
    const floats = [...hero.querySelectorAll('.edu-float')]
    let raf = 0, tx = 0, ty = 0
    const onMove = (e) => {
      const r = hero.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const apply = () => {
      raf = 0
      floats.forEach((el) => {
        const d = parseFloat(el.dataset.depth || '2')
        el.style.transform = `translate3d(${(-tx * d * 8).toFixed(2)}px, ${(-ty * d * 8).toFixed(2)}px, 0)`
      })
    }
    hero.addEventListener('pointermove', onMove)
    return () => { hero.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf) }
  }, [reduced])

  // ── GSAP: process stroke-draw ──
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      // process icons: measure + set fully undrawn, then draw when each card enters
      const cards = [...el.querySelectorAll('.edu-proc-card')]
      cards.forEach((card) => {
        const draws = [...card.querySelectorAll('.edu-draw')]
        draws.forEach((p) => {
          const L = p.getTotalLength?.() || 0
          if (!L) return
          if (reduced) { gsap.set(p, { strokeDasharray: 'none', strokeDashoffset: 0 }); return }
          gsap.set(p, { strokeDasharray: L, strokeDashoffset: L })
        })
        if (reduced) return
        gsap.to(card.querySelectorAll('.edu-draw'), {
          strokeDashoffset: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08,
          scrollTrigger: { trigger: card, start: 'top 82%', once: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const renderFloat = (f, i) => (
    <div key={i} className="edu-float" data-depth={f.depth} style={{ top: f.top, left: f.left, transform: 'translate(-50%,-50%)' }}>
      <div className="edu-float-inner" style={reduced ? undefined : { animation: `${f.bob} ${f.dur}s ease-in-out infinite` }}>
        <img src={f.src} alt="" aria-hidden="true" style={{ width: f.w }} draggable="false" />
      </div>
    </div>
  )

  return (
    <main id="main" ref={root}>
      {/* ── 1. HERO — /infrastructure anatomy, navy ── */}
      <section ref={heroRef} data-theme="dark" className="edu-hero" aria-labelledby="edu-h1">
        <WavyBackground className="edu-hero-waves" />
        <div className="edu-hero-beam" aria-hidden="true" />

        {FLOATS.map(renderFloat)}

        <div className="edu-hero-inner edu-hero-grid relative z-10">
          <div className="edu-hero-copy">
            <p className="edu-hero-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
            <h1 id="edu-h1" className="edu-h1" data-textreveal>
              <Trans t={t} i18nKey="hero.title" components={{ 1: <span className="edu-h1-accent" /> }} />
            </h1>
            <p className="edu-hero-sub" data-reveal>
              {t('hero.sub')}
            </p>
            <div className="edu-hero-ctas" data-reveal>
              <Link to="/contact" className="edu-btn edu-btn--gold">{t('hero.ctaPrimary')}</Link>
              <a href="#impact" className="edu-btn edu-btn--ghost">
                {t('hero.ctaSecondary')}
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
              </a>
            </div>
          </div>

          {/* single foil moment on the page — the flagship stat */}
          <div className="edu-hero-stat" aria-label={t('hero.statAria')}>
            <span className="edu-hero-foil" aria-hidden="true">25M</span>
            <span className="edu-hero-stat-unit">{t('hero.statUnit')}</span>
            <span className="edu-hero-stat-foot">{t('hero.statFoot')}</span>
          </div>
        </div>
      </section>

      {/* ── 3. PROCESS ── */}
      <section id="process" data-theme="light" className="edu-proc relative overflow-hidden" aria-labelledby="edu-proc-title">
        <SectionCurve position="top" fill="#f0ebe0" />
        <PaperGrain />
        <div className="edu-proc-inner relative z-10">
          <p className="edu-proc-eyebrow">{t('process.eyebrow')}</p>
          <h2 id="edu-proc-title" className="edu-proc-title">{t('process.title')}</h2>
          <div className="edu-proc-grid">
            {STEPS.map((s) => (
              <article className="edu-proc-card" key={s.n}>
                <span className="edu-proc-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">{STEP_ICONS[s.icon]}</svg>
                </span>
                <span className="edu-proc-step">{s.n}</span>
                <div>
                  <h3 className="edu-proc-name">{t(`process.steps.${s.icon}.name`)}</h3>
                  <p className="edu-proc-desc">{t(`process.steps.${s.icon}.desc`)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. IMPACT BAND (navy) ── */}
      <section id="impact" data-theme="dark" className="edu-impact relative overflow-hidden" aria-labelledby="edu-impact-title">
        {/* LIGHT RAYS — the impact band's single signature effect (supersedes the
            generic wavy canvas): gold light from above over the reach/impact roll.
            Sole WebGL here; top-center, low-sat, slight noise, no pulse. */}
        <LightRays className="edu-impact-rays" rayLength={1.6} lightSpread={0.85} />
        <SectionCurve position="top" fill="#f0ebe0" />
        <div className="edu-impact-inner relative z-10">
          <div className="edu-impact-head">
            <div data-reveal>
              <p className="edu-impact-eyebrow">{t('impact.eyebrow')}</p>
              <h2 id="edu-impact-title" className="edu-impact-title">{t('impact.title')}</h2>
            </div>
            <p className="edu-impact-lede" data-reveal>
              {t('impact.lede')}
            </p>
          </div>

          <div className="edu-countries">
            {COUNTRIES.map((c) => (
              <div className="edu-country" key={c.id} data-reveal>
                <div className="edu-country-name">{t(`impact.countries.${c.id}`)}</div>
                <div className={`edu-country-figure${c.key ? '' : ' muted'}`}>{t(`impact.figures.${SHOW_MINISTRY_NAMES ? c.figure : (c.figureSafe || c.figure)}`)}</div>
              </div>
            ))}
          </div>

          <p className="edu-awards" data-reveal>
            <GoldSeal />
            <span><Trans t={t} i18nKey="impact.awards" components={{ 1: <b /> }} /></span>
          </p>
        </div>
      </section>

      {/* ── 5. CTA (beige) ── */}
      <section data-theme="light" className="edu-cta relative overflow-hidden" aria-labelledby="edu-cta-title">
        <SectionCurve position="top" fill="#f0ebe0" />
        <PaperGrain />
        <h2 id="edu-cta-title" className="edu-cta-title relative z-10" data-textreveal>{t('cta.title')}</h2>
        <p className="edu-cta-sub relative z-10" data-reveal>
          {t('cta.sub')}
        </p>
        <Link to="/contact" className="edu-cta-pill relative z-10" data-reveal>
          {t('cta.btn')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5 7 7-7 7" /></svg>
        </Link>
      </section>
    </main>
  )
}
