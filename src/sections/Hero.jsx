import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── QFP hero skin (mechanics unchanged — Alternativ assets swapped for QFP) ──
// The rotating circular seal is rendered inline (textPath on a circle) so it can
// carry QFP wording in brand gold while keeping the exact seal-spin motion.
const BOOK_BASE = '/qfp/hero/qfp-book-pages.webp' // LETTERED base — always present
const BOOK_OVER = '/qfp/hero/qfp-book-cover.webp' // COVER overlay — sits on top, fades out to expose the pages
const BUBBLE = '/qfp/hero/qfp-bubble.webp'
const GOLD = '#C89A3C' // System B on-navy accent gold (matches ledger-num, 5.3:1 on navy)

// Bloom figures. w / cx / cy are in **vw** (offsets from the book centre) so the
// whole spread scales with the book at any viewport. 6 QFP characters + props
// replace the reference's 10-piece sticker spread. Same scatter-to-place scrub:
// each starts scaled to 0 at its final (cx,cy) and grows in over the bloom window.
const CUTOUTS = [
  { key: 'boy-red',      src: '/qfp/hero/qfp-kid-boy-red.webp',       w: 11.5, cx: -12.5, cy: -11.0, reveal: 'scale', z: 7 }, // peeking over LEFT page top edge
  { key: 'girl-blonde',  src: '/qfp/hero/qfp-kid-girl-blonde.webp',   w: 13.0, cx: 12.5,  cy: -11.0, reveal: 'scale', z: 7 }, // peeking over RIGHT page top edge
  { key: 'girl-mustard', src: '/qfp/hero/qfp-kid-girl-mustard.webp',  w: 13.5, cx: -37.0, cy: 2.5,   reveal: 'scale', z: 5 }, // far LEFT, ground level
  { key: 'boy-green',    src: '/qfp/hero/qfp-kid-boy-green.webp',     w: 12.0, cx: 37.0,  cy: 2.5,   reveal: 'scale', z: 5 }, // far RIGHT, ground level
  { key: 'prop-bookstack', src: '/qfp/hero/qfp-prop-bookstack.webp', w: 15.5, cx: -26.5, cy: 12.5,  reveal: 'scale', z: 3 }, // low accent near mustard's feet
  { key: 'prop-plane',   src: '/qfp/hero/qfp-prop-plane.webp',        w: 11.0, cx: 25.0,  cy: -15.0, reveal: 'scale', z: 3 }, // upper accent
]

// 4 speech bubbles — one above each kid, tail pointing toward the kid. Text is
// REAL HTML inside a single transform wrapper so it scales WITH the bubble.
const BUBBLES = [
  { key: 'b-mustard', forKey: 'girl-mustard', w: 18.0, cx: -35.5, cy: -15.5,
    body: (<>Oh yes! Education has no borders.</>) },
  { key: 'b-red', forKey: 'boy-red', w: 18.5, cx: -13.5, cy: -26.5,
    body: (<>Quarterfold Prints <b style={{ color: GOLD, fontWeight: 700 }}>25 Million Books</b> Every Year.</>) },
  { key: 'b-blonde', forKey: 'girl-blonde', w: 18.5, cx: 13.5, cy: -26.5,
    body: (<>What? They also export to <b style={{ color: GOLD, fontWeight: 700 }}>25+ Countries</b> every year?</>) },
  { key: 'b-green', forKey: 'boy-green', w: 19.0, cx: 35.5, cy: -15.5,
    body: (<>Wow! That means the books have been read by <b style={{ color: GOLD, fontWeight: 700 }}>billions</b> of people!</>) },
]

export default function Hero() {
  const reduced = prefersReduced()
  const section = useRef(null)
  const pin = useRef(null)
  const textWrap = useRef(null)
  const titleGhost = useRef(null)
  const copyGroup = useRef(null)
  const riseWrap = useRef(null)
  const overlay = useRef(null)
  const bloomWrap = useRef(null)
  const elRefs = useRef([])
  const floatRefs = useRef([])
  const bubbleRefs = useRef([])

  const cutouts = useMemo(() => CUTOUTS, [])

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // ── Initial states ──
      // x:-45 matches the reference's left-of-centre title (its text is left-aligned
      // inside a wider box). Base x composes with the scale in one matrix.
      gsap.set(titleGhost.current, { x: -45, transformOrigin: '50% 50%', scale: 1, opacity: 1 })
      gsap.set(copyGroup.current, { opacity: 1 })
      gsap.set(riseWrap.current, { y: 0 })
      gsap.set(overlay.current, { opacity: 1 }) // cover overlay hides the pages at rest

      elRefs.current.forEach((node, i) => {
        if (!node) return
        const c = cutouts[i]
        gsap.set(node, c.reveal === 'fade' ? { opacity: 0 } : { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
        const f = floatRefs.current[i]
        if (f) {
          gsap.to(f, { yPercent: -6 - (i % 4) * 2, duration: 2.4 + (i % 3) * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.12 })
        }
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
        scrollTrigger: { trigger: section.current, start: () => pinEnd() - 262, end: () => pinEnd() + 140, scrub: 0.3, invalidateOnRefresh: true },
      })
      // Cover overlay fades across the bloom window — pristine until onset, then
      // the pages reveal gradually with the characters (matches reference).
      bloomTl.fromTo(overlay.current, { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.82 }, 0.02)
      // Characters grow gradually and TOGETHER over the whole window (tiny stagger,
      // gentle sine ease, no pop) — small at mid, full only near pin release.
      cutouts.forEach((c, i) => {
        const node = elRefs.current[i]
        if (!node) return
        const at = 0.02 + i * 0.014
        if (c.reveal === 'fade') bloomTl.fromTo(node, { opacity: 0 }, { opacity: 1, ease: 'sine.inOut', duration: 0.82 }, at)
        else bloomTl.fromTo(node, { opacity: 0, scale: 0.1 }, { opacity: 1, scale: 1, ease: 'sine.inOut', duration: 0.82 }, at)
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

  // ── Reduced-motion: static rest composition (headline only, no motion) ──
  if (reduced) {
    return (
      <section id="hero" data-theme="dark" className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0c2f4a] px-6 text-center">
        <div className="flex flex-col items-center leading-[0.86]">
          <span className="ml-[-23px] font-metrisch text-[13vw] font-bold uppercase tracking-[-0.02em] text-[#fdfaf4] lg:text-[9vw]">Powering</span>
          <span className="font-metrisch text-[13vw] font-bold uppercase tracking-[-0.02em] text-[#fdfaf4] lg:text-[9vw]">Global</span>
          <span className="font-metrisch text-[13vw] font-bold uppercase tracking-[-0.02em] lg:text-[9vw]" style={{ color: GOLD }}>Education</span>
        </div>
        <p className="mt-8 max-w-[900px] text-[20px] leading-[1.35] text-white/90">We help publishers around the world print, bind, package, and deliver exceptional books on time, every time.</p>
      </section>
    )
  }

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative z-[1] bg-[#0c2f4a]" style={{ height: '250vh' }}>
      {/* overflow-x-clip (not overflow-hidden): still contains the wide bloom
          horizontally, but lets the book's bowed bottom page-stack extend below
          the pin box instead of being cut flat at pin release. */}
      <div ref={pin} className="sticky top-0 h-[100svh] overflow-x-clip">
        {/* Corner watermark tiles removed — the Alternativ graph-symbol repeat fought
            the clean navy field; the QFP kids/props carry the visual interest. */}

        {/* Book + bloom — the whole graph wrapper rises together. Book TOP sits
            at 64vh (peeking) at rest; the rise raises it into view. */}
        <div ref={riseWrap} className="absolute inset-x-0 top-0 z-[15] mt-[64vh] flex flex-col items-center will-change-transform">
          <div className="relative flex w-full justify-center">
            {/* lettered base (always present). clip-path cuts the bottom 19% — the
                image's transparent shadow-padding zone below the cover pixels — so
                the CSS drop-shadow stops at the TrustStrips gold-border line instead
                of bleeding onto the strips. The 81% cut sits below the cover on both
                the original and QFP books (solid ends ~76%), so it never truncates
                the visible book and the junction stays pixel-identical.
                (clip-path applies after filter, so it clips the drop-shadow too.) */}
            <img src={BOOK_BASE} alt="Open QFP book" className="block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" style={{ clipPath: 'inset(0 0 19% 0)' }} draggable="false" />
            {/* cover overlay on top at the same footprint — fades out to reveal the pages */}
            <img ref={overlay} src={BOOK_OVER} alt="" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-full select-none object-contain" draggable="false" />

            {/* bloom cutouts + bubbles, each CENTRED at (cx, cy) vw from the book centre */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div ref={bloomWrap} className="relative">
                {cutouts.map((c, i) => {
                  return (
                    <div
                      key={c.key}
                      className="absolute"
                      style={{ left: `${c.cx}vw`, top: `${c.cy}vw`, width: `${c.w}vw`, transform: 'translate(-50%, -50%)', zIndex: c.z }}
                    >
                      {/* inner div = GSAP scale/opacity target (kept separate from the
                          position transform so scale never clobbers placement) */}
                      <div data-cut={c.key} ref={(n) => (elRefs.current[i] = n)} className="will-change-transform" style={{ transformOrigin: '50% 50%' }}>
                        <img
                          ref={(n) => (floatRefs.current[i] = n)}
                          src={c.src}
                          alt=""
                          aria-hidden="true"
                          className="block w-full max-w-none select-none drop-shadow-[0_12px_20px_rgba(10,20,40,0.35)]"
                          draggable="false"
                        />
                      </div>
                    </div>
                  )
                })}

                {/* speech bubbles — real HTML text inside one transform wrapper */}
                {BUBBLES.map((b, i) => (
                  <div
                    key={b.key}
                    className="absolute"
                    style={{ left: `${b.cx}vw`, top: `${b.cy}vw`, width: `${b.w}vw`, transform: 'translate(-50%, -50%)', zIndex: 9 }}
                  >
                    <div ref={(n) => (bubbleRefs.current[i] = n)} className="relative will-change-transform" style={{ transformOrigin: '50% 100%' }}>
                      <img src={BUBBLE} alt="" aria-hidden="true" className="block w-full select-none" draggable="false" />
                      {/* text sits in the bubble body (top ~74%, above the tail),
                          centred, Inter navy with gold key figures, min 11px. */}
                      <div className="absolute inset-x-0 top-0 flex items-center justify-center px-[9%] text-center" style={{ height: '72%' }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 500,
                            color: '#0F2444',
                            fontSize: 'clamp(11px, 0.95vw, 14.5px)',
                            lineHeight: 1.25,
                            letterSpacing: '-0.1px',
                          }}
                        >
                          {b.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Centered content block (title / subcopy / CTA). pt-[16vh] gives the
            three headline lines room (was 29vh for the two-line reference). */}
        <div ref={textWrap} className="absolute inset-x-0 top-0 z-30 flex flex-col items-center px-4 pt-[16vh] font-metrisch">
          <div ref={titleGhost} className="flex flex-col items-center leading-[0.86] will-change-transform">
            {/* POWERING (cream) */}
            <div className="ml-[-23px] text-[13vw] font-bold uppercase text-[#fdfaf4] lg:text-[9vw]" style={{ letterSpacing: '-0.2vw' }}>
              Powering
            </div>
            {/* GLOBAL (cream) */}
            <div className="mt-[4px] text-[13vw] font-bold uppercase text-[#fdfaf4] lg:text-[9vw]" style={{ letterSpacing: '-0.2vw' }}>
              Global
            </div>
            {/* EDUCATION (gold accent) with the inline rotating QFP seal */}
            <div className="mt-[4px] flex items-center text-[13vw] font-bold uppercase lg:text-[9vw]" style={{ letterSpacing: '-0.2vw', color: GOLD }}>
              <svg
                viewBox="0 0 120 120"
                role="img"
                aria-label="Quarterfold Printabilities seal"
                className="hidden shrink-0 select-none md:block"
                style={{ width: 104, height: 104, marginTop: -14, marginRight: 10, marginLeft: -8, animation: 'seal-spin 60s linear infinite' }}
              >
                <defs>
                  {/* circular baseline for the text (radius 46, starts at top) */}
                  <path id="qfp-seal-path" fill="none" d="M 60,60 m 0,-46 a 46,46 0 1,1 0,92 a 46,46 0 1,1 0,-92" />
                </defs>
                {/* two gold rings frame the wordmark ring */}
                <circle cx="60" cy="60" r="57" fill="none" stroke={GOLD} strokeWidth="2" />
                <circle cx="60" cy="60" r="35" fill="none" stroke={GOLD} strokeWidth="1" opacity="0.55" />
                <text fill={GOLD} fontFamily="'DM Mono', monospace" fontWeight="500" fontSize="9.4" letterSpacing="1.5">
                  <textPath href="#qfp-seal-path" startOffset="0" textLength="289" lengthAdjust="spacing">
                    QFP STORIES · QFP STORIES · QFP STORIES ·
                  </textPath>
                </text>
                {/* centre registration dot */}
                <circle cx="60" cy="60" r="3" fill={GOLD} />
              </svg>
              Education
            </div>
          </div>

          <div ref={copyGroup} className="flex flex-col items-center will-change-[opacity]">
            <p className="mt-[26px] max-w-[760px] text-center text-[20px] font-normal leading-[1.4] text-white/95">
              We help publishers around the world print, bind, package, and deliver exceptional books on time, every time.
            </p>

            <div className="mt-[36px] flex items-center gap-[30px]">
              <a href="#services" className="group flex h-[62px] items-center justify-between gap-[35px] rounded-[40px] border border-white pl-[32px] text-[18px] font-medium text-white transition-opacity hover:opacity-45">
                What we print
                <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border border-white transition-transform group-hover:translate-x-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5 7 7-7 7" /></svg>
                </span>
              </a>
              <a href="#projects" className="text-[18px] font-medium text-white underline decoration-white/60 underline-offset-4 transition hover:decoration-white">
                Our global reach
              </a>
            </div>
          </div>
        </div>

        {/* Scroll pill — stays through the pin, scrolls away with the stage */}
        <div className="absolute bottom-[48px] left-1/2 z-40 flex -translate-x-1/2 items-center gap-5 rounded-[50px] px-[25px] py-[10px] font-metrisch" style={{ backgroundColor: 'rgba(12,47,74,0.39)' }}>
          <span className="block h-1.5 w-1.5 rounded-full bg-white" />
          <span className="text-[11px] font-medium uppercase text-white" style={{ letterSpacing: '5px' }}>Scroll</span>
        </div>
      </div>
    </section>
  )
}
