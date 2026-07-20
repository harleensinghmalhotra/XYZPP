import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef, useMemo } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
// Company-wide credentials — imported verbatim from the homepage sections so the
// content, markup, CSS (global, in index.css) and behaviour stay in exact sync.
// No homepage files are modified; tokens resolve to the inner-page palette.
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
import './OurStory.css'

// MOCK — replace with client photography. Raw Pexels photos (free license), one
// per era, object-fit cover in the timeline media frame. No filters/overlays/tints.
import mock1 from '@/assets/mock/timeline-mock-1.jpg'
import mock2 from '@/assets/mock/timeline-mock-2.jpg'
import mock3 from '@/assets/mock/timeline-mock-3.jpg'
import mock4 from '@/assets/mock/timeline-mock-4.jpg'
import mock5 from '@/assets/mock/timeline-mock-5.jpg'
const TIMELINE_MOCKS = [mock1, mock2, mock3, mock4, mock5]   // MOCK — replace with client photography

// ── /about — "Our Story", the definitive craft pass ──────────────────────────
// Hero band (~74vh) → THE JOURNEY (Union-Properties three-zone timeline) → INK
// SPREADS (MVV, three navy spines split by drawn gold hairlines — indices AND
// ghost numerals removed) → THE FOUNDER (Tequila editorial spread: fitted 3:4
// portrait LEFT, all copy + ink-in pull quote in the RIGHT column) → MARQUEE
// ribbon → THE TEAM (homepage-scale shells). One continuous gold spine thread
// draws down the page by scroll progress.
//
// Every user-facing string resolves from ourStory.json verbatim (zero invented
// copy). Every motion is transform/opacity (plus two sanctioned exceptions: the
// eyebrow letter-spacing settle and the MVV rule extend) and every mechanic has
// an explicit prefers-reduced-motion resting state.

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

      {/* One continuous gold thread down the page spine — scaleY by scroll. */}
      <Spine />

      {/* SECTION 1 ── HERO BAND — the ORIGINAL homepage display headline, recreated.
          A full-width navy top containing ONLY the staggered two-line hero text:
          "Powering Global Education" (line 1, big bold cream) over "Through Print
          Excellence" (line 2, smaller, wide-tracked gold) — the exact type treatment
          from the git-history homepage hero (commit ba7b134). No eyebrow, no "ABOUT
          US" display, no subline. The two visible lines carry the page's single H1;
          the lede has moved down to lead the JOURNEY section. */}
      <section data-theme="dark" className="ab-hero" aria-labelledby="about-h1">
        <div className="ab-wrap ab-hero-inner">
          <h1 id="about-h1" className="ab-hero-headline" data-reveal>
            <span className="ab-hl-1">{t('hero.titleLine1')}</span>
            <span className="ab-hl-2">{t('hero.titleLine2')}</span>
          </h1>
        </div>
      </section>

      {/* SECTION 2 ── OUR STORY LEDE — the "OUR STORY" eyebrow (gold→orange) over
          the lede paragraph, leading the reader into the journey below. */}
      <section data-theme="light" className="ab-lede" aria-labelledby="ab-lede-eyebrow">
        <PaperGrain />
        <div className="ab-wrap">
          <p id="ab-lede-eyebrow" className="ab-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
          <p className="ab-lede-text" data-reveal>{t('hero.lede')}</p>
        </div>
      </section>

      {/* SECTION 3 ── THE JOURNEY — pure vertical-scroll timeline (no interaction) */}
      <Timeline stops={timelineStops} />

      {/* SECTION 3 ── INK SPREADS — MVV, three navy spines + drawn gold hairlines */}
      <InkSpreads />

      {/* SECTION 4 ── THE FOUNDER — Tequila spread + ink-in pull quote ────────── */}
      <Founder />

      {/* Ribbon between the founder and the people who keep his promise. */}
      <AboutMarquee />

      {/* SECTION 5 ── THE TEAM — full roster, one grid, everyone shown ────────── */}
      <Team />

      {/* SECTION 6 & 7 ── AWARDS + CERTIFICATES — company-wide credentials,
          imported from the homepage sections (Awards navy → Certs cream dome).
          The closing CTA is appended by the site layout after <main>. */}
      <Awards />
      <Certifications />
    </main>
  )
}

// ── Spine — one gold thread pinned to the page's left edge, drawn top→down by
// scroll progress (scaleY). Reduced-motion: full-height, static. ───────────────
function Spine() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) { el.style.transform = 'scaleY(1)'; return }
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 1
      el.style.transform = `scaleY(${p.toFixed(4)})`
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])
  return <span ref={ref} className="ab-spine" aria-hidden="true" />
}

// ── THE JOURNEY — pure vertical-scroll timeline ───────────────────────────────
// Every stop is a card stacked vertically; the reader scrolls through all of them
// with ZERO interaction. No click-nav, no prev/next arrows, no year rail, no giant
// ghost year numerals, no rail gold line — all deleted. Inside each card: a small
// gold→orange accent line + the year (DM Mono) sit ABOVE the title, then the body
// and the existing era imagery. Cards alternate the media side for rhythm and
// reveal subtly on scroll (shared [data-reveal] system); reduced-motion rests them
// visible. Below 900px each card stacks to a single column (media over copy).
function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')
  return (
    <section data-theme="light" className="tls" aria-label={t('timeline.eyebrow')}>
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow tls-eyebrow" data-reveal>{t('timeline.eyebrow')}</p>
        <ol className="tls-list">
          {stops.map((s, i) => (
            <li className={`tls-card${i % 2 ? ' tls-card--flip' : ''}`} data-reveal key={i}>
              {/* CARD MEDIA — existing era mock (raw photo, awaiting client asset) */}
              <div className="tls-media-zone">
                <div className="ab-frame tls-media" data-slot={`timeline-${i}`} aria-hidden="true">
                  {TIMELINE_MOCKS[i] && (
                    <img className="tls-media-img" src={TIMELINE_MOCKS[i]} alt="" loading="lazy" decoding="async" />
                  )}
                </div>
              </div>

              {/* CARD COPY — accent line + year (DM Mono) above the title, then body */}
              <div className="tls-copy">
                <p className="tls-year">
                  <span className="tls-year-line" aria-hidden="true" />
                  {s.year}
                </p>
                <h3 className="tls-title">{s.title}</h3>
                <p className="tls-body">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ── MVV — ONE-SCREEN TRIPTYCH ─────────────────────────────────────────────────
// One continuous flat navy band (curves top/bottom per bible), folded into three
// vertical spines — MISSION | VISION | VALUES — split by two drawn gold hairlines.
// The 01/02/03 indices and the huge ghost numerals are BOTH removed; a small gold
// chapter-tick draws above each label to hold the vertical rhythm. Each column:
// tick → Inter-Tight cream label → a gold rule (draws on reveal, extends on hover)
// → the statement. On scroll-in the columns reveal in stagger (hairline draws
// down, then content fades up); under reduced-motion everything rests visible.
function InkSpreads() {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const sectionRef = useRef(null)
  const beats = ['mission', 'vision', 'values']

  // reveal once, when the band crosses into view — CSS carries the stagger.
  useEffect(() => {
    if (reduced) return
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() } },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className={`mvv${reduced ? ' is-in' : ''}`}
      aria-label={t('mission.label')}
    >
      <SectionCurve position="top" fill="var(--cream)" inward />
      <div className="mvv-inner">
        <div className="mvv-triptych">
          {beats.map((key, i) => (
            <div className="mvv-col" key={key} style={{ '--col-i': i }}>
              <div className="mvv-col-body">
                <span className="mvv-tick" aria-hidden="true" />
                <p className="mvv-label">{t(`${key}.label`)}</p>
                <span className="mvv-rule" aria-hidden="true" />
                <p className="mvv-text">{t(`${key}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SectionCurve position="bottom" fill="var(--cream)" inward />
    </section>
  )
}

// ── THE FOUNDER — Tequila editorial spread ────────────────────────────────────
// Fitted 3:4 portrait frame LEFT (gold offset-rule behind it), and EVERYTHING
// else in the RIGHT column: eyebrow kicker, name (word-mask rise), role micro-
// label, bio, then the ink-in pull quote + attribution stacked under the bio.
function Founder() {
  const { t } = useTranslation('ourStory')
  return (
    <section data-theme="light" className="fnd" aria-labelledby="fnd-name">
      <PaperGrain />
      <div className="ab-wrap">
        <div className="fnd-spread">
          <div className="fnd-portrait-wrap" data-reveal>
            <span className="fnd-offset" aria-hidden="true" />
            <div className="ab-frame fnd-portrait" data-slot="founder-portrait" aria-hidden="true" />
          </div>
          <div className="fnd-copy">
            <p className="ab-eyebrow--cream fnd-kicker" data-reveal>{t('founder.eyebrow')}</p>
            <MaskText as="h2" id="fnd-name" className="fnd-name" text={t('founder.name')} />
            <p className="fnd-role" data-reveal><b>Role</b><i aria-hidden="true" />{t('founder.role')}</p>
            <p className="fnd-bio" data-reveal>{t('founder.bio')}</p>
            <InkQuote text={t('founder.quote')} attribution={t('founder.attribution')} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ── MARQUEE — a slow gold ribbon of the page's own eyebrow, "OUR STORY",
// repeating on a thin navy band between the founder and the team. Chosen because
// it is the shortest brand-owned string in the locale and it frames the whole
// chapter without repeating the pull quote directly above it. translateX loop,
// edge-faded; paused + static under reduced-motion. ────────────────────────────
function AboutMarquee() {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const word = t('hero.eyebrow')
  const run = (key) => (
    <div className="ab-marquee-run" key={key}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span className="ab-marquee-item" key={i}>
          <span className="ab-marquee-word">{word}</span>
          <span className="ab-marquee-sep" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
  return (
    <div className="ab-marquee" data-theme="dark" aria-hidden="true">
      <div className={`ab-marquee-track${reduced ? ' is-static' : ''}`}>
        {run('a')}
        {run('b')}
      </div>
    </div>
  )
}

// ── THE TEAM — full roster, one grid, everyone shown ──────────────────────────
// One unified grid of 8 identical YOO cards: a fitted 3:4 portrait frame, a name
// line, a thin hairline divider, then a DM Mono 11px "ROLE" / value micro-label
// pair. Card 1 is Nilesh's team presence (real name + role from existing strings);
// cards 2-8 are shells (skeleton name, "ROLE" + empty value) awaiting client
// portraits — no tiering, no expand, no "rest of us" button. 4×2 at 1536, homepage
// card scale, tight gaps. Cascade in at 60ms; hover warms the divider gold, lifts
// the card -4px, and scale-ins the future photo (inert while the frame is empty).
//
// Header: no ourStory key names a team/people section, so the section's YOO-style
// statement reuses the only existing purpose-built team heading in the locale set,
// globalMarkets.teamSection.heading ("Our Global Team"), verbatim. Its companion
// `placeholder` string is a global-markets-specific stub, so there is no suitable
// supporting line — the drawn gold hairline + statement open the section.
function Team() {
  const { t } = useTranslation('ourStory')
  const { t: tg } = useTranslation('globalMarkets')
  // roster: card 1 real (existing strings), 2-8 shells.
  const roster = [
    { name: t('founder.name'), role: t('founder.role') },
    ...Array.from({ length: 7 }, () => null),
  ]
  return (
    <section data-theme="light" className="tm" aria-labelledby="tm-title">
      <PaperGrain />
      <div className="ab-wrap">
        <hr className="tm-rule" data-reveal aria-hidden="true" />
        <h2 id="tm-title" className="tm-title" data-reveal>{tg('teamSection.heading')}</h2>
        <div className="tm-grid">
          {roster.map((m, i) => (
            <article
              className={`tm-card${m ? '' : ' tm-card--shell'}`}
              data-reveal key={i}
              style={{ '--reveal-delay': `${i * 60}ms` }}
              {...(m ? {} : { 'aria-hidden': true })}
            >
              <div className="ab-frame tm-frame" data-slot={`team-${i + 1}`} />
              {m
                ? <p className="tm-name">{m.name}</p>
                : <span className="tm-nameskel" aria-hidden="true" />}
              <span className="tm-divider" aria-hidden="true" />
              <div className="tm-meta">
                <span className="tm-meta-k">ROLE</span>
                {m
                  ? <span className="tm-meta-v">{m.role}</span>
                  : <span className="tm-skel tm-skel--role" aria-hidden="true" />}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── MaskText — per-word rise from behind a mask (overflow-hidden + translateY) ──
function MaskText({ text, className = '', as: Tag = 'p', id }) {
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
    <Tag ref={ref} id={id} className={`masktext ${className}${reduced ? ' is-in' : ''}`}>
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

// ── InkQuote — words fill from a 45% ghost to full ink as the quote crosses the
// viewport centre; the attribution rides in behind a drawn gold em-dash. Reduced-
// motion: full ink, dash drawn, no scroll listener. ────────────────────────────
function InkQuote({ text, attribution }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const figRef = useRef(null)
  const words = useRef([])
  const tokens = useMemo(() => text.split(/(\s+)/), [text])

  useEffect(() => {
    const list = words.current.filter(Boolean)
    if (reduced) {
      list.forEach((el) => { el.style.opacity = '1' })
      figRef.current?.classList.add('is-seen')
      return
    }
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
        word.style.opacity = (0.45 + 0.55 * wp).toFixed(3)   // 45% ghost floor → full ink
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        figRef.current?.classList.add('is-seen')
        window.addEventListener('scroll', onScroll, { passive: true })
        update()
      } else window.removeEventListener('scroll', onScroll)
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
    <figure ref={figRef} className="fq-fig">
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
      <figcaption className="fq-cite"><span className="fq-dash" aria-hidden="true" />{attribution}</figcaption>
    </figure>
  )
}
