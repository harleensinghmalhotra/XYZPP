import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── What We Print ───────────────────────────────────────────────────────────
// Replaces the Alternativ "Printing Services" placeholder. Content is LAW —
// her 8 QFP categories, exact names / subtitles / 4 bullets, exact order.
// Mechanic: a scroll-jacked horizontal track. The sticky panel rests on the nav's
// bottom line (top: --nav-h) so the one-line heading + intro + cards all sit in
// the clear BELOW the nav and travel TOGETHER — visible through the whole scrub —
// while vertical scroll scrubs the 8-card row LEFT until card 08 is in view, then
// releases. Reduced motion → native horizontal scroll, thin scrollbar (no pin).
//
// Card = our 3D "pop" skeleton (image breaks out of the card top via a negative
// margin + slight rotate) wearing her QFP skin: light card, number badge, name,
// subtitle, 4 dash bullets — body text on a light card, not her solid fills.
// Photos are contained flat JPEGs today; transparent cutouts drop in later over
// the SAME filenames (product-0N.webp) with zero code change.

// v2 assets are all the SAME 700×560 alpha canvas, so ONE pop geometry (width +
// marginTop, in CSS) fits all 8 — the only per-card value is the alternating
// tilt. Content model (Claude Fable): cutout + name + ONE sentence. Names/order
// are law; sentences are the client's condensed one-liners.
// Names/descriptions resolve via t(`cards.${key}.name|line`); keys/order/img/rot
// are law — only the human-readable text is translated.
// On-palette placeholder for the two new categories (Religious Books, Packaging
// and Gifting) whose photography does not exist yet: a navy card with a gold
// frame, inlined as an SVG data URI so it never 404s and needs no CSS/layout
// change. Harry to supply /qfp/products/product-09.webp (Religious Books) and
// /qfp/products/product-10.webp (Packaging and Gifting); swap the img paths below
// once they land — zero other code change.
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='560'%3E%3Crect width='700' height='560' fill='%230F2444'/%3E%3Crect x='44' y='44' width='612' height='472' fill='none' stroke='%239B7420' stroke-width='3'/%3E%3C/svg%3E"

const CARDS = [
  { key: 'educational', img: '/qfp/products/product-01.webp', rot: -8 },
  { key: 'trade', img: '/qfp/products/product-02.webp', rot: 7 },
  { key: 'coffee', img: '/qfp/products/product-03.webp', rot: -9 },
  { key: 'general', img: '/qfp/products/product-04.webp', rot: 8 },
  { key: 'children', img: '/qfp/products/product-05.webp', rot: -7 },
  { key: 'kits', img: '/qfp/products/product-06.webp', rot: 9 },
  { key: 'corporate', img: '/qfp/products/product-07.webp', rot: -8 },
  { key: 'pod', img: '/qfp/products/product-08.webp', rot: 7 },
  // Awaiting real photography — see PLACEHOLDER note above.
  { key: 'religious', img: PLACEHOLDER, rot: -9 },
  { key: 'packaging', img: PLACEHOLDER, rot: 8 },
]

function Card({ c, t }) {
  const name = t(`cards.${c.key}.name`)
  return (
    <article className="wwp-card">
      <div className="wwp-pop">
        <img
          className="wwp-img"
          src={c.img}
          alt={name}
          loading="lazy"
          draggable="false"
          style={{ '--rot': `${c.rot}deg` }}
        />
      </div>
      <h3 className="wwp-name">{name}</h3>
      <p className="wwp-line">{t(`cards.${c.key}.line`)}</p>
    </article>
  )
}

function Header({ t }) {
  // R2: the title is ONE line (no <br>) — the two content strings joined with a
  // space. JS fits it to the width per-locale. Intro copy + link reflow BELOW it.
  return (
    <div className="wwp-head">
      <p className="wwp-eyebrow">{t('eyebrow')}</p>
      <h2 className="wwp-title">{t('titleLine1')} {t('titleLine2')}</h2>
      <div className="wwp-head-meta">
        <p className="wwp-lede">{t('lede')}</p>
        <a href="#process" className="wwp-more">{t('more')}</a>
      </div>
    </div>
  )
}

export default function WhatWePrint() {
  const { t, i18n } = useTranslation('homeWwp')
  const wrap = useRef(null)
  const track = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    const isDesktop = () => window.matchMedia('(min-width: 901px)').matches

    // Derive the nav height from the live header (never a second hardcoded number)
    // so the pinned panel can rest exactly on the nav's bottom line (CSS --nav-h).
    // Runs in every mode so scroll-margin-top clears the nav for #services anchors.
    const measureNav = () => {
      const nav = document.querySelector('header.sticky') || document.querySelector('header')
      const h = nav ? Math.round(nav.getBoundingClientRect().height) : 86
      wrap.current?.style.setProperty('--nav-h', `${h}px`)
      return h
    }

    // ONE-LINE heading fit to its width per-locale, by measurement (Harry's R2
    // call — clamp by measurement, no magic numbers). `nowrap` guarantees a single
    // line; we scale the font down from the CSS ceiling only if the natural width
    // overflows the available column. Mobile keeps the CSS size and may wrap.
    const fitTitle = () => {
      const title = wrap.current?.querySelector('.wwp-title')
      if (!title) return
      title.style.fontSize = '' // reset to the CSS ceiling before measuring
      if (!isDesktop()) return
      const ceiling = parseFloat(getComputedStyle(title).fontSize)
      const target = title.clientWidth * 0.96 // leave a little side margin — "comfortably"
      const natural = title.scrollWidth
      if (target > 0 && natural > target) {
        title.style.fontSize = `${Math.max(24, Math.floor(ceiling * (target / natural)))}px`
      }
    }

    measureNav()
    fitTitle()

    // Keep the fit correct across resizes and late font loads in EVERY mode
    // (reduced motion skips the GSAP branch, so it needs its own listeners).
    const onResize = () => { measureNav(); fitTitle() }
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(() => { fitTitle(); ScrollTrigger.refresh() })

    let ctx
    if (!reduced) {
      ctx = gsap.context(() => {
        // Pin/scrub only on desktop; ≤900px → native horizontal scroll (CSS).
        // matchMedia auto-reverts the branch (incl. the inline height) off-query.
        const mm = gsap.matchMedia()
        mm.add('(min-width: 901px)', () => {
          // Pin-together: the panel holds on the nav line and the card row scrubs
          // left. Heading + intro + cards stay on screen for the entire scrub; the
          // heading never touches the nav because the panel's top edge IS the nav
          // line. Smooth follow (~0.3s) so the row eases behind the wheel.
          const xTo = gsap.quickTo(track.current, 'x', { duration: 0.32, ease: 'power3' })
          let navH = 86
          let travel = 0
          const measure = () => {
            navH = measureNav()
            fitTitle()
            gsap.set(track.current, { x: 0 })
            travel = Math.max(0, track.current.scrollWidth - viewport.current.clientWidth)
            // Section height = panel + travel, so the panel holds for exactly
            // `travel` px of scroll (1:1 wheel feel), then releases.
            wrap.current.style.height = `${window.innerHeight - navH + travel}px`
          }
          measure()

          const st = ScrollTrigger.create({
            trigger: wrap.current,
            start: () => `top top+=${navH}`, // fires when the panel begins to stick
            end: () => `+=${travel}`,
            invalidateOnRefresh: true,
            onRefresh: measure,
            onUpdate: (self) => xTo(-travel * self.progress),
          })
          return () => {
            st.kill()
            gsap.set(track.current, { x: 0 })
            wrap.current.style.height = ''
          }
        })
      }, wrap)
    }
    return () => {
      window.removeEventListener('resize', onResize)
      ctx?.revert()
    }
  }, [reduced, i18n.language])

  return (
    <section
      id="services"
      ref={wrap}
      data-theme="light"
      className={`wwp-section ${reduced ? 'is-reduced' : ''}`}
    >
      <div className="wwp-sticky">
        <div className="wwp-inner">
          <Header t={t} />
          <div className="wwp-viewport" ref={viewport}>
            <div className="wwp-track" ref={track}>
              {CARDS.map((c) => <Card key={c.key} c={c} t={t} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
