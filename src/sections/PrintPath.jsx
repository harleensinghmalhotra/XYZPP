import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SectionTag } from '@/components/craft'
import { prefersReduced } from '@/lib/useReducedMotion'

const CY = '#00AEEF', MG = '#EC008C', YE = '#FFC800', PA = '#F3EDE1'

function Glyph({ type }) {
  const common = { width: '100%', height: '100%', viewBox: '0 0 220 220', fill: 'none' }
  if (type === 'prepress')
    return (
      <svg {...common} aria-hidden="true">
        <g stroke={PA} strokeWidth="1.5" opacity="0.5">
          <line x1="40" y1="20" x2="40" y2="200" /><line x1="180" y1="20" x2="180" y2="200" />
          <line x1="20" y1="40" x2="200" y2="40" /><line x1="20" y1="180" x2="200" y2="180" />
        </g>
        <circle cx="110" cy="110" r="46" stroke={CY} strokeWidth="2" /><circle cx="110" cy="110" r="20" stroke={MG} strokeWidth="2" />
        <line x1="110" y1="44" x2="110" y2="176" stroke={PA} strokeWidth="1.5" /><line x1="44" y1="110" x2="176" y2="110" stroke={PA} strokeWidth="1.5" />
      </svg>
    )
  if (type === 'plates')
    return (
      <svg {...common} aria-hidden="true">
        {[CY, MG, YE, PA].map((c, i) => (
          <rect key={i} x={26 + i * 12} y={26 + i * 12} width="120" height="150" rx="4" fill="none" stroke={c} strokeWidth="2" opacity={0.5 + i * 0.14} />
        ))}
      </svg>
    )
  if (type === 'press')
    return (
      <svg {...common} aria-hidden="true">
        <g style={{ mixBlendMode: 'screen' }}>
          <circle cx="92" cy="98" r="54" fill={CY} opacity="0.85" />
          <circle cx="128" cy="98" r="54" fill={MG} opacity="0.85" />
          <circle cx="110" cy="128" r="54" fill={YE} opacity="0.85" />
        </g>
      </svg>
    )
  if (type === 'binding')
    return (
      <svg {...common} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M60 ${56 + i * 22} q50 -14 100 0`} stroke={i === 2 ? MG : PA} strokeWidth="2" fill="none" opacity="0.7" />
        ))}
        <line x1="60" y1="50" x2="60" y2="160" stroke={CY} strokeWidth="3" />
      </svg>
    )
  return (
    <svg {...common} aria-hidden="true">
      <path d="M50 96 L110 66 L170 96 L110 126 Z" stroke={PA} strokeWidth="2" fill="none" />
      <path d="M50 96 L50 150 L110 180 L110 126 Z" stroke={CY} strokeWidth="2" fill="none" />
      <path d="M170 96 L170 150 L110 180 L110 126 Z" stroke={MG} strokeWidth="2" fill="none" />
    </svg>
  )
}

const STAGES = [
  { n: '01', title: 'Pre-press', accent: 'proofed', type: 'prepress', body: 'Files trapped, imposed and soft-proofed. Every registration mark aligned before a single plate is burned.' },
  { n: '02', title: 'Plates', accent: 'burned', type: 'plates', body: 'Four CMYK plates etched to the micron. Cyan, magenta, yellow and key — the whole spectrum from four inks.' },
  { n: '03', title: 'Press run', accent: 'inked', type: 'press', body: 'Sheets fly through the offset tower at 15,000/hour, densitometer-checked so colour never drifts.' },
  { n: '04', title: 'Binding', accent: 'bound', type: 'binding', body: 'Signatures folded, gathered and sewn. Perfect-bound, case-bound or saddle-stitched to spec.' },
  { n: '05', title: 'Dispatch', accent: 'shipped', type: 'dispatch', body: 'Shrink-wrapped, palletised and tracked to 23 countries — on-time, 99.4% of the time.' },
]

export default function PrintPath() {
  const wrap = useRef(null)
  const panel = useRef(null)
  const fill = useRef(null)
  const [active, setActive] = useState(0)
  const [reduced] = useState(prefersReduced)

  useEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      // CSS `position: sticky` does the visual hold (CLS-free); ScrollTrigger
      // only reports progress — no DOM pinning, no position:fixed jump.
      const st = ScrollTrigger.create({
        trigger: wrap.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const p = self.progress
          if (fill.current) gsap.set(fill.current, { scaleX: p })
          const idx = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length + 0.0001))
          setActive((prev) => (prev === idx ? prev : idx))
        },
      })
      return () => st.kill()
    }, wrap)
    return () => ctx.revert()
  }, [reduced])

  // Reduced-motion / no-JS fallback: a clean stacked list.
  if (reduced) {
    return (
      <section id="path" data-theme="dark" className="bg-tone py-24 text-paper paper-grain">
        <div className="mx-auto max-w-page px-6">
          <h2 className="sr-only">The XYZ Print Path — from pre-press to dispatch</h2>
          <SectionTag index="04" color={PA} className="mb-10">The XYZ Print Path</SectionTag>
          <ol className="space-y-14">
            {STAGES.map((s) => (
              <li key={s.n} className="grid gap-6 md:grid-cols-[1fr_2fr] md:items-center">
                <div className="h-40 w-40">
                  <Glyph type={s.type} />
                </div>
                <div>
                  <p className="label mb-2 text-cyan">{s.n}</p>
                  <h3 className="font-display text-4xl font-extrabold uppercase">
                    {s.title} <span className="font-serif italic normal-case text-magenta">{s.accent}</span>
                  </h3>
                  <p className="mt-3 max-w-lg font-mono text-sm text-paper/70">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section
      id="path"
      ref={wrap}
      data-theme="dark"
      className="relative bg-tone text-paper"
      style={{ height: `${STAGES.length * 80}vh` }}
    >
      <div ref={panel} className="sticky top-0 flex h-[100svh] flex-col overflow-hidden paper-grain">
        <div className="mx-auto flex w-full max-w-page flex-1 flex-col px-6 pb-20 pt-24">
          <h2 className="sr-only">The XYZ Print Path — from pre-press to dispatch</h2>
          <div className="flex items-center justify-between">
            <SectionTag index="04" color={PA}>The XYZ Print Path</SectionTag>
            <span className="label text-paper/40">{active + 1} / {STAGES.length}</span>
          </div>

          <div className="grid flex-1 grid-cols-1 items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            {/* left: copy stack */}
            <div className="relative">
              {STAGES.map((s, i) => (
                <div
                  key={s.n}
                  aria-hidden={i !== active}
                  className="transition-all duration-500 ease-out"
                  style={{
                    position: i === active ? 'relative' : 'absolute',
                    inset: i === active ? undefined : 0,
                    opacity: i === active ? 1 : 0,
                    transform: `translateY(${i === active ? 0 : 24}px)`,
                    pointerEvents: i === active ? 'auto' : 'none',
                  }}
                >
                  <p className="label mb-4 text-cyan">Stage {s.n}</p>
                  <h3 className="font-display text-[clamp(2.6rem,7vw,6rem)] font-extrabold uppercase leading-[0.9]">
                    {s.title}
                    <br />
                    <span className="font-serif font-medium normal-case italic text-magenta">{s.accent}.</span>
                  </h3>
                  <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-paper/70">{s.body}</p>
                </div>
              ))}
            </div>

            {/* right: glyph + big index */}
            <div className="relative hidden aspect-square w-full max-w-[420px] justify-self-center md:block">
              <span className="absolute inset-0 grid place-items-center font-display text-[16rem] font-extrabold leading-none text-paper/[0.05]">
                {STAGES[active].n}
              </span>
              {STAGES.map((s, i) => (
                <div
                  key={s.n}
                  className="absolute inset-[14%] transition-opacity duration-500"
                  style={{ opacity: i === active ? 1 : 0 }}
                >
                  <Glyph type={s.type} />
                </div>
              ))}
            </div>
          </div>

          {/* progress rail */}
          <div className="mt-auto">
            <div className="mb-3 hidden justify-between md:flex">
              {STAGES.map((s, i) => (
                <span
                  key={s.n}
                  className="label transition-colors duration-300"
                  style={{ color: i <= active ? PA : 'rgba(243,237,225,0.32)' }}
                >
                  {s.title}
                </span>
              ))}
            </div>
            <div className="mb-3 flex items-center gap-2 md:hidden">
              {STAGES.map((s, i) => (
                <span
                  key={s.n}
                  className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
                  style={{ background: i <= active ? CY : 'rgba(243,237,225,0.25)' }}
                />
              ))}
              <span className="label ml-2 text-paper/70">{STAGES[active].title}</span>
            </div>
            <div className="h-[3px] w-full overflow-hidden bg-paper/15">
              <div ref={fill} className="h-full origin-left bg-cyan" style={{ transform: 'scaleX(0)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
