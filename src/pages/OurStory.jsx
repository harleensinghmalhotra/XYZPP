import { useTranslation, Trans } from 'react-i18next'
import { useState, useEffect, useRef, useMemo } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import './OurStory.css'

// ── /about — "Our Story", signature sections pass ────────────────────────────
// Hero band → THE JOURNEY (Union-Properties three-zone timeline) → INK SPREADS
// (MVV, three navy panels with a drawing thread) → THE FOUNDER (editorial spread
// + scroll ink-in quote) → THE TEAM (homepage-scale shells).
//
// The timeline is state-driven (year rail / media / content+arrows); era swaps
// animate transform+opacity only and degrade to instant under reduced-motion.
// MVV/founder/team keep their hand-rolled rAF + IntersectionObserver mechanics.
// Every user-facing string resolves from ourStory.json verbatim.

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

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

      {/* SECTION 1 ── HERO BAND — flat navy, ~58vh, left-aligned column.
          "ABOUT US" is decorative (aria-hidden, word-stagger); hero.title is the
          page's single H1. Accent word kept in Inter Tight (font law) as gold-2. */}
      <section data-theme="dark" className="ab-hero" aria-labelledby="about-h1">
        <div className="ab-wrap ab-hero-inner">
          <p className="ab-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
          <p className="ab-hero-display" data-textreveal aria-hidden="true">{t('hero.display')}</p>
          <h1 id="about-h1" className="ab-hero-title" data-reveal>
            <Trans t={t} i18nKey="hero.title" components={{ em: <em className="ab-accent" /> }} />
          </h1>
          <p className="ab-hero-lede" data-reveal>{t('hero.lede')}</p>
        </div>
      </section>

      {/* SECTION 2 ── THE JOURNEY — Union-Properties three-zone timeline ──────── */}
      <Timeline stops={timelineStops} />

      {/* SECTION 3 ── INK SPREADS — MVV, three navy panels + drawing thread ───── */}
      <InkSpreads />

      {/* SECTION 4 ── THE FOUNDER — editorial spread + ink-in pull quote ──────── */}
      <Founder />

      {/* SECTION 5 ── THE TEAM — homepage-scale shells, awaiting assets ───────── */}
      <Team />
    </main>
  )
}

// ── THE JOURNEY — Union-Properties three-zone timeline ────────────────────────
// LEFT year rail (vertical, dotted connector) · CENTER media card · RIGHT big
// year + title + body + prev/next arrows. Year click / arrows / keyboard ← →
// switch eras; the swap plays a transform+opacity out→in (instant under reduced-
// motion). Below 900px the rail becomes a horizontal scrollable strip on top.
function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const n = stops.length
  const [active, setActive] = useState(0)   // selected era (rail highlight is immediate)
  const [shown, setShown] = useState(0)     // era currently rendered in media/content
  const [phase, setPhase] = useState('in')  // 'in' | 'out'
  const sectionRef = useRef(null)
  const timer = useRef(0)

  const go = (next) => {
    const idx = clamp(next, 0, n - 1)
    if (idx === active) return
    setActive(idx)
    if (reduced) { setShown(idx); setPhase('in'); return }
    setPhase('out')                                   // fade current up + out
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { setShown(idx); setPhase('in') }, 180)   // then fade new up from below
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  // Keyboard ← → when focus sits inside the section.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const s = sectionRef.current
      if (!s || !s.contains(document.activeElement)) return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      e.preventDefault()
      go(active + (e.key === 'ArrowLeft' ? -1 : 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, reduced, n])

  const stop = stops[shown]
  const atStart = active === 0
  const atEnd = active === n - 1

  return (
    <section ref={sectionRef} data-theme="light" className="tl" aria-label={t('timeline.eyebrow')}>
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow--cream tl-eyebrow" data-reveal>{t('timeline.eyebrow')}</p>

        <div className="tl-grid">
          {/* LEFT — year rail */}
          <div className="tl-rail" role="tablist" aria-label={t('timeline.eyebrow')}>
            <span className="tl-spine" aria-hidden="true" />
            {stops.map((s, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`tl-year focus-ring${i === active ? ' is-active' : ''}`}
                onClick={() => go(i)}
              >
                <span className="tl-dot" aria-hidden="true" />
                <span className="tl-year-label">{s.year}</span>
              </button>
            ))}
          </div>

          {/* CENTER — media card (empty frame, awaiting asset) */}
          <div className="tl-media-zone">
            <div key={shown} className={`ab-frame tl-media tl-anim-${phase}`} data-slot={`timeline-${shown}`} aria-hidden="true" />
          </div>

          {/* RIGHT — content + arrows */}
          <div className="tl-content-zone">
            <div key={shown} className={`tl-content tl-anim-${phase}`}>
              <p className="tl-year-big">{stop.year}</p>
              <h3 className="tl-title">{stop.title}</h3>
              <p className="tl-body">{stop.desc}</p>
            </div>
            <div className="tl-arrows">
              <button
                type="button" className="tl-arrow focus-ring"
                onClick={() => go(active - 1)} disabled={atStart}
                aria-label={stops[Math.max(0, active - 1)].year}
              >←</button>
              <button
                type="button" className="tl-arrow focus-ring"
                onClick={() => go(active + 1)} disabled={atEnd}
                aria-label={stops[Math.min(n - 1, active + 1)].year}
              >→</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── INK SPREADS (MVV) ─────────────────────────────────────────────────────────
// One continuous navy band; each beat a near-full-viewport moment with a ghosted
// spine label. A single gold thread draws (scaleY) down the section as you scroll.
function InkSpreads() {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const sectionRef = useRef(null)
  const threadRef = useRef(null)
  const beats = ['mission', 'vision', 'values']

  useEffect(() => {
    const section = sectionRef.current
    const thread = threadRef.current
    if (!section || !thread) return
    if (reduced) { thread.style.transform = 'scaleY(1)'; return }
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const rect = section.getBoundingClientRect()
      // 0 as the band's top reaches mid-viewport, 1 as its bottom passes mid-viewport.
      const span = rect.height + vh
      const p = clamp((vh * 0.5 - rect.top) / (span - vh * 0.5), 0, 1)
      thread.style.transform = `scaleY(${p.toFixed(4)})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <section ref={sectionRef} data-theme="dark" className="mvv" aria-label={t('mission.label')}>
      <SectionCurve position="top" fill="var(--cream)" inward />
      <span ref={threadRef} className="mvv-thread" aria-hidden="true" />
      <div className="mvv-inner">
        {beats.map((k) => (
          <div className="mvv-beat" key={k}>
            <span className="mvv-ghost" aria-hidden="true">{t(`${k}.label`)}</span>
            <div className="mvv-beat-copy">
              <p className="mvv-label">{t(`${k}.label`)}</p>
              <MaskText as="p" className="mvv-text" text={t(`${k}.desc`)} />
            </div>
          </div>
        ))}
      </div>
      <SectionCurve position="bottom" fill="var(--cream)" inward />
    </section>
  )
}

// ── THE FOUNDER ───────────────────────────────────────────────────────────────
function Founder() {
  const { t } = useTranslation('ourStory')
  return (
    <section data-theme="light" className="fnd" aria-labelledby="fnd-name">
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow--cream fnd-kicker" data-reveal>{t('founder.eyebrow')}</p>
        <div className="fnd-spread">
          <div className="fnd-portrait-wrap" data-reveal>
            <span className="fnd-offset" aria-hidden="true" />
            <div className="ab-frame fnd-portrait" data-slot="founder-portrait" aria-hidden="true" />
          </div>
          <div className="fnd-copy">
            <h2 id="fnd-name" className="fnd-name" data-reveal>{t('founder.name')}</h2>
            <p className="fnd-role" data-reveal><b>Role</b><i aria-hidden="true" />{t('founder.role')}</p>
            <p className="fnd-bio" data-reveal>{t('founder.bio')}</p>
          </div>
        </div>
        <InkQuote text={t('founder.quote')} attribution={t('founder.attribution')} />
      </div>
    </section>
  )
}

// ── THE TEAM ──────────────────────────────────────────────────────────────────
// Seven quiet shells at homepage card scale (300px / r-card / soft shadow),
// awaiting client portraits. No worded heading: no ourStory key denotes a team/
// people section, and inventing copy is forbidden — per DESIGN-BIBLE's "skip when
// no suitable key exists" rule, a gold hairline provides the section's entry.
function Team() {
  return (
    <section data-theme="light" className="tm" aria-label="Team">
      <PaperGrain />
      <div className="ab-wrap">
        <hr className="tm-rule" data-reveal aria-hidden="true" />
        <div className="tm-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <article className="tm-card" data-reveal key={i} aria-hidden="true">
              <div className="ab-frame tm-frame" data-slot={`team-${i + 1}`} />
              <span className="tm-skel tm-skel--name" />
              <span className="tm-skel tm-skel--role" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── MaskText — per-word rise from behind a mask (overflow-hidden + translateY) ──
function MaskText({ text, className = '', as: Tag = 'p' }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const tokens = useMemo(() => text.split(/(\s+)/), [text])

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() } },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced, text])

  let w = -1
  return (
    <Tag ref={ref} className={`masktext ${className}${reduced ? ' is-in' : ''}`}>
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return tok
        w += 1
        return (
          <span className="mask" key={i}>
            <span className="mask-w" style={{ transitionDelay: `${Math.min(w, 16) * 42}ms` }}>{tok}</span>
          </span>
        )
      })}
    </Tag>
  )
}

// ── InkQuote — words fill from ghost to full ink as the quote crosses centre ────
function InkQuote({ text, attribution }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const words = useRef([])
  const tokens = useMemo(() => text.split(/(\s+)/), [text])

  useEffect(() => {
    const list = words.current.filter(Boolean)
    if (reduced) { list.forEach((el) => { el.style.opacity = '1' }); return }
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const r = el.getBoundingClientRect()
      // fill sweeps as the block travels from 80%→35% of the viewport height
      const p = clamp((vh * 0.8 - r.top) / (vh * 0.45), 0, 1)
      const nW = list.length
      list.forEach((word, i) => {
        const wp = clamp(p * nW - i, 0, 1)
        word.style.opacity = (0.16 + 0.84 * wp).toFixed(3)
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { window.addEventListener('scroll', onScroll, { passive: true }); update() }
      else window.removeEventListener('scroll', onScroll)
    }, { threshold: 0 })
    io.observe(el)
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced, text])

  let w = -1
  return (
    <figure className="fq-fig">
      <blockquote ref={ref} className={`fq${reduced ? ' is-in' : ''}`}>
        {tokens.map((tok, i) => {
          if (/^\s+$/.test(tok)) return tok
          w += 1
          const wi = w
          return (
            <span key={i} ref={(el) => { words.current[wi] = el }} className="fq-w">{tok}</span>
          )
        })}
      </blockquote>
      <figcaption className="fq-cite">— {attribution}</figcaption>
    </figure>
  )
}
