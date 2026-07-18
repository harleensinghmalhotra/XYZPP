import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import './OurStory.css'

// ── /about — "Our Story" v4, YOO-faithful rebuild ────────────────────────────
// Hero → Journey(timeline) → MVV manifesto → Founder. Every user-facing string
// resolves from ourStory.json verbatim; the hero title is split into two styled
// lines (titleLine1/titleLine2) that together still form the page's single H1.
// Reveals + split-text via alive.js data attributes (degrade + reduced-motion safe).

export default function OurStory() {
  const { t } = useTranslation('ourStory')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.about'), item: 'https://www.quarterfoldltd.com/about' },
    ],
  }

  const timelineStops = t('timeline.stops', { returnObjects: true })

  return (
    <main id="main">
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={breadcrumb} />

      {/* SECTION 1 ── HERO — flat #0e1b46, ~78vh, centered, two-line title ─────── */}
      <section data-theme="dark" className="ab-hero" aria-labelledby="about-h1">
        <div className="ab-hero-inner">
          <p className="ab-eyebrow" data-reveal>{t('hero.eyebrow')}</p>

          {/* Single H1 — two spans styled differently, together = the full title */}
          <h1 id="about-h1" className="ab-hero-title">
            <span className="ab-hero-l1" data-textreveal>{t('hero.titleLine1')}</span>{' '}
            <span className="ab-hero-l2" data-textreveal>{t('hero.titleLine2')}</span>
          </h1>

          <p className="ab-hero-lede" data-reveal>{t('hero.lede')}</p>
        </div>

        <div className="ab-scroll" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      {/* SECTIONS 2+3 ── JOURNEY intro + interactive timeline (cream) ─────────── */}
      <Timeline stops={timelineStops} />

      {/* SECTION 4 ── MVV MANIFESTO — flat navy band, curves top+bottom ───────── */}
      <section data-theme="dark" className="ab-mvv" aria-label={t('mission.label')}>
        <SectionCurve position="top" fill="var(--cream)" inward />
        <div className="ab-mvv-inner">
          {['mission', 'vision', 'values'].map((k) => (
            <div className="ab-beat" data-reveal key={k}>
              <p className="ab-beat-label">{t(`${k}.label`)}</p>
              <p className="ab-beat-text">{t(`${k}.desc`)}</p>
            </div>
          ))}
        </div>
        <SectionCurve position="bottom" fill="var(--cream)" inward />
      </section>

      {/* SECTION 5 ── FOUNDER — cream, YOO team-card anatomy ──────────────────── */}
      <section data-theme="light" className="ab-founder" aria-label={t('founder.name')}>
        <PaperGrain />
        <div className="ab-wrap">
          <div className="ab-founder-grid">
            {/* Left — portrait + name + hairline + role micro-label pair */}
            <div data-reveal>
              <div className="ab-portrait" data-slot="founder-portrait">
                <span className="ab-slot">Image</span>
              </div>
              <h2 className="ab-name">{t('founder.name')}</h2>
              <hr className="ab-founder-hair" aria-hidden="true" />
              <p className="ab-microlabel"><b>Role</b><i aria-hidden="true" />{t('founder.role')}</p>
            </div>

            {/* Right — eyebrow + bio + pull quote + attribution (hairlines only) */}
            <div data-reveal>
              <p className="ab-founder-eyebrow">{t('founder.eyebrow')}</p>
              <p className="ab-founder-bio">{t('founder.bio')}</p>
              <blockquote className="ab-quote">{t('founder.quote')}</blockquote>
              <p className="ab-attr">— {t('founder.attribution')}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// ── Timeline — interactive year-rail (three-zone desktop, stacked mobile) ─────
// Keeps the fixed keyboard model: the window listener is always registered and
// decides per-keystroke whether focus sits inside the section before stepping.
function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')
  const [activeIdx, setActiveIdx] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const section = sectionRef.current
      if (!section || !section.contains(document.activeElement)) return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      e.preventDefault()
      if (e.key === 'ArrowLeft') setActiveIdx((p) => Math.max(0, p - 1))
      else setActiveIdx((p) => Math.min(stops.length - 1, p + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stops.length])

  const stop = stops[activeIdx]
  const atStart = activeIdx === 0
  const atEnd = activeIdx === stops.length - 1

  const Content = () => (
    <div className="ab-tl-content" key={activeIdx}>
      <p className="ab-tl-yearbig">{stop.year}</p>
      <h3 className="ab-tl-title">{stop.title}</h3>
      <p className="ab-tl-desc">{stop.desc}</p>
      <div className="ab-arrows">
        <button type="button" className="ab-arrow" onClick={() => setActiveIdx((p) => Math.max(0, p - 1))}
          disabled={atStart} aria-label={t('timeline.eyebrow')}>←</button>
        <button type="button" className="ab-arrow" onClick={() => setActiveIdx((p) => Math.min(stops.length - 1, p + 1))}
          disabled={atEnd} aria-label={t('timeline.eyebrow')}>→</button>
      </div>
    </div>
  )

  return (
    <section data-theme="light" className="ab-journey" ref={sectionRef}>
      <PaperGrain />
      <div className="ab-wrap">
        <div data-reveal>
          <p className="ab-eyebrow--cream">{t('timeline.eyebrow')}</p>
          <hr className="ab-rule" aria-hidden="true" />
        </div>

        {/* Desktop — three zones: rail / media / content */}
        <div className="ab-tl">
          <div className="ab-tl-rail">
            <div className="ab-tl-spine" aria-hidden="true" />
            <div className="ab-tl-years">
              {stops.map((s, idx) => (
                <button key={idx} type="button" className="ab-tl-year focus-ring"
                  onClick={() => setActiveIdx(idx)} aria-current={idx === activeIdx ? 'true' : undefined}>
                  {s.year}
                </button>
              ))}
            </div>
          </div>

          <div className="ab-tl-media" data-slot={`timeline-${activeIdx}`}>
            <span className="ab-slot">Image</span>
          </div>

          <Content />
        </div>

        {/* Mobile — horizontal year strip, stacked media + content */}
        <div className="ab-tl-m">
          <div className="ab-tl-strip">
            {stops.map((s, idx) => (
              <button key={idx} type="button" className="ab-tl-chip focus-ring"
                onClick={() => setActiveIdx(idx)} aria-current={idx === activeIdx ? 'true' : undefined}>
                {s.year}
              </button>
            ))}
          </div>
          <div className="ab-tl-media" data-slot={`timeline-m-${activeIdx}`}>
            <span className="ab-slot">Image</span>
          </div>
          <Content />
        </div>
      </div>
    </section>
  )
}
