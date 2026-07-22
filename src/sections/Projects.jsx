import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import { SHOW_MINISTRY_NAMES, SHOW_RESTRICTED_CLIENTS, SHOW_SHIPMENT_RECORDS } from '@/lib/compliance'
import { SealCheck, PenNib, Gauge, Headset } from '@phosphor-icons/react'
import Globe3D from '@/components/Globe3D'

gsap.registerPlugin(ScrollTrigger)

// ── Global Projects — the globe on its stage ─────────────────────────────────
// The realistic Earth (react-globe.gl, see Globe3D) is the jewel; everything
// around it was rebuilt for the revamp:
//   • THE STAGE — deep near-black velvet, a sparse static star field and a warm
//     gold backlight halo (the dotted world-map behind the globe is GONE).
//   • DESTINATION PANELS — three tall duotone region posters (airline energy);
//     hovering one swings the globe to face that region + brightens its arcs.
//   • THE ARCHIVE SHELF — the shipment records are now code-built hardcover books
//     standing on a warm-lit shelf (pure HTML/CSS, no images/canvas). Each record
//     IS a book: navy/cream cover, gold foil figure, a 3D page-edge side, a customs
//     stamp. Hovering pulls a book off the shelf and pulses its country on the globe.
// Reduced-motion → static globe, no reveals, no globe reactions, hover = glow only.

// HDFC + ZEE rows carry the same permission flag as the trust strips, so
// the gate is the CENTRAL one from src/lib/compliance.js (not a local const —
// that leaked `true` in the last revamp and shipped restricted names). A
// `?hideRestricted` URL param also forces them off for preview/QA.

// Destination posters — text resolved from the homeProjects namespace by slug.
// `slug` also names the Globe3D focus region (africa | asia | europe). `img` is
// the clean school-kids photo (public/site-assets/homepage/destinations/, no duotone filter).
const REGIONS = [
  { slug: 'africa', img: '/site-assets/homepage/destinations/africa-1.jpg' },
  { slug: 'asia', img: '/site-assets/homepage/destinations/asia-2.jpg' },
  { slug: 'europe', img: '/site-assets/homepage/destinations/europe-2.jpg' },
]

// The featured milestone (loud) + seven shipment records (quiet). The featured
// story names a government body; when SHOW_MINISTRY_NAMES is off it falls back to
// a neutral national-programme phrasing (same card, no hole).
const HERO = {
  value: '10',
  suffix: 'M+',
  storyKey: SHOW_MINISTRY_NAMES ? 'ledger.heroStory' : 'ledger.heroStoryFallback',
  globeTarget: 'Tanzania',
}
// `ministry: true` rows carry government / ministry / programme names gated behind
// SHOW_MINISTRY_NAMES; `restricted: true` rows carry commercial client names gated
// behind SHOW_RESTRICTED_CLIENTS. Either gate filters its rows out cleanly.
// `key` → stable i18n key (name/desc); `unitKey` → unit label key; `globeTarget`
// → the Globe3D marker/arc this record pulses ('__HQ' for the India-side rows).
// Milestone rows:
//   • ZEE Learn removed entirely (removed, not just gated).
//   • DR Congo removed; replaced by Côte d'Ivoire (already present below) — the
//     Mozambique row is pending an approved delivery figure.
//   • Ghana set to the 10M milestone (was 2M), keyed to `ledger.rows.ghana`
//     ("Ghana / 10 million books... across various publishers").
//   • HDFC stays in code, gated behind SHOW_RESTRICTED_CLIENTS (currently false).
const LEDGER = [
  { key: 'nigeria', num: '8', unitKey: 'books', ministry: true, globeTarget: 'Nigeria' },
  { key: 'cotedivoire', num: '4', unitKey: 'books', ministry: true, globeTarget: 'Côte d’Ivoire' },
  { key: 'ghana', num: '10', unitKey: 'books', ministry: true, globeTarget: 'Ghana' },
  { key: 'maharashtra', num: '1.5', unitKey: 'books', ministry: true, globeTarget: '__HQ' },
  { key: 'hdfc', num: '1.3', unitKey: 'books', restricted: true, globeTarget: '__HQ' },
]

const words = (s) => s.split(' ')

// Deterministic sparse star field (seeded → stable across renders, no hydration
// flicker). ~64 tiny dots; ~40% barely twinkle (opacity only; killed under RM).
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const STARS = (() => {
  const r = mulberry32(0x134af7)
  return Array.from({ length: 64 }, () => ({
    left: +(r() * 100).toFixed(2),
    top: +(r() * 100).toFixed(2),
    s: +(0.8 + r() * 1.6).toFixed(2),
    o: +(0.22 + r() * 0.55).toFixed(2),
    tw: r() < 0.42,
    d: +(r() * 6).toFixed(2),
  }))
})()

// ── Destination poster — clean school-kids photo (no duotone filter) framed by a
// brand gold→navy glow-border. A bottom-up navy scrim is the ONLY tint, and it
// only sits behind the label/stat zone so faces stay natural. Hovering (or
// focusing) it swings the globe to face the region and brightens the glow.
// href="#" for now — per-region pages are built later.
function DestPanel({ slug, img, t, onFocus, onReset }) {
  const name = t(`regions.${slug}.name`)
  const stat = t(`regions.${slug}.stat`)
  const statLabel = t(`regions.${slug}.statLabel`)
  const body = t(`regions.${slug}.body`)
  return (
    // TODO(region-pages): point href to the per-region destination page once
    // those pages are scoped and approved; keep the globe-focus + stat as the poster.
    // The glow lives on ::before/::after of .proj-dest (outside .proj-dest-frame,
    // which owns overflow:hidden so only the photo zoom is clipped, not the glow).
    <div className="proj-dest-wrapper">
      <a
        className="proj-dest"
        href="#"
        data-region={slug}
        aria-label={`${name}, ${stat} ${statLabel}`}
        onClick={(e) => e.preventDefault()}
        onMouseEnter={onFocus}
        onMouseLeave={onReset}
        onFocus={onFocus}
        onBlur={onReset}
      >
        <div className="proj-dest-frame">
          <div className="proj-dest-media" aria-hidden="true">
            <div className="proj-dest-base" />
            <img
              className="proj-dest-photo"
              src={img}
              alt={t(`regions.${slug}.alt`)}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="proj-dest-scrim" aria-hidden="true" />
          <div className="proj-dest-content">
            <span className="proj-dest-kicker">{t(`regions.${slug}.descriptor`)}</span>
            <h3 className="proj-dest-name">{name}</h3>
            <div className="proj-dest-stat">
              <span className="proj-dest-stat-num">{stat}</span>
              <span className="proj-dest-stat-label">{statLabel}</span>
            </div>
          </div>
        </div>
      </a>
      <p className="proj-dest-body" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}

// Circular customs / postmark stamp — pure SVG. A clean gold outline ring + a
// dashed perforation ring, with the unit word sitting HORIZONTAL and INSIDE the
// ring (never riding the stroke), a small star below it. viewBox === rendered px
// (56) → the label renders at a true 11px floor. Decorative (aria-hidden).
function CustomsStamp({ label }) {
  return (
    <svg className="proj-book-stamp-svg" viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
      <circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="0.9" strokeDasharray="1.4 2.9" opacity="0.6" />
      <text x="28" y="27" textAnchor="middle" className="proj-book-stamp-text">{label}</text>
      <text x="28" y="41" textAnchor="middle" className="proj-book-stamp-mark">✶</text>
    </svg>
  )
}

// Credentials row — 4-column aligned cards (grid-cols-4 at desktop, grid-cols-2 on tablet,
// stacked on mobile) with Phosphor icons, title, and description. Mounts immediately
// after Destinations section. Reduced-motion safe reveal. Uses fixed title height to
// ensure all 4 descriptions align to a common baseline regardless of title wrap count.
function CredentialsRow({ credentials, reduced }) {
  const iconColor = 'var(--gold-2)'
  const icons = [
    <SealCheck weight="light" size={44} color={iconColor} aria-hidden="true" key="cert" />,
    <PenNib weight="light" size={44} color={iconColor} aria-hidden="true" key="pen" />,
    <Gauge weight="light" size={44} color={iconColor} aria-hidden="true" key="gauge" />,
    <Headset weight="light" size={44} color={iconColor} aria-hidden="true" key="headset" />,
  ]

  return (
    <div className="proj-creds" role="region" aria-label="Credentials">
      <div className="proj-creds-grid">
        {credentials && credentials.map((cred, idx) => (
          <div key={idx} className="proj-cred-card">
            <div className="proj-cred-icon">{icons[idx]}</div>
            <h4 className="proj-cred-title">{cred.title}</h4>
            <p className="proj-cred-desc">{cred.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// One shipment record, rebuilt as a code-built hardcover book. A front cover
// (navy or cream) + a 3D page-edge side face, standing on the shelf. Cover carries
// the country (DM Mono caps), the big gold figure (count-up + foil shimmer on
// reveal), a gold rule and one human line. The milestone book is taller, wears a
// gold foil banner + a ribbon bookmark, and skips the round stamp. Hovering pulls
// the book toward the viewer and pulses its country on the globe.
function BookRecord({
  country, story, line, stampLabel, num, suffix, decimals,
  reduced, variant, milestone, milestoneTag, onPulse, onReset,
}) {
  const finalNum = `${num}${suffix}`
  return (
    <article
      className={`proj-book proj-book--${variant}${milestone ? ' is-milestone' : ''}`}
      onMouseEnter={onPulse}
      onMouseLeave={onReset}
    >
      <div className="proj-book-inner">
        <span className="proj-book-spine" aria-hidden="true" />
        <div className="proj-book-cover">
          {milestone && <span className="proj-book-banner">{milestoneTag}</span>}
          {milestone && <span className="proj-book-ribbon" aria-hidden="true" />}
          <span className="proj-book-country">{country}</span>
          <span className="proj-book-num">
            <span
              className="proj-book-countn"
              data-value={num}
              data-decimals={decimals}
              data-suffix={suffix}
            >
              {reduced ? finalNum : `0${suffix}`}
            </span>
          </span>
          <span className="proj-book-rule" aria-hidden="true" />
          <p className="proj-book-line">{story || line}</p>
          {!milestone && (
            <span className="proj-book-stamp" aria-hidden="true">
              <CustomsStamp label={stampLabel} />
            </span>
          )}
        </div>
      </div>
      <span className="proj-book-shadow" aria-hidden="true" />
    </article>
  )
}

export default function Projects() {
  const { t } = useTranslation('homeProjects')
  const root = useRef(null)
  const recordsRef = useRef(null)
  const globe = useRef(null)
  const [reduced] = useState(prefersReduced)
  const credentials = t('credentials', { returnObjects: true })

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const hideParam = !!params && params.has('hideRestricted')
  const showRestricted = SHOW_RESTRICTED_CLIENTS && !hideParam
  // A/B glow tuning — `?glow=olive` swaps the navy leg for olive so both can be
  // screenshotted side-by-side. Default (and the shipped pick) is navy.
  const glowVariant = params?.get('glow') === 'olive' ? 'olive' : 'navy'
  const rows = LEDGER.filter(
    (r) => (SHOW_MINISTRY_NAMES || !r.ministry) && (showRestricted || !r.restricted),
  )

  const stars = useMemo(() => STARS, [])

  // globe-conversation handlers (no-op targets when reduced → Globe3D guards it)
  const focusRegion = (slug) => globe.current?.focusRegion(slug)
  const pulse = (target) => globe.current?.pulseCountry(target)
  const releaseGlobe = () => globe.current?.reset()

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      // top block entrance
      gsap.set(q('.proj-eyebrow'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.pw'), { autoAlpha: 0, yPercent: 80, filter: 'blur(8px)' })
      gsap.set(q('.proj-sub'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.proj-globe'), { autoAlpha: 0, scale: 0.92 })
      gsap.set(q('.proj-dests-eyebrow'), { autoAlpha: 0, y: 12 })
      gsap.set(q('.proj-dest'), { autoAlpha: 0, y: 26 })
      gsap.set(q('.proj-dest-body'), { autoAlpha: 0, y: 14 })
      gsap.set(q('.proj-cred-card'), { autoAlpha: 0, y: 12 })

      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 74%', once: true } })
      tl.to(q('.proj-head .proj-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.pw'), { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.7, stagger: 0.055, ease: 'power3.out' }, 0.1)
        .to(q('.proj-globe'), { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out', clearProps: 'transform' }, 0.15)
        .to(q('.proj-sub'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '>-0.5')
        .to(q('.proj-dests-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '>-0.2')
        .to(q('.proj-dest'), { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, '>-0.3')
        .to(q('.proj-dest-body'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, '>-0.4')
        .to(q('.proj-cred-card'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, '>-0.3')

      // the archive shelf — own trigger so the books slide up as the shelf enters.
      // Only wire it when the shipment-records block actually renders (SHOW_SHIPMENT_RECORDS,
      // line ~382). Gated off, its targets (.proj-books-*, .proj-book) are absent and every
      // set/tween below would fire GSAP's "target not found" warning against nothing.
      if (SHOW_SHIPMENT_RECORDS) {
        gsap.set(q('.proj-books-eyebrow'), { autoAlpha: 0, y: 12 })
        gsap.set(q('.proj-books-shelf'), { autoAlpha: 0, scaleX: 0.55 })
        gsap.set(q('.proj-book'), { autoAlpha: 0, y: 34 })

        const tl2 = gsap.timeline({ scrollTrigger: { trigger: recordsRef.current, start: 'top 82%', once: true } })
        tl2.to(q('.proj-books-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
          .to(q('.proj-books-shelf'), { autoAlpha: 1, scaleX: 1, duration: 0.7, ease: 'power2.out' }, 0.04)
          .to(q('.proj-book'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.12)

        // count-up on reveal — each figure tweens 0 → target once, formatted to the
        // target's precision, and lights its foil shimmer (one pass) on start.
        q('.proj-book-countn').forEach((el) => {
          const target = parseFloat(el.dataset.value)
          const dec = parseInt(el.dataset.decimals, 10) || 0
          const suffix = el.dataset.suffix || ''
          const proxy = { v: 0 }
          tl2.to(proxy, {
            v: target, duration: 1.15, ease: 'power2.out',
            onStart: () => el.classList.add('is-lit'),
            onUpdate: () => { el.textContent = proxy.v.toFixed(dec) + suffix },
          }, 0.3)
        })
      }
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="projects" ref={root} data-theme="dark" className="proj" role="region" aria-labelledby="proj-title">
      {/* THE STAGE — near-black velvet, sparse stars, gold backlight (on the globe) */}
      <div className="proj-stage" aria-hidden="true">
        <div className="proj-stars">
          {stars.map((st, i) => (
            <span
              key={i}
              className={`proj-star${st.tw ? ' is-tw' : ''}`}
              style={{
                left: `${st.left}%`,
                top: `${st.top}%`,
                width: `${st.s}px`,
                height: `${st.s}px`,
                opacity: st.o,
                animationDelay: `${st.d}s`,
              }}
            />
          ))}
        </div>
        <div className="proj-vignette" />
      </div>

      <div className="proj-inner">
        <div className="proj-top">
          <div className="proj-head">
            <p className="proj-eyebrow proj-eyebrow-script">{t('eyebrow')}</p>
            <h2 id="proj-title" className="proj-title">
              <span className="proj-line">
                {words(t('titleA')).map((w, i) => <span key={`a${i}`} className="pw pw-light">{w}</span>)}
              </span>
              <span className="proj-line proj-line-gold">
                {words(t('titleB')).map((w, i) => <span key={`b${i}`} className="pw pw-bold">{w}</span>)}
              </span>
            </h2>
            <p className="proj-sub">{t('sub')}</p>
            <p className="proj-lead">{t('leadInText')}</p>
            <ul className="proj-list">
              {t('listItems', { returnObjects: true }).map((item, idx) => (
                <li key={idx} className="proj-list-item">{item}</li>
              ))}
            </ul>
          </div>
          <Globe3D ref={globe} reduced={reduced} />
        </div>

        {/* DESTINATION PANELS */}
        <div className="proj-dests" data-glow={glowVariant}>
          <p className="proj-dests-eyebrow">{t('destinationsEyebrow')}</p>
          <div className="proj-dests-grid">
            {REGIONS.map((r) => (
              <DestPanel
                key={r.slug}
                slug={r.slug}
                img={r.img}
                t={t}
                onFocus={() => focusRegion(r.slug)}
                onReset={releaseGlobe}
              />
            ))}
          </div>
        </div>

        {/* CREDENTIALS ROW — 4 cards below destinations */}
        <CredentialsRow credentials={credentials} reduced={reduced} />

        {/* THE ARCHIVE SHELF — code-built hardcover books standing on a warm shelf.
            Hidden-not-deleted; reusable later. See SHOW_SHIPMENT_RECORDS in lib/compliance.js. */}
        {SHOW_SHIPMENT_RECORDS && (
          <div className="proj-books" ref={recordsRef}>
            <p className="proj-books-eyebrow">{t('ledger.recordsEyebrow')}</p>
            <div className="proj-books-scroll">
              <div className="proj-books-rail">
                <BookRecord
                  milestone
                  variant="navy"
                  milestoneTag={t('ledger.heroLabel')}
                  country={t('ledger.heroCountry')}
                  num={HERO.value}
                  suffix={HERO.suffix}
                  decimals={HERO.value.includes('.') ? 1 : 0}
                  reduced={reduced}
                  story={<Trans t={t} i18nKey={HERO.storyKey} components={{ strong: <strong /> }} />}
                  onPulse={() => pulse(HERO.globeTarget)}
                  onReset={releaseGlobe}
                />
                {rows.map((r, i) => (
                  <BookRecord
                    key={r.key}
                    variant={(i + 1) % 2 === 0 ? 'navy' : 'cream'}
                    country={t(`ledger.rows.${r.key}.name`)}
                    // Stamp label is the unit. The full "kits" unit label
                    // ("Learning Kits" / "Kits d'apprentissage") can't fit horizontally
                    // inside the ring at ≥11px, so the stamp uses the shared short form
                    // "KITS" (valid EN + FR). "Books"/"Livres" fit as-is.
                    stampLabel={r.unitKey === 'kits' ? 'KITS' : t(`ledger.units.${r.unitKey}`)}
                    num={r.num}
                    suffix="M+"
                    decimals={r.num.includes('.') ? 1 : 0}
                    reduced={reduced}
                    line={t(`ledger.rows.${r.key}.desc`)}
                    onPulse={() => pulse(r.globeTarget)}
                    onReset={releaseGlobe}
                  />
                ))}
                <span className="proj-books-shelf" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
