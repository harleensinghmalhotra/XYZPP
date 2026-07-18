import { useTranslation } from 'react-i18next'
import { useState, useEffect, useRef } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'

const HERO_NAVY = '#0e1b46'
const HERO_GOLD = 'rgb(170, 111, 29)'
const CREAM = '#FDFAF4'
const BEIGE = '#F0EBE0'
const INK = '#1C2019'
const GOLD_TEXT = '#9d6f14'
const TIGHT = "'Inter Tight', sans-serif"
const INTER = "'Inter', sans-serif"
const MONO = "'DM Mono', monospace"

function Eyebrow({ children, color = GOLD_TEXT, className = '' }) {
  return (
    <p className={`text-[12px] font-medium uppercase ${className}`} style={{ fontFamily: MONO, letterSpacing: '0.28em', color }}>
      {children}
    </p>
  )
}

function SplitTextReveal({ children, as: Component = 'h1', className = '' }) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Component
      className={`overflow-hidden ${className}`}
      style={{ fontFamily: TIGHT }}
      data-textreveal={!reduceMotion}
    >
      {children}
    </Component>
  )
}

export default function OurStory() {
  const { t } = useTranslation('ourStory')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.about'), item: 'https://www.quarterfoldltd.com/about' },
    ],
  }

  const timelineStops = t('timeline.stops', { returnObjects: true })

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* SECTION 1 ── FULLSCREEN TYPOGRAPHIC HERO ───────────────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 sm:px-10" style={{ background: HERO_NAVY, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="relative z-10 mx-auto max-w-[1280px] w-full px-[clamp(20px,5vw,56px)]">
          {/* Eyebrow */}
          <div data-reveal className="mb-12">
            <Eyebrow color={HERO_GOLD}>{t('hero.eyebrow')}</Eyebrow>
          </div>

          {/* Massive display text — the hero */}
          <div className="mb-24">
            <p
              className="text-[clamp(100px,20vw,200px)] font-extrabold leading-[0.88] tracking-tight"
              style={{ fontFamily: TIGHT, letterSpacing: '-0.02em', color: CREAM }}
              data-reveal
            >
              {t('hero.display')}
            </p>
          </div>
        </div>

        {/* Scroll cue (bottom-left) */}
        <div className="absolute bottom-12 left-[clamp(20px,5vw,56px)] z-10 flex items-center gap-4">
          <p style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.28em', color: 'rgba(253,250,244,0.6)' }} className="uppercase font-medium">
            Scroll down
          </p>
          <div
            style={{
              width: '1px',
              height: '32px',
              background: 'rgba(253,250,244,0.4)',
              animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'scaleY 1.5s ease-in-out infinite',
              transformOrigin: 'center',
            }}
            aria-hidden="true"
          />
        </div>

        <style>{`
          @keyframes scaleY {
            0%, 100% { scaleY: 0.3; }
            50% { scaleY: 1; }
          }
        `}</style>
      </section>

      {/* CHAPTER 1 ── STATEMENT ────────────────────────────────────────────────────────── */}
      <section data-theme="light" className="relative px-6 py-20 sm:px-10 md:py-32 overflow-hidden" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
          {/* H1 headline */}
          <SplitTextReveal as="h1" className="text-[clamp(40px,7vw,72px)] font-semibold leading-tight tracking-tight max-w-[18ch] mb-8" style={{ color: INK }}>
            {t('hero.title')}
          </SplitTextReveal>

          {/* Gold divider */}
          <div className="w-10 h-[1px] mb-8" style={{ background: GOLD_TEXT }} aria-hidden="true" />

          {/* Paragraph */}
          <p className="text-[clamp(15px,1.1vw,17px)] leading-relaxed max-w-[58ch] mb-16" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.8)' }}>
            {t('hero.lede')}
          </p>

          {/* Full-bleed media slot */}
          <div
            data-reveal
            className="w-full"
            style={{
              aspectRatio: '21/9',
              background: BEIGE,
              borderRadius: '8px',
              border: '1px solid rgba(155, 116, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-slot="about-facility"
          >
            <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
          </div>
        </div>
      </section>

      {/* CHAPTER 2 ── JOURNEY (Interactive year-rail timeline) ───────────────────────────── */}
      <Timeline stops={timelineStops} />


      {/* CHAPTER 3 ── MISSION / VISION / VALUES (Manifesto stacking on navy band) ──────── */}
      <section data-theme="dark" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: HERO_NAVY }}>
        <SectionCurve position="top" fill={CREAM} inward />

        {/* Dark-section atmosphere treatment */}
        <div className="absolute inset-0 z-0" style={{
          background: `radial-gradient(120% 80% at 50% 0%, rgba(187,122,32,0.08) 0%, transparent 50%),
                      radial-gradient(90% 70% at 0% 100%, rgba(26,49,109,0.3) 0%, transparent 60%)`
        }} />

        <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
          {/* Mission */}
          <div data-reveal className="border-t py-16 md:py-20" style={{ borderColor: 'rgba(155, 116, 32, 0.35)' }}>
            <Eyebrow color={GOLD_TEXT}>{t('mission.label')}</Eyebrow>
            <p className="mt-6 text-[clamp(24px,5vw,40px)] leading-tight font-medium max-w-[30ch]" style={{ fontFamily: TIGHT, color: CREAM }}>
              {t('mission.desc')}
            </p>
          </div>

          {/* Vision */}
          <div data-reveal className="border-t py-16 md:py-20" style={{ borderColor: 'rgba(155, 116, 32, 0.35)' }}>
            <Eyebrow color={GOLD_TEXT}>{t('vision.label')}</Eyebrow>
            <p className="mt-6 text-[clamp(24px,5vw,40px)] leading-tight font-medium max-w-[30ch]" style={{ fontFamily: TIGHT, color: CREAM }}>
              {t('vision.desc')}
            </p>
          </div>

          {/* Values */}
          <div data-reveal className="border-t border-b py-16 md:py-20" style={{ borderColor: 'rgba(155, 116, 32, 0.35)' }}>
            <Eyebrow color={GOLD_TEXT}>{t('values.label')}</Eyebrow>
            <p className="mt-6 text-[clamp(24px,5vw,40px)] leading-tight font-medium max-w-[30ch]" style={{ fontFamily: TIGHT, color: CREAM }}>
              {t('values.desc')}
            </p>
          </div>
        </div>

        <SectionCurve position="bottom" fill={CREAM} inward />
      </section>

      {/* CHAPTER 4 ── THE FOUNDER (YOO-style editorial spread) ──────────────────────────── */}
      <section data-theme="light" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-16 md:gap-24 items-start">
            {/* Left: Portrait + Name + Role (YOO team card anatomy) */}
            <div data-reveal className="flex flex-col">
              {/* Portrait */}
              <div
                className="mb-12 w-full"
                style={{
                  aspectRatio: '3/4',
                  background: BEIGE,
                  borderRadius: '8px',
                  border: '1px solid rgba(155, 116, 32, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                data-slot="founder-portrait"
              >
                <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
              </div>

              {/* Name */}
              <h2 className="text-[clamp(24px,4vw,32px)] font-bold leading-tight mb-2" style={{ fontFamily: TIGHT, color: INK }}>
                {t('founder.name')}
              </h2>

              {/* Hairline divider */}
              <div className="w-8 h-[1px] mb-4" style={{ background: GOLD_TEXT }} aria-hidden="true" />

              {/* Role micro-label */}
              <p className="text-[11px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                {t('founder.role')}
              </p>
            </div>

            {/* Right: Bio + Pull quote (editorial narrative) */}
            <div data-reveal className="flex flex-col">
              {/* Eyebrow */}
              <Eyebrow color={GOLD_TEXT} className="mb-8">{t('founder.eyebrow')}</Eyebrow>

              {/* Bio paragraph */}
              <p className="text-[clamp(15px,1.1vw,17px)] leading-relaxed mb-12" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('founder.bio')}
              </p>

              {/* Pull quote with hairline divider */}
              <div className="border-t pt-12" style={{ borderColor: GOLD_TEXT }}>
                <p className="text-[clamp(22px,4vw,32px)] leading-tight font-medium mb-6" style={{ fontFamily: TIGHT, color: INK }}>
                  {t('founder.quote')}
                </p>
                <p className="text-[11px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                  — {t('founder.attribution')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Timeline({ stops }) {
  const { t } = useTranslation('ourStory')
  const [activeIdx, setActiveIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState(-1)
  const sectionRef = useRef(null)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    // Always register; decide per-keystroke whether the timeline owns the arrows.
    // (The old code checked focus containment ONCE at mount, when focus is still on
    // <body> — so the listener never attached and ← → were dead. Check at event time
    // instead: the arrows drive the rail only while focus sits inside the section,
    // e.g. a year button is focused, and never hijack a text field.)
    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const section = sectionRef.current
      if (!section || !section.contains(document.activeElement)) return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      e.preventDefault()
      if (e.key === 'ArrowLeft') setActiveIdx(prev => Math.max(0, prev - 1))
      else setActiveIdx(prev => Math.min(stops.length - 1, prev + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stops.length])

  const handleYearClick = (idx) => {
    setPrevIdx(activeIdx)
    setActiveIdx(idx)
  }

  const handlePrev = () => {
    if (activeIdx > 0) {
      setPrevIdx(activeIdx)
      setActiveIdx(activeIdx - 1)
    }
  }

  const handleNext = () => {
    if (activeIdx < stops.length - 1) {
      setPrevIdx(activeIdx)
      setActiveIdx(activeIdx + 1)
    }
  }

  const stop = stops[activeIdx]
  const transitionStyle = reduceMotion
    ? {}
    : {
      transition: 'all 300ms ease-out',
      opacity: 1,
      transform: 'translateY(0)',
    }

  return (
    <section data-theme="light" className="relative px-6 py-24 sm:px-10 md:py-32 overflow-hidden" style={{ background: CREAM }} ref={sectionRef}>
      <PaperGrain />
      <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
        <div data-reveal className="mb-16">
          <Eyebrow color={GOLD_TEXT}>{t('timeline.eyebrow')}</Eyebrow>
        </div>

        {/* Desktop: Three-zone layout (LEFT rail / CENTER image / RIGHT content) */}
        <div className="hidden md:grid md:grid-cols-[120px_1fr_1fr] md:gap-16 lg:gap-24 md:items-start">
          {/* LEFT: Year rail */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-px"
              style={{ background: 'rgba(28,32,25,0.15)' }}
              aria-hidden="true"
            />

            {/* Years */}
            <div className="space-y-8">
              {stops.map((s, idx) => {
                const isActive = idx === activeIdx
                return (
                  <button
                    key={idx}
                    onClick={() => handleYearClick(idx)}
                    className="relative text-left group focus-ring"
                    style={{ fontFamily: MONO }}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {/* Dot */}
                    <div
                      className="absolute left-2 top-1 w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        background: isActive ? GOLD_TEXT : 'rgba(28,32,25,0.3)',
                        boxShadow: isActive ? `0 0 0 8px rgba(157, 111, 20, 0.1)` : 'none',
                      }}
                      aria-hidden="true"
                    />

                    {/* Year label */}
                    <span
                      className="block pl-6 transition-all duration-300"
                      style={{
                        fontSize: isActive ? '14px' : '12px',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? GOLD_TEXT : 'rgba(28,32,25,0.45)',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {s.year}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CENTER: Image slot */}
          <div
            className="w-full"
            style={{
              aspectRatio: '4/3',
              background: BEIGE,
              borderRadius: '8px',
              border: '1px solid rgba(155, 116, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-slot={`timeline-${activeIdx}`}
          >
            <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
          </div>

          {/* RIGHT: Content */}
          <div style={transitionStyle}>
            {/* Year huge */}
            <div
              className="mb-4"
              style={{
                fontFamily: TIGHT,
                fontSize: 'clamp(56px, 10vw, 96px)',
                fontWeight: 800,
                color: HERO_NAVY,
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
              }}
            >
              {stop.year}
            </div>

            {/* Title */}
            <h3 className="mb-6" style={{ fontFamily: TIGHT, fontSize: '24px', fontWeight: 700, color: INK }}>
              {stop.title}
            </h3>

            {/* Description */}
            <p className="mb-12" style={{ fontFamily: INTER, fontSize: '15px', lineHeight: 1.6, maxWidth: '46ch', color: 'rgba(28,32,25,0.75)' }}>
              {stop.desc}
            </p>

            {/* Navigation arrows */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={activeIdx === 0}
                aria-label="Previous entry"
                className="focus-ring"
                style={{
                  width: '44px',
                  height: '44px',
                  border: `1.5px solid ${activeIdx === 0 ? 'rgba(14,27,70,0.3)' : HERO_NAVY}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeIdx !== 0) {
                    e.currentTarget.style.background = HERO_NAVY
                    e.currentTarget.style.color = CREAM
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'inherit'
                }}
              >
                <span style={{ fontSize: '18px', color: 'inherit' }}>←</span>
              </button>

              <button
                onClick={handleNext}
                disabled={activeIdx === stops.length - 1}
                aria-label="Next entry"
                className="focus-ring"
                style={{
                  width: '44px',
                  height: '44px',
                  border: `1.5px solid ${activeIdx === stops.length - 1 ? 'rgba(14,27,70,0.3)' : HERO_NAVY}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeIdx === stops.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeIdx !== stops.length - 1) {
                    e.currentTarget.style.background = HERO_NAVY
                    e.currentTarget.style.color = CREAM
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'inherit'
                }}
              >
                <span style={{ fontSize: '18px', color: 'inherit' }}>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-8">
          {/* Year strip */}
          <div className="overflow-x-auto -mx-6 px-6 pb-4">
            <div className="flex gap-3 w-max">
              {stops.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleYearClick(idx)}
                  className="px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 focus-ring whitespace-nowrap"
                  style={{
                    fontFamily: MONO,
                    background: idx === activeIdx ? GOLD_TEXT : 'rgba(155,116,32,0.1)',
                    color: idx === activeIdx ? CREAM : INK,
                  }}
                  aria-current={idx === activeIdx ? 'true' : undefined}
                >
                  {s.year}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div
            className="w-full"
            style={{
              aspectRatio: '4/3',
              background: BEIGE,
              borderRadius: '8px',
              border: '1px solid rgba(155, 116, 32, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-slot={`timeline-${activeIdx}`}
          >
            <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
          </div>

          {/* Content */}
          <div style={transitionStyle}>
            {/* Year */}
            <div
              className="mb-4"
              style={{
                fontFamily: TIGHT,
                fontSize: 'clamp(48px, 8vw, 72px)',
                fontWeight: 800,
                color: HERO_NAVY,
                lineHeight: 0.9,
                letterSpacing: '-0.02em',
              }}
            >
              {stop.year}
            </div>

            {/* Title */}
            <h3 className="mb-4" style={{ fontFamily: TIGHT, fontSize: '20px', fontWeight: 700, color: INK }}>
              {stop.title}
            </h3>

            {/* Description */}
            <p className="mb-8" style={{ fontFamily: INTER, fontSize: '15px', lineHeight: 1.6, color: 'rgba(28,32,25,0.75)' }}>
              {stop.desc}
            </p>

            {/* Navigation arrows */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrev}
                disabled={activeIdx === 0}
                aria-label="Previous entry"
                className="focus-ring"
                style={{
                  width: '44px',
                  height: '44px',
                  border: `1.5px solid ${activeIdx === 0 ? 'rgba(14,27,70,0.3)' : HERO_NAVY}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeIdx !== 0) {
                    e.currentTarget.style.background = HERO_NAVY
                    e.currentTarget.style.color = CREAM
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'inherit'
                }}
              >
                <span style={{ fontSize: '18px', color: 'inherit' }}>←</span>
              </button>

              <button
                onClick={handleNext}
                disabled={activeIdx === stops.length - 1}
                aria-label="Next entry"
                className="focus-ring"
                style={{
                  width: '44px',
                  height: '44px',
                  border: `1.5px solid ${activeIdx === stops.length - 1 ? 'rgba(14,27,70,0.3)' : HERO_NAVY}`,
                  borderRadius: '50%',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: activeIdx === stops.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeIdx !== stops.length - 1) {
                    e.currentTarget.style.background = HERO_NAVY
                    e.currentTarget.style.color = CREAM
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'inherit'
                }}
              >
                <span style={{ fontSize: '18px', color: 'inherit' }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
