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
  const track = useRef(null)
  const viewport = useRef(null)
  const [reduced] = useState(prefersReduced)

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // Pin/scrub only on desktop; ≤900px falls back to native horizontal scroll
      // (CSS). matchMedia auto-reverts the branch — including the inline height —
      // when the query stops matching, so mobile never gets a tall empty section.
      const mm = gsap.matchMedia()
      mm.add('(min-width: 901px)', () => {
        // Smooth scrub (~0.3s follow) so the row eases behind the scroll rather
        // than stepping 1:1 — transform-only, GPU, no layout per frame.
        const xTo = gsap.quickTo(track.current, 'x', { duration: 0.32, ease: 'power3' })
        let travel = 0

        const measure = () => {
          travel = Math.max(0, track.current.scrollWidth - viewport.current.clientWidth)
          // Section height = one viewport + the horizontal travel, so the sticky
          // panel holds for exactly `travel` px of scroll (1:1 wheel feel).
          wrap.current.style.height = `${window.innerHeight + travel}px`
        }
        measure()

        const st = ScrollTrigger.create({
          trigger: wrap.current,
          start: 'top top',
          end: 'bottom bottom',
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
