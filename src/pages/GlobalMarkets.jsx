import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import { CertificateIcon, PenNibIcon, PrinterIcon, HeadsetIcon } from '@/components/CredentialIcons'

const NAVY = '#0F2444'
const CREAM = '#FDFAF4'
const BEIGE = '#F0EBE0'
const INK = '#1C2019'
const GOLD = '#9B7420'
const GOLD_BRIGHT = '#D99637' // canonical on-navy accent (gold-2) — was off-palette #C89A3C
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

export default function GlobalMarkets() {
  const { t } = useTranslation('globalMarkets')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.globalMarkets'), item: 'https://www.quarterfoldltd.com/global-markets' },
    ],
  }

  const regions = t('regions', { returnObjects: true })
  const bullets = t('credentials.bullets', { returnObjects: true })

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* 1 ── HERO (navy) — header + subline ──────────────────────────────────── */}
      <section data-theme="dark" className="u-hero" aria-labelledby="globalmarkets-h1">
        <div className="u-hero-inner">
          <div className="u-hero-copy">
            <h1 id="globalmarkets-h1" className="u-h1" data-textreveal>{t('hero.title')}</h1>
            <p className="u-hero-sub" data-reveal>{t('hero.subhead')}</p>
          </div>
        </div>
      </section>

      {/* 2 ── REGIONS (cream) ─ three regional blocks ────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-12 md:grid-cols-3">
            {regions && regions.map((region, idx) => (
              <div key={idx} data-reveal className="flex flex-col">
                <h2 className="text-[26px] font-bold leading-tight mb-2" style={{ fontFamily: TIGHT, color: NAVY }}>
                  {region.title}
                </h2>
                {region.subtitle && (
                  <p className="text-[14px] font-medium mb-4" style={{ fontFamily: INTER, color: GOLD_TEXT }}>
                    {region.subtitle}
                  </p>
                )}
                <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                  {region.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 ── CREDENTIALS (navy) ─ lead-in + 4-column aligned cards ────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        <SectionCurve position="top" fill={NAVY} />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div data-reveal className="mb-16">
            <p className="text-[18px] font-semibold leading-relaxed mb-12" style={{ fontFamily: TIGHT, color: CREAM }}>
              {t('credentials.leadIn')}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {bullets && bullets.map((bullet, idx) => {
              const icons = [CertificateIcon, PenNibIcon, PrinterIcon, HeadsetIcon]
              const Icon = icons[idx]
              return (
                <div key={idx} data-reveal className="flex flex-col group">
                  {/* Icon */}
                  <div className="mb-5">
                    <Icon />
                  </div>
                  {/* Fixed title zone for alignment */}
                  <h3 className="text-[18px] font-bold leading-tight" style={{ fontFamily: TIGHT, color: GOLD_BRIGHT, minHeight: '3em' }}>
                    {bullet.title}
                  </h3>
                  {/* Description aligned to common baseline */}
                  <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.72)' }}>
                    {bullet.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4 ── PENDING TEAM SECTION (cream) ────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px] text-center" data-reveal>
          <h2 className="font-bold leading-[1.1] tracking-tight text-[clamp(40px,6vw,64px)] mb-6" style={{ fontFamily: TIGHT, color: NAVY }}>
            {t('teamSection.heading')}
          </h2>
          <p className="mx-auto max-w-2xl text-[18px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
            {t('teamSection.placeholder')}
          </p>
        </div>
      </section>
    </main>
  )
}
