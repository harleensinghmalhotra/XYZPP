import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReduced } from '@/lib/useReducedMotion'
import FacilityBook from '@/components/FacilityBook'

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
const VIDEO_READY = true
const VIDEO_SRC = '/qfp/video/facilities.mp4'

// "Our People" grid ("600+ Hands Behind Every Shipment" — Press Floor Team /
// Quality Check / Kitting & Packing / Leadership Team). Hidden, not deleted:
// pending client photography. Locale keys stay so the block returns by flipping
// this to true once real team photos land. Same pattern as SHOW_STRIP_3.
const SHOW_TEAM_SECTION = false

// The three facility cards are now the InfraBooks book stack (Lane 15): the copy
// still lives in the same `facilities.<n>.*` keys, re-paginated into book pages by
// InfraBooks.jsx. Only the card GRID moved — the video + People blocks below stay.

// People captions resolved from people.captions.<n>; each team carries a stroke
// icon that names its role, drawn onto the same placeholder panel as the facilities.
const PEOPLE = [
  { n: '01', icon: 'roller' },     // Press Floor Team → press operator / roller
  { n: '02', icon: 'check' },      // Quality Check → magnifier / check
  { n: '03', icon: 'kit' },        // Kitting & Packing → open box
  { n: '04', icon: 'leadership' }, // Leadership Team → people / leadership
]

// Team stroke icons — same system as FacilityIcon (fill none, gold currentColor,
// pathLength-normalised) so the placeholder mark reads as one site-wide language.
function TeamIcon({ name }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', pathLength: 1 }
  return (
    <svg className="infra-ph-icon" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      {name === 'roller' && ( /* press operator — two inked rollers feeding a sheet */
        <>
          <rect x="9" y="13" width="30" height="7" rx="3.5" {...s} />
          <rect x="9" y="24" width="30" height="7" rx="3.5" {...s} />
          <path d="M24 31v8M19 39h10" {...s} />
        </>
      )}
      {name === 'check' && ( /* quality — magnifier with a check inside */
        <>
          <circle cx="21" cy="21" r="11.5" {...s} />
          <path d="M29.5 29.5 39 39" {...s} />
          <path d="M16 21.5l3.8 3.8L27 17.5" {...s} />
        </>
      )}
      {name === 'kit' && ( /* kitting — an open carton, flaps splayed */
        <>
          <path d="M24 20 10 14v16l14 7 14-7V14L24 20Z" {...s} />
          <path d="M10 14l14 6 14-6M24 20v17" {...s} />
          <path d="M10 14l5-5 9 5M38 14l-5-5-9 5" {...s} />
        </>
      )}
      {name === 'leadership' && ( /* leadership — a lead figure with the team behind */
        <>
          <circle cx="24" cy="15" r="5" {...s} />
          <path d="M14 35c0-6 4.5-10 10-10s10 4 10 10" {...s} />
          <circle cx="10" cy="20" r="3.4" {...s} />
          <path d="M4 32c0-3.5 2.6-6 6-6" {...s} />
          <circle cx="38" cy="20" r="3.4" {...s} />
          <path d="M44 32c0-3.5-2.6-6-6-6" {...s} />
        </>
      )}
    </svg>
  )
}

// Team portrait placeholder — the exact facility placeholder language on the 4/5
// portrait frame: solid deep-navy ground, faint tonal dot grid, gold stroke mark,
// DM Mono caption. Photos were pulled (Harry's call); a real drop restores here.
function TeamPlaceholder({ icon, note }) {
  return (
    <div className="infra-photo infra-photo--portrait infra-ph" aria-hidden="true">
      {/* TODO(Harry): real team photo drops here */}
      <div className="infra-ph-pattern" />
      <div className="infra-ph-mark">
        <TeamIcon name={icon} />
        <span className="infra-ph-cap">{note}</span>
      </div>
    </div>
  )
}

export default function Infrastructure() {
  const { t } = useTranslation('homeInfraSection')
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
      gsap.set(q('.ib-stage'), { autoAlpha: 0, y: 32 })
      gsap.set(q('.infra-video'), { autoAlpha: 0, y: 28 })
      gsap.set(q('.infra-person'), { autoAlpha: 0, y: 22 })

      // header + facility cards
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 74%', once: true } })
      tl.to(q('.infra-eyebrow'), { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(q('.infra-title'), { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.08)
        .to(q('.ib-stage'), { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', clearProps: 'transform,opacity,visibility' }, 0.2)

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
          <p className="infra-eyebrow">{t('eyebrow')}</p>
          <h2 id="infra-title" className="infra-title">
            {t('titleA')} <span className="infra-title-light">{t('titleB')}</span>
          </h2>
        </header>

        {/* ── THE BOOK STACK — the three facility cards, rebuilt as a stack of
             hardcover books you open and flip through (Lane 15, Cases mechanics).
             Books 4–5 are reserved placeholder slots awaiting content. ── */}
        <FacilityBook />

        {/* ── VIDEO — walkthrough placeholder, sits between the facility cards and the
             People block (client request). Gated by VIDEO_READY (false): the click opens
             a graceful "coming soon" panel, never a broken <video>. ── */}
        <div className="infra-video">
          <button
            type="button"
            className="infra-video-thumb"
            onClick={onPlay}
            data-pending={!VIDEO_READY}
            aria-label={VIDEO_READY ? t('video.playAria') : t('video.previewAria')}
          >
            <span className="infra-video-note" aria-hidden="true">{t('video.note')}</span>
            <span className="infra-play" aria-hidden="true">
              <span className="infra-play-ring" />
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
            </span>
          </button>
        </div>

        {/* ── OUR PEOPLE — the closing note of the section (client request).
             Gated behind SHOW_TEAM_SECTION (pending client photography). ── */}
        {SHOW_TEAM_SECTION && (
          <div className="infra-people">
            <h3 className="infra-people-title">
              <span className="infra-foil">{t('people.count')}</span> {t('people.title')}
            </h3>
            <p className="infra-people-body">{t('people.body')}</p>
            <div className="infra-people-grid">
              {PEOPLE.map((p) => (
                <figure key={p.n} className="infra-person">
                  <TeamPlaceholder icon={p.icon} note={t('people.photoNote', { team: t(`people.captions.${p.n}`) })} />
                  <figcaption className="infra-person-cap">{t(`people.captions.${p.n}`)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── VIDEO DIALOG — backdrop blur + navy scrim; Esc / click-out close ── */}
      {videoOpen && (
        <div
          className="infra-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={t('video.dialogAria')}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setVideoOpen(false) }}
        >
          <div className="infra-dialog-panel">
            <button ref={closeRef} type="button" className="infra-dialog-close" onClick={() => setVideoOpen(false)} aria-label={t('video.closeAria')}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {VIDEO_READY ? (
              // Caption-ready: the <track> ships with the element so a <video> is never
              // shipped without captions. Drop facility-walkthrough.vtt beside the mp4
              // (+ a linked transcript) before flipping VIDEO_READY on.
              <video className="infra-dialog-video" src={VIDEO_SRC} poster="/qfp/video/facilities-poster.jpg" controls autoPlay playsInline>
                <track kind="captions" srcLang="en" src="/qfp/video/facilities.vtt" label={t('video.captionsLabel')} default />
              </video>
            ) : (
              <div className="infra-dialog-ph" aria-hidden="true">
                <span className="infra-video-note">{t('video.note')}</span>
                <span className="infra-dialog-soon">{t('video.comingSoon')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
