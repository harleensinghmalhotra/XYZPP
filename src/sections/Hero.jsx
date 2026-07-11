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

// Kids. w / cx / cy are in **vw** (offsets from the book centre) so the whole
// spread scales with the book at any viewport. All 4 kids render BEHIND the book
// (layer:'back') so the pages crop them — the two centre kids peek
// head+shoulders+chest over the page tops (page-top edge ≈ -20.3vw / -19.1vw from
// book centre), the two outer kids stand at ground level and are cropped by the
// book's side edges (≈ ±42vw). Each starts scaled to 0 at its final (cx,cy) and
// grows in over the bloom window.
//
// PHASE 3.4 R2 — ALL bloom props over the book (globe / owl / balloon / bulb /
// blocks / pencil / plane / bookstack) are REMOVED: the book spread + its typed
// copy IS the hero moment, nothing sits on top of the pages. Their assets stay in
// the repo; only these render entries + choreography are retired.
const CUTOUTS = [
  // BACK layer — behind the book, cropped by the pages / side edges
  { key: 'boy-red',      src: '/qfp/hero/qfp-kid-boy-red.webp',       layer: 'back', w: 11.5, cx: -21.3, cy: -16.5, z: 2 }, // behind LEFT page, head+shoulders+chest over the top edge
  { key: 'girl-blonde',  src: '/qfp/hero/qfp-kid-girl-blonde.webp',   layer: 'back', w: 15.5, cx: 20.3,  cy: -15.5, z: 2 }, // behind RIGHT page, upper body over the top edge
  { key: 'girl-mustard', src: '/qfp/hero/qfp-kid-girl-mustard.webp',  layer: 'back', w: 15.0, cx: -42.0, cy: -6.0,  z: 1 }, // far LEFT ground, cropped by the book's left edge
  { key: 'boy-green',    src: '/qfp/hero/qfp-kid-boy-green.webp',      layer: 'back', w: 10.5, cx: 41.0,  cy: -6.0,  z: 1 }, // far RIGHT ground, cropped by the book's right edge
]

// 4 speech bubbles — one floating CLEARLY above each kid's head (front layer),
// tail pointing DOWN toward that kid, never touching a face or hands. Text is
// REAL HTML (translated via <Trans>) inside a single transform wrapper so it
// scales WITH the bubble. `tk` = translation key in home.bubbles; the gold key
// figure is wrapped in <1></1> in the locale string. Rest navy.
// R2 — Harry: text must FILL the bubble (3–4 lines, generous line-height), read
// effortlessly at 60cm. Each bubble grows ~10–16% from R1 to give the copy room
// (tail still points at its kid — the wrapper is centred on (cx,cy)); `fs` is a
// per-bubble type size (clamp, ≥11px floor cleared) tuned by SENTENCE LENGTH so
// short sentences (mustard) get bigger type and long ones (green, esp. FR) get a
// touch smaller — every bubble lands at ~70–80% interior fill in BOTH EN and FR.
const BUBBLES = [
  { key: 'b-mustard', tk: 'mustard', forKey: 'girl-mustard', w: 12.4, cx: -38.0, cy: -24.0, fs: 'clamp(15px, 1.4vw, 21.5px)' },
  { key: 'b-red', tk: 'red', forKey: 'boy-red', w: 12.9, cx: -11.0, cy: -27.0, fs: 'clamp(14px, 1.2vw, 18.5px)' },
  { key: 'b-blonde', tk: 'blonde', forKey: 'girl-blonde', w: 13.1, cx: 11.0, cy: -27.0, fs: 'clamp(13.5px, 1.16vw, 18px)' },
  { key: 'b-green', tk: 'green', forKey: 'boy-green', w: 13.4, cx: 39.0, cy: -24.0, fs: 'clamp(13px, 1.12vw, 17.2px)' },
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
  const [soundOn, setSoundOn] = useState(() => typingSound.isEnabled()) // default ON, or the user's remembered choice

  const cutouts = useMemo(() => CUTOUTS, [])

  // One positioned cutout (kid or prop). The inner div is the GSAP scale/opacity
  // target, kept separate from the position transform so scale never clobbers
  // placement. Rendered into the back or front layer by its `layer` field.
  // opacity: reduced ? 1 : 0 — in the animated hero the inner div starts HIDDEN so
  // there's no flash of all-landed kids between first paint and the GSAP set; in
  // reduced motion (no GSAP) it renders visible (landed) straight away.
  const renderCutout = (c, i) => (
    <div
      key={c.key}
      className="absolute"
      style={{ left: `${c.cx}vw`, top: `${c.cy}vw`, width: `${c.w}vw`, transform: 'translate(-50%, -50%)', zIndex: c.z }}
    >
      <div data-cut={c.key} ref={(n) => (elRefs.current[i] = n)} className="will-change-transform" style={{ transformOrigin: '50% 50%', opacity: reduced ? 1 : 0 }}>
        <img src={c.src} alt="" aria-hidden="true" className="block w-full max-w-none select-none drop-shadow-[0_12px_20px_rgba(10,20,40,0.35)]" draggable="false" />
      </div>
    </div>
  )

  // The book "scene" — kids behind, blank book base, live typing overlay, and the
  // 4 speech bubbles in front. Shared by the animated pin and the reduced-motion
  // static/landed composition so the two never diverge.
  const renderBookScene = () => (
    <div className="relative flex w-full justify-center">
      {/* LAYER 1 (z-0) — the 4 kids render BEHIND the book so the pages and side
          edges crop them (the peek effect). Sits under the book base. */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative">
          {cutouts.map((c, i) => (c.layer === 'back' ? renderCutout(c, i) : null))}
        </div>
      </div>

      {/* BLANK book base (z-[1], ON TOP of the kids). clip-path cuts the bottom
          19% transparent shadow-padding zone so the CSS drop-shadow stops at the
          TrustStrips gold-border line (junction unchanged). */}
      <img src={BOOK_BASE} alt={t('hero.bookAlt')} className="relative z-[1] block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" style={{ clipPath: 'inset(0 0 19% 0)' }} draggable="false" />
      {/* TYPING OVERLAY (z-[2]) — Ekta's copy typed live on the blank base; nothing
          sits over the pages. inset-0 fills the base-image box so the overlay's
          page quads map to the real book geometry at any viewport. */}
      <div className="absolute inset-0 z-[2]">
        <TypingBookOverlay ref={typing} reduced={reduced} />
      </div>

      {/* LAYER 3 (z-[3]) — speech bubbles IN FRONT of the book (props removed R2) */}
      <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
        <div className="relative">
          {BUBBLES.map((b, i) => (
            <div
              key={b.key}
              className="absolute"
              style={{ left: `${b.cx}vw`, top: `${b.cy}vw`, width: `${b.w}vw`, transform: 'translate(-50%, -50%)', zIndex: 30 }}
            >
              <div ref={(n) => (bubbleRefs.current[i] = n)} className="relative will-change-transform" style={{ transformOrigin: '50% 100%', opacity: reduced ? 1 : 0 }}>
                <img src={BUBBLE} alt="" aria-hidden="true" className="block w-full select-none" draggable="false" />
                {/* text in the bubble body (upper ~78%, above the tail), centred.
                    Inter Tight (the site's display language), weight 500 sentence
                    / 700 foil-gold numerals, deep-navy ink for AA on the cream
                    bubble ground. R2: per-bubble `fs` scales the type UP so the
                    sentence FILLS the interior across 3–4 lines with generous
                    ~1.4 line-height — no forced balancing, let it wrap to fill. */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-center px-[7%] text-center" style={{ height: '78%' }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Inter Tight', 'Inter', sans-serif",
                      fontWeight: 500,
                      color: '#0F2444',
                      fontSize: b.fs,
                      lineHeight: 1.4,
                      letterSpacing: '-0.004em',
                    }}
                  >
                    <Trans t={t} i18nKey={`hero.bubbles.${b.tk}`} components={{ 1: <b className="bub-foil" /> }} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // ── THE SEQUENCE (Phase 3.4 R3) — strict sequential windows over one pin. ──
      // Ekta's approved scroll choreography: each beat fully completes before the
      // next begins (no overlaps), so every moment lands like a story page-turn.
      //
      //   INTRO  [0.00 → 0.14]  headline fades to a faint ghost + scales; copy
      //                         fades; the book rises to its landed position.
      //   W0     [0.14 → 0.16]  landed REST beat — blank book sitting there,
      //                         no kids, no bubbles, no typing.
      //   W1     [0.16 → 0.26]  boy-red      pops in WITH his bubble
      //   W2     [0.26 → 0.36]  girl-blonde  pops in WITH her bubble
      //   W3     [0.36 → 0.46]  boy-green    pops in WITH his bubble
      //   W4     [0.46 → 0.56]  girl-mustard pops in WITH her bubble
      //   W5     [0.56 → 0.86]  ONLY now the page copy types start→finish (largest
      //                         window; left page then right, R2 engine unchanged)
      //   W6     [0.86 → 1.00]  typing complete → settle beat → pin releases
      //
      // Only TIMING changed vs R2 — kids/bubbles keep their exact positions and
      // entrance style (kid: sine.inOut grow 0.1→1; bubble: back.out(1.5) sticker
      // 0.85→1). Reverse scroll plays the whole thing backwards cleanly.
      const SEQ = [
        { key: 'boy-red', at: 0.16 },
        { key: 'girl-blonde', at: 0.26 },
        { key: 'boy-green', at: 0.36 },
        { key: 'girl-mustard', at: 0.46 },
      ]
      const KID_DUR = 0.075
      const BUB_LEAD = 0.045
      const BUB_DUR = 0.05
      const TYPE_START = 0.56
      const TYPE_END = 0.86

      // Foil shimmer bookkeeping — each bubble's gold numerals get ONE slow sweep
      // the moment that bubble has fully stickered in (reveal = its kid window +
      // bubble lead + bubble duration). Fired off the same raw scroll value that
      // drives typing, so NO sequence timing changes; `litBubbles` guarantees the
      // sweep is added exactly once (the CSS animation is non-looping).
      const litBubbles = new Set()

      // ── Initial states — everything at its pre-sequence rest. ──
      gsap.set(titleGhost.current, { x: 0, transformOrigin: '50% 50%', scale: 1, opacity: 1 })
      gsap.set(copyGroup.current, { opacity: 1 })
      gsap.set(riseWrap.current, { y: 0 })
      // Kids start hidden + scaled to 0 at their final (cx,cy).
      elRefs.current.forEach((node) => {
        if (node) gsap.set(node, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
      })
      // Bubbles rest hidden at 0.85.
      bubbleRefs.current.forEach((node) => {
        if (node) gsap.set(node, { opacity: 0, scale: 0.85, transformOrigin: '50% 100%' })
      })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          invalidateOnRefresh: true,
          // TYPING DRIVER (W5) — read RAW scroll position (not self.progress, which
          // lags with scrub) and map the W5 window to typing 0→1, so typing is a
          // pure, immediate function of scroll position — no scrub lag, completing
          // exactly at the end of W5. Below W5 → 0 (nothing typed at rest / during
          // kid beats); reverse scroll drives it back down → untypes. Same scroll
          // position ⇒ same glyphs regardless of speed.
          onUpdate: () => {
            if (!typing.current || !section.current) return
            const dist = section.current.offsetHeight - window.innerHeight
            const sp = dist > 0 ? window.scrollY / dist : 0
            const tp = gsap.utils.clamp(0, 1, (sp - TYPE_START) / (TYPE_END - TYPE_START))
            typing.current.setProgress(tp)
            // one-shot foil sweep per bubble once its reveal window is crossed
            BUBBLES.forEach((b, i) => {
              if (litBubbles.has(i)) return
              const reveal = (SEQ.find((s) => s.key === b.forKey)?.at ?? 1) + BUB_LEAD + BUB_DUR
              if (sp >= reveal) {
                litBubbles.add(i)
                bubbleRefs.current[i]?.querySelectorAll('.bub-foil').forEach((el) => el.classList.add('is-lit'))
              }
            })
          },
        },
      })

      // INTRO — reach the landed-rest state (W0). Same eases as R2, retimed.
      tl.fromTo(titleGhost.current, { opacity: 1 }, { opacity: 0, duration: 0.08 }, 0)
      tl.to(titleGhost.current, { opacity: 0.06, duration: 0.04 }, 0.10)
      tl.fromTo(titleGhost.current, { scale: 1 }, { scale: 3.0, ease: 'power2.in', duration: 0.12 }, 0.02)
      tl.fromTo(copyGroup.current, { opacity: 1 }, { opacity: 0, duration: 0.06 }, 0)
      tl.fromTo(riseWrap.current, { y: 0 }, { y: () => -window.innerHeight * 0.45, ease: 'power3.out', duration: 0.12 }, 0.02)

      // WINDOWS 1–4 — each kid pops WITH its bubble, one strict window at a time.
      // Kid finishes, then the bubble stickers in; both land before the next window.
      SEQ.forEach(({ key, at }) => {
        const ki = cutouts.findIndex((c) => c.key === key)
        const kidNode = elRefs.current[ki]
        if (kidNode) tl.fromTo(kidNode, { opacity: 0, scale: 0.1 }, { opacity: 1, scale: 1, ease: 'sine.inOut', duration: KID_DUR }, at)
        const bi = BUBBLES.findIndex((b) => b.forKey === key)
        const bubNode = bubbleRefs.current[bi]
        if (bubNode) tl.fromTo(bubNode, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, ease: 'back.out(1.5)', duration: BUB_DUR }, at + BUB_LEAD)
      })

      // WINDOW 5 typing runs via onUpdate (above). WINDOW 6 is a hold/settle beat.
      // Lock the timeline total to exactly 1.0 so scrub maps scroll progress 1:1.
      tl.set({}, {}, 1.0)
    }, section)
    return () => ctx.revert()
  }, [reduced, cutouts])

  // ── Reduced-motion: static composition, no scrub/scroll motion, NO sound. ──
  // The typing book degrades to its finished state — the collage is rendered
  // fully-typed and still (TypingBookOverlay reduced) on a static, fully-visible
  // blank book below the headline. No caret, no scrub, no audio.
  // ── Reduced-motion: the SEQUENCE's finished frame, static, instant. ──
  // Everything landed + fully typed at once — the 4 kids + bubbles in place, the
  // book risen, Ekta's copy fully typed (TypingBookOverlay reduced) — with no
  // scrub, no pinning, no caret, no sound. The typed left page carries the
  // headline copy, so no separate title is needed.
  if (reduced) {
    return (
      <section id="hero" data-theme="dark" className="relative z-[1] flex h-[100svh] flex-col items-center overflow-hidden bg-[#0c2f4a]">
        <div className="hero-aurora" aria-hidden="true">
          <div className="hero-aurora__ribbons" />
          <div className="hero-aurora__veil" />
        </div>
        {/* Book scene at its LANDED position (translateY(-45vh) == the animated
            rise's end state), everything visible + fully typed. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] mt-[64vh] flex flex-col items-center" style={{ transform: 'translateY(-45vh)' }}>
          {renderBookScene()}
        </div>
      </section>
    )
  }

  return (
    // Section height 400vh (pin ≈ 300vh ≈ 2229px @743) gives THE SEQUENCE room:
    // an intro beat, four kid beats, the large typing window and a settle beat,
    // each its own page-turn without feeling sluggish.
    <section id="hero" ref={section} data-theme="dark" className="relative z-[1] bg-[#0c2f4a]" style={{ height: '400vh' }}>
      {/* overflow-x-clip (not overflow-hidden): still contains the wide scene
          horizontally, but lets the book's bowed bottom page-stack extend below
          the pin box instead of being cut flat at pin release. */}
      <div ref={pin} className="sticky top-0 h-[100svh] overflow-x-clip">
        {/* HERO AURORA — signature background, at the very BACK of the pin stack
            (z-0, behind the headline at z-[5] and the riseWrap book/kids at
            z-15). CSS-only ambient drift, scroll-independent; radial-masked so
            the headline zone stays calm and the wash fades before the hero's
            bottom edge (never bleeds into the TrustStrips). The giant headline
            ghost (scaling to 3× at 0.07 opacity) reads over the aurora but now
            passes BEHIND the rising book. */}
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
          {renderBookScene()}
        </div>

        {/* Centered content block (title / subcopy / CTA). pt-[23vh] gives a clear
            gap between the nav and the headline (Alternativ's air) now that the
            headline is TWO lines instead of three.
            Z-ORDER (Phase 3.4 R2): z-[5] sits BELOW the riseWrap book/kids stack
            (z-15), so as the book rises it passes IN FRONT of the headline —
            exactly like Alternativ. The headline never renders over the pages. */}
        <div ref={textWrap} className="absolute inset-x-0 top-0 z-[5] flex flex-col items-center px-4 pt-[23vh] font-metrisch">
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
                className="btn-nebula group relative inline-flex h-[54px] items-center gap-[18px] border-[1.5px] border-white/60 pl-[26px] pr-[7px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[#0f2444] hover:border-[#f5f0e8]"
              >
                <span className="relative z-10">{t('hero.ctaPrint')}</span>
                <span className="relative z-10 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-white/60 transition-[background-color,border-color] duration-300 ease-out group-hover:border-[#0f2444] group-hover:bg-[#0f2444]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white transition-transform duration-300 ease-out group-hover:translate-x-[3px]"><path d="m11 5 7 7-7 7" /></svg>
                </span>
              </a>
              {/* Promoted from a text link to a matching square ghost chip so both
                  hero CTAs carry the same nebula foil (sweep round 2). Typography
                  (15px / 500 / 0.3px) and colour unchanged; class swap only — the
                  reveal timeline animates the copyGroup parent, not this anchor. */}
              <a href="#projects" className="btn-nebula group relative inline-flex h-[54px] items-center border-[1.5px] border-white/60 px-[26px] text-[15px] font-medium tracking-[0.3px] text-white transition-[color,border-color,background-color] duration-300 ease-out hover:bg-[#f5f0e8] hover:text-[#0f2444] hover:border-[#f5f0e8]">
                {t('hero.ctaReach')}
              </a>
            </div>
          </div>
        </div>

        {/* SCROLL pill REMOVED (R2) — Harry: the kid→bubble→typing sequence teaches
            scrolling on its own; the pill was noise. The orphaned `hero.scroll`
            locale key is removed from en/fr home.json too. */}

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
