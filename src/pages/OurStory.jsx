import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { Flag, Globe, Building2, Cog, Target, Telescope, HeartHandshake } from 'lucide-react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import CTAButton from '@/components/CTAButton'
import { PaperGrain } from '@/components/atmosphere'
// Company-wide credentials — imported verbatim from the homepage sections so the
// content, markup, CSS (global, in index.css) and behaviour stay in exact sync.
// No homepage files are modified; tokens resolve to the inner-page palette.
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
import { GALLERY } from '@/assets/gallery/manifest'
import './OurStory.css'

// Task 6 — horizontal timeline, one lucide milestone icon per stop. Order matches
// timeline.stops: 2014 first order (flag) · 2015-17 startup (globe) · 2018 first
// facility (building) · 2021-23 scale (gears) · 2024-26 global operation (target).
const TIMELINE_ICONS = [Flag, Globe, Building2, Cog, Target]

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

      {/* SECTION 7 ── GALLERY — print-industry placeholder imagery, trivially swappable */}
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

// ── THE JOURNEY — horizontal timeline (Task 6) ────────────────────────────────
// A single horizontal axis. At each of the five stops a small boxed year sits ON
// the axis, and the milestone icon + copy alternate ABOVE and BELOW the line
// (stop 1 above, 2 below, 3 above, …). Sized to read as one screen at 1536×743;
// below 900px it folds into a vertical rail. Reveal-on-scroll via the shared
// [data-reveal] system (content rests fully visible when JS is off).
function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')

  return (
    <section data-theme="light" className="tlh" aria-label={t('timeline.eyebrow')}>
      <PaperGrain />
      <div className="ab-wrap">
        <p className="ab-eyebrow tlh-eyebrow" data-reveal>{t('timeline.eyebrow')}</p>
        <ol className="tlh-track">
          {stops.map((s, i) => {
            const Ic = TIMELINE_ICONS[i] || Flag
            const side = i % 2 === 0 ? 'above' : 'below'
            return (
              <li className={`tlh-stop tlh-stop--${side}`} data-reveal style={{ '--i': i }} key={i}>
                <div className="tlh-panel">
                  <span className="tlh-icon" aria-hidden="true"><Ic size={25} strokeWidth={1.6} /></span>
                  <h3 className="tlh-title">{s.title}</h3>
                  <p className="tlh-body">{s.desc}</p>
                </div>
                <div className="tlh-axis">
                  <span className="tlh-year">{s.year}</span>
                </div>
              </li>
            )
          })}
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
  // Task 18 — one lucide glyph per card, better matched to each idea:
  // Target → mission, Telescope → vision (looking ahead), HeartHandshake → values.
  const beats = [
    { key: 'mission', Icon: Target },
    { key: 'vision', Icon: Telescope },
    { key: 'values', Icon: HeartHandshake },
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
                <span className="mvv-icon" aria-hidden="true"><Icon size={44} strokeWidth={1.5} /></span>
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
            <div className="ab-frame fnd-portrait" data-slot="founder-portrait" aria-hidden="true">
              <img src="/site-assets/about/founder/founder-portrait.webp" alt="" loading="lazy" decoding="async" />
            </div>
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
          {/* Shared site CTA — identical to the header "Request a Quote" pill. */}
          <CTAButton ref={moreRef} className="gal-more" onClick={() => { setIdx(0); setOpen(true) }}>
            {t('gallery.seeMore')}
          </CTAButton>
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
              ? <video className="gal-lb-media" src={current} controls autoPlay muted playsInline />
              : <img className="gal-lb-media" src={current} alt="" />}
          </div>
          <button type="button" className="gal-lb-nav gal-lb-next" onClick={() => go(1)} aria-label={t('gallery.next')}>›</button>
          <p className="gal-lb-counter">{idx + 1} / {n}</p>
        </div>
      )}
    </section>
  )
}

// ── THE TEAM — leadership roster, six horizontal cards, everything visible ────
// Six uniform HORIZONTAL cards — the whole 3:4 portrait LEFT (shown COMPLETE, never
// cropped), copy RIGHT. Laid 2 × 3. One uniform text structure for all six:
//   name · (thin orange rule that draws under it on hover) · role · one-line bio ·
//   quote (italic, thin orange left rule).
// The quote is ALWAYS visible — no "+" expander, no truncation. A member with no
// quote (Charani) simply drops the quote block; one with no bio (Dhiresh) drops the
// bio line — the structure is otherwise identical. Cool hover: the photo warms from
// grayscale → full colour (300ms), the card lifts 4px, and the orange rule draws in.
//
// Header + copy resolve from ourStory.team (heading / members) in all three locales;
// roles + bios localise, quotes stay in their original language. No locale changes.
// Task 16 — the three leaders' photos have not been supplied; each card falls back to a
// neutral placeholder. Drop <slug>.webp into public/site-assets/about/team/ to swap in a
// real photo (see that folder's README). Order matches team.members in ourStory.json.
const TEAM_SLUGS = ['sameer-kazi', 'charani-dhankani', 'dhiresh-verlekar']
const TEAM_PLACEHOLDER = '/site-assets/about/team/placeholder-portrait.svg'

function Team() {
  const { t } = useTranslation('ourStory')
  const members = t('team.members', { returnObjects: true })
  const photo = (i) => `/site-assets/about/team/${TEAM_SLUGS[i] || `team-${String(i + 1).padStart(2, '0')}`}.webp`

  return (
    <section data-theme="light" className="tm" aria-labelledby="tm-title">
      <PaperGrain />
      <div className="ab-wrap">
        <hr className="tm-rule" data-reveal aria-hidden="true" />
        <h2 id="tm-title" className="tm-title" data-reveal>{t('team.heading')}</h2>
        <div className="tm-grid">
          {members.map((p, i) => (
            <article className="tm-card" data-reveal key={i} style={{ '--reveal-delay': `${(i % 3) * 80}ms` }}>
              <div className="tm-media">
                {/* Real photo when its <slug>.webp is dropped in; otherwise the neutral
                    placeholder. Whole 3:4 portrait, never cropped. */}
                <img
                  src={photo(i)}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { if (!e.currentTarget.src.endsWith('placeholder-portrait.svg')) e.currentTarget.src = TEAM_PLACEHOLDER }}
                />
              </div>
              <div className="tm-body">
                <p className="tm-name">{p.name}</p>
                <span className="tm-underline" aria-hidden="true" />
                {p.role && <p className="tm-role">{p.role}</p>}
                {p.bio && <p className="tm-bio">{p.bio}</p>}
                {p.quote && <blockquote className="tm-quote">{p.quote}</blockquote>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

