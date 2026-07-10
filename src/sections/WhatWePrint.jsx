import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
const CARDS = [
  {
    img: '/qfp/products/product-01.webp', rot: -8,
    name: 'Educational Book Printing',
    line: 'Textbooks, workbooks and ministry curriculum print for 25+ countries.',
  },
  {
    img: '/qfp/products/product-02.webp', rot: 7,
    name: 'Trade Books',
    line: 'Notebooks, counterbooks, pads and custom branded stationery.',
  },
  {
    img: '/qfp/products/product-03.webp', rot: -9,
    name: 'Coffee Table & Hardcase Books',
    line: "Premium photography, heritage and collector's editions with specialty finishes.",
  },
  {
    img: '/qfp/products/product-04.webp', rot: 8,
    name: 'General Books',
    line: 'Manga, graphic novels, puzzles and leisure reading.',
  },
  {
    img: '/qfp/products/product-05.webp', rot: -7,
    name: "Children's Books",
    line: 'Picture books, board books, colouring and pop-up formats.',
  },
  {
    img: '/qfp/products/product-06.webp', rot: 9,
    name: 'Learning Activity Kits',
    line: 'Hands-on activity kits, puzzle cards and DIY learning sets.',
  },
  {
    img: '/qfp/products/product-07.webp', rot: -8,
    name: 'Corporate, Banks & MNCs',
    line: 'Annual reports, welcome kits and financial documentation.',
  },
  {
    img: '/qfp/products/product-08.webp', rot: 7,
    name: 'Print on Demand',
    line: 'Single copy to short run, printed and shipped fast.',
  },
]

function Card({ c }) {
  return (
    <article className="wwp-card">
      <div className="wwp-pop">
        <img
          className="wwp-img"
          src={c.img}
          alt={c.name}
          loading="lazy"
          draggable="false"
          style={{ '--rot': `${c.rot}deg` }}
        />
      </div>
      <h3 className="wwp-name">{c.name}</h3>
      <p className="wwp-line">{c.line}</p>
    </article>
  )
}

function Header() {
  return (
    <div className="wwp-head">
      <div className="wwp-head-left">
        <p className="wwp-eyebrow">What We Print</p>
        <h2 className="wwp-title">Built on Precision.<br />Backed by Experience.</h2>
      </div>
      <div className="wwp-head-right">
        <p className="wwp-lede">
          Across educational books, trade titles, coffee table editions and more, we
          bring the same care and consistency to every project we take on.
        </p>
        <a href="#process" className="wwp-more">Learn more about our process</a>
      </div>
    </div>
  )
}

export default function WhatWePrint() {
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
          <Header />
          <div className="wwp-viewport" ref={viewport}>
            <div className="wwp-track" ref={track}>
              {CARDS.map((c) => <Card key={c.name} c={c} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
