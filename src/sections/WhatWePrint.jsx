import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── What We Print ───────────────────────────────────────────────────────────
// Her 8 QFP categories + the two newer ones (Religious Books, Packaging and
// Gifting) — exact names / one-line descriptions / order. Content is LAW.
//
// R3b (client call): the ORIGINAL single-row horizontal card row is back — she
// liked the row; what she rejected was the page LOCK (the ScrollTrigger pin that
// trapped the visitor until every card had scrubbed past). So the row returns as
// a NATIVE horizontal scroller: NO pin, NO scroll-jack — vertical page scroll is
// never intercepted. The section holds its natural height and the page scrolls
// past it like any other. The row itself scrolls on its own axis via overflow-x
// (scroll-snap, momentum/touch-drag, shift+wheel) plus a pair of arrow buttons.
// The last card peeks cut-off at the right edge as the affordance that it scrolls.
//
// Card = our 3D "pop" skeleton (image breaks out of the card top) wearing her QFP
// skin: light card, name, one sentence. Photos are contained flat JPEGs today;
// transparent cutouts drop in later over the SAME filenames (product-0N.webp)
// with zero code change.

// On-palette fallback for the two categories (Religious Books, Packaging and
// Gifting) whose real photography does not exist yet: a navy card with a gold
// frame. It now ships as a real, swappable file (product-09/10.webp) so Harry
// overwrites those to drop in photos — the SVG below stays only as an onError
// safety net so a missing/renamed file never shows a broken frame.
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='560'%3E%3Crect width='700' height='560' fill='%230F2444'/%3E%3Crect x='44' y='44' width='612' height='472' fill='none' stroke='%239B7420' stroke-width='3'/%3E%3C/svg%3E"

const CARDS = [
  { key: 'educational', img: '/site-assets/homepage/products/product-01.webp', rot: -8 },
  { key: 'trade', img: '/site-assets/homepage/products/product-02.webp', rot: 7 },
  { key: 'coffee', img: '/site-assets/homepage/products/product-03.webp', rot: -9 },
  { key: 'general', img: '/site-assets/homepage/products/product-04.webp', rot: 8 },
  { key: 'children', img: '/site-assets/homepage/products/product-05.webp', rot: -7 },
  { key: 'kits', img: '/site-assets/homepage/products/product-06.webp', rot: 9 },
  { key: 'corporate', img: '/site-assets/homepage/products/product-07.webp', rot: -8 },
  { key: 'pod', img: '/site-assets/homepage/products/product-08.webp', rot: 7 },
  // Placeholder photography until real shots land — overwrite these two files.
  { key: 'religious', img: '/site-assets/homepage/products/product-09.webp', rot: -9 },
  { key: 'packaging', img: '/site-assets/homepage/products/product-10.webp', rot: 8 },
]

function Card({ c, t }) {
  const name = t(`cards.${c.key}.name`)
  return (
    <article className="wwp-card" id={`wwp-${c.key}`}>
      <div className="wwp-pop">
        <img
          className="wwp-img"
          src={c.img}
          alt={name}
          loading="lazy"
          draggable="false"
          onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER }}
          style={{ '--rot': `${c.rot}deg` }}
        />
      </div>
      <h3 className="wwp-name">{name}</h3>
      <p className="wwp-line">{t(`cards.${c.key}.line`)}</p>
    </article>
  )
}

function Header({ t, onPrev, onNext }) {
  return (
    <div className="wwp-head">
      <p className="wwp-eyebrow">{t('eyebrow')}</p>
      <h2 className="wwp-title">{t('titleLine1')} {t('titleLine2')}</h2>
      <div className="wwp-head-meta">
        <p className="wwp-lede">{t('lede')}</p>
        <div className="wwp-controls">
          <a href="#process" className="wwp-more">{t('more')}</a>
          {/* Arrow affordance — each nudges the row one card width. Real buttons,
              keyboard-focusable; the row itself is also focusable and arrow-keys
              scroll it natively. */}
          <div className="wwp-arrows">
            <button
              type="button"
              className="wwp-arrow focus-ring"
              onClick={onPrev}
              aria-label={t('scrollPrev')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
            </button>
            <button
              type="button"
              className="wwp-arrow focus-ring"
              onClick={onNext}
              aria-label={t('scrollNext')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WhatWePrint() {
  const { t } = useTranslation('homeWwp')
  const viewport = useRef(null)

  // One "card width" of scroll = the distance between two adjacent card starts
  // (card box + the flex gap), measured live so it stays right at any zoom/locale.
  const cardStep = () => {
    const vp = viewport.current
    if (!vp) return 356
    const cards = vp.querySelectorAll('.wwp-card')
    if (cards.length >= 2) {
      return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
    }
    return cards[0]?.getBoundingClientRect().width ?? 356
  }

  const scrollRow = (dir) => {
    const vp = viewport.current
    if (!vp) return
    vp.scrollBy({ left: dir * cardStep(), behavior: prefersReduced() ? 'auto' : 'smooth' })
  }

  return (
    <section id="what-we-print" data-theme="light" className="wwp-section">
      <div className="wwp-inner">
        <Header t={t} onPrev={() => scrollRow(-1)} onNext={() => scrollRow(1)} />
        {/* Native horizontal scroller. Focusable region (arrow keys scroll it);
            role/label name it for assistive tech. No pin, no page-scroll capture. */}
        <div
          className="wwp-viewport"
          ref={viewport}
          role="region"
          aria-label={t('rowLabel')}
          tabIndex={0}
        >
          <div className="wwp-track">
            {CARDS.map((c) => <Card key={c.key} c={c} t={t} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
