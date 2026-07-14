import { useTranslation } from 'react-i18next'

// ── What We Print ───────────────────────────────────────────────────────────
// Her 8 QFP categories + the two newer ones (Religious Books, Packaging and
// Gifting) — exact names / one-line descriptions / order. Content is LAW.
//
// R3 (client call): the horizontal scroll-jack is GONE. She said the pin trapped
// the visitor — they had to scrub through every card before the page would move
// on, and it read as forced. So this is now a NORMAL vertical section: heading,
// intro, then a calm multi-column grid of the ten category cards that fits within
// the section's own height. The visitor scrolls past it like any other section.
// No ScrollTrigger, no pin, no track — nothing here touches the page scroll.
//
// Card = our 3D "pop" skeleton (image breaks out of the card top) wearing her QFP
// skin: light card, name, one sentence. Photos are contained flat JPEGs today;
// transparent cutouts drop in later over the SAME filenames (product-0N.webp)
// with zero code change.

// On-palette placeholder for the two categories (Religious Books, Packaging and
// Gifting) whose photography does not exist yet: a navy card with a gold frame,
// inlined as an SVG data URI so it never 404s and needs no CSS/layout change.
// Harry to supply /qfp/products/product-09.webp (Religious Books) and
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
  const { t } = useTranslation('homeWwp')
  return (
    <section id="services" data-theme="light" className="wwp-section">
      <div className="wwp-inner">
        <Header t={t} />
        <div className="wwp-grid">
          {CARDS.map((c) => <Card key={c.key} c={c} t={t} />)}
        </div>
      </div>
    </section>
  )
}
