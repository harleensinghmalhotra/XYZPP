import { useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '@/components/Seo'
import CountUp from '@/components/CountUp'
import SectionCurve from '@/components/SectionCurve'
import { DotField, EdgeGlow, PaperGrain } from '@/components/atmosphere'
import { SHOW_MINISTRY_NAMES } from '@/lib/compliance'

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

// Client-name permission gate (mirrors Projects.jsx). Until Harry confirms written
// permission, HDFC / ZEE / Kidzee rows stay hidden — never placeholdered.
const SHOW_RESTRICTED_CLIENTS = false

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

const AWARDS = [
  'Dun & Bradstreet',
  'PrintWeek',
  'CAPEXIL Highest Book Exporter',
  'ASSOCHAM',
  'Federation of Indian Publishers',
  'FORBES D-GEMS',
  'Education Export Company of the Year 2024',
]

// Milestones ordered by scale. Where live figures conflict, the LOWER is used
// (DR Congo 3.5M not 5M; Top publishers 4M not 5M).
// `ministry: true` entries name a government body / ministry / funded programme,
// gated behind SHOW_MINISTRY_NAMES (permission pending). They filter out cleanly
// when off, leaving the non-named milestones and no timeline gaps.
const MILESTONES = [
  { vol: '400M+', title: 'Books delivered to date', desc: 'Printed in India, read across 25+ countries.' },
  { vol: '10M+', title: 'Ministry of Education, Tanzania', desc: 'National textbook programme printed and shipped at scale.', ministry: true },
  { vol: '10M+', title: 'Ministry of Education & Sports, Ghana', desc: 'World Bank and USAID backed education printing.', ministry: true },
  { vol: '8M+', title: 'Universal Basic Education Commission, Nigeria', desc: 'Primary education titles for the UBEC programme.', ministry: true },
  { vol: '7M+', title: "Ministère de l'Éducation Nationale, Ivory Coast", desc: 'French-language curriculum books for national schools.', ministry: true },
  { vol: '4M+', title: 'Top 10 Indian publishers', desc: 'Curriculum and trade titles for leading Indian houses.' },
  { vol: '3.5M+', title: 'République Démocratique du Congo', desc: 'Curriculum printing for the national education ministry.', ministry: true },
  { vol: '2M+', title: 'Maharashtra State Education Board', desc: 'Bal Bharti state-board textbooks for Maharashtra, India.', ministry: true },
]
const RESTRICTED_MILESTONES = [
  { vol: '1.3M+/mo', title: 'HDFC Bank', desc: 'Loan-agreement booklets printed every month.' },
]

const WHAT_WE_DO = [
  { icon: IconBook, title: 'Educational Books', to: '/educational-books', desc: 'Curriculum and trade titles for 250+ publishers and national education programmes.' },
  { icon: IconNotebook, title: 'Trade Books', to: '/trade-books', desc: 'Premium notebooks, coffee-table editions, diaries and journals.' },
  { icon: IconPOD, title: 'Print on Demand', to: '/print-on-demand', desc: 'Short-run and single-copy printing for self-publishers and indie titles.' },
  { icon: IconFactory, title: 'Infrastructure', to: '/infrastructure', desc: 'Web towers, sheet-fed presses and finishing lines across our facilities.' },
  { icon: IconTruck, title: 'Fulfilment', to: '/fulfilment', desc: 'Kitting, warehousing and last-mile logistics from 250,000 sq ft of space.' },
]

const SERVICES = {
  'For Publishers': [
    { icon: IconBook, title: 'Large-volume book production', desc: 'Offset and web printing for curriculum and trade runs at national scale.' },
    { icon: IconPOD, title: 'Print on demand', desc: 'Short-run and single-copy printing for self-publishers and backlist titles.' },
    { icon: IconTruck, title: 'Warehousing & fulfilment', desc: 'Storage, kitting and last-mile delivery from two fulfilment centres.' },
  ],
  'For Institutions & Programmes': [
    { icon: IconGlobe, title: 'Government & tender printing', desc: 'World Bank and USAID backed textbook programmes across 25+ countries.' },
    { icon: IconNotebook, title: 'Educational content', desc: 'Curriculum books produced for ministries and state education boards.' },
    { icon: IconFactory, title: 'Export & logistics', desc: '800+ containers shipped each year to publishers and programmes worldwide.' },
  ],
}

const HUB = [
  { title: 'Contact', to: '/contact', router: true, desc: 'Tell us what you are printing and hear back within one business day.' },
  { title: 'Infrastructure', to: '/infrastructure', router: true, desc: 'Web towers and finishing lines across 250,000 sq ft of facilities.' },
  { title: 'Certifications', to: '/#certifications', router: false, desc: 'FSC, ISO and Sedex certified production.' },
  { title: 'Sustainability', to: '/#sustainability', router: false, desc: 'Responsible sourcing and specific environmental practices.' },
  { title: 'Legal', to: '/legal/privacy', router: true, desc: 'Privacy, cookies, terms of use and accessibility.' },
]

/* ── marquees (reuse homepage Marquee typographic treatment) ─────────────── */

function StatementMarquee() {
  const Row = () => (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {['Printed in India', 'Read by the World'].map((t, i) => (
        <span key={t + i} className="flex items-center">
          <span
            className="font-bold uppercase leading-none text-[8vw] md:text-[5.4vw]"
            style={{
              fontFamily: TIGHT,
              color: i % 2 ? 'transparent' : CREAM,
              WebkitTextStroke: i % 2 ? `1.4px ${CREAM}` : undefined,
            }}
          >
            {t}
          </span>
          <span className="mx-[3vw] text-[3.2vw] md:text-[2vw]" style={{ color: GOLD_BRIGHT }} aria-hidden="true">✶</span>
        </span>
      ))}
    </div>
  )
  return (
    <section data-theme="dark" aria-label="Printed in India, read by the world" className="overflow-hidden border-y py-9 md:py-12" style={{ background: NAVY, borderColor: 'rgba(253,250,244,0.1)' }}>
      <h2 className="sr-only">Printed in India. Read by the World.</h2>
      <div className="flex w-max motion-safe:animate-[marquee_34s_linear_infinite] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  )
}

function RecognitionMarquee() {
  const Row = () => (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {AWARDS.map((a, i) => (
        <span key={a + i} className="flex items-center">
          <span className="whitespace-nowrap text-[22px] font-semibold md:text-[26px]" style={{ fontFamily: TIGHT, color: NAVY }}>{a}</span>
          <span className="mx-8 text-[16px]" style={{ color: GOLD }} aria-hidden="true">✶</span>
        </span>
      ))}
    </div>
  )
  return (
    <section data-theme="light" aria-label="Awards and recognition" className="relative overflow-hidden py-16 md:py-20" style={{ background: BEIGE }}>
      <SectionCurve position="top" fill={BEIGE} />
      <div className="relative z-10 mx-auto mb-8 max-w-[1400px] px-6 sm:px-10">
        <Eyebrow>Recognised by</Eyebrow>
      </div>
      <ul className="sr-only">{AWARDS.map((a) => <li key={a}>{a}</li>)}</ul>
      <div className="flex w-max motion-safe:animate-[marquee_40s_linear_infinite] motion-reduce:animate-none">
        <Row />
        <Row />
      </div>
    </section>
  )
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function About() {
  const [tab, setTab] = useState('For Publishers')

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: 'About Us', item: 'https://www.quarterfoldltd.com/about' },
    ],
  }

  const baseMilestones = SHOW_MINISTRY_NAMES ? MILESTONES : MILESTONES.filter((m) => !m.ministry)
  const milestones = SHOW_RESTRICTED_CLIENTS ? [...baseMilestones, ...RESTRICTED_MILESTONES] : baseMilestones

  return (
    <main id="main">
      <Seo
        title="About Us | Quarterfold Printabilities"
        description="One of India's largest print and publishing solutions companies, printing 25M+ books a year for publishers and education programmes across 25+ countries."
        jsonLd={breadcrumb}
      />

      {/* 1 ── HERO (navy) ─────────────────────────────────────────────────── */}
      <section
        data-theme="dark"
        className="relative flex min-h-[82svh] flex-col justify-end overflow-hidden px-6 pb-20 pt-40 sm:px-10"
        style={{ background: `radial-gradient(1100px 720px at 68% 18%, rgba(200,154,60,0.14), transparent 60%), radial-gradient(900px 700px at 12% 110%, rgba(27,58,107,0.55), transparent 62%), ${NAVY}` }}
      >
        <DotField tone="navy" />
        <div className="relative z-10 mx-auto w-full max-w-[1400px]">
          <Eyebrow color={GOLD_BRIGHT}>Quarterfold Printabilities</Eyebrow>
          <h1 className="mt-5 font-extrabold leading-[0.92] tracking-tight text-[clamp(64px,12vw,168px)]" style={{ fontFamily: TIGHT, color: CREAM }}>
            About Us
          </h1>
          <p className="mt-7 max-w-2xl text-[clamp(18px,2.2vw,24px)] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.82)' }}>
            One of India&apos;s largest print and publishing solutions companies, powering education across 25+ countries.
          </p>
          <div className="mt-10">
            <Link
              to="/contact"
              className={`inline-flex h-14 items-center justify-center rounded-full px-9 text-[15px] font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${focusGold}`}
              style={{ background: GOLD_BRIGHT, color: NAVY, fontFamily: INTER, letterSpacing: '0.1px' }}
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* 2 ── FOUNDER GREETING (cream) ────────────────────────────────────── */}
      <section data-theme="light" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: CREAM }}>
        <SectionCurve position="top" fill={CREAM} />
        <PaperGrain />
        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* portrait */}
          <div className="order-2 lg:order-1">
            <div className="relative mx-auto max-w-[420px] overflow-hidden rounded-[28px] ring-1" style={{ ringColor: NAVY, boxShadow: '0 30px 70px rgba(15,36,68,0.22)' }}>
              <img src="/qfp/about/founder.webp" alt="Founder and Managing Director of Quarterfold Printabilities" className="block aspect-[760/920] w-full object-cover" width="760" height="920" loading="lazy" />
            </div>
          </div>
          {/* greeting + quote */}
          <div className="order-1 lg:order-2">
            <h2 className="font-extrabold leading-[0.95] tracking-tight text-[clamp(44px,6vw,86px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              Hey there <span aria-hidden="true">👋</span>
            </h2>
            <div className="relative mt-8 max-w-2xl">
              <span aria-hidden="true" className="absolute -left-1 -top-8 select-none text-[110px] leading-none" style={{ fontFamily: TIGHT, color: 'rgba(155,116,32,0.22)' }}>“</span>
              <p className="relative text-[clamp(20px,2.4vw,28px)] font-medium italic leading-[1.5]" style={{ fontFamily: TIGHT, color: INK }}>
                Our mission is simple. To be one of the top ten printing and educational content companies across the globe by 2030, powering publishers and education programmes in every market we serve.
              </p>
              <p className="mt-7 text-[13px] font-medium not-italic" style={{ fontFamily: MONO, color: GOLD_TEXT, letterSpacing: '0.04em' }}>
                — Founder &amp; Managing Director, Quarterfold Printabilities
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
          <div>
            <div className="overflow-hidden rounded-[28px] ring-1 ring-[#0f2444]/10" style={{ boxShadow: '0 30px 70px rgba(15,36,68,0.18)' }}>
              <img src="/qfp/about/story.webp" alt="Quarterfold printing facility in Taloja, Navi Mumbai" className="block aspect-[1280/860] w-full object-cover" width="1280" height="860" loading="lazy" />
            </div>
          </div>
          <div>
            <Eyebrow>Our Story</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.02] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              India&apos;s largest print and publishing solutions company.
            </h2>
            <div className="mt-8 space-y-5 text-[17px] leading-[1.65]" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.82)' }}>
              <p>
                Quarterfold specialises in high-quality printing presses built for large-scale book production and print-on-demand, handling large-volume projects for private publishers and government, World Bank backed tenders.
              </p>
              <p>
                Our operations run across three state-of-the-art printing presses in Taloja, Navi Mumbai, and two large warehouses and fulfilment centres, spanning 250,000 sq ft of high-end web towers, sheet-fed machines and finishing lines.
              </p>
            </div>
            {/* stat row — CountUp odometers, solid gold on cream (large-text carve-out) */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                { node: <CountUp value={3} />, label: 'Printing presses' },
                { node: <CountUp value={2} />, label: 'Fulfilment centres' },
                { node: <CountUp value={250000} suffix="" />, label: 'Sq ft of space' },
                { node: <><CountUp value={25} />+</>, label: 'Countries served' },
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

      {/* 5 ── OUR HISTORY — vertical timeline (navy) ──────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: NAVY }}>
        <SectionCurve position="top" fill={NAVY} />
        <DotField tone="navy" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <Eyebrow color={GOLD_BRIGHT}>Milestones</Eyebrow>
          <h2 className="mt-5 font-extrabold leading-none tracking-tight text-[clamp(48px,8vw,120px)]" style={{ fontFamily: TIGHT, color: 'rgba(253,250,244,0.9)' }}>
            Our History
          </h2>
          <div className="mt-14">
            {milestones.map((m, i) => (
              <div
                key={m.title}
                className="grid grid-cols-1 items-baseline gap-3 border-t py-8 md:grid-cols-[240px_1fr_1.1fr] md:gap-10 md:py-9"
                style={{ borderColor: 'rgba(200,154,60,0.28)' }}
              >
                <Foil className="text-[clamp(36px,5vw,64px)] leading-[0.9]">{m.vol}</Foil>
                <h3 className="text-[20px] font-semibold md:text-[23px]" style={{ fontFamily: TIGHT, color: CREAM }}>{m.title}</h3>
                <p className="text-[15px] leading-relaxed md:text-[16px]" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.72)' }}>{m.desc}</p>
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
          <div className="max-w-3xl">
            <Eyebrow>What We Do</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              Five ways we help publishers put books in hands.
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_DO.map(({ icon: Icon, title, to, desc }) => (
              <Link
                key={to}
                to={to}
                data-card="whatwedo"
                className={`group flex h-full min-h-[248px] flex-col rounded-[24px] border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,36,68,0.16)] ${focusGold}`}
                style={{ background: BEIGE, borderColor: 'rgba(15,36,68,0.1)' }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300" style={{ background: CREAM, color: GOLD }}>
                  <Icon />
                </span>
                <h3 className="mt-auto pt-8 text-[22px] font-semibold leading-tight" style={{ fontFamily: TIGHT, color: NAVY }}>{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}>{desc}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider transition-transform duration-300 group-hover:translate-x-1" style={{ fontFamily: MONO, color: GOLD_TEXT }}>
                  Explore <span aria-hidden="true">→</span>
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
          <div className="max-w-3xl">
            <Eyebrow>What We Provide</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(32px,4.4vw,56px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              Expert print support for every kind of partner.
            </h2>
          </div>

          {/* tab toggle */}
          <div role="tablist" aria-label="Who we serve" className="mt-12 flex flex-wrap gap-3">
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
                  {key}
                </button>
              )
            })}
          </div>

          {/* cards */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SERVICES[tab].map(({ icon: Icon, title, desc }) => (
              <div key={title} data-card="service" className="flex h-full min-h-[236px] flex-col rounded-[24px] p-8" style={{ background: CREAM, border: '1px solid rgba(15,36,68,0.1)' }}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: BEIGE, color: GOLD }}>
                  <Icon />
                </span>
                <h3 className="mt-auto pt-8 text-[21px] font-semibold leading-tight" style={{ fontFamily: TIGHT, color: NAVY }}>{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.74)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9 ── OUR PEOPLE teaser (navy) ────────────────────────────────────── */}
      <section data-theme="dark" className="relative overflow-hidden px-6 py-24 sm:px-10 md:py-32" style={{ background: `radial-gradient(900px 600px at 20% 12%, rgba(200,154,60,0.1), transparent 60%), ${NAVY}` }}>
        <SectionCurve position="top" fill={NAVY} />
        <EdgeGlow tone="navy" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Eyebrow color={GOLD_BRIGHT}>Our People</Eyebrow>
              <h2 className="mt-5 font-extrabold leading-[0.98] tracking-tight text-[clamp(40px,6vw,88px)]" style={{ fontFamily: TIGHT, color: CREAM }}>
                <Foil style={{ WebkitTextStroke: '0' }}>600+</Foil> hands behind every shipment.
              </h2>
            </div>
            <p className="text-[18px] leading-relaxed lg:pb-3" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.78)' }}>
              Every book that leaves our floor carries the care of the people who set the presses, check the sheets and pack the pallets.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="overflow-hidden rounded-[22px] ring-1" style={{ ringColor: 'rgba(200,154,60,0.25)' }}>
                <img src={`/qfp/about/people-0${n}.webp`} alt={`Quarterfold team member ${n}`} className="block aspect-square w-full object-cover" width="640" height="640" loading="lazy" />
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
          <div className="max-w-3xl">
            <Eyebrow>Explore</Eyebrow>
            <h2 className="mt-5 font-bold leading-[1.03] tracking-tight text-[clamp(34px,4.6vw,60px)]" style={{ fontFamily: TIGHT, color: NAVY }}>
              Explore Quarterfold.
            </h2>
            <p className="mt-4 text-[18px]" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.7)' }}>
              Learn more across the following sections.
            </p>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-2 md:grid-cols-2 lg:grid-cols-3">
            {HUB.map((h) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[22px] font-semibold" style={{ fontFamily: TIGHT, color: NAVY }}>{h.title}</h3>
                    <span aria-hidden="true" className="text-[22px] transition-transform duration-300 group-hover:translate-x-1" style={{ color: GOLD }}>→</span>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}>{h.desc}</p>
                </>
              )
              const cls = `group block border-t py-7 transition-colors duration-300 hover:border-[#9B7420] ${focusGold}`
              const st = { borderColor: 'rgba(15,36,68,0.15)' }
              return h.router ? (
                <Link key={h.title} to={h.to} className={cls} style={st}>{inner}</Link>
              ) : (
                <a key={h.title} href={h.to} className={cls} style={st}>{inner}</a>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
