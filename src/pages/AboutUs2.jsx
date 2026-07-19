import { useTranslation, Trans } from 'react-i18next'
import { useRef, useEffect, useState } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import './AboutUs2.css'

// ── /about-2 — "About Us 2" ──────────────────────────────────────────────────
// A ground-up editorial about page: a studio-grade layout + scroll interactions
// rebuilt from scratch, populated with Quarterfold's own copy (ourStory namespace)
// and PLACEHOLDER image slots. Drop real photos/logos into the slots later.
// No third-party page, copy, or imagery is reproduced here.

function Slot({ label = 'Image', className = '', dark = false, ...rest }) {
  return (
    <div className={`a2-slot ${dark ? 'a2-slot--dark' : ''} ${className}`} {...rest}>
      <span>{label}</span>
    </div>
  )
}

// Scroll-linked vertical drift for [data-drift] children (transform only, rAF-
// throttled). Amplitude in px comes from the data-drift attribute; disabled under
// reduced motion so nothing moves.
function useDrift(ref) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const scope = ref.current
    const els = scope ? Array.from(scope.querySelectorAll('[data-drift]')) : []
    if (!els.length) return
    let raf = 0
    const update = () => {
      const vh = window.innerHeight
      els.forEach((el) => {
        const amp = parseFloat(el.dataset.drift) || 0
        const r = el.getBoundingClientRect()
        const p = (r.top + r.height / 2 - vh / 2) / vh // 0 at viewport centre
        el.style.transform = `translate3d(0, ${(-p * amp).toFixed(1)}px, 0)`
      })
      raf = 0
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
}

export default function AboutUs2() {
  const { t } = useTranslation('ourStory')
  const storyRef = useRef(null)
  useDrift(storyRef)
  const [showRest, setShowRest] = useState(false)

  const beats = ['mission', 'vision', 'values']
  // Lead + placeholder teammates — the founder is real copy; the rest are slots.
  const lead = { name: t('founder.name'), role: t('founder.role') }
  const restOfUs = [1, 2, 3, 4, 5]

  return (
    <main id="main" className="a2">
      <Seo title={t('seo.title')} description={t('seo.description')} />

      {/* HERO — full-bleed photo slot + navy overlay + giant word */}
      <section className="a2-hero" data-theme="dark" aria-label={t('hero.eyebrow')}>
        <Slot className="a2-hero-media" label="Hero image — drop a facility / print-floor photo" dark />
        <div className="a2-hero-inner">
          <p className="a2-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
          <p className="a2-hero-word" data-reveal>{t('hero.display')}</p>
        </div>
        <div className="a2-scroll" aria-hidden="true"><span>Scroll</span><i /></div>
      </section>

      {/* STATEMENT — offset two-column, italic-serif accent */}
      <section className="a2-statement" data-theme="light" aria-labelledby="a2-h1">
        <PaperGrain />
        <div className="a2-wrap a2-statement-grid">
          <h1 id="a2-h1" className="a2-h1" data-reveal>
            <Trans t={t} i18nKey="hero.title" components={{ em: <em className="a2-accent" /> }} />
          </h1>
          <div className="a2-side">
            <hr className="a2-rule" data-reveal aria-hidden="true" />
            <p className="a2-lede" data-reveal>{t('hero.lede')}</p>
          </div>
        </div>
      </section>

      {/* STORY — scroll-drift image/text columns */}
      <section className="a2-story" data-theme="light" ref={storyRef} aria-label={t('founder.eyebrow')}>
        <PaperGrain />
        <div className="a2-wrap a2-story-grid">
          <div className="a2-story-copy">
            <p className="a2-eyebrow--warm" data-reveal>{t('timeline.eyebrow')}</p>
            <h2 className="a2-story-h" data-reveal>
              From a single order to a <em className="a2-accent">global operation</em>
            </h2>
            <p className="a2-story-p" data-reveal>{t('founder.bio')}</p>
            <p className="a2-story-p" data-reveal>{t('hero.lede')}</p>
          </div>
          <div className="a2-story-media">
            <Slot data-drift="34" className="a2-drift" label="Story image 1 — books / bindery" />
            <Slot data-drift="-28" className="a2-drift" label="Story image 2 — press / facility" />
          </div>
        </div>
      </section>

      {/* MANIFESTO — navy band, mission / vision / values */}
      <section className="a2-mvv" data-theme="dark" aria-label={t('mission.label')}>
        <SectionCurve position="top" fill="var(--cream)" inward />
        <div className="a2-mvv-inner">
          {beats.map((k) => (
            <div className="a2-beat" data-reveal key={k}>
              <p className="a2-beat-label">{t(`${k}.label`)}</p>
              <p className="a2-beat-text">{t(`${k}.desc`)}</p>
            </div>
          ))}
        </div>
        <SectionCurve position="bottom" fill="var(--cream)" inward />
      </section>

      {/* TEAM — gallery grid + "rest of us" reveal */}
      <section className="a2-team" data-theme="light" aria-label="Team">
        <PaperGrain />
        <div className="a2-wrap">
          <div className="a2-team-head">
            <h2 className="a2-team-title" data-reveal>Team</h2>
            <p className="a2-team-sub" data-reveal>
              The people behind every <em className="a2-accent">book we print</em>.
            </p>
          </div>

          <div className="a2-team-grid">
            <article className="a2-card" data-reveal>
              <Slot label="Founder portrait" />
              <h3 className="a2-card-name">{lead.name}</h3>
              <p className="a2-card-role">{lead.role}</p>
            </article>
            {[1, 2].map((n) => (
              <article className="a2-card" data-reveal key={n}>
                <Slot label={`Leadership portrait ${n}`} />
                <h3 className="a2-card-name">Team Member</h3>
                <p className="a2-card-role">Role</p>
              </article>
            ))}
          </div>

          <div className="a2-team-more" hidden={!showRest} aria-hidden={!showRest}>
            {restOfUs.map((n) => (
              <article className="a2-card" key={n}>
                <Slot label={`Team portrait ${n}`} />
                <h3 className="a2-card-name">Team Member</h3>
                <p className="a2-card-role">Role</p>
              </article>
            ))}
          </div>

          <div className="a2-reveal-wrap">
            <button
              type="button"
              className="a2-reveal"
              aria-expanded={showRest}
              onClick={() => setShowRest((v) => !v)}
            >
              {showRest ? 'Show less' : 'Rest of us'} <i aria-hidden="true">↓</i>
            </button>
          </div>
        </div>
      </section>

      {/* CLIENTS — logo strip (slots) */}
      <section className="a2-clients" data-theme="light" aria-label="Clients">
        <PaperGrain />
        <div className="a2-wrap">
          <div className="a2-clients-head">
            <h2 className="a2-clients-title" data-reveal>References</h2>
            <p className="a2-clients-sub" data-reveal>
              Trusted by <em className="a2-accent">publishers and ministries</em> worldwide.
            </p>
          </div>
          <div className="a2-logos">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="a2-logo" key={i}><span>Logo {i + 1}</span></div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
