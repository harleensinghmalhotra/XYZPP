import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── What We Print ───────────────────────────────────────────────────────────
// Replaces the Alternativ "Printing Services" placeholder. Content is LAW —
// her 8 QFP categories, exact names / subtitles / 4 bullets, exact order.
// Mechanic: a scroll-jacked horizontal track. The section holds (CSS sticky —
// CLS-free, like PrintPath) while vertical scroll scrubs the 8-card row LEFT
// until card 08 is fully in view, then releases. Reduced motion → native
// horizontal scroll with a thin scrollbar (no pin).
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
const CARDS = [
  { key: 'educational', img: '/qfp/products/product-01.webp', rot: -8 },
  { key: 'trade', img: '/qfp/products/product-02.webp', rot: 7 },
  { key: 'coffee', img: '/qfp/products/product-03.webp', rot: -9 },
  { key: 'general', img: '/qfp/products/product-04.webp', rot: 8 },
  { key: 'children', img: '/qfp/products/product-05.webp', rot: -7 },
  { key: 'kits', img: '/qfp/products/product-06.webp', rot: 9 },
  { key: 'corporate', img: '/qfp/products/product-07.webp', rot: -8 },
  { key: 'pod', img: '/qfp/products/product-08.webp', rot: 7 },
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
  return (
    <div className="wwp-head">
      <div className="wwp-head-left">
        <p className="wwp-eyebrow">{t('eyebrow')}</p>
        <h2 className="wwp-title">{t('titleLine1')}<br />{t('titleLine2')}</h2>
      </div>
      <div className="wwp-head-right">
        <p className="wwp-lede">{t('lede')}</p>
        <a href="#process" className="wwp-more">{t('more')}</a>
      </div>
    </div>
  )
}

export default function WhatWePrint() {
  const { t } = useTranslation('homeWwp')
  const wrap = useRef(null)
  const inner = useRef(null)
  const track = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    // Measure the live nav so the pin math derives the nav height from the real
    // header, never a second hardcoded magic number. The sticky panel then rests
    // exactly on the nav's bottom line (CSS reads --nav-h). Runs even in reduced
    // motion so scroll-margin-top still clears the nav for #services anchors.
    const measureNav = () => {
      const nav = document.querySelector('header.sticky') || document.querySelector('header')
      const h = nav ? Math.round(nav.getBoundingClientRect().height) : 86
      wrap.current?.style.setProperty('--nav-h', `${h}px`)
      return h
    }
    measureNav()

    if (reduced) return
    const ctx = gsap.context(() => {
      // Pin/scrub only on desktop; ≤900px falls back to native horizontal scroll
      // (CSS). matchMedia auto-reverts the branch — including the inline height —
      // when the query stops matching, so mobile never gets a tall empty section.
      const mm = gsap.matchMedia()
      mm.add('(min-width: 901px)', () => {
        // Sequenced pin, three beats scrubbed to scroll:
        //   1. HOLD   — the heading rests fully clear below the nav (reveal-y = 0).
        //   2. REVEAL — the header/viewport stack lifts, sliding the heading up and
        //               out (it vanishes at the panel's top edge = the nav line, so
        //               it is NEVER occluded under the nav) and centring the cards.
        //   3. SCRUB  — the card row scrubs left until card 08 is in view.
        let navH = 86
        let travel = 0
        let revealY = 0
        let holdDist = 0
        let revealDist = 0

        const measure = () => {
          navH = measureNav()
          const panelH = window.innerHeight - navH
          // Reset transforms so the geometry we read is the untranslated layout.
          gsap.set(inner.current, { y: 0 })
          gsap.set(track.current, { x: 0 })

          travel = Math.max(0, track.current.scrollWidth - viewport.current.clientWidth)

          // Lift needed so the card ROW centres vertically in the panel once the
          // header has left. Measured against the panel top (= sticky top).
          const innerTop = inner.current.getBoundingClientRect().top
          const card = track.current.querySelector('.wwp-card')
          const cr = card.getBoundingClientRect()
          const cardCentreInPanel = cr.top - innerTop + cr.height / 2
          revealY = Math.max(0, Math.round(cardCentreInPanel - panelH / 2))

          // Beat lengths in scroll px. Hold = a readable pause on the heading;
          // reveal ≈ the lift distance for a 1:1 slide feel.
          holdDist = Math.round(panelH * 0.22)
          revealDist = Math.max(revealY, Math.round(panelH * 0.4))

          // Section height = panel + all three beats, so the panel stays pinned
          // for exactly hold+reveal+travel px of scroll.
          wrap.current.style.height = `${panelH + holdDist + revealDist + travel}px`
        }
        measure()

        // The header fades as it lifts so it's gone BEFORE it reaches the nav line
        // — the heading is never seen cut at the nav edge, only cleanly handed off.
        const head = inner.current.querySelector('.wwp-head')

        // Smooth scrub follow (~0.3s) so beats ease behind the wheel, not 1:1 steps.
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: wrap.current,
            start: () => `top top+=${navH}`, // fires when the panel begins to stick
            end: () => `+=${holdDist + revealDist + travel}`,
            scrub: 0.3,
            invalidateOnRefresh: true,
            onRefresh: measure,
          },
        })
        tl.to(inner.current, { y: 0, duration: holdDist })                 // 1. hold
          .to(inner.current, { y: () => -revealY, duration: revealDist })  // 2. reveal
          .to(head, { opacity: 0, duration: revealDist * 0.6, ease: 'power1.in' }, '<') // fade with the lift
          .to(track.current, { x: () => -travel, duration: travel })       // 3. scrub

        return () => {
          tl.scrollTrigger?.kill()
          tl.kill()
          gsap.set([inner.current, track.current], { clearProps: 'transform' })
          gsap.set(head, { clearProps: 'opacity' })
          wrap.current.style.height = ''
        }
      })
    }, wrap)
    return () => ctx.revert()
  }, [reduced])

  // Refresh after web fonts settle (card widths shift → travel changes).
  useEffect(() => {
    if (reduced || !document.fonts) return
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [reduced])

  return (
    <section
      id="services"
      ref={wrap}
      data-theme="light"
      className={`wwp-section ${reduced ? 'is-reduced' : ''}`}
    >
      <div className="wwp-sticky">
        <div className="wwp-inner" ref={inner}>
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
