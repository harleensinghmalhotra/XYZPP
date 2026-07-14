import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import CountUp from '@/components/CountUp'
import SectionCurve from '@/components/SectionCurve'
import { DotField, EdgeGlow, PaperGrain, WavyBackground } from '@/components/atmosphere'
import GlobeFlyTo from '@/components/GlobeFlyTo'
import { SHOW_MINISTRY_NAMES, SHOW_RESTRICTED_CLIENTS } from '@/lib/compliance'

/* ─────────────────────────────────────────────────────────────────────────────
   /about — QFP "About Us"
   Structure & section rhythm cloned from https://www.grb.uk.com/about-us/,
   reskinned entirely into brand System B. GRB section → QFP section:
     hero · founder greeting · recognition strip · story block · history timeline ·
     statement marquee · what-we-do cards · two-tab services · people teaser ·
     hub links grid.
   DESIGN LAW: navy/gold/cream/beige/ink, Inter Tight/Inter/DM Mono, ≥11px labels.
   Foil (cream→gold) is reserved for large display numbers on navy; smaller gold
   text uses solid #9B7420 (cream, large) / #836013 (cream, small) / #C89A3C (navy).
───────────────────────────────────────────────────────────────────────────── */

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
const FOIL = 'linear-gradient(180deg, #fdfaf4 0%, #f0cd82 58%, #c89a3c 100%)'
const FOIL_SHADOW =
  'drop-shadow(0 2px 3px rgba(0,0,0,.5)) drop-shadow(0 0 26px rgba(200,154,60,.28)) drop-shadow(0 0 64px rgba(200,154,60,.14))'

// Client-name permission gate now imported from the single source of truth
// (src/lib/compliance.js). No written permission on file → HDFC / ZEE / Kidzee
// rows stay hidden, never placeholdered. One flag, no per-page divergence.

const focusGold = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7420] focus-visible:ring-offset-2'

/* ── shared bits ─────────────────────────────────────────────────────────── */

function Eyebrow({ children, color = GOLD_TEXT, className = '' }) {
  return (
    <p className={`text-[12px] font-medium uppercase ${className}`} style={{ fontFamily: MONO, letterSpacing: '0.28em', color }}>
      {children}
    </p>
  )
}

// Large display number, cream→gold foil, on navy only.
function Foil({ children, className = '', style }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: TIGHT,
        fontWeight: 800,
        background: FOIL,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        filter: FOIL_SHADOW,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

// Line-art (stroke) icons — gold, 1.6 stroke, drawn by default.
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
function IconBook(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><path d="M16 7c-2.5-1.6-5.5-2-9-1.4v18c3.5-.6 6.5-.2 9 1.4 2.5-1.6 5.5-2 9-1.4v-18c-3.5-.6-6.5-.2-9 1.4Z"/><path d="M16 7v17.6"/></g></svg>) }
function IconNotebook(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><rect x="8" y="5" width="16" height="22" rx="2"/><path d="M8 11h16M8 16h10M8 21h10"/><path d="M12 5v22"/></g></svg>) }
function IconPOD(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><path d="M9 13V6h14v7"/><rect x="6" y="13" width="20" height="9" rx="1.5"/><path d="M9 22v4h14v-4"/><circle cx="22" cy="17" r="1"/></g></svg>) }
function IconFactory(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><path d="M5 27V14l7 4V14l7 4V8l8 3v16Z"/><path d="M10 27v-4M17 27v-4M23 27v-4"/></g></svg>) }
function IconTruck(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><path d="M3 9h13v12H3zM16 13h6l4 4v4h-10z"/><circle cx="9" cy="24" r="2.2"/><circle cx="22" cy="24" r="2.2"/></g></svg>) }
function IconGlobe(p) { return (<svg viewBox="0 0 32 32" width="30" height="30" {...p}><g {...stroke}><circle cx="16" cy="16" r="11"/><path d="M5 16h22M16 5c3.5 3 3.5 19 0 22M16 5c-3.5 3-3.5 19 0 22"/></g></svg>) }

/* ── data ────────────────────────────────────────────────────────────────── */

// Award marquee — proper names (Dun & Bradstreet, PrintWeek, ASSOCHAM, Federation
// of Indian Publishers, FORBES D-GEMS) stay byte-identical across languages; the
// two descriptive titles (CAPEXIL exporter, Education Export Company) translate.
const AWARDS = ['dun', 'printweek', 'capexil', 'assocham', 'fip', 'forbes', 'eduExport']

// Milestones ordered by scale. Where live figures conflict, the LOWER is used
// (DR Congo 3.5M not 5M; Top publishers 4M not 5M).
// `ministry: true` entries name a government body / ministry / funded programme,
// gated behind SHOW_MINISTRY_NAMES (permission pending). They filter out cleanly
// when off, leaving the non-named milestones and no timeline gaps.
// `key` resolves title/desc via t(`milestones.${key}.title|desc`). `ministry: true`
// entries name a government body / funded programme (gated behind SHOW_MINISTRY_NAMES).
const MILESTONES = [
  { vol: '400M+', key: 'delivered' },
  { vol: '10M+', key: 'tanzania', ministry: true },
  { vol: '10M+', key: 'ghana', ministry: true },
  { vol: '8M+', key: 'nigeria', ministry: true },
  { vol: '7M+', key: 'ivoryCoast', ministry: true },
  { vol: '4M+', key: 'topPublishers' },
  { vol: '3.5M+', key: 'drCongo', ministry: true },
  { vol: '2M+', key: 'maharashtra', ministry: true },
]
const RESTRICTED_MILESTONES = [
  { vol: '1.3M+/mo', key: 'hdfc' },
]

const WHAT_WE_DO = [
  { icon: IconBook, key: 'educationalBooks', to: '/educational-books' },
  { icon: IconNotebook, key: 'tradeBooks', to: '/trade-books' },
  { icon: IconPOD, key: 'printOnDemand', to: '/print-on-demand' },
  { icon: IconFactory, key: 'infrastructure', to: '/infrastructure' },
  { icon: IconTruck, key: 'fulfilment', to: '/fulfilment' },
]

// Tabs keyed by stable id ('publishers'/'institutions'); the visible label comes
// from t(`services.tabs.${id}`), and each card resolves via t(`services.${id}.${key}`).
const SERVICES = {
  publishers: [
    { icon: IconBook, key: 'largeVolume' },
    { icon: IconPOD, key: 'pod' },
    { icon: IconTruck, key: 'warehousing' },
  ],
  institutions: [
    { icon: IconGlobe, key: 'government' },
    { icon: IconNotebook, key: 'content' },
    { icon: IconFactory, key: 'export' },
  ],
}

const HUB = [
  { key: 'contact', to: '/contact', router: true },
  { key: 'infrastructure', to: '/infrastructure', router: true },
  { key: 'certifications', to: '/#certifications', router: false },
  { key: 'sustainability', to: '/#sustainability', router: false },
  { key: 'legal', to: '/legal/privacy', router: true },
]

/* ── marquees (reuse homepage Marquee typographic treatment) ─────────────── */

function StatementMarquee() {
  const { t } = useTranslation('about')
  const words = [t('statement.printedInIndia'), t('statement.readByTheWorld')]
  const Row = () => (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {words.map((word, i) => (
        <span key={word + i} className="flex items-center">
          <span
            className="font-bold uppercase leading-none text-[8vw] md:text-[5.4vw]"
            style={{
              fontFamily: TIGHT,
              color: i % 2 ? 'transparent' : CREAM,
              WebkitTextStroke: i % 2 ? `1.4px ${CREAM}` : undefined,
            }}
          >
            {word}
          </span>
          <span className="mx-[3vw] text-[3.2vw] md:text-[2vw]" style={{ color: GOLD_BRIGHT }} aria-hidden="true">✶</span>
        </span>
      ))}
    </div>
  )
  return (
    <section data-theme="dark" aria-label={t('statement.aria')} className="overflow-hidden border-y py-9 md:py-12" style={{ background: NAVY, borderColor: 'rgba(253,250,244,0.1)' }}>
      <h2 className="sr-only">{t('statement.sr')}</h2>
      <div className="flex w-max motion-safe:animate-[marquee_34s_linear_infinite] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  )
}

function RecognitionMarquee() {
  const { t } = useTranslation('about')
  const Row = () => (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {AWARDS.map((a, i) => (
        <span key={a + i} className="flex items-center">
          <span className="whitespace-nowrap text-[22px] font-semibold md:text-[26px]" style={{ fontFamily: TIGHT, color: NAVY }}>{t(`awards.${a}`)}</span>
          <span className="mx-8 text-[16px]" style={{ color: GOLD }} aria-hidden="true">✶</span>
        </span>
      ))}
    </div>
  )
  return (
    <section data-theme="light" aria-label={t('recognition.aria')} className="relative overflow-hidden py-16 md:py-20" style={{ background: BEIGE }}>
      <SectionCurve position="top" fill={BEIGE} />
      <div className="relative z-10 mx-auto mb-8 max-w-[1400px] px-6 sm:px-10">
        <Eyebrow>{t('recognition.eyebrow')}</Eyebrow>
      </div>
      <ul className="sr-only">{AWARDS.map((a) => <li key={a}>{t(`awards.${a}`)}</li>)}</ul>
      <div className="flex w-max motion-safe:animate-[marquee_40s_linear_infinite] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  )
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function About() {
  const { t } = useTranslation('about')
  const [tab, setTab] = useState('publishers')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.about'), item: 'https://www.quarterfoldltd.com/about' },
    ],
  }

  const baseMilestones = SHOW_MINISTRY_NAMES ? MILESTONES : MILESTONES.filter((m) => !m.ministry)
  const milestones = SHOW_RESTRICTED_CLIENTS ? [...baseMilestones, ...RESTRICTED_MILESTONES] : baseMilestones

  return (
    <main id="main">
      <Seo
        title={t('seo.title')}
        description={t('seo.description')}
        jsonLd={breadcrumb}
      />

      {/* 1 ── HERO (navy) — canonical unified hero (.u-*) ──────────────────── */}
      <section data-theme="dark" className="u-hero" aria-labelledby="about-h1">
        <WavyBackground className="u-hero-waves" />
        <div className="u-hero-beam" aria-hidden="true" />
        <div className="u-hero-inner">
          <div className="u-hero-copy">
            <p className="u-eyebrow" data-reveal>{t('hero.eyebrow')}</p>
            <h1 id="about-h1" className="u-h1" data-textreveal>{t('hero.title')}</h1>
            <p className="u-hero-sub" data-reveal>{t('hero.lede')}</p>
            <div className="u-hero-ctas" data-reveal>
              <Link to="/contact" className="u-btn u-btn--gold">{t('hero.cta')}</Link>
            </div>
          </div>
          <div className="u-hero-stat" aria-label={t('hero.statAria')}>
            <span className="u-stat-num" aria-hidden="true">{t('hero.statNum')}</span>
            <span className="u-stat-unit">{t('hero.statUnit')}</span>
            <span className="u-stat-foot">{t('hero.statFoot')}</span>
          </div>
        </div>
      </section>

      {/* 2 ── FOUNDER GREETING (cream) ────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* portrait */}
          <div className="order-2 lg:order-1" data-reveal>
            <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-none ring-1" style={{ ringColor: NAVY, boxShadow: '0 30px 70px rgba(15,36,68,0.22)' }}>
              <img src="/qfp/about/founder.webp" alt={t('founder.imageAlt')} className="block aspect-[760/920] w-full object-cover" width="760" height="920" loading="lazy" />
            </div>
          </div>
          {/* greeting + quote */}
          <div className="order-1 lg:order-2" data-reveal>
            <h2 className="font-extrabold leading-[0.95] tracking-tight text-[clamp(44px,6vw,86px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              {t('founder.greeting')} <span aria-hidden="true">👋</span>
            </h2>
            <div className="relative mt-8 max-w-2xl">
              <span aria-hidden="true" className="absolute -left-1 -top-8 select-none text-[110px] leading-none" style={{ fontFamily: TIGHT, color: 'rgba(155,116,32,0.22)' }}>“</span>
              <p className="relative text-[clamp(20px,2.4vw,28px)] font-medium italic leading-[1.5]" style={{ fontFamily: TIGHT, color: INK }}>
                {t('founder.quote')}
              </p>
              <p className="mt-7 text-[13px] font-medium not-italic" style={{ fontFamily: MONO, color: GOLD_TEXT, letterSpacing: '0.04em' }}>
                {t('founder.attribution')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ── RECOGNITION STRIP (beige marquee) ───────────────────────────── */}
      <RecognitionMarquee />

      {/* 4 ── STORY BLOCK (cream) ─────────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto grid max-w-[1400px] items-start gap-14 lg:grid-cols-2 lg:gap-20">
          <div data-reveal>
            <div className="overflow-hidden rounded-none ring-1 ring-[#0f2444]/10" style={{ boxShadow: '0 30px 70px rgba(15,36,68,0.18)' }}>
              <img src="/qfp/about/story.webp" alt={t('story.imageAlt')} className="block aspect-[1280/860] w-full object-cover" width="1280" height="860" loading="lazy" />
            </div>
          </div>
          <div data-reveal>
            <Eyebrow>{t('story.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.02] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              {t('story.title')}
            </h2>
            <div className="mt-8 space-y-5 text-[17px] leading-[1.65]" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.82)' }}>
              <p>
                {t('story.para1')}
              </p>
              <p>
                {t('story.para2')}
              </p>
            </div>
            {/* stat row — CountUp odometers, solid gold on cream (large-text carve-out) */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { node: <CountUp value={3} />, label: t('story.stats.presses') },
                { node: <CountUp value={2} />, label: t('story.stats.centres') },
                { node: <CountUp value={250000} suffix="" />, label: t('story.stats.space') },
                { node: <><CountUp value={25} />+</>, label: t('story.stats.countries') },
              ].map((s, i) => (
                <div key={i} className="border-t pt-4" style={{ borderColor: 'rgba(15,36,68,0.15)' }}>
                  <div className="text-[clamp(26px,3vw,40px)] font-extrabold leading-none" style={{ fontFamily: TIGHT, color: GOLD }}>{s.node}</div>
                  <div className="mt-2 text-[11px] uppercase" style={{ fontFamily: MONO, letterSpacing: '0.16em', color: GOLD_TEXT }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 ── GLOBE MOMENT — full-width navy band after the story block ─────
         Second GlobeFlyTo instance. A full-width band (not embedded in the
         two-col story grid, where the fixed map height fights the flow) reads
         cleaner: text left, branded globe right, same choreography at 4s. */}
      <section data-theme="dark" aria-labelledby="about-reach-heading" className="relative overflow-hidden" style={{ background: NAVY }}>
        <div className="mx-auto grid max-w-[1600px] items-stretch lg:grid-cols-[0.82fr_1.18fr]">
          <div className="flex flex-col justify-center px-6 py-20 sm:px-10 lg:py-28">
            <Eyebrow color={GOLD_BRIGHT}>{t('reach.eyebrow')}</Eyebrow>
            <h2 id="about-reach-heading" className="mt-5 font-extrabold leading-[0.98] tracking-tight text-[clamp(38px,5vw,74px)]" style={{ fontFamily: TIGHT, color: CREAM }}>
              {t('reach.titleLine1')}<br />
              <span style={{ fontWeight: 400, color: 'rgba(253,250,244,0.6)' }}>{t('reach.titleLine2')}</span>
            </h2>
            <p className="mt-6 max-w-[32ch] text-[17px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.76)' }}>
              {t('reach.body')}
            </p>
            <a href="/#projects" className={`mt-8 inline-flex items-center gap-2 text-[13px] font-medium uppercase ${focusGold}`} style={{ fontFamily: MONO, letterSpacing: '0.12em', color: CREAM, borderBottom: '1px solid rgba(200,154,60,0.5)', paddingBottom: '4px', width: 'fit-content' }}>
              {t('reach.link')} <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="relative min-h-[420px] lg:min-h-[600px]">
            <GlobeFlyTo flightMs={4000} beatMs={1000} />
          </div>
        </div>
      </section>

      {/* 5 ── OUR HISTORY — vertical timeline (navy) ──────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        {/* history follows the navy globe band above — this boundary is navy→navy,
            so the curve stays NAVY; recolouring it would create an orphan beige lip. */}
        <SectionCurve position="top" fill={NAVY} />
        <DotField tone="navy" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div data-reveal>
            <Eyebrow color={GOLD_BRIGHT}>{t('history.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-extrabold leading-none tracking-tight text-[clamp(48px,8vw,120px)]" style={{ fontFamily: TIGHT, color: 'rgba(253,250,244,0.9)' }}>
              {t('history.title')}
            </h2>
          </div>
          <div className="mt-14">
            {milestones.map((m) => (
              <div
                key={m.key}
                data-reveal
                className="grid grid-cols-1 items-baseline gap-3 border-t py-8 md:grid-cols-[240px_1fr_1.1fr] md:gap-10 md:py-9"
                style={{ borderColor: 'rgba(200,154,60,0.28)' }}
              >
                <Foil className="text-[clamp(36px,5vw,64px)] leading-[0.9]">{m.vol}</Foil>
                <h3 className="text-[20px] font-semibold md:text-[23px]" style={{ fontFamily: TIGHT, color: CREAM }}>{t(`milestones.${m.key}.title`)}</h3>
                <p className="text-[15px] leading-relaxed md:text-[16px]" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.72)' }}>{t(`milestones.${m.key}.desc`)}</p>
              </div>
            ))}
            <div className="border-t" style={{ borderColor: 'rgba(200,154,60,0.28)' }} />
          </div>
        </div>
      </section>

      {/* 6 ── STATEMENT MARQUEE (navy) ────────────────────────────────────── */}
      <StatementMarquee />

      {/* 7 ── WHAT WE DO — cards linking to routes (cream) ────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="max-w-3xl" data-reveal>
            <Eyebrow>{t('whatWeDo.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              {t('whatWeDo.title')}
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_DO.map(({ icon: Icon, key, to }) => (
              <Link
                key={to}
                to={to}
                data-reveal
                data-card="whatwedo"
                className={`group flex h-full min-h-[248px] flex-col rounded-none border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,36,68,0.16)] ${focusGold}`}
                style={{ background: BEIGE, borderColor: 'rgba(15,36,68,0.1)' }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-none transition-colors duration-300" style={{ background: CREAM, color: GOLD }}>
                  <Icon />
                </span>
                <h3 className="mt-auto pt-8 text-[22px] font-semibold leading-tight" style={{ fontFamily: TIGHT, color: NAVY }}>{t(`whatWeDo.${key}.title`)}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}>{t(`whatWeDo.${key}.desc`)}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider transition-transform duration-300 group-hover:translate-x-1" style={{ fontFamily: MONO, color: GOLD_TEXT }}>
                  {t('whatWeDo.explore')} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8 ── TWO-TAB SERVICES (beige) ────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: BEIGE }}>
        <SectionCurve position="top" fill={BEIGE} />
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="max-w-3xl" data-reveal>
            <Eyebrow>{t('services.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(32px,4.4vw,56px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              {t('services.title')}
            </h2>
          </div>

          {/* tab toggle */}
          <div role="tablist" aria-label={t('services.tablistAria')} className="mt-12 flex flex-wrap gap-3">
            {Object.keys(SERVICES).map((key) => {
              const active = tab === key
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-full px-7 py-3.5 text-[15px] font-semibold transition-all duration-300 ${focusGold}`}
                  style={{
                    fontFamily: INTER,
                    background: active ? NAVY : 'transparent',
                    color: active ? CREAM : NAVY,
                    border: `1.5px solid ${active ? NAVY : 'rgba(15,36,68,0.2)'}`,
                  }}
                >
                  {t(`services.tabs.${key}`)}
                </button>
              )
            })}
          </div>

          {/* cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICES[tab].map(({ icon: Icon, key }) => (
              <div key={key} data-reveal data-card="service" className="flex h-full min-h-[236px] flex-col rounded-none p-8" style={{ background: CREAM, border: '1px solid rgba(15,36,68,0.1)' }}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-none" style={{ background: BEIGE, color: GOLD }}>
                  <Icon />
                </span>
                <h3 className="mt-auto pt-8 text-[21px] font-semibold leading-tight" style={{ fontFamily: TIGHT, color: NAVY }}>{t(`services.${tab}.${key}.title`)}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.74)' }}>{t(`services.${tab}.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 ── OUR PEOPLE teaser (navy) ────────────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: `radial-gradient(900px 600px at 20% 12%, rgba(200,154,60,0.1), transparent 60%), ${NAVY}` }}>
        {/* people section transitions in from the beige services band above — the
            curve matches that beige, not navy, so no orphan blue lip forms. */}
        <SectionCurve position="top" fill={BEIGE} inward />
        <EdgeGlow tone="navy" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div data-reveal>
              <Eyebrow color={GOLD_BRIGHT}>{t('people.eyebrow')}</Eyebrow>
              <h2 className="mt-5 font-extrabold leading-[0.98] tracking-tight text-[clamp(40px,6vw,88px)]" style={{ fontFamily: TIGHT, color: CREAM }}>
                <Foil style={{ WebkitTextStroke: '0' }}>600+</Foil> {t('people.titleSuffix')}
              </h2>
            </div>
            <p className="text-[18px] leading-relaxed lg:pb-3" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.78)' }}>
              {t('people.body')}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} data-reveal className="overflow-hidden rounded-none ring-1" style={{ ringColor: 'rgba(200,154,60,0.25)' }}>
                <img src={`/qfp/about/people-0${n}.webp`} alt={t('people.imageAlt', { n })} className="block aspect-square w-full object-cover" width="640" height="640" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 ── HUB LINKS grid (cream) ─────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="max-w-3xl" data-reveal>
            <Eyebrow>{t('hub.eyebrow')}</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              {t('hub.title')}
            </h2>
            <p className="mt-4 text-[18px]" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.7)' }}>
              {t('hub.sub')}
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-2 md:grid-cols-2 lg:grid-cols-3">
            {HUB.map((h) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[22px] font-semibold" style={{ fontFamily: TIGHT, color: NAVY }}>{t(`hub.${h.key}.title`)}</h3>
                    <span aria-hidden="true" className="text-[22px] transition-transform duration-300 group-hover:translate-x-1" style={{ color: GOLD }}>→</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}>{t(`hub.${h.key}.desc`)}</p>
                </>
              )
              const cls = `group block border-t py-7 transition-colors duration-300 hover:border-[#9B7420] ${focusGold}`
              const st = { borderColor: 'rgba(15,36,68,0.15)' }
              return h.router ? (
                <Link key={h.key} to={h.to} data-reveal className={cls} style={st}>{inner}</Link>
              ) : (
                <a key={h.key} href={h.to} data-reveal className={cls} style={st}>{inner}</a>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
