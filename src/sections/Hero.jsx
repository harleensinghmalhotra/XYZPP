import { useEffect, useRef, useMemo, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import gsap from 'gsap'
import { prefersReduced } from '@/lib/useReducedMotion'
import TypingBookOverlay from './TypingBookOverlay'
import { typingSound } from '@/lib/typingSound'

// ── QFP hero skin — RESKINNED to Ekta's design language. ──
// The client rejected motion in the hero background and the rotating seal, so the
// LiquidEther WebGL fluid layer is removed (the static hero-aurora reproduces its
// settled resting appearance — the aurora is exactly what showed through the idle
// near-transparent ether canvas), and the "QFP STORIES" spinning seal is gone.
// The gold-foil headline is relaxed to Ekta's flat solid gold accent.
//
// PHASE 3.4 — TYPING BOOK: the reveal no longer crossfades a blank cover into a
// pre-lettered bitmap. The BLANK spread is the permanent base, and the page
// collage is LIVE text typed on by <TypingBookOverlay>, scrubbed to scroll. The
// old lettered asset (BOOK_LETTERED) is intentionally kept in the repo untouched
// — the blank-base + live-text split is exactly what makes a future asset swap
// from Ekta trivial (see TypingBookOverlay.jsx).
const BOOK_BASE = '/qfp/hero/qfp-book-cover.webp' // BLANK spread — permanent base
const BOOK_LETTERED = '/qfp/hero/qfp-book-pages.webp' // retired pre-lettered art (kept for Ekta's future regen; not rendered)
const BUBBLE = '/qfp/hero/qfp-bubble.webp'
const GOLD = '#C89A3C' // System B on-navy accent gold (matches ledger-num, 5.3:1 on navy)

// Bloom figures. w / cx / cy are in **vw** (offsets from the book centre) so the
// whole spread scales with the book at any viewport. Layout matches Ekta's
// mockup (qfp-homepage-v17.html): the 4 kids render BEHIND the book (layer:'back')
// so the pages crop them — the two centre kids peek head+shoulders+chest over the
// page tops (page-top edge ≈ -20.3vw / -19.1vw from book centre), the two outer
// kids stand at ground level and are cropped by the book's side edges (≈ ±42vw).
// Props sit in FRONT of the book (layer:'front'). Same scatter-to-place scrub:
// each starts scaled to 0 at its final (cx,cy) and grows in over the bloom window.
// Bloom figures. w / cx / cy are in **vw** (offsets from the book centre). The
// book keeps its ORIGINAL full-width size and rise — only these assets move to
// fit around it. The 4 kids render BEHIND the book (layer:'back') so the pages
// crop them: the two centre kids peek head+shoulders+chest over the page tops
// (page-top edge ≈ -20.3vw / -19.1vw from book centre), the two outer kids stand
// at ground level and are cropped by the book's side edges (≈ ±43vw). Props sit
// in FRONT (layer:'front'). Same scatter-to-place scrub: each starts scaled to 0
// at its final (cx,cy) and grows in over the bloom window.
const CUTOUTS = [
  // BACK layer — behind the book, cropped by the pages / side edges
  { key: 'boy-red',      src: '/qfp/hero/qfp-kid-boy-red.webp',       layer: 'back', w: 11.5, cx: -21.3, cy: -16.5, z: 2 }, // behind LEFT page, head+shoulders+chest over the top edge
  { key: 'girl-blonde',  src: '/qfp/hero/qfp-kid-girl-blonde.webp',   layer: 'back', w: 15.5, cx: 20.3,  cy: -15.5, z: 2 }, // behind RIGHT page, upper body over the top edge
  { key: 'girl-mustard', src: '/qfp/hero/qfp-kid-girl-mustard.webp',  layer: 'back', w: 15.0, cx: -42.0, cy: -6.0,  z: 1 }, // far LEFT ground, cropped by the book's left edge
  { key: 'boy-green',    src: '/qfp/hero/qfp-kid-boy-green.webp',      layer: 'back', w: 10.5, cx: 41.0,  cy: -6.0,  z: 1 }, // far RIGHT ground, cropped by the book's right edge
  // FRONT layer — the "bouquet": props sit ON the open pages, clustered around the
  // spine, and bloom from the centre (drift:true → grow from ~0.15 scale near the
  // spine and drift out to these final spots). All stay below y≈360px at landed so
  // they never reach the kids' faces / bubbles (which live in the upper band).
  // Order sets the pop sequence; bigger central pieces carry higher z (in front).
  { key: 'prop-balloon', src: '/qfp/hero/prop-balloon.webp',          layer: 'front', drift: true, w: 10.0, cx: 0.0,   cy: -9.0,  z: 6 }, // big, rises from the spine
  { key: 'prop-globe',   src: '/qfp/hero/prop-globe.webp',            layer: 'front', drift: true, w: 16.5, cx: -9.0,  cy: -3.0,  z: 5 }, // big, centre-left over the left page
  { key: 'prop-owl',     src: '/qfp/hero/prop-owl.webp',              layer: 'front', drift: true, w: 14.0, cx: 9.0,   cy: -3.0,  z: 4 }, // big, centre-right over the right page
  { key: 'prop-bulb',    src: '/qfp/hero/prop-bulb.webp',             layer: 'front', drift: true, w: 7.0,  cx: 14.0,  cy: -12.0, z: 3 }, // medium, upper right page
  { key: 'prop-blocks',  src: '/qfp/hero/prop-blocks.webp',           layer: 'front', drift: true, w: 6.5,  cx: -17.0, cy: -4.0,  z: 3 }, // medium, left flank (spreads onto left page)
  { key: 'prop-pencil',  src: '/qfp/hero/prop-pencil.webp',           layer: 'front', drift: true, w: 7.5,  cx: 18.0,  cy: 2.0,   z: 2 }, // medium, right-lower flank
  { key: 'prop-plane',   src: '/qfp/hero/qfp-prop-plane.webp',        layer: 'front', drift: true, w: 6.0,  cx: -12.0, cy: -15.0, z: 2 }, // repositioned INSIDE the spread, upper-left page
  { key: 'prop-bookstack', src: '/qfp/hero/qfp-prop-bookstack.webp', layer: 'front', w: 12.5, cx: -33.0, cy: 3.0,   z: 5 }, // grounded accent, book's lower-left (stays — scale in place)
]

// 4 speech bubbles — one floating CLEARLY above each kid's head (front layer),
// tail pointing DOWN toward that kid, never touching a face or hands. Text is
// REAL HTML (translated via <Trans>) inside a single transform wrapper so it
// scales WITH the bubble. `tk` = translation key in home.bubbles; the gold key
// figure is wrapped in <1></1> in the locale string. Rest navy.
const BUBBLES = [
  { key: 'b-mustard', tk: 'mustard', forKey: 'girl-mustard', w: 11.5, cx: -38.0, cy: -24.0 },
  { key: 'b-red', tk: 'red', forKey: 'boy-red', w: 11.5, cx: -11.0, cy: -27.0 },
  { key: 'b-blonde', tk: 'blonde', forKey: 'girl-blonde', w: 11.5, cx: 11.0, cy: -27.0 },
  { key: 'b-green', tk: 'green', forKey: 'boy-green', w: 11.8, cx: 39.0, cy: -24.0 },
]

export default function Hero() {
  const { t } = useTranslation('home')
  const reduced = prefersReduced()
  const section = useRef(null)
  const pin = useRef(null)
  const textWrap = useRef(null)
  const titleGhost = useRef(null)
  const copyGroup = useRef(null)
  const riseWrap = useRef(null)
  const typing = useRef(null) // TypingBookOverlay imperative handle
  const elRefs = useRef([])
  const bubbleRefs = useRef([])
  const [soundOn, setSoundOn] = useState(false)

  const cutouts = useMemo(() => CUTOUTS, [])

  // One positioned cutout (kid or prop). The inner div is the GSAP scale/opacity
  // target, kept separate from the position transform so scale never clobbers
  // placement. Rendered into the back or front layer by its `layer` field.
  const renderCutout = (c, i) => (
    <div
      key={c.key}
      className="absolute"
      style={{ left: `${c.cx}vw`, top: `${c.cy}vw`, width: `${c.w}vw`, transform: 'translate(-50%, -50%)', zIndex: c.z }}
    >
      <div data-cut={c.key} ref={(n) => (elRefs.current[i] = n)} className="will-change-transform" style={{ transformOrigin: '50% 50%' }}>
        <img src={c.src} alt="" aria-hidden="true" className="block w-full max-w-none select-none drop-shadow-[0_12px_20px_rgba(10,20,40,0.35)]" draggable="false" />
      </div>
    </div>
  )

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // ── Initial states ──
      // x:-45 matches the reference's left-of-centre title (its text is left-aligned
      // inside a wider box). Base x composes with the scale in one matrix.
      gsap.set(titleGhost.current, { x: 0, transformOrigin: '50% 50%', scale: 1, opacity: 1 })
      gsap.set(copyGroup.current, { opacity: 1 })
      gsap.set(riseWrap.current, { y: 0 })

      // Cutouts start hidden + scaled to 0 at their final (cx,cy). No float loop —
      // a drifting figure would slide against its fixed page crop line.
      elRefs.current.forEach((node) => {
        if (node) gsap.set(node, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
      })
      // bubbles rest at 0.85 + hidden, pop to 1 slightly after their kid lands
      bubbleRefs.current.forEach((node) => {
        if (node) gsap.set(node, { opacity: 0, scale: 0.85, transformOrigin: '50% 100%' })
      })

      // ── Scrub timeline over the pin (250vh section → ~1115px pin room). ──
      // Positions are normalised progress fractions mapped from the measured
      // scrollY thresholds on the live site (÷ ~1115px pin distance).
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section.current, start: 'top top', end: 'bottom bottom', scrub: 0.3, invalidateOnRefresh: true },
      })

      // Timing mapped 1:1 to the measured live per-frame states. Pin ≈ 1174px
      // (section 258vh − 100vh @743). Positions = measured scrollY ÷ 1174, and
      // the timeline total is locked to 1.0 so scrub maps scroll progress 1:1.
      // 1. Title fade — linear, y140→700; floor 0.07 (ghost, never 0).
      // Opacity DIPS to ~0 by y700, then the giant ghost fades back in to 0.07 by
      // y980 (matches the reference's non-monotonic title opacity).
      tl.fromTo(titleGhost.current, { opacity: 1 }, { opacity: 0, ease: 'none', duration: 0.502 }, 0.126)
      tl.to(titleGhost.current, { opacity: 0.07, ease: 'none', duration: 0.252 }, 0.628)
      // 2. Title ghost scale 1→3.0 — accelerating, concentrated y620→980. Only the
      //    title ghosts; the copy just fades (matches the reference).
      tl.fromTo(titleGhost.current, { scale: 1 }, { scale: 3.0, ease: 'power2.in', duration: 0.323 }, 0.557)
      // 2b. Subcopy + CTA fade fully to 0 (no scale), y140→600.
      tl.fromTo(copyGroup.current, { opacity: 1 }, { opacity: 0, ease: 'none', duration: 0.4 }, 0.126)
      // 3. Book rise 0 → -45vh — fast then eases, y668→980. Carries bloom. The
      //    reference rise is viewport-relative (-45vh = -334px @743, -423px @940),
      //    so the bowed bottom page-stack clears the viewport at any height.
      tl.fromTo(riseWrap.current, { y: 0 }, { y: () => -window.innerHeight * 0.45, ease: 'power3.out', duration: 0.25 }, 0.63)
      // Lock the main timeline total to exactly 1.0 so scrub progress == positions.
      tl.set({}, {}, 1.0)

      // 5. Bloom — on its OWN ScrollTrigger spanning scroll 0→1260 (past the pin
      //    end at 1114), so characters keep growing as the book scrolls away —
      //    exactly like the reference (pristine until ~y1000, full by ~y1240).
      // The reference bloom is keyed to a FIXED ~400px window around pin release
      // (onset ≈ pin_end − 262, complete ≈ pin_end + 140), NOT a progress fraction
      // — that's why it stays aligned across viewport heights. pin_end = 1.5·H.
      const pinEnd = () => window.innerHeight * 1.5
      const bloomTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section.current,
          start: () => pinEnd() - 262,
          end: () => pinEnd() + 140,
          scrub: 0.3,
          invalidateOnRefresh: true,
          // TYPING DRIVER — self.progress is the RAW scroll progress across the
          // reveal window (scrub only lags the bloom tween, not this value), so
          // the typed substring is a pure function of scroll position: fast/slow
          // scroll lands identical glyphs, reverse scroll untypes. No timers.
          onUpdate: (self) => typing.current && typing.current.setProgress(self.progress),
        },
      })
      // The page collage is typed on live by <TypingBookOverlay> (driven above) —
      // no cover crossfade any more; the blank base stays put and the words type.
      // Characters grow gradually and TOGETHER over the whole window (tiny stagger,
      // gentle sine ease, no pop) — small at mid, full only near pin release.
      cutouts.forEach((c, i) => {
        const node = elRefs.current[i]
        if (!node) return
        const at = 0.02 + i * 0.014
        if (c.drift) {
          // bouquet: start small near the spine centre, grow + drift out to final.
          const vw = window.innerWidth / 100
          const dx = -c.cx * vw * 0.72
          const dy = -c.cy * vw * 0.72
          bloomTl.fromTo(node, { opacity: 0, scale: 0.15, x: dx, y: dy }, { opacity: 1, scale: 1, x: 0, y: 0, ease: 'sine.inOut', duration: 0.82 }, at)
        } else {
          bloomTl.fromTo(node, { opacity: 0, scale: 0.1 }, { opacity: 1, scale: 1, ease: 'sine.inOut', duration: 0.82 }, at)
        }
      })
      // Speech bubbles pop in WITH their kid (same window, slight delay after the
      // kid lands), scaling from 0.85 + fade like a sticker.
      BUBBLES.forEach((b, i) => {
        const node = bubbleRefs.current[i]
        if (!node) return
        const owner = cutouts.findIndex((c) => c.key === b.forKey)
        const kidAt = 0.02 + (owner >= 0 ? owner : i) * 0.014
        bloomTl.fromTo(node, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, ease: 'back.out(1.5)', duration: 0.5 }, kidAt + 0.08)
      })
      bloomTl.set({}, {}, 1.0)
    }, section)
    return () => ctx.revert()
  }, [reduced, cutouts])

  // ── Reduced-motion: static composition, no scrub/scroll motion, NO sound. ──
  // The typing book degrades to its finished state — the collage is rendered
  // fully-typed and still (TypingBookOverlay reduced) on a static, fully-visible
  // blank book below the headline. No caret, no scrub, no audio.
  if (reduced) {
    return (
      <section id="hero" data-theme="dark" className="relative flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#0c2f4a] px-6 pt-[13vh] text-center">
        {/* HERO AURORA — static gradient under reduced motion (no drift). */}
        <div className="hero-aurora" aria-hidden="true">
          <div className="hero-aurora__ribbons" />
          <div className="hero-aurora__veil" />
        </div>
        {/* Two-line anatomy (line1 cream, line2 solid gold). Seal removed. */}
        <div className="relative z-[1] flex flex-col items-center leading-[0.84]">
          <span className="font-metrisch text-[9vw] font-bold uppercase tracking-[-0.02em] text-[#fdfaf4] lg:text-[6vw]">{t('hero.line1')} {t('hero.line2')}</span>
          <span className="mt-[2px] flex items-center justify-center font-metrisch text-[9vw] font-bold uppercase tracking-[-0.02em] lg:text-[6vw]" style={{ color: GOLD }}>
            {t('hero.line3')}
          </span>
        </div>
        <p className="relative z-[1] mt-6 max-w-[820px] text-[18px] leading-[1.35] text-white/90">{t('hero.subhead')}</p>
        {/* Static, fully-typed book — the reveal's finished state. */}
        <div className="relative z-[1] mt-8 w-full max-w-[820px]">
          <div className="relative flex w-full justify-center">
            <img src={BOOK_BASE} alt={t('hero.bookAlt')} className="relative block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" style={{ clipPath: 'inset(0 0 12% 0)' }} draggable="false" />
            <TypingBookOverlay ref={typing} reduced />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative z-[1] bg-[#0c2f4a]" style={{ height: '250vh' }}>
      {/* overflow-x-clip (not overflow-hidden): still contains the wide bloom
          horizontally, but lets the book's bowed bottom page-stack extend below
          the pin box instead of being cut flat at pin release. */}
      <div ref={pin} className="sticky top-0 h-[100svh] overflow-x-clip">
        {/* HERO AURORA — signature background, at the very BACK of the pin stack
            (z-0, behind the riseWrap book/bloom at z-15 and the headline at
            z-30). CSS-only ambient drift, scroll-independent; radial-masked so
            the headline zone stays calm and the wash fades before the hero's
            bottom edge (never bleeds into the TrustStrips). The giant headline
            ghost (scaling to 3× at 0.07 opacity) reads over it — that's the
            premium moment where the letters catch the light. */}
        <div className="hero-aurora" aria-hidden="true">
          <div className="hero-aurora__ribbons" />
          <div className="hero-aurora__veil" />
        </div>

        {/* LIQUID ETHER REMOVED — the client wants a motionless hero. The static
            hero-aurora above reproduces the settled resting appearance the fluid
            layer showed at idle (its canvas was near-transparent at rest, letting
            the aurora through). Removing it also drops the hero's only WebGL
            context (banks ~39fps) and guarantees a pixel-stable background. */}

        {/* Corner watermark tiles removed — the Alternativ graph-symbol repeat fought
            the clean navy field; the QFP kids/props carry the visual interest. */}

        {/* Book + bloom — the whole graph wrapper rises together. Book TOP sits
            at 64vh (peeking) at rest; the rise raises it into view. */}
        {/* pointer-events-none: this decorative book/bloom wrapper is tall and its
            transparent lower area overlaps the TrustStrips below — without this it
            would swallow hover from the strips (breaking their hover-to-pause). */}
        <div ref={riseWrap} className="pointer-events-none absolute inset-x-0 top-0 z-[15] mt-[64vh] flex flex-col items-center will-change-transform">
          <div className="relative flex w-full justify-center">
            {/* LAYER 1 (z-0) — the 4 kids render BEHIND the book so the pages and
                side edges crop them (the peek effect). Sits under the book base. */}
            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
              <div className="relative">
                {cutouts.map((c, i) => (c.layer === 'back' ? renderCutout(c, i) : null))}
              </div>
            </div>

            {/* BLANK book base (z-[1], ON TOP of the kids). clip-path cuts the bottom
                19% transparent shadow-padding zone so the CSS drop-shadow stops at
                the TrustStrips gold-border line (junction unchanged). */}
            <img src={BOOK_BASE} alt={t('hero.bookAlt')} className="relative z-[1] block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" style={{ clipPath: 'inset(0 0 19% 0)' }} draggable="false" />
            {/* TYPING OVERLAY (z-[2]) — live page collage typed on the blank base,
                under the front props (globe/owl sit physically on the open pages).
                inset-0 fills the base-image box so the overlay's page quads map to
                the real book geometry at any viewport. */}
            <div className="absolute inset-0 z-[2]">
              <TypingBookOverlay ref={typing} />
            </div>

            {/* LAYER 3 (z-[3]) — props + speech bubbles IN FRONT of the book */}
            <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
              <div className="relative">
                {cutouts.map((c, i) => (c.layer === 'front' ? renderCutout(c, i) : null))}

                {/* speech bubbles — real HTML text inside one transform wrapper so it
                    scales WITH the bubble; floats clear above each kid, tail down. */}
                {BUBBLES.map((b, i) => (
                  <div
                    key={b.key}
                    className="absolute"
                    style={{ left: `${b.cx}vw`, top: `${b.cy}vw`, width: `${b.w}vw`, transform: 'translate(-50%, -50%)', zIndex: 30 }}
                  >
                    <div ref={(n) => (bubbleRefs.current[i] = n)} className="relative will-change-transform" style={{ transformOrigin: '50% 100%' }}>
                      <img src={BUBBLE} alt="" aria-hidden="true" className="block w-full select-none" draggable="false" />
                      {/* text in the bubble body (top ~70%, above the tail), centred */}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center px-[10%] text-center" style={{ height: '70%' }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            color: '#0F2444',
                            fontSize: 'clamp(11px, 0.72vw, 12px)',
                            lineHeight: 1.22,
                            letterSpacing: '-0.1px',
                          }}
                        >
                          <Trans
                            t={t}
                            i18nKey={`hero.bubbles.${b.tk}`}
                            components={{ 1: <b style={{ color: GOLD, fontWeight: 700 }} /> }}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Centered content block (title / subcopy / CTA). pt-[23vh] gives a clear
            gap between the nav and the headline (Alternativ's air) now that the
            headline is TWO lines instead of three. */}
        <div ref={textWrap} className="absolute inset-x-0 top-0 z-30 flex flex-col items-center px-4 pt-[23vh] font-metrisch">
          <div ref={titleGhost} className="flex flex-col items-center leading-[0.84] will-change-transform">
            {/* Line 1 — POWERING GLOBAL (cream). The two original words are joined
                into one line so the headline reads as Alternativ's two-line
                "PRINTING / STORIES" anatomy. */}
            <div className="text-[12vw] font-bold uppercase text-[#fdfaf4] lg:text-[8.4vw]" style={{ letterSpacing: '-0.2vw' }}>
              {t('hero.line1')} {t('hero.line2')}
            </div>
            {/* Line 2 — EDUCATION in Ekta's flat solid gold (foil + spinning seal
                removed per client feedback). */}
            <div className="mt-[2px] flex items-center justify-center text-[12vw] font-bold uppercase lg:text-[8.4vw]" style={{ letterSpacing: '-0.2vw', color: GOLD }}>
              {t('hero.line3')}
            </div>
          </div>

          <div ref={copyGroup} className="flex flex-col items-center will-change-[opacity]">
            <p className="mt-[18px] max-w-[720px] text-center text-[18px] font-normal leading-[1.4] text-white/95">
              {t('hero.subhead')}
            </p>

            <div className="mt-[24px] flex items-center gap-[30px]">
              {/* Premium hover: a gold gradient sweeps in from the left, the label
                  inverts to navy, the arrow pod flips to navy with a cream arrow,
                  and the whole pill lifts with a soft gold glow. GPU transforms only. */}
              {/* Ekta DNA: square ghost button that fills solid on hover — no
                  rounded pill, no gold glow (matches the unified .u-btn--ghost). */}
              <a
                href="#services"
                className="group relative inline-flex h-[54px] items-center gap-[18px] overflow-hidden border-[1.5px] border-white/60 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[#0f2444] hover:border-[#f5f0e8]"
              >
                <span className="relative z-10">{t('hero.ctaPrint')}</span>
                <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/60 transition-[background-color,border-color] duration-300 ease-out group-hover:border-[#0f2444] group-hover:bg-[#0f2444]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
                </span>
              </a>
              <a href="#projects" className="text-[15px] font-medium tracking-[0.3px] text-white underline decoration-white/50 underline-offset-[5px] transition-colors duration-300 hover:decoration-[#e6bd6a] hover:text-[#e6bd6a]">
                {t('hero.ctaReach')}
              </a>
            </div>
          </div>
        </div>

        {/* Scroll pill — stays through the pin, scrolls away with the stage */}
        <div className="absolute bottom-[48px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-none px-[25px] py-[10px] font-metrisch" style={{ backgroundColor: 'rgba(12,47,74,0.39)' }}>
          <span className="block h-1.5 w-1.5 rounded-full bg-white" />
          <span className="text-[11px] font-medium uppercase text-white" style={{ letterSpacing: '5px' }}>{t('hero.scroll')}</span>
        </div>

        {/* Sound toggle — mechanical key-clicks for the typing book, OFF by
            default. The tap IS the user gesture that unlocks WebAudio, so playback
            only ever starts after this. DM Mono label per Ekta's micro-label style. */}
        <button
          type="button"
          onClick={() => setSoundOn(typingSound.toggle())}
          aria-pressed={soundOn}
          className="group absolute bottom-[48px] right-[40px] z-40 flex items-center gap-2 border border-white/25 px-[13px] py-[8px] font-mono text-white/85 transition-colors duration-300 hover:border-white/55 hover:text-white"
          style={{ backgroundColor: 'rgba(12,47,74,0.39)' }}
        >
          {soundOn ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6" /><path d="m16 9 6 6" /></svg>
          )}
          <span className="text-[10px] font-medium uppercase" style={{ letterSpacing: '2.5px' }}>{t('hero.bookSound')}</span>
        </button>
      </div>
    </section>
  )
}
