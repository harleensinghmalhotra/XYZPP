import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import { Target, Telescope, HeartHandshake, MousePointerClick } from 'lucide-react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import CTAButton from '@/components/CTAButton'
import PageHero from '@/components/PageHero'
import { PaperGrain } from '@/components/atmosphere'
// Company-wide credentials — imported verbatim from the homepage sections so the
// content, markup, CSS (global, in index.css) and behaviour stay in exact sync.
// No homepage files are modified; tokens resolve to the inner-page palette.
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
// The Journey timeline — "The Press Run", a self-contained animated section
// (WAAPI + IntersectionObserver) that consumes the ourStory.timeline copy.
import JourneyTimeline from '@/sections/JourneyTimeline'
import { GALLERY } from '@/assets/gallery/manifest'
import './OurStory.css'

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
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.about'), item: 'https://quarterfoldltd.com/about' },
    ],
  }

  return (
    <main id="main">
      <Seo title={t('seo.title')} description={t('seo.description')} jsonLd={breadcrumb} />

      {/* One continuous gold thread down the page spine — scaleY by scroll. */}
      <Spine />

      {/* SECTION 1 ── HERO BAND — now the shared <PageHero> so the About hero matches
          the Infrastructure page treatment EXACTLY: a small gold eyebrow ("ABOUT")
          over a tamer two-line headline (line 1 cream, line 2 gold). The existing
          headline copy is kept verbatim; only the scale, eyebrow and gold/cream split
          change. The lede leads the JOURNEY section below. */}
      <PageHero
        id="about-h1"
        eyebrow={t('hero.eyebrowLabel')}
        line1={t('hero.titleLine1')}
        line2={t('hero.titleLine2')}
        minVh={60}
      />

      {/* SECTION 2 ── OUR STORY LEDE — the "OUR STORY" eyebrow (gold→orange) over
          the lede paragraph, leading the reader into the journey below. */}
      <section data-theme="light" className="ab-lede" aria-labelledby="ab-lede-eyebrow">
        <PaperGrain />
        <div className="ab-wrap">
          <p id="ab-lede-eyebrow" className="ab-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
          <p className="ab-lede-text" data-reveal>{t('hero.lede')}</p>
        </div>
      </section>

      {/* SECTION 3 ── THE JOURNEY — "The Press Run" animated timeline. Self-contained
          (WAAPI + IntersectionObserver); auto-plays on entry, replays on re-entry
          and via its Replay control, and consumes ourStory.timeline in all locales. */}
      <JourneyTimeline />

      {/* SECTION 3 ── INK SPREADS — MVV, three navy spines + drawn gold hairlines */}
      <InkSpreads />

      {/* SECTION 5 ── OUR TEAM — full roster, one grid, everyone shown ────────── */}
      <Team />

      {/* SECTION 6 ── FOUNDER AND CEO PROFILE — corporate boardroom profile ────── */}
      <Founder />

      {/* SECTION 7 ── GALLERY — print-industry placeholder imagery, trivially swappable */}
      <Gallery />

      {/* SECTION 8 & 9 ── AWARDS + CERTIFICATES — company-wide credentials,
          imported from the homepage sections (Awards navy → Certs cream).
          flatTop: the Certifications cream dome (certs-arc-top) otherwise
          sweeps UP into the navy Awards section and clips the outer plaque cards'
          lower corners. On the homepage Awards is the LAST section (nothing above the
          certs), so it never clips there; suppressing the dome here brings About in
          line — the cards sit fully clear on a flat navy→cream seam. The closing CTA
          is appended by the site layout after <main>. */}
      <Awards />
      <Certifications flatTop />
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
  // One lucide glyph per card, better matched to each idea:
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
    <section data-theme="light" className="fnd" aria-labelledby="fnd-section-title">
      <PaperGrain />
      <div className="ab-wrap">
        <hr className="fnd-rule" data-reveal aria-hidden="true" />
        <h2 id="fnd-section-title" className="fnd-section-title" data-reveal>{t('founder.sectionTitle')}</h2>
        <div className="fnd-spread">
          <div className="fnd-portrait-wrap" data-reveal>
            <div className="ab-frame fnd-portrait" data-slot="founder-portrait" aria-hidden="true">
              <img src="/site-assets/about/founder/founder-portrait.webp" alt="" loading="lazy" decoding="async" />
            </div>
          </div>
          <div className="fnd-copy">
            <p className="ab-eyebrow fnd-kicker" data-reveal>{t('founder.eyebrow')}</p>
            <h3 id="fnd-name" className="fnd-name" data-reveal>{t('founder.name')}</h3>
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

// ── THE TEAM — leadership roster, six cards in a 3-up grid ────────────────────
// Six vertical cards, three per row → two clean rows (two per row on tablet, one on
// phones). Portrait on TOP (a fixed 3:4 frame the pre-cropped 3:4 webp fills), copy
// BELOW: name · (thin orange rule that draws under it on hover) · role · bio · quote
// (italic, thin orange left rule). Every copy slot is optional and simply drops when
// its string is empty — Charani has no quote; the three newest leaders (Dilip,
// Patrick, Priyanka) render photo + name only until their bios and titles are
// supplied. Cool hover: the photo warms grayscale → colour (300ms), the card lifts 4px.
//
// Header + copy resolve from ourStory.team (heading / members) in all three locales;
// roles + bios localise, quotes stay in their original language. Photos live at
// public/site-assets/about/team/<slug>.webp (see that folder's README); order matches
// team.members in ourStory.json. A missing file falls back to the neutral placeholder.
// Order matches team.members in ourStory.json (index-aligned). Nilesh is card 1 —
// his photo is a top-anchored crop of the founder portrait; Charani's slug is kept
// while her displayed name gains her full middle name. Milton is intentionally
// omitted (no name, title, photo, bio or quote supplied).
const TEAM_SLUGS = ['nilesh-dhankani', 'patrick-carrapiett', 'dilip-ramrakhyani', 'charani-dhankani', 'sameer-kazi', 'dhiresh-verlekar', 'priyanka-rajpal']
const TEAM_PLACEHOLDER = '/site-assets/about/team/placeholder-portrait.svg'

// ── OUR TEAM — the spotlight ─────────────────────────────────────────────────
// A grid of six compact photo cards (3×2) beside one sticky navy spotlight panel.
// Cards carry ONLY the photo + name + gold-mono title on a bottom gradient — no
// bios, no quotes, no overlays. They are greyscale at rest, warm to colour and
// lift on hover; the SELECTED card keeps its colour and wears a 2px gold ring.
// Clicking a card fills the panel with that person: name (Inter Tight), title
// (gold mono), full bio (cream) and quote (italic, gold left rule) — all at
// comfortable reading size, never truncated.
//
// Nothing is selected by default: the panel shows a centred invitation (gold-mono
// eyebrow + cream hint + a subtle cursor glyph) and every card sits greyscale.
// Clicking a card selects it; clicking the active card again, clicking anywhere
// outside the cards and panel, or pressing Escape deselects and eases the panel
// back to the invitation. The invitation and all six people are stacked in the
// SAME grid cell, so the panel's height is fixed to the LONGEST person and never
// jumps between states; the outgoing block fades down 12px while the incoming
// fades up (a directional crossfade, 250ms). Partial people render clean — Charani
// has no quote, Priyanka no bio, and the absent block simply isn't rendered.
// Mobile (<768px): grid on top, panel (not sticky) below; tapping a card scrolls
// the panel into view, tapping elsewhere collapses it back to the invitation.
function Team() {
  const { t } = useTranslation('ourStory')
  const reduced = useReducedMotion()
  const members = t('team.members', { returnObjects: true })
  const panelRef = useRef(null)
  const [selected, setSelected] = useState(null)   // null = invitation; index = spotlit person
  const photo = (i) => `/site-assets/about/team/${TEAM_SLUGS[i] || `team-${String(i + 1).padStart(2, '0')}`}.webp`

  const select = (i) => {
    const next = selected === i ? null : i          // clicking the active card again deselects
    setSelected(next)
    // mobile: the panel lives below the grid — bring it into view when a person is picked.
    if (next !== null && typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      panelRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' })
    }
  }

  // Click-away + Escape deselect. A click anywhere that is NOT inside a card or the
  // panel returns to the invitation; card/panel clicks are handled locally. Listeners
  // are document-scoped and torn down on unmount.
  useEffect(() => {
    const onDocClick = (e) => {
      const el = e.target
      if (!(el instanceof Element)) return
      if (el.closest('.tm-card') || el.closest('.tm-panel')) return
      setSelected(null)
    }
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <section data-theme="light" className="tm" aria-labelledby="tm-title">
      <PaperGrain />
      <div className="ab-wrap">
        <hr className="tm-rule" data-reveal aria-hidden="true" />
        <h2 id="tm-title" className="tm-title" data-reveal>{t('team.heading')}</h2>

        <div className="tm-spotlight">
          {/* LEFT (top on mobile) — the six-card grid, each card a select toggle */}
          <ul className="tm-grid" role="list">
            {members.map((p, i) => (
              <li className="tm-cell" data-reveal key={i} style={{ '--reveal-delay': `${(i % 3) * 70}ms` }}>
                <button
                  type="button"
                  className={`tm-card${i === selected ? ' is-active' : ''}`}
                  aria-pressed={i === selected}
                  onClick={() => select(i)}
                >
                  <img
                    className="tm-card-photo"
                    src={photo(i)}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { if (!e.currentTarget.src.endsWith('placeholder-portrait.svg')) e.currentTarget.src = TEAM_PLACEHOLDER }}
                  />
                  <span className="tm-card-cap">
                    <span className="tm-card-name">{p.name}</span>
                    {p.role && <span className="tm-card-role">{p.role}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* RIGHT (below on mobile) — the sticky spotlight panel. The invitation and
              all six people are stacked in one grid cell so the panel height locks to
              the tallest; only the active block is visible (opacity), the rest fade
              out/down. */}
          <div className="tm-panel" ref={panelRef} aria-live="polite">
            <div className="tm-panel-stack">
              {/* invitation — shown whenever no card is selected */}
              <div className={`tm-invite${selected === null ? ' is-active' : ''}`} aria-hidden={selected !== null}>
                <p className="tm-invite-eyebrow">{t('team.leadershipEyebrow')}</p>
                <p className="tm-invite-body">{t('team.leadershipBody')}</p>
                <p className="tm-invite-hint">
                  <MousePointerClick className="tm-invite-glyph" strokeWidth={1.5} aria-hidden="true" />
                  {t('team.selectHint')}
                </p>
              </div>

              {members.map((p, i) => (
                <article
                  key={i}
                  className={`tm-person${i === selected ? ' is-active' : ''}`}
                  aria-hidden={i !== selected}
                >
                  <p className="tm-person-name">{p.name}</p>
                  {p.role && <p className="tm-person-role">{p.role}</p>}
                  {p.bio && <p className="tm-person-bio">{p.bio}</p>}
                  {p.quote && <blockquote className="tm-person-quote">{p.quote}</blockquote>}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

