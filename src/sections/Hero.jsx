import { useEffect, useRef, useState, useMemo } from 'react'
import gsap from 'gsap'
import { elements as ALL_ELEMENTS } from '@/lib/assets'
import { prefersReduced } from '@/lib/useReducedMotion'

// ── Asset mapping (verified against the live alternativinc.com runtime) ──
const SEAL = '/alternativ/6388ed18ed811f19975f80d2_en_5c2325e9-2b8b-477b-bc9a-4259fda1c863.svg'
const ORNAMENT = '/alternativ/632ccd6e85cf3209e8636b58_graph_symbol-repeat-white.svg'
const BOOK_BASE = '/alternativ/book_pages.webp' // LETTERED base — always present
const BOOK_OVER = '/alternativ/book_cover.webp' // BLANK overlay — sits on top, fades out

// Bloom cutouts. w / cx / cy are in **vw** (calibrated to the reference-matched
// 1536px values ÷15.36) so the whole spread scales with the book at any viewport
// — this is what keeps the layout from clustering centrally on wide screens.
// Two mid-zone decorative elements (hero3.1 / hero4) match the reference's 10-piece
// spread. `src` overrides the ALL_ELEMENTS lookup for those two.
const HERO31 = '/alternativ/632b720e6ec6a379fbbc9571_graph_detail-hero3.1.webp'
const HERO4 = '/alternativ/632b6a1834dcb738f8b20fdd_graph_detail-hero4.svg'
const CUTOUTS = [
  { key: 'pencil', w: 31.2, cx: -5.2, cy: -12.6, reveal: 'scale', z: 6 }, // intro1 Asterix+Obelix (front)
  { key: 'atlas', w: 21.9, cx: 6.5, cy: -9.2, reveal: 'scale', z: 5 }, // intro2 pink monster (visible right of Asterix)
  { key: 'star', w: 26.1, cx: -14.2, cy: -3.1, reveal: 'fade', z: 3 }, // intro3 bed (left)
  { key: 'blocks', w: 20.6, cx: 13.5, cy: -3.3, reveal: 'fade', z: 4 }, // intro4 grey monster (right of pink)
  { key: 'inkdrop', w: 16.3, cx: -39.7, cy: 3.3, reveal: 'scale', z: 2 }, // intro5 far-left-low
  { key: 'ruler', w: 14.3, cx: 33.9, cy: 7.7, reveal: 'scale', z: 2 }, // intro6 far-right-low
  { key: 'plane', w: 6.4, cx: -22.6, cy: -12.0, reveal: 'scale', z: 4 }, // intro7 small upper-left
  { key: 'owl', w: 11.7, cx: -40.2, cy: -5.7, reveal: 'scale', z: 2 }, // intro8 far-left
  { key: 'hero31', src: HERO31, w: 13.0, cx: -30.8, cy: -10.0, reveal: 'scale', z: 1 }, // mid-left decorative
  { key: 'hero4', src: HERO4, w: 9.8, cx: 29.0, cy: -9.0, reveal: 'scale', z: 1 }, // mid-right decorative
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

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const srcByKey = useMemo(() => Object.fromEntries(ALL_ELEMENTS.map((e) => [e.key, e])), [])
  const cutoutSrc = (c) => c.src || (srcByKey[c.key] && srcByKey[c.key].src)
  const cutoutAlt = (c) => (srcByKey[c.key] && srcByKey[c.key].alt) || 'Alternativ Graphic'
  const cutouts = useMemo(() => CUTOUTS.filter((c) => cutoutSrc(c) && (!isMobile || c.src || (srcByKey[c.key] && srcByKey[c.key].mobile))), [isMobile, srcByKey])

  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', on, { passive: true })
    return () => window.removeEventListener('resize', on)
  }, [])

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // ── Initial states ──
      // x:-45 matches the reference's left-of-centre title (its text is left-aligned
      // inside a wider box). Base x composes with the scale in one matrix.
      gsap.set(titleGhost.current, { x: -45, transformOrigin: '50% 50%', scale: 1, opacity: 1 })
      gsap.set(copyGroup.current, { opacity: 1 })
      gsap.set(riseWrap.current, { y: 0 })
      gsap.set(overlay.current, { opacity: 1 }) // blank overlay hides the lettering at rest

      elRefs.current.forEach((node, i) => {
        if (!node) return
        const c = cutouts[i]
        gsap.set(node, c.reveal === 'fade' ? { opacity: 0 } : { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
        const f = floatRefs.current[i]
        if (f) {
          gsap.to(f, { yPercent: -6 - (i % 4) * 2, duration: 2.4 + (i % 3) * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.12 })
        }
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
      // Blank overlay fades across the bloom window — pristine until onset, then
      // the lettering reveals gradually with the characters (matches reference).
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
      bloomTl.set({}, {}, 1.0)
    }, section)
    return () => ctx.revert()
  }, [reduced, cutouts])

  // ── Reduced-motion: static rest composition ──
  if (reduced) {
    return (
      <section id="hero" data-theme="dark" className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#0c2f4a] px-6 text-center">
        <div className="flex flex-col items-center leading-[0.74]">
          <span className="ml-[-23px] font-metrisch text-[13vw] font-bold uppercase tracking-[-0.02em] text-[#6ebe4a] lg:text-[10vw]">Printing</span>
          <span className="font-metrisch text-[13vw] font-bold uppercase tracking-[-0.02em] text-white lg:text-[10vw]">Stories</span>
        </div>
        <p className="mt-8 max-w-[900px] text-[26px] leading-[1.2] text-white/90">At Alternativ, we believe that beautiful prints have the power to tell beautiful stories.</p>
      </section>
    )
  }

  return (
    <section id="hero" ref={section} data-theme="dark" className="relative z-[1] bg-[#0c2f4a]" style={{ height: '250vh' }}>
      {/* overflow-x-clip (not overflow-hidden): still contains the wide bloom
          horizontally, but lets the book's bowed bottom page-stack extend below
          the pin box instead of being cut flat at pin release. */}
      <div ref={pin} className="sticky top-0 h-[100svh] overflow-x-clip">
        {/* Two static corner ornaments (bottom-left, bottom-right lower by ~104px) */}
        <img src={ORNAMENT} width={295} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 z-0 select-none" />
        <img src={ORNAMENT} width={295} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 z-0 select-none" style={{ marginBottom: '-104px' }} />

        {/* Book + bloom — the whole graph wrapper rises together. Book TOP sits
            at 64vh (peeking) at rest; the rise raises it into view. */}
        <div ref={riseWrap} className="absolute inset-x-0 top-0 z-[15] mt-[64vh] flex flex-col items-center will-change-transform">
          <div className="relative flex w-full justify-center">
            {/* lettered base (always present) */}
            <img src={BOOK_BASE} alt="Open book" className="block w-full select-none object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]" draggable="false" />
            {/* blank overlay on top at the same footprint — fades out to reveal the lettering */}
            <img ref={overlay} src={BOOK_OVER} alt="" aria-hidden="true" className="pointer-events-none absolute left-0 top-0 w-full select-none object-contain" draggable="false" />

            {/* bloom cutouts, each CENTRED at (cx, cy) px from the book centre */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div ref={bloomWrap} className="relative">
                {cutouts.map((c, i) => {
                  const src = cutoutSrc(c)
                  if (!src) return null
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
                          src={src}
                          alt={cutoutAlt(c)}
                          className="block w-full max-w-none select-none drop-shadow-xl"
                          draggable="false"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Centered content block (title / subcopy / CTA) */}
        <div ref={textWrap} className="absolute inset-x-0 top-0 z-30 flex flex-col items-center px-4 pt-[29vh] font-metrisch">
          <div ref={titleGhost} className="flex flex-col items-center leading-[0.74] will-change-transform">
            {/* PRINTING */}
            <div className="ml-[-23px] text-[13vw] font-bold uppercase text-[#6ebe4a] lg:text-[10vw]" style={{ letterSpacing: '-0.2vw' }}>
              Printing
            </div>
            {/* STORIES with the inline seal forming the "O" */}
            <div className="mt-[5px] flex items-center text-[13vw] font-bold uppercase text-white lg:text-[10vw]" style={{ letterSpacing: '-0.2vw' }}>
              <img
                src={SEAL}
                alt="Printing stories seal"
                className="hidden shrink-0 select-none md:block"
                style={{ width: 117, marginTop: -18, marginRight: 9, marginLeft: -11, animation: 'seal-spin 60s linear infinite' }}
                draggable="false"
              />
              Stories
            </div>
          </div>

          <div ref={copyGroup} className="flex flex-col items-center will-change-[opacity]">
            <p className="ml-[106px] mt-[5px] max-w-[1000px] text-left text-[26px] font-normal leading-[1.2] text-white">
              At Alternativ, we believe that beautiful prints have the power to tell beautiful stories.
            </p>

            <div className="mt-[40px] flex items-center gap-[30px]">
            <a href="#expertise" className="group flex h-[62px] items-center justify-between gap-[35px] rounded-[40px] border border-white pl-[32px] text-[18px] font-medium text-white transition-opacity hover:opacity-45">
              Our expertise
              <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-full border border-white transition-transform group-hover:translate-x-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5 7 7-7 7" /></svg>
              </span>
            </a>
            <a href="#approach" className="text-[18px] font-medium text-white underline decoration-white/60 underline-offset-4 transition hover:decoration-white">
              Our approach
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
