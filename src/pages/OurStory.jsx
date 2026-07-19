import { useTranslation, Trans } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import './OurStory.css'

// ── /about — "Our Story", definitive compact rebuild ─────────────────────────
// Hero(band) → Journey(timeline) → MVV manifesto → Team(8) + founder block.
// The page closes on SiteLayout's global "Request a Quote" CTA band (the existing
// site pattern) — no page-local closing is added, which would only duplicate it.
// Anatomy borrows YOO Interior's about page (serif accent, offset statement,
// team-card grid) but the SCALE comes DOWN per the client: a page-opening navy
// BAND (~58vh), not a full-viewport takeover; statements capped; paddings tight.
//
// Signature: every empty asset frame wears opposite-corner registration
// brackets (gold hairline crop marks) — a book printer's own vernacular. It
// turns "awaiting client photo" into an intentional printer's-plate, not a
// broken image. Every user-facing string resolves from ourStory.json verbatim;
// the empty team shells carry NO invented copy — only skeleton rules.

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

      {/* SECTION 1 ── HERO BAND — flat #0e1b46, ~58vh, left-aligned column.
          "ABOUT US" is the decorative display (aria-hidden, word-stagger);
          hero.title is the page's single H1. ──────────────────────────────── */}
      <section data-theme="dark" className="ab-hero" aria-labelledby="about-h1">
        <div className="ab-wrap ab-hero-inner">
          <p className="ab-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
          <p className="ab-hero-display" data-textreveal aria-hidden="true">{t('hero.display')}</p>
          {/* data-reveal (whole-element), NOT data-textreveal: alive.js word-
              splitting mutates the DOM and fights React on language switch,
              which garbles the <Trans> accent. Fading the whole H1 keeps React
              in sole control so locales swap cleanly. */}
          <h1 id="about-h1" className="ab-hero-title" data-reveal>
            <Trans t={t} i18nKey="hero.title" components={{ em: <em className="ab-serif" /> }} />
          </h1>
          <p className="ab-hero-lede" data-reveal>{t('hero.lede')}</p>
        </div>
      </section>

      {/* SECTIONS 2 ── JOURNEY intro + interactive timeline (cream) ──────────── */}
      <Timeline stops={timelineStops} />

      {/* SECTION 3 ── MVV MANIFESTO — flat navy band, curves top+bottom ──────── */}
      <section data-theme="dark" className="ab-mvv" aria-label={t('mission.label')}>
        <SectionCurve position="top" fill="var(--cream)" inward />
        <div className="ab-mvv-inner">
          {['mission', 'vision', 'values'].map((k) => (
            <div className="ab-beat" key={k}>
              <p className="ab-beat-label" data-reveal>{t(`${k}.label`)}</p>
              <p className="ab-beat-text" data-textreveal>{t(`${k}.desc`)}</p>
            </div>
          ))}
        </div>
        <SectionCurve position="bottom" fill="var(--cream)" inward />
      </section>

      {/* SECTION 4 ── TEAM — cream, YOO team-card anatomy, 8 cards.
          Section eyebrow = founder.eyebrow (no single-word team key exists; NO
          invented heading word). Card 1 = Nilesh (real). Cards 2–8 = quiet
          empty shells: bracketed frame + skeleton rules, awaiting client assets.
          Nilesh's bio + pull quote sit as an editorial block below the grid. */}
      <section data-theme="light" className="ab-team" aria-labelledby="ab-team-eyebrow">
        <PaperGrain />
        <div className="ab-wrap">
          <p id="ab-team-eyebrow" className="ab-eyebrow--cream" data-reveal>{t('founder.eyebrow')}</p>
          <hr className="ab-rule" data-reveal aria-hidden="true" />

          <div className="ab-team-grid">
            {Array.from({ length: 8 }).map((_, i) =>
              i === 0 ? (
                <article className="ab-card" data-reveal key="founder">
                  <div className="ab-frame" data-slot="team-0" />
                  <h2 className="ab-card-name">{t('founder.name')}</h2>
                  <hr className="ab-card-hair" aria-hidden="true" />
                  <p className="ab-card-role"><b>Role</b><i aria-hidden="true" />{t('founder.role')}</p>
                </article>
              ) : (
                // Empty shell — structurally present, visually quiet, no copy.
                <article className="ab-card ab-card--empty" data-reveal key={i} aria-hidden="true">
                  <div className="ab-frame" data-slot={`team-${i}`} />
                  <span className="ab-skel ab-skel--name" />
                  <hr className="ab-card-hair" />
                  <span className="ab-skel ab-skel--role" />
                </article>
              )
            )}
          </div>

          {/* Founder editorial block — quote left, bio right (restrained scale) */}
          <div className="ab-founder-note">
            <blockquote className="ab-quote" data-reveal>
              {t('founder.quote')}
              <cite className="ab-attr">— {t('founder.attribution')}</cite>
            </blockquote>
            <p className="ab-bio" data-reveal>{t('founder.bio')}</p>
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
    <section data-theme="light" className="ab-journey" ref={sectionRef} aria-label={t('timeline.eyebrow')}>
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

          {/* empty frame — bracketed, no label text (data-slot for asset drop) */}
          <div className="ab-frame ab-tl-media" data-slot={`timeline-${activeIdx}`} aria-hidden="true" />

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
          <div className="ab-frame ab-tl-media" data-slot={`timeline-m-${activeIdx}`} aria-hidden="true" />
          <Content />
        </div>
      </div>
    </section>
  )
}
