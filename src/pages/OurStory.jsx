import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { DotField, PaperGrain, WavyBackground } from '@/components/atmosphere'

const NAVY = '#0F2444'
const CREAM = '#FDFAF4'
const BEIGE = '#F0EBE0'
const INK = '#1C2019'
const GOLD = '#9B7420'
const GOLD_BRIGHT = '#C89A3C'
const GOLD_TEXT = '#836013'
const TIGHT = "'Inter Tight', sans-serif"
const INTER = "'Inter', sans-serif"
const MONO = "'DM Mono', monospace"

const focusGold = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7420] focus-visible:ring-offset-2'

function Eyebrow({ children, color = GOLD_TEXT, className = '' }) {
  return (
    <p className={`text-[12px] font-medium uppercase ${className}`} style={{ fontFamily: MONO, letterSpacing: '0.28em', color }}>
      {children}
    </p>
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

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* 1 ── HERO (navy) — canonical unified hero ─────────────────────────────── */}
      <section data-theme="dark" className="u-hero" aria-labelledby="ourstory-h1">
        <WavyBackground className="u-hero-waves" />
        <div className="u-hero-beam" aria-hidden="true" />
        <div className="u-hero-inner">
          <div className="u-hero-copy">
            <p className="u-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
            <h1 id="ourstory-h1" className="u-h1" data-textreveal>{t('hero.title')}</h1>
            <p className="u-hero-sub" data-reveal>{t('hero.lede')}</p>
            <div className="u-hero-ctas" data-reveal>
              <Link to="/contact" className="u-btn u-btn--gold">{t('hero.cta')}</Link>
            </div>
          </div>
          <div className="u-hero-stat">
            <span className="u-stat-num" aria-hidden="true">{t('hero.statNum')}</span>
            <span className="u-stat-unit">{t('hero.statUnit')}</span>
            <span className="u-stat-foot">{t('hero.statFoot')}</span>
          </div>
        </div>
      </section>

      {/* 2 ── TIMELINE — 5 stops (navy) ──────────────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        <SectionCurve position="top" fill={NAVY} />
        <DotField tone="navy" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div data-reveal>
            <Eyebrow color={GOLD_BRIGHT}>{t('timeline.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-extrabold leading-none tracking-tight text-[clamp(48px,8vw,120px)]" style={{ fontFamily: TIGHT, color: 'rgba(253,250,244,0.9)' }}>
              {t('timeline.title')}
            </h2>
          </div>
          <div className="mt-14">
            {t('timeline.stops', { returnObjects: true }).map((stop, idx) => (
              <div
                key={idx}
                data-reveal
                className="grid grid-cols-1 items-baseline gap-3 border-t py-8 md:grid-cols-[160px_1fr_1.1fr] md:gap-10 md:py-9"
                style={{ borderColor: 'rgba(200,154,60,0.28)' }}
              >
                <div className="text-[clamp(28px,4vw,48px)] font-extrabold leading-[0.9]" style={{ fontFamily: TIGHT, background: 'linear-gradient(180deg, #fdfaf4 0%, #f0cd82 58%, #c89a3c 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>
                  {stop.year}
                </div>
                <h3 className="text-[20px] font-semibold md:text-[23px]" style={{ fontFamily: TIGHT, color: CREAM }}>{stop.label}</h3>
                <p className="text-[15px] leading-relaxed md:text-[16px]" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.72)' }}>{stop.desc}</p>
              </div>
            ))}
            <div className="border-t" style={{ borderColor: 'rgba(200,154,60,0.28)' }} />
          </div>
        </div>
      </section>

      {/* 3 ── MISSION, VISION, VALUES (cream → beige → cream) ──────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-12 md:grid-cols-3">
            {/* Mission */}
            <div data-reveal className="flex flex-col">
              <div className="mb-6 h-12 w-12 rounded-none flex items-center justify-center" style={{ background: BEIGE }}>
                <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: GOLD }}>01</span>
              </div>
              <h2 className="text-[26px] font-bold leading-tight mb-4" style={{ fontFamily: TIGHT, color: NAVY }}>
                {t('mission.title')}
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('mission.desc')}
              </p>
            </div>

            {/* Vision */}
            <div data-reveal className="flex flex-col">
              <div className="mb-6 h-12 w-12 rounded-none flex items-center justify-center" style={{ background: BEIGE }}>
                <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: GOLD }}>02</span>
              </div>
              <h2 className="text-[26px] font-bold leading-tight mb-4" style={{ fontFamily: TIGHT, color: NAVY }}>
                {t('vision.title')}
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('vision.desc')}
              </p>
            </div>

            {/* Values */}
            <div data-reveal className="flex flex-col">
              <div className="mb-6 h-12 w-12 rounded-none flex items-center justify-center" style={{ background: BEIGE }}>
                <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 600, color: GOLD }}>03</span>
              </div>
              <h2 className="text-[26px] font-bold leading-tight mb-4" style={{ fontFamily: TIGHT, color: NAVY }}>
                {t('values.title')}
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('values.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 ── CTA SECTION (navy) ───────────────────────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        <SectionCurve position="top" fill={CREAM} inward />
        <div className="relative z-10 mx-auto max-w-[1400px] text-center" data-reveal>
          <h2 className="font-extrabold leading-[1.1] tracking-tight text-[clamp(40px,6vw,88px)]" style={{ fontFamily: TIGHT, color: CREAM, marginBottom: '24px' }}>
            Ready to bring your educational books to life?
          </h2>
          <p className="mx-auto max-w-2xl text-[18px] leading-relaxed mb-8" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.76)' }}>
            From small print runs to millions of copies, we have the expertise and facilities to deliver your vision on time and on budget.
          </p>
          <Link to="/contact" className="u-btn u-btn--gold">{t('hero.cta')}</Link>
        </div>
      </section>
    </main>
  )
}
