import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { covers } from '@/lib/assets'
import { SectionTag } from '@/components/craft'
import { prefersReduced } from '@/lib/useReducedMotion'

// Geometry for a book at fan-offset o (= index - active).
function place(o, mobile) {
  const active = o === 0
  const spread = mobile ? 128 : 176
  return {
    x: o * spread,
    y: Math.abs(o) * (mobile ? 10 : 16),
    z: active ? (mobile ? 120 : 220) : -Math.abs(o) * (mobile ? 90 : 140),
    rotateY: active ? -6 : o * (mobile ? -16 : -22),
    scale: active ? (mobile ? 1.04 : 1.12) : 1 - Math.abs(o) * 0.05,
  }
}

function Book({ cover, offset, mobile, onSelect, active }) {
  const p = place(offset, mobile)
  const reduced = prefersReduced()
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-label={`${cover.label} — bring forward`}
      aria-pressed={active}
      className="focus-ring absolute left-1/2 top-1/2 -ml-[110px] -mt-[150px] h-[300px] w-[220px] cursor-pointer md:-ml-[135px] md:-mt-[180px] md:h-[360px] md:w-[270px]"
      style={{ zIndex: 50 - Math.abs(offset) * 10, transformStyle: 'preserve-3d' }}
      initial={false}
      animate={{ x: p.x, y: p.y, z: p.z, rotateY: p.rotateY, scale: p.scale }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: 'spring', stiffness: 120, damping: 18, mass: 0.9 }
      }
    >
      <div className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
        {/* page block on the fore-edge for real book thickness */}
        <div
          className="absolute right-0 top-[1.5%] h-[97%] w-[16px] rounded-r-[3px] bg-[repeating-linear-gradient(90deg,#efe7d6,#efe7d6_1px,#d9cfba_1px,#d9cfba_2px)]"
          style={{ transform: 'translateX(14px) rotateY(52deg)', transformOrigin: 'left center' }}
        />
        <img
          src={cover.src}
          alt={`${cover.label} book sample cover`}
          className="relative h-full w-full rounded-[3px] object-cover shadow-[0_30px_60px_-18px_rgba(22,19,15,0.55)]"
          draggable="false"
        />
        {/* spine shading + darken non-active for depth */}
        <div className="pointer-events-none absolute inset-0 rounded-[3px] bg-gradient-to-r from-black/25 via-transparent to-black/10" />
        <div
          className="pointer-events-none absolute inset-0 rounded-[3px] bg-ink transition-opacity duration-300"
          style={{ opacity: active ? 0 : 0.22 }}
        />
      </div>
    </motion.button>
  )
}

export default function BookFan() {
  const [active, setActive] = useState(2)
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  const stage = useRef(null)
  const tiltRef = useRef(null)
  const touch = useRef(0)

  useEffect(() => {
    const on = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', on, { passive: true })
    return () => window.removeEventListener('resize', on)
  }, [])

  // subtle scroll-driven tilt of the whole shelf
  useEffect(() => {
    if (prefersReduced()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        tiltRef.current,
        { rotateX: 12, y: 40 },
        {
          rotateX: -3,
          y: -10,
          ease: 'none',
          scrollTrigger: { trigger: stage.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
        },
      )
    }, stage)
    return () => ctx.revert()
  }, [])

  const activeCover = covers[active]
  const onTouchStart = (e) => (touch.current = e.touches[0].clientX)
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touch.current
    if (Math.abs(dx) > 44) setActive((a) => Math.min(covers.length - 1, Math.max(0, a + (dx < 0 ? 1 : -1))))
  }

  return (
    <section id="scope" ref={stage} data-theme="light" className="relative overflow-hidden bg-paper py-24 md:py-32">
      {/* giant ghost word */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 select-none font-display text-[22vw] font-extrabold uppercase leading-none text-ink/[0.045]"
      >
        Scope
      </span>

      <div className="relative z-10 mx-auto max-w-page px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionTag index="03" color="var(--ink)" className="mb-5 text-ink">
              Print Scope
            </SectionTag>
            <h2 className="max-w-xl font-display text-display-m font-extrabold uppercase leading-[0.92] text-ink">
              Five formats,
              <br />
              <span className="font-serif font-medium normal-case italic text-magenta">one press.</span>
            </h2>
          </div>
          <p className="max-w-xs font-mono text-sm leading-relaxed text-ink-500 md:text-right">
            From board books to case-bound anthologies — pick a format and bring it to the front of the shelf.
          </p>
        </div>
      </div>

      {/* the fan stage */}
      <div
        className="relative z-10 mt-4 flex h-[440px] items-center justify-center md:mt-2 md:h-[560px]"
        style={{ perspective: mobile ? '1100px' : '1700px' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* active tint glow on the paper */}
        <div
          className="pointer-events-none absolute h-[360px] w-[360px] rounded-full blur-[70px] transition-all duration-500 md:h-[460px] md:w-[460px]"
          style={{ background: activeCover.tint, opacity: 0.16 }}
        />
        <div ref={tiltRef} className="relative h-full w-full" style={{ transformStyle: 'preserve-3d' }}>
          {covers.map((c, i) => (
            <Book
              key={c.key}
              cover={c}
              offset={i - active}
              mobile={mobile}
              active={i === active}
              onSelect={() => setActive(i)}
            />
          ))}
        </div>
      </div>

      {/* spec readout for the active format */}
      <div className="relative z-10 mx-auto mb-9 mt-2 flex max-w-page items-center justify-center gap-4 px-6">
        <span className="label text-ink-500">Plate 0{active + 1}</span>
        <span className="h-px w-8 bg-ink/20" />
        <span className="font-mono text-sm text-ink-600">{activeCover.spec}</span>
      </div>

      {/* category pills */}
      <div className="relative z-10 mx-auto flex max-w-page snap-x gap-2.5 overflow-x-auto px-6 pb-1 md:justify-center">
        {covers.map((c, i) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`focus-ring flex shrink-0 snap-center items-center gap-2 rounded-full px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors duration-200 ${
              i === active ? 'bg-ink text-paper' : 'bg-ink/[0.06] text-ink-500 hover:bg-ink/[0.12]'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.tint }} />
            {c.label}
          </button>
        ))}
      </div>
    </section>
  )
}
