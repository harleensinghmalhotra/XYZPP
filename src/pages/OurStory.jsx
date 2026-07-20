import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { Target, Eye, Handshake } from '@phosphor-icons/react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
// Company-wide credentials — imported verbatim from the homepage sections so the
// content, markup, CSS (global, in index.css) and behaviour stay in exact sync.
// No homepage files are modified; tokens resolve to the inner-page palette.
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
import { GALLERY } from '@/assets/gallery/manifest'
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

      {/* SECTION 5 ── THE FOUNDER — corporate boardroom profile ──────────────── */}
      <Founder />

      {/* SECTION 6 ── OUR TEAM — full roster, one grid, everyone shown ────────── */}
      <Team />

      {/* SECTION 7 ── GALLERY — print-industry mock imagery, trivially swappable */}
      <Gallery />

      {/* SECTION 8 & 9 ── AWARDS + CERTIFICATES — company-wide credentials,
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

// ── THE JOURNEY — center-spine scroll-draw timeline ───────────────────────────
// A vertical line runs down the centre of the section. Its orange fill draws
// downward as the reader scrolls (scaleY on a reading-line at ~60% viewport
// height — transform-only, 60fps). Each stop has a node ON the line that turns
// orange the moment the fill reaches its card centre; the year (DM Mono) sits
// beside the node on the empty side — the year lives ONLY on the spine, never in
// the card. Cards alternate left/right of the spine; media + copy stack inside.
// Reduced-motion: fill fully drawn, every node reached, no scroll listener.
function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const listRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    const list = listRef.current
    const fill = fillRef.current
    if (!list || !fill) return
    const cards = Array.from(list.querySelectorAll('.tls-card'))
    const nodes = cards.map((c) => c.querySelector('.tls-node'))

    if (reduced) {
      fill.style.transform = 'scaleY(1)'
      nodes.forEach((nd) => nd && nd.classList.add('is-reached'))
      return
    }

    // card centres relative to the list top (layout metrics — transform-free, so
    // the [data-reveal] entrance never skews them); recomputed on resize.
    let centers = []
    const measure = () => { centers = cards.map((c) => c.offsetTop + c.offsetHeight / 2) }

    let raf = 0
    const update = () => {
      raf = 0
      const r = list.getBoundingClientRect()            // one read per frame
      const readLine = window.innerHeight * 0.6
      const drawn = clamp(readLine - r.top, 0, r.height)
      const p = r.height > 0 ? drawn / r.height : 1
      fill.style.transform = `scaleY(${p.toFixed(4)})`
      for (let k = 0; k < nodes.length; k += 1) {
        if (nodes[k]) nodes[k].classList.toggle('is-reached', drawn >= centers[k])
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    const onResize = () => { measure(); onScroll() }

    measure()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced, stops])

  return (
    <section data-theme="light" className="tls" aria-label={t('timeline.eyebrow')}>
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow tls-eyebrow" data-reveal>{t('timeline.eyebrow')}</p>
        <div className="tls-timeline">
          <div className="tls-spine" aria-hidden="true">
            <span ref={fillRef} className="tls-spine-fill" />
          </div>
          <ol className="tls-list" ref={listRef}>
            {stops.map((s, i) => (
              <li className={`tls-card ${i % 2 ? 'tls-card--right' : 'tls-card--left'}`} data-reveal key={i}>
                {/* MARKER — node on the spine + the year beside it (spine-only) */}
                <div className="tls-marker">
                  <span className="tls-node" aria-hidden="true" />
                  <span className="tls-year">{s.year}</span>
                </div>

                {/* CARD — media over copy, stacked on one side of the spine */}
                <div className="tls-card-inner">
                  <div className="tls-media-zone">
                    <div className="ab-frame tls-media" data-slot={`timeline-${i}`} aria-hidden="true">
                      {TIMELINE_MOCKS[i] && (
                        <img className="tls-media-img" src={TIMELINE_MOCKS[i]} alt="" loading="lazy" decoding="async" />
                      )}
                    </div>
                  </div>
                  <div className="tls-copy">
                    <h3 className="tls-title">{s.title}</h3>
                    <p className="tls-body">{s.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
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
  // One Phosphor LIGHT glyph per card (44px, matching the site credentials row):
  // Target → mission, Eye → vision, Handshake → values.
  const beats = [
    { key: 'mission', Icon: Target },
    { key: 'vision', Icon: Eye },
    { key: 'values', Icon: Handshake },
  ]

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
          {beats.map(({ key, Icon }, i) => (
            <div className="mvv-col" key={key} style={{ '--col-i': i }}>
              <div className="mvv-col-body">
                <span className="mvv-icon" aria-hidden="true"><Icon weight="light" size={44} /></span>
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

// ── THE FOUNDER — corporate boardroom profile ─────────────────────────────────
// A clean institutional grid: a fitted portrait LEFT, structured text RIGHT
// (descriptor kicker, name, role, narrative, then the quote in a bordered pull-
// quote block). The editorial drama is gone — no gold offset-rule behind the
// portrait, no word-mask name rise, no scroll-driven ink-fill quote. Everything
// rests plainly and reveals once: restrained, boardroom-flat, attribution kept.
function Founder() {
  const { t } = useTranslation('ourStory')
  return (
    <section data-theme="light" className="fnd" aria-labelledby="fnd-name">
      <PaperGrain />
      <div className="ab-wrap">
        <div className="fnd-spread">
          <div className="fnd-portrait-wrap" data-reveal>
            <div className="ab-frame fnd-portrait" data-slot="founder-portrait" aria-hidden="true" />
          </div>
          <div className="fnd-copy">
            <p className="ab-eyebrow fnd-kicker" data-reveal>{t('founder.eyebrow')}</p>
            <h2 id="fnd-name" className="fnd-name" data-reveal>{t('founder.name')}</h2>
            <p className="fnd-role" data-reveal>{t('founder.role')}</p>
            <p className="fnd-bio" data-reveal>{t('founder.bio')}</p>
            <figure className="fnd-quote" data-reveal>
              <blockquote className="fnd-quote-text">{t('founder.quote')}</blockquote>
              <figcaption className="fnd-quote-cite">{t('founder.attribution')}</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── GALLERY — capped preview grid + See More lightbox ─────────────────────────
// The page shows a capped masonry (first 6 tiles, manifest order). Tiles are NOT
// clickable. A centred orange "See More" pill opens a fullscreen overlay lightbox
// that walks the FULL manifest with prev/next + keyboard ← → + Esc, a close (×),
// and a "n / total" counter. Body scroll locks while open; the dialog is
// role="dialog" aria-modal, takes focus on open and returns it to the pill on
// close. Media-agnostic: <img> for images, <video controls> for video files — a
// future video manifest entry drops in with zero code change.
const PREVIEW_COUNT = 6
const isVideoSrc = (src) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(src)

function Gallery() {
  const { t } = useTranslation('ourStory')
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const moreRef = useRef(null)
  const dialogRef = useRef(null)
  const wasOpen = useRef(false)
  const n = GALLERY.length

  const go = (delta) => setIdx((p) => (p + delta + n) % n)

  // While open: keyboard nav (← → Esc), body scroll lock, focus into the dialog,
  // and a light Tab trap so focus can't leave the overlay.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      else if (e.key === 'Tab') {
        const f = dialogRef.current?.querySelectorAll('button')
        if (!f || !f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => dialogRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      cancelAnimationFrame(raf)
    }
  }, [open, n])

  // Return focus to the See More pill when the overlay closes.
  useEffect(() => {
    if (wasOpen.current && !open) moreRef.current?.focus()
    wasOpen.current = open
  }, [open])

  if (!GALLERY.length) return null
  const preview = GALLERY.slice(0, PREVIEW_COUNT)
  const current = GALLERY[idx]

  return (
    <section data-theme="light" className="gal" aria-labelledby="gal-title">
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow gal-eyebrow" data-reveal>{t('gallery.eyebrow')}</p>
        <h2 id="gal-title" className="gal-title" data-reveal>{t('gallery.heading')}</h2>
        <div className="gal-grid">
          {preview.map((src, i) => (
            <figure className="gal-item" data-reveal key={i} style={{ '--reveal-delay': `${(i % 3) * 60}ms` }}>
              <img className="gal-img" src={src} alt="" loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
        <div className="gal-more-wrap">
          <button type="button" ref={moreRef} className="gal-more" onClick={() => { setIdx(0); setOpen(true) }}>
            <span>{t('gallery.seeMore')}</span>
            <span className="gal-more-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {open && (
        <div
          className="gal-lb"
          role="dialog"
          aria-modal="true"
          aria-label={t('gallery.lightboxLabel')}
          ref={dialogRef}
          tabIndex={-1}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <button type="button" className="gal-lb-close" onClick={() => setOpen(false)} aria-label={t('gallery.close')}>×</button>
          <button type="button" className="gal-lb-nav gal-lb-prev" onClick={() => go(-1)} aria-label={t('gallery.prev')}>‹</button>
          <div className="gal-lb-stage">
            {isVideoSrc(current)
              ? <video className="gal-lb-media" src={current} controls autoPlay />
              : <img className="gal-lb-media" src={current} alt="" />}
          </div>
          <button type="button" className="gal-lb-nav gal-lb-next" onClick={() => go(1)} aria-label={t('gallery.next')}>›</button>
          <p className="gal-lb-counter">{idx + 1} / {n}</p>
        </div>
      )}
    </section>
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
// Header: "Our Team" (ourStory.team.heading — own key in all three locales, no
// longer borrowing globalMarkets). The drawn gold→orange hairline opens the
// section above the statement.
function Team() {
  const { t } = useTranslation('ourStory')
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
        <h2 id="tm-title" className="tm-title" data-reveal>{t('team.heading')}</h2>
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

