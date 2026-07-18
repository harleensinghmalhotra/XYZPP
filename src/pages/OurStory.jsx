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

      {/* SECTION 1 ── HERO BAND (hero navy #0e1b46) ────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: HERO_NAVY }}>
        <WavyBackground className="u-hero-waves absolute inset-0" />
        <div className="u-hero-beam absolute inset-0" aria-hidden="true" style={{
          background: `radial-gradient(120% 90% at 100% 0%, rgba(215,141,38,0.13) 0%, transparent 55%),
                      radial-gradient(90% 80% at 0% 100%, rgba(26,49,109,0.5) 0%, transparent 60%)`
        }} />

        <div className="relative z-10 mx-auto max-w-[1400px] px-[clamp(20px,5vw,56px)]">
          <div data-reveal>
            <Eyebrow color={HERO_GOLD}>{t('hero.eyebrow')}</Eyebrow>
          </div>

          <p
            aria-hidden="true"
            className="mt-6 text-[clamp(40px,6vw,88px)] font-extrabold leading-[1.1] tracking-tight"
            style={{ fontFamily: TIGHT, color: CREAM }}
            data-reveal
          >
            {t('hero.display')}
          </p>

          <h1
            className="mt-6 text-[clamp(28px,4vw,64px)] font-semibold leading-tight tracking-tight max-w-[52ch]"
            style={{ fontFamily: TIGHT, color: CREAM }}
            data-textreveal
          >
            {t('hero.title')}
          </h1>

          <p
            className="mt-8 text-[16px] leading-relaxed max-w-[62ch]"
            style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.8)' }}
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
                transform: 'scaleY(0)',
              }}
              aria-hidden="true"
            />

            {/* Spine background line (always visible) */}
            <div
              className="absolute left-1/2 md:left-1/2 top-0 bottom-0 w-[1px]"
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
                        className="mb-12 mx-auto max-w-2xl"
                        style={{
                          aspectRatio: '16/9',
                          background: BEIGE,
                          borderRadius: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        data-slot="about-facility"
                      >
                        <span style={{ fontFamily: MONO, fontSize: '14px', color: 'rgba(28,32,25,0.4)', letterSpacing: '0.2em' }}>IMAGE</span>
                      </div>
                    )}

                    {/* Entry */}
                    <div
                      key={`entry-${idx}`}
                      data-reveal
                      className="grid grid-cols-1 md:grid-cols-[1fr_2px_1fr] md:gap-0 gap-8 items-start md:items-baseline border-t py-12 md:py-16"
                      style={{ borderColor: 'rgba(155,116,32,0.2)' }}
                    >
                      {/* Left content (desktop: odd entries, mobile: all) */}
                      <div className={`md:text-right ${isEvenEntry ? 'md:order-3' : ''}`}>
                        <div
                          className="text-[clamp(24px,3vw,48px)] font-extrabold leading-none mb-6"
                          style={{
                            fontFamily: TIGHT,
                            background: 'linear-gradient(180deg, #fdfaf4 0%, #f0cd82 58%, #D99637 100%)',
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
                          className="w-3 h-3 rounded-full absolute top-[32px]"
                          style={{ background: '#9B7420' }}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Right content (desktop: even entries, mobile: hidden) */}
                      <div className={`${isEvenEntry ? 'md:order-2' : ''}`}>
                        <p className="text-[15px] md:text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}>
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

      {/* SECTION 3 ── MISSION / VISION / VALUES (hero navy, asymmetric grid) ──────── */}
      <section data-theme="dark" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: HERO_NAVY }}>
        <SectionCurve position="top" fill={CREAM} inward />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-[60%_40%] gap-0" style={{ borderTop: '1px solid rgba(155,116,32,0.3)' }}>
            {/* Mission */}
            <div data-reveal className="border-b md:border-b-0 md:border-r py-12 md:py-16 pr-0 md:pr-12" style={{ borderColor: 'rgba(155,116,32,0.3)' }}>
              <Eyebrow color="rgb(170, 111, 29)">{t('mission.label')}</Eyebrow>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.8)' }}>
                {t('mission.desc')}
              </p>
            </div>

            {/* Vision */}
            <div data-reveal className="border-b md:border-b-0 py-12 md:py-16 md:pl-12" style={{ borderColor: 'rgba(155,116,32,0.3)' }}>
              <Eyebrow color="rgb(170, 111, 29)">{t('vision.label')}</Eyebrow>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.8)' }}>
                {t('vision.desc')}
              </p>
            </div>
          </div>

          {/* Values (full width below) */}
          <div
            data-reveal
            className="border-t py-12 md:py-16"
            style={{ borderColor: 'rgba(155,116,32,0.3)' }}
          >
            <Eyebrow color="rgb(170, 111, 29)">{t('values.label')}</Eyebrow>
            <p className="mt-6 text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.8)' }}>
              {t('values.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 ── THE FOUNDER (cream background, two-column spread) ─────────── */}
      <section data-theme="light" className="relative px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-12 md:gap-16 items-start">
            {/* Portrait placeholder */}
            <div
              data-reveal
              className="hidden md:block"
              style={{
                aspectRatio: '3/4',
                background: BEIGE,
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              data-slot="founder-portrait"
            >
              <span style={{ fontFamily: MONO, fontSize: '14px', color: 'rgba(28,32,25,0.4)', letterSpacing: '0.2em' }}>IMAGE</span>
            </div>

            {/* Founder content */}
            <div data-reveal className="flex flex-col">
              <Eyebrow color={GOLD_TEXT}>{t('founder.eyebrow')}</Eyebrow>

              <h2
                className="mt-6 text-[clamp(32px,5vw,64px)] font-extrabold leading-tight tracking-tight"
                style={{ fontFamily: TIGHT, color: INK }}
              >
                {t('founder.name')}
              </h2>

              <p className="mt-4 text-[12px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                {t('founder.role')}
              </p>

              <p className="mt-8 text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('founder.bio')}
              </p>

              {/* Pull quote */}
              <div className="mt-12 pt-12 border-t" style={{ borderColor: 'rgba(155,116,32,0.3)' }}>
                <div className="flex items-start gap-4">
                  <span
                    className="text-[72px] leading-none flex-shrink-0"
                    style={{ color: '#9B7420', marginTop: '-8px' }}
                    aria-hidden="true"
                  >
                    "
                  </span>
                  <div>
                    <p
                      className="text-[18px] leading-relaxed"
                      style={{ fontFamily: TIGHT, fontWeight: 600, color: INK }}
                    >
                      {t('founder.quote')}
                    </p>
                    <p className="mt-4 text-[12px] font-medium uppercase" style={{ fontFamily: MONO, letterSpacing: '0.28em', color: GOLD_TEXT }}>
                      {t('founder.attribution')}
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
