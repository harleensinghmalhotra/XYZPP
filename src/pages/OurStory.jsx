import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain, WavyBackground } from '@/components/atmosphere'

gsap.registerPlugin(ScrollTrigger)

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

export default function OurStory() {
  const { t } = useTranslation('ourStory')
  const spineOverlayRef = useRef(null)

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.about'), item: 'https://www.quarterfoldltd.com/about' },
    ],
  }

  const timelineStops = t('timeline.stops', { returnObjects: true })

  useEffect(() => {
    if (!spineOverlayRef.current) return

    // Respect prefers-reduced-motion: skip GSAP, set spine to full visibility
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      spineOverlayRef.current.style.scaleY = '1'
      return
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spineOverlayRef.current.closest('section'),
        start: 'top center',
        end: 'bottom center',
        scrub: 0.5,
        markers: false,
      },
    })

    tl.fromTo(
      spineOverlayRef.current,
      { scaleY: 0 },
      { scaleY: 1, transformOrigin: 'top center', duration: 1 }
    )

    return () => {
      tl.kill()
    }
  }, [])

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* SECTION 1 ── HERO BAND (hero navy #0e1b46 with homepage scale ~70vh) ───────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 sm:px-10" style={{ background: HERO_NAVY, minHeight: 'clamp(65vh, 75vh, 100vh)', display: 'flex', alignItems: 'center' }}>
        <WavyBackground className="u-hero-waves absolute inset-0" />
        <div className="u-hero-beam absolute inset-0" aria-hidden="true" style={{
          background: `radial-gradient(120% 90% at 100% 0%, rgba(187,122,32,0.13) 0%, transparent 55%),
                      radial-gradient(90% 80% at 0% 100%, rgba(26,49,109,0.5) 0%, transparent 60%)`
        }} />

        <div className="relative z-10 mx-auto max-w-[1280px] w-full px-[clamp(20px,5vw,56px)]">
          <div data-reveal>
            <Eyebrow color={HERO_GOLD}>{t('hero.eyebrow')}</Eyebrow>
          </div>

          {/* Architectural display with flanking rules */}
          <div className="mt-8 mb-6 flex items-center gap-8 md:gap-12">
            <div className="h-[2px] flex-shrink-0 w-12" style={{ background: 'rgba(187,122,32,0.6)' }} />
            <p
              aria-hidden="true"
              className="text-[clamp(64px,9vw,104px)] font-extrabold leading-[0.92] tracking-tight flex-1"
              style={{ fontFamily: MONO, letterSpacing: '0.06em', color: CREAM }}
              data-reveal
            >
              {t('hero.display')}
            </p>
            <div className="h-[2px] flex-shrink-0 w-12" style={{ background: 'rgba(187,122,32,0.6)' }} />
          </div>

          <h1
            className="mt-8 text-[clamp(32px,5vw,72px)] font-semibold leading-tight tracking-tight max-w-[55ch]"
            style={{ fontFamily: TIGHT, color: CREAM }}
            data-textreveal
          >
            {t('hero.title')}
          </h1>

          <p
            className="mt-10 text-[clamp(16px,1.2vw,18px)] leading-relaxed max-w-[65ch]"
            style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.85)' }}
            data-reveal
          >
            {t('hero.lede')}
          </p>
        </div>
      </section>

      {/* SECTION 2 ── TIMELINE (cream background, scroll-linked spine) ────────────── */}
      <section data-theme="light" className="relative px-6 py-24 sm:px-10 md:py-32 overflow-hidden" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div data-reveal className="mb-12">
            <Eyebrow color={GOLD_TEXT}>{t('timeline.eyebrow')}</Eyebrow>
          </div>

          {/* Timeline spine container */}
          <div className="relative">
            {/* Spine overlay (scroll-linked scaleY) */}
            <div
              ref={spineOverlayRef}
              className="absolute left-1/2 md:left-1/2 top-0 bottom-0 w-[2px]"
              style={{
                background: '#9B7420',
                transformOrigin: 'top center',
                transform: 'translateX(-50%) scaleY(0)',
              }}
              aria-hidden="true"
            />

            {/* Spine background line (always visible) */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-[1px]"
              style={{
                background: 'rgba(155, 116, 32, 0.2)',
                transform: 'translateX(-50%)',
              }}
              aria-hidden="true"
            />

            {/* Timeline entries */}
            <div className="space-y-0">
              {timelineStops && timelineStops.map((stop, idx) => {
                const isEvenEntry = idx % 2 === 0

                return (
                  <div key={idx}>
                    {/* Image slot after entry 3 (between stops[2] and stops[3]) */}
                    {idx === 3 && (
                      <div
                        data-reveal
                        className="my-16 md:my-20 mx-auto max-w-2xl w-full"
                        style={{
                          aspectRatio: '16/9',
                          background: BEIGE,
                          borderRadius: '22px',
                          border: '1px solid rgba(155, 116, 32, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: 'inset 0 1px 0 rgba(155, 116, 32, 0.08)',
                        }}
                        data-slot="about-facility"
                      >
                        <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
                      </div>
                    )}

                    {/* Entry */}
                    <div
                      key={`entry-${idx}`}
                      data-reveal
                      className="grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] md:gap-0 gap-10 items-start md:items-center border-t py-16 md:py-24"
                      style={{ borderColor: 'rgba(155,116,32,0.2)' }}
                    >
                      {/* Left content (desktop: odd entries, mobile: all) */}
                      <div className={`md:text-right ${isEvenEntry ? 'md:order-3' : ''}`}>
                        <div
                          className="text-[clamp(28px,3vw,52px)] font-extrabold leading-none mb-6"
                          style={{
                            fontFamily: TIGHT,
                            background: 'linear-gradient(180deg, #0e1b46 0%, #9B7420 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {stop.year}
                        </div>
                        <h3 className="text-[18px] md:text-[20px] font-bold leading-tight" style={{ fontFamily: TIGHT, color: INK }}>
                          {stop.title}
                        </h3>
                      </div>

                      {/* Spine node (desktop only) */}
                      <div className="hidden md:flex flex-col items-center relative">
                        <div
                          className="w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2 ring-4"
                          style={{ background: '#9B7420', ringColor: 'rgba(155, 116, 32, 0.2)' }}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Right content (desktop: even entries, mobile: hidden) */}
                      <div className={`${isEvenEntry ? 'md:order-2' : ''}`}>
                        <p className="text-[15px] md:text-[16px] leading-relaxed font-medium" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.8)' }}>
                          {stop.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Final border */}
              <div className="border-t" style={{ borderColor: 'rgba(155,116,32,0.2)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 ── MISSION / VISION / VALUES (hero navy with atmosphere treatment) ─────── */}
      <section data-theme="dark" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: HERO_NAVY }}>
        <SectionCurve position="top" fill={CREAM} inward />

        {/* Dark-section atmosphere treatment */}
        <div className="absolute inset-0 z-0" style={{
          background: `radial-gradient(120% 80% at 50% 0%, rgba(187,122,32,0.08) 0%, transparent 50%),
                      radial-gradient(90% 70% at 0% 100%, rgba(26,49,109,0.3) 0%, transparent 60%)`
        }} />

        <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
          <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-0" style={{ borderTop: '2px solid rgb(155, 116, 32)' }}>
            {/* Mission */}
            <div data-reveal className="border-b md:border-b-0 md:border-r py-16 md:py-20 pr-0 md:pr-16" style={{ borderColor: 'rgb(155, 116, 32)' }}>
              <Eyebrow color="#B07A20">{t('mission.label')}</Eyebrow>
              <p className="mt-6 text-[clamp(15px,1.2vw,16px)] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.85)' }}>
                {t('mission.desc')}
              </p>
            </div>

            {/* Vision */}
            <div data-reveal className="border-b md:border-b-0 py-16 md:py-20 md:pl-16" style={{ borderColor: 'rgb(155, 116, 32)' }}>
              <Eyebrow color="#B07A20">{t('vision.label')}</Eyebrow>
              <p className="mt-6 text-[clamp(15px,1.2vw,16px)] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.85)' }}>
                {t('vision.desc')}
              </p>
            </div>
          </div>

          {/* Values (full width below) */}
          <div
            data-reveal
            className="border-t py-16 md:py-20"
            style={{ borderColor: 'rgb(155, 116, 32)' }}
          >
            <Eyebrow color="#B07A20">{t('values.label')}</Eyebrow>
            <p className="mt-6 text-[clamp(15px,1.2vw,16px)] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.85)' }}>
              {t('values.desc')}
            </p>
          </div>
        </div>

        <SectionCurve position="bottom" fill={CREAM} inward />
      </section>

      {/* SECTION 4 ── THE FOUNDER (editorial spread with portrait frame + pull quote) ──────── */}
      <section data-theme="light" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1280px] px-[clamp(20px,5vw,56px)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-12 md:gap-20 items-start">
            {/* Portrait with gold offset-frame detail */}
            <div
              data-reveal
              className="hidden md:block relative"
              style={{ aspectRatio: '3/4' }}
              data-slot="founder-portrait"
            >
              {/* Gold offset-frame detail (shadow rectangle behind) */}
              <div
                className="absolute inset-0 rounded-[24px]"
                style={{
                  background: 'none',
                  border: '2.5px solid #9B7420',
                  transform: 'translate(16px, 16px)',
                  zIndex: 0,
                  opacity: 0.7,
                }}
                aria-hidden="true"
              />

              {/* Main portrait container */}
              <div
                className="relative rounded-[22px] overflow-hidden w-full h-full flex items-center justify-center"
                style={{
                  background: BEIGE,
                  border: '1px solid rgba(155, 116, 32, 0.2)',
                  zIndex: 1,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: '13px', color: 'rgba(28,32,25,0.35)', letterSpacing: '0.2em' }}>IMAGE</span>
              </div>
            </div>

            {/* Founder content */}
            <div data-reveal className="flex flex-col">
              <Eyebrow color={GOLD_TEXT}>{t('founder.eyebrow')}</Eyebrow>

              <h2
                className="mt-6 text-[clamp(38px,5vw,72px)] font-extrabold leading-tight tracking-tight"
                style={{ fontFamily: TIGHT, color: INK }}
              >
                {t('founder.name')}
              </h2>

              <p className="mt-4 text-[12px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                {t('founder.role')}
              </p>

              <p className="mt-8 text-[clamp(15px,1.2vw,16px)] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('founder.bio')}
              </p>

              {/* Pull quote with oversized gold mark */}
              <div className="mt-16 pt-12 border-t" style={{ borderColor: '#9B7420' }}>
                <div className="flex items-start gap-6">
                  <span
                    className="text-[96px] leading-[0.8] flex-shrink-0 font-light"
                    style={{ color: '#9B7420', marginTop: '-12px', fontFamily: MONO }}
                    aria-hidden="true"
                  >
                    "
                  </span>
                  <div className="flex-1">
                    <p
                      className="text-[clamp(18px,2vw,22px)] leading-relaxed"
                      style={{ fontFamily: TIGHT, fontWeight: 600, color: INK }}
                    >
                      {t('founder.quote')}
                    </p>
                    <p className="mt-6 text-[12px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                      — {t('founder.attribution')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
