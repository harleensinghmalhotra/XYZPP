import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import CountUp from '@/components/CountUp'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import FacilityBook from '@/components/FacilityBook'
import YouTubeChannel from '@/components/YouTubeChannel'
import Awards from '@/sections/Awards'
import Certifications from '@/sections/Certifications'
import CTAButton from '@/components/CTAButton'
import PageHero, { splitTitle } from '@/components/PageHero'
import { PaperGrain } from '@/components/atmosphere'
import { Maximize, Warehouse, Building2, BookOpen, Users } from 'lucide-react'
import './InfrastructurePage.css'

gsap.registerPlugin(ScrollTrigger)

// ── /infrastructure — "Built for Scale. Engineered for Trust." ───────────────
// Structure + rhythm reskinned from dispel.com into QFP brand System B:
//   1 statement hero (navy) + dual CTA · 2 certification trust strip (cream)
//   3 capability TRIPTYCH — three gold-hairline spines + 98% stat + press-hall frame (navy)
//   4 machine LEDGER — four hairline rows, big gold numeral / mark (cream)
//   5 measurable-results band + video (navy)
//   6 recognition plaques (beige) · 7 facility gallery, photos only (cream) · 8 CTA (beige)
// Every image is a premium navy placeholder that a delivered asset drops into with
// zero code change.
//   public/qfp/infra/facility-0{1..3}.webp   (accordion side image)
//   public/qfp/infra/gallery-0{1..4}.webp     (facility strip)

// The Corporate AV single-film slot was replaced by <YouTubeChannel /> — a live grid
// of the company's YouTube videos, driven by the URL list in src/data/youtube.js.

// Data carries stable keys + non-translatable values (logos, codes, icons, numbers).
// User-facing labels/subs/specs/captions resolve via t(`<group>.<key>...`) at render.
// (The certification trust strip is now the shared homepage <Certifications /> — see §2.)

const CAPABILITIES = [
  { k: 'print' },
  { k: 'bind' },
  { k: 'ware' },
]

// Premium finishing services — the approved list, in the given order. No counts attach to
// these (they're capabilities, not machine tallies), so each renders as a hairline
// cell with a gold DM-Mono index in the ledger's cream+gold vocabulary. Names resolve
// via t(`finish.items.<k>`); the index is decorative sequencing, not a data figure.
const FINISH = ['foiling', 'embossing', 'debossing', 'spotuv', 'dripuvlamination', 'diecutting', 'windowpatching', 'specialtycoating', 'premiumdecorative']

// The hero capacity strip: one lucide icon per figure (order matches heroStats.items,
// per the client reference: footprint, facilities, professionals, books). Its
// gold-hairline cream band reuses the homepage trust-belt look.
const HERO_STAT_ICONS = [Warehouse, Building2, Users, BookOpen]

// Recognition is now the shared homepage <Awards /> component (see §6) — the page's
// own plaque rail was retired.

const GALLERY = [
  { n: '01', k: 'pressHall' },
  { n: '02', k: 'bindery' },
  { n: '03', k: 'warehouse' },
  { n: '04', k: 'dispatch' },
]

// Silent drop-in photo surface: navy duotone placeholder under the real image, so a
// delivered .webp covers it with zero code change (a missing file just reveals it).
function InfraPhoto({ src, note, className = '' }) {
  return (
    <div className={`inf-photo ${className}`}>
      <div className="inf-photo-base" aria-hidden="true" />
      <span className="inf-photo-note" aria-hidden="true">{note}</span>
      {src && (
        <div className="inf-photo-img" aria-hidden="true" style={{ backgroundImage: `url(${src})` }} />
      )}
    </div>
  )
}

export default function InfrastructurePage() {
  const { t } = useTranslation('infrastructurePage')
  const root = useRef(null)
  const triRef = useRef(null) // capability triptych — CSS reveal container
  const [reduced] = useState(prefersReduced)

  // §3 capability triptych — hairlines draw + columns fade-stagger via the CSS
  // `.is-in` gate (About-MVV mechanism). Reduced motion mounts already-in (see JSX).
  useEffect(() => {
    if (reduced) return
    const el = triRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect() }
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      const reveal = (sel, opts = {}) => {
        const els = q(sel)
        if (!els.length) return
        gsap.set(els, { autoAlpha: 0, y: 24 })
        gsap.to(els, {
          autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
          stagger: opts.stagger || 0, clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: opts.trigger || els[0], start: opts.start || 'top 82%', once: true },
        })
      }

      // (hero reveals now handled by PageHero via alive.js data-reveal/textreveal)
      // §2 Certifications + §6 Awards are the shared homepage components — they own their
      // OWN entrance animations, so no reveal() is wired for them here.
      // §3 capability triptych reveals via CSS `.is-in` (IntersectionObserver above).
      reveal('.inf-finish-cell', { trigger: '.inf-finish-grid', stagger: 0.05, start: 'top 82%' })
      reveal('.yt-channel', { trigger: '.inf-av', start: 'top 78%' })
      reveal('.inf-gallery-item', { trigger: '.inf-gallery', stagger: 0.08 })
      reveal('.inf-cta-inner', { trigger: '.inf-cta', start: 'top 84%' })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const canonical = 'https://quarterfoldltd.com/infrastructure'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumbHome'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumbCurrent'), item: canonical },
    ],
  }

  return (
    <main id="main" ref={root} className="inf">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={jsonLd}
      />

      {/* ── 1 · TWO-LINE HERO (navy) — replaces the giant display band ────── */}
      {(() => {
        const [l1, l2] = splitTitle(t('hero.title'))
        return <PageHero id="inf-h1" eyebrow={t('hero.eyebrow')} line1={l1} line2={l2} minVh={60} />
      })()}

      {/* ── 1A · CAPACITY STRIP — highlight figures below the page heading, in the
          homepage trust-belt visual language (gold top-hairline, cream, icon per figure). */}
      <section className="tb-band" aria-label={t('heroStats.aria')}>
        <ul className="inf-hero-stats">
          {(t('heroStats.items', { returnObjects: true }) || []).map((it, i) => {
            const Icon = HERO_STAT_ICONS[i] || Maximize
            return (
              <li className="tb-item inf-hero-stat" key={i}>
                <span className="tb-ico" aria-hidden="true"><Icon size={22} strokeWidth={1.6} /></span>
                <span className="inf-hero-stat-text">
                  <span className="inf-hero-stat-value">{it.value}</span>
                  <span className="inf-hero-stat-label">{it.label}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ── 1B · FACILITY BOOK — SAME wrapper as the homepage ───────────────
          Nested in the homepage's cream `.infra` section context (+ .infra-inner) so
          the navy rounded stage floats on cream exactly like the homepage — not merged
          with the navy hero above nor invaded by the Certifications cream dome below. */}
      <section data-theme="light" className="infra inf-facilitybook">
        <div className="infra-inner">
          <FacilityBook />
        </div>
      </section>

      {/* ── 1C · PREMIUM FINISHING — value-added services grid (cream), directly below
          the book display. Each capability is a hairline cell with a gold DM-Mono index
          in the ledger's cream + gold vocabulary; a gold top-hairline opens the band. */}
      <section data-theme="light" className="inf-finish-sec" aria-labelledby="inf-fin-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('finish.eyebrow')}</p>
            <h2 id="inf-fin-h" className="inf-h2">{t('finish.title')}</h2>
          </div>
          <ul className="inf-finish-grid">
            {FINISH.map((k, i) => (
              <li key={k} className="inf-finish-cell">
                <span className="inf-finish-mark" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="inf-finish-name">{t(`finish.items.${k}`)}</span>
              </li>
            ))}
          </ul>
          <p className="inf-finish-note">{t('finish.note')}</p>
        </div>
      </section>

      {/* ── 2 · VIDEO CHANNEL — a live grid of the company's YouTube videos, directly
          after Premium Finishing (client: replaces the single Corporate AV film). The
          card list is driven by the plain URL file src/data/youtube.js; the panel
          scrolls internally so the page never grows as videos are added. Cream, so
          Premium Finishing flows into it and the triptych below keeps its cream curve. ── */}
      <section data-theme="light" className="inf-av" aria-labelledby="inf-av-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          <div className="inf-sec-head">
            <p className="inf-eyebrow">{t('av.eyebrow')}</p>
            <h2 id="inf-av-h" className="inf-h2">{t('av.title')}</h2>
          </div>
          <YouTubeChannel
            sub={t('av.sub')}
            dialogAria={t('av.dialogAria')}
            closeLabel={t('av.closeLabel')}
            playLabel={t('av.playLabel')}
            watchOnYouTube={t('av.watchOnYouTube')}
            channelLabel={t('av.watchChannel')}
          />
        </div>
      </section>

      {/* ── 3 · CAPABILITY TRIPTYCH (navy) — About-MVV vocabulary ───────────
          One flat #030C31 band folded into three spines split by two drawn gold
          hairlines. NO 01/02/03 indices, NO ghost numerals (MVV site law). Each
          column: DM Mono gold capability name → Inter cream statement, equal
          optical weight. The 98% stat punctuates below (homepage stat anatomy),
          then a full-width press-hall frame closes the band. Curves inward per
          bible so the cream neighbours dip in, never a navy sliver. ─────────── */}
      <section
        ref={triRef}
        data-theme="dark"
        className={`inf-tri${reduced ? ' is-in' : ''}`}
        aria-labelledby="inf-tri-h"
      >
        <SectionCurve position="top" fill="#fdfaf4" inward />
        <div className="inf-wrap inf-z">
          <div className="inf-tri-head">
            <p className="inf-eyebrow inf-eyebrow--ondark">{t('acc.eyebrow')}</p>
            <h2 id="inf-tri-h" className="inf-h2 inf-h2--ondark">{t('acc.title')}</h2>
          </div>

          <div className="inf-tri-cols">
            {CAPABILITIES.map((cap, i) => (
              <div className="inf-tri-col" key={cap.k} style={{ '--col-i': i }}>
                <div className="inf-tri-col-body">
                  <p className="inf-tri-label">{t(`acc.capabilities.${cap.k}.label`)}</p>
                  <p className="inf-tri-text">{t(`acc.capabilities.${cap.k}.body`)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 98% stat — centred punctuation row, homepage stat anatomy (big flat
              gold numeral + DM Mono label). 98 is a fixed brand figure. */}
          <div className="inf-tri-stat">
            <span className="inf-tri-stat-num"><CountUp value={98} suffix="%" /></span>
            <span className="inf-tri-stat-label">{t('acc.quoteText')}</span>
          </div>

          {/* full-width press-hall frame — hairline, no label; silent drop-in for
              facility-01.webp (a delivered asset covers the navy base, zero code
              change; a 404 simply leaves the framed navy placeholder). */}
          <div className="inf-tri-frame" aria-hidden="true">
            <div className="inf-tri-frame-img" style={{ backgroundImage: 'url(/site-assets/infrastructure/facility/facility-01.webp)' }} />
          </div>
        </div>
        <SectionCurve position="bottom" fill="#fdfaf4" inward />
      </section>

      {/* ── 3 · GALLERY — facility photos only, no testimonials (cream) ─── */}
      <section data-theme="light" className="inf-gallery" aria-labelledby="inf-gal-h">
        <PaperGrain />
        <div className="inf-wrap inf-z">
          {/* Heading "A look across the floor" removed (client); the eyebrow labels the
              band and stays as the section's accessible name. */}
          <div className="inf-sec-head inf-sec-head--eyebrowonly">
            <p id="inf-gal-h" className="inf-eyebrow">{t('gallery.eyebrow')}</p>
          </div>
          <div className="inf-gallery-strip">
            {GALLERY.map((g) => {
              const cap = t(`gallery.items.${g.k}`)
              return (
              <figure key={g.n} className="inf-gallery-item">
                <InfraPhoto src={`/site-assets/infrastructure/gallery/gallery-0${g.n.slice(-1)}.webp`} note={t('gallery.photoNote', { caption: cap })} className="inf-gallery-photo" />
                <figcaption className="inf-gallery-cap">{cap}</figcaption>
              </figure>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4 · CERTIFICATIONS — shared homepage <Certifications /> (moved to sit after
          the gallery, per client). flatTop suppresses the cream dome (the cream Gallery
          sits directly above); flatBottom stays false so the section keeps its navy
          sweep-arc into the navy Awards band below. ── */}
      <Certifications flatTop />

      {/* ── 5 · RECOGNITION — shared homepage <Awards /> (moved below the gallery, after
          Certifications). Navy; its foot flows into the beige CTA's own top curve. ── */}
      <Awards />

      {/* ── 6 · CTA (beige) ─────────────────────────────────────────────── */}
      <section data-theme="light" className="inf-cta" aria-labelledby="inf-cta-h">
        <PaperGrain />
        <SectionCurve position="top" fill="#f0ebe0" />
        <div className="inf-wrap inf-cta-inner inf-z">
          <h2 id="inf-cta-h" className="inf-cta-title">{t('cta.title')}</h2>
          <p className="inf-cta-sub">
            {t('cta.sub')}
          </p>
          <CTAButton to="/contact">{t('cta.button')}</CTAButton>
        </div>
      </section>
    </main>
  )
}
