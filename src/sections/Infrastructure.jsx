import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

// ── Infrastructure — "Built for Scale. Engineered for Trust." ────────────────
// Light proof band (cream2). Three alternating photo/content facility rows, a
// Hero-Video-Dialog walkthrough card, and an "Our People" scene grid. Every photo
// and the video are PENDING from the client — each surface is a premium navy
// placeholder that a real asset drops straight into (silent CSS-bg: a missing file
// simply reveals the placeholder, never a broken frame). Drop-in paths are exact:
//   public/qfp/infra/facility-01.webp … facility-03.webp
//   public/qfp/infra/facility-walkthrough.mp4   (+ flip VIDEO_READY → true)
//   public/qfp/infra/people-01.webp … people-04.webp

// Walkthrough video toggle. Stays false until the client delivers the MP4; the
// play button then goes live. COMPLIANCE: the final video must ship with closed
// captions + a text transcript (accessibility / same client-permission bar as the
// trust strips) BEFORE VIDEO_READY is flipped on.
const VIDEO_READY = false
const VIDEO_SRC = '/qfp/infra/facility-walkthrough.mp4'

const FACILITIES = [
  {
    n: '01',
    title: '3 Print Facilities',
    body: 'State-of-the-art production units across Navi Mumbai, totalling 2,00,000 sq. ft., built for efficiency, safety and scale.',
    caption: 'Taloja MIDC, Navi Mumbai',
    ph: 'PHOTO · PRINT FACILITIES, NAVI MUMBAI',
  },
  {
    n: '02',
    title: '20 Printing Towers, 5 Sheet Fed',
    body: 'High speed presses supported by 17 folders, 10 binding and stitching lines, 6 automatic thread sewing machines and 2 digital presses, for precision at any scale.',
    caption: '30,000 MT Shipped Annually',
    ph: 'PHOTO · PRESS HALL, PRINTING TOWERS',
  },
  {
    n: '03',
    title: '2 Warehouse & Fulfilment Centres',
    body: 'Automated collating, kitting and shrink-wrapping, up to 10,000 kits processed every single day.',
    caption: 'Navi Mumbai · Export-Ready',
    ph: 'PHOTO · WAREHOUSE & FULFILMENT',
  },
]

const PEOPLE = [
  { n: '01', cap: 'Press Floor Team' },
  { n: '02', cap: 'Quality Check' },
  { n: '03', cap: 'Kitting & Packing' },
  { n: '04', cap: 'Leadership Team' },
]

// Silent drop-in photo surface: navy placeholder (with a DM Mono note) sits UNDER
// the real image layer, so a delivered .webp covers it with zero code change.
function InfraPhoto({ src, note, className = '' }) {
  return (
    <div className={`infra-photo ${className}`}>
      <div className="infra-photo-base" aria-hidden="true" />
      <span className="infra-photo-note" aria-hidden="true">{note}</span>
      <div
        className="infra-photo-img"
        aria-hidden="true"
        style={{ backgroundImage: `url(${src})` }}
      />
    </div>
  )
}

export default function Infrastructure() {
  const root = useRef(null)
  const [reduced] = useState(prefersReduced)
  const [videoOpen, setVideoOpen] = useState(false)
  const closeRef = useRef(null)

  // dialog: Esc closes, lock body scroll, focus the close button on open
  useEffect(() => {
    if (!videoOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setVideoOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [videoOpen])

  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root)
      gsap.set(q('.infra-eyebrow, .infra-title, .infra-people-title, .infra-people-body'), { autoAlpha: 0, y: 16 })
      gsap.set(q('.infra-card'), { autoAlpha: 0, y: 32 })
      gsap.set(q('.infra-video'), { autoAlpha: 0, y: 28 })
      gsap.set(q('.infra-person'), { autoAlpha: 0, y: 22 })

      // header + facility cards
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 74%', once: true } })
      tl.to(q('.infra-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.infra-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.08)
        .to(q('.infra-card'), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.2)

      // video card — its own trigger
      gsap.timeline({ scrollTrigger: { trigger: q('.infra-video'), start: 'top 84%', once: true } })
        .to(q('.infra-video'), { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform,opacity,visibility' })

      // people block — heading + scene grid cascade
      const tl3 = gsap.timeline({ scrollTrigger: { trigger: q('.infra-people'), start: 'top 80%', once: true } })
      tl3.to(q('.infra-people-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' })
        .to(q('.infra-people-body'), { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, 0.12)
        .to(q('.infra-person'), { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.18)
    }, root)
    return () => ctx.revert()
  }, [reduced])

  // Open the dialog either way — when the MP4 isn't in yet it shows a graceful
  // "coming soon" panel (never a broken <video>), so the click is always safe.
  const onPlay = () => setVideoOpen(true)

  return (
    <section id="infrastructure" ref={root} data-theme="light" className="infra" aria-labelledby="infra-title">
      <div className="infra-inner">
        {/* ── HEADER ── */}
        <header className="infra-head">
          <p className="infra-eyebrow">Infrastructure</p>
          <h2 id="infra-title" className="infra-title">
            Built for Scale. <span className="infra-title-light">Engineered for Trust.</span>
          </h2>
        </header>

        {/* ── THREE FACILITY CARDS — uniform vertical cards, one row ── */}
        <div className="infra-cards">
          {FACILITIES.map((f) => (
            <article key={f.n} className="infra-card">
              <InfraPhoto src={`/qfp/infra/facility-${f.n}.webp`} note={f.ph} className="infra-card-photo" />
              <h3 className="infra-card-title">{f.title}</h3>
              <p className="infra-card-text">{f.body}</p>
              <p className="infra-card-cap">{f.caption}</p>
            </article>
          ))}
        </div>

        {/* ── VIDEO — Hero Video Dialog (recreated, no shadcn) ── */}
        <div className="infra-video">
          <button
            type="button"
            className="infra-video-thumb"
            onClick={onPlay}
            data-pending={!VIDEO_READY}
            aria-label={VIDEO_READY ? 'Play facilities walkthrough video' : 'Preview facilities walkthrough — video coming soon'}
          >
            <span className="infra-video-note" aria-hidden="true">VIDEO · INSIDE OUR FACILITIES</span>
            <span className="infra-play" aria-hidden="true">
              <span className="infra-play-ring" />
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            </span>
          </button>
        </div>

        {/* ── OUR PEOPLE ── */}
        <div className="infra-people">
          <h3 className="infra-people-title">
            <span className="infra-foil">600+</span> Hands Behind Every Shipment.
          </h3>
          <p className="infra-people-body">
            Press operators, quality inspectors, kitting teams and logistics specialists, working across
            shifts, trained to the same standard at every facility.
          </p>
          <div className="infra-people-grid">
            {PEOPLE.map((p) => (
              <figure key={p.n} className="infra-person">
                <InfraPhoto src={`/qfp/infra/people-${p.n}.webp`} note={p.cap.toUpperCase()} className="infra-photo--portrait" />
                <figcaption className="infra-person-cap">{p.cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      {/* ── VIDEO DIALOG — backdrop blur + navy scrim; Esc / click-out close ── */}
      {videoOpen && (
        <div
          className="infra-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Facilities walkthrough video"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoOpen(false) }}
        >
          <div className="infra-dialog-panel">
            <button ref={closeRef} type="button" className="infra-dialog-close" onClick={() => setVideoOpen(false)} aria-label="Close video">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {VIDEO_READY ? (
              // NOTE: ship with <track kind="captions"> + linked transcript before go-live.
              <video className="infra-dialog-video" src={VIDEO_SRC} controls autoPlay playsInline />
            ) : (
              <div className="infra-dialog-ph" aria-hidden="true">
                <span className="infra-video-note">VIDEO · INSIDE OUR FACILITIES</span>
                <span className="infra-dialog-soon">Walkthrough footage coming soon</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
