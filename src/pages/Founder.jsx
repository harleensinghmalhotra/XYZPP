import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import PageHero from '@/components/PageHero'
import CTAButton from '@/components/CTAButton'
import { PaperGrain } from '@/components/atmosphere'

const NAVY = '#030C31'
const CREAM = '#FDFAF4'
const BEIGE = '#F0EBE0'
const INK = '#1C2019'
const GOLD = '#925C10'
const GOLD_TEXT = '#925C10'
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

export default function Founder() {
  const { t } = useTranslation('founder')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.founder'), item: 'https://quarterfoldltd.com/founder' },
    ],
  }

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* HERO — two-line band: name is the H1, role a gold sub-line (not the H1) */}
      <PageHero
        id="founder-h1"
        eyebrow={t('hero.eyebrow')}
        line1={t('hero.title')}
        line2={t('hero.subhead')}
        line2Role
        subline={t('hero.narrative')}
        minVh={62}
      >
        <div className="ph-ctas">
          <CTAButton to="/contact" dark>{t('cta.button')}</CTAButton>
        </div>
      </PageHero>

      {/* PORTRAIT SECTION — cream background with placeholder */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-12 md:grid-cols-2 items-start">
            {/* Founder portrait — the real photo (also used on the About page) */}
            <div data-reveal className="flex justify-center">
              <div
                className="w-full max-w-sm aspect-[3/4] rounded-lg overflow-hidden border border-[#925C10]/20"
                style={{ background: BEIGE }}
              >
                <img
                  src="/site-assets/about/founder/founder-portrait.webp"
                  alt={t('hero.portraitAlt')}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Story section */}
            <div data-reveal className="flex flex-col justify-center">
              <div className="mb-8">
                <Eyebrow color={GOLD}>{t('hero.eyebrow')}</Eyebrow>
              </div>
              <h2 className="text-[32px] font-bold leading-tight mb-6 md:text-[42px]" style={{ fontFamily: TIGHT, color: NAVY }}>
                {t('hero.title')}
              </h2>
              <p className="text-[18px] font-semibold mb-6" style={{ fontFamily: TIGHT, color: INK }}>
                {t('hero.subhead')}
              </p>
              <p className="text-[16px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
                {t('hero.narrative')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE SECTION — navy background with featured blockquote */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        <SectionCurve position="top" fill={NAVY} />
        <div className="relative z-10 mx-auto max-w-[900px]" data-reveal>
          <blockquote className="text-center">
            <p
              className="text-[32px] font-bold leading-relaxed mb-6 md:text-[42px]"
              style={{ fontFamily: TIGHT, color: CREAM }}
            >
              "{t('quote.text')}"
            </p>
            <footer style={{ fontFamily: INTER, fontSize: '15px', color: 'rgba(253,250,244,0.72)' }}>
              {t('quote.attribution')}
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA SECTION — cream background */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px] text-center" data-reveal>
          <h2 className="font-bold leading-[1.1] tracking-tight text-[clamp(40px,6vw,64px)] mb-6" style={{ fontFamily: TIGHT, color: NAVY }}>
            {t('cta.heading')}
          </h2>
          <p className="mx-auto max-w-2xl text-[18px] leading-relaxed mb-8" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.78)' }}>
            {t('cta.text')}
          </p>
          <CTAButton to="/contact">{t('cta.button')}</CTAButton>
        </div>
      </section>
    </main>
  )
}
