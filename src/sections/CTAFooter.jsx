import { useTranslation, Trans } from 'react-i18next'
import { Link } from 'react-router-dom'
import { SHOW_CASE_STUDIES } from '@/lib/compliance'

// Fonts locked to our system (was inheriting the global Space Mono / font-display):
const INTER = "'Inter', sans-serif"
const TIGHT = "'Inter Tight', sans-serif"
const MONO = "'DM Mono', monospace"

export default function CTAFooter() {
  const { t } = useTranslation('footer')

  // Every footer link is wired ({ label, to }). Several targets are
  // SECTIONS on the homepage, not standalone pages: those use a hash route (e.g.
  // "/#reach") so a click from any inner page navigates to "/" AND the site's global
  // ScrollToTop handler scrolls the section into view on arrival (via Lenis, offset
  // for the nav). Infrastructure and Contact are real routes, linked directly.
  //   Products      → homepage What We Print section (#what-we-print)
  //   Global Reach  → homepage "Global Reach / Worldwide Deliveries" section (#projects):
  //                   the "Trusted by 200+ publishers" block (Leading Publishers,
  //                   Educational Institutions, World Bank Funded Projects, Ministries of
  //                   Education, NGOs, Multinational Retail Brands) — NOT the #reach map.
  //   Infrastructure→ /infrastructure route
  //   Contact       → /contact route
  //   Certified (×5)→ homepage Certifications section (#certifications)
  // Quick Links resolve through the footer namespace; certification acronyms and
  // the CIN entity line below are proper names and stay English in every language.
  const columns = [
    {
      h: t('quickLinks'),
      // Case Studies link gated with the section — hidden while
      // SHOW_CASE_STUDIES is false so no link points at a hidden section.
      items: [
        { label: t('links.products'), to: '/#what-we-print' },
        { label: t('links.globalReach'), to: '/#projects' },
        { label: t('links.infrastructure'), to: '/infrastructure' },
        ...(SHOW_CASE_STUDIES ? [{ label: t('links.caseStudies'), to: '/#cases' }] : []),
        { label: t('links.contact'), to: '/contact' },
      ],
    },
  ]

  // The five featured certifications — a horizontal row of ICONS (no text labels) in the
  // left brand column, under the logo near the social handles. Each links to the homepage
  // Certifications section and carries an accessible label. Icons live at
  // /site-assets/footer-certs/<slug>.webp (48px marks derived from the homepage cert logos;
  // the two-star mark is drawn from the Star Export House treatment). The acronyms +
  // "Two Star Export House" stay English in every language.
  const certs = [
    { label: 'FSC', slug: 'fsc' },
    { label: 'ISO 9001:2015', slug: 'iso-9001' },
    { label: 'ISO/IEC 27001:2022', slug: 'iso-27001' },
    { label: 'Sedex', slug: 'sedex' },
    { label: 'Two Star Export House', slug: 'star-export-house' },
  ]

  // Social channels — Instagram and YouTube only (LinkedIn + Facebook removed per client).
  // Both open in a new tab. LinkedIn/Facebook are not present anywhere on QFP's socials.
  const socials = [
    { net: 'Instagram', href: 'https://www.instagram.com/quarterfold_printabilities/' },
    { net: 'YouTube', href: 'https://www.youtube.com/@quarterfoldprintabilities6000' },
  ]

  const legalLinks = [
    { key: 'privacy', label: t('legal.privacy') },
    { key: 'cookies', label: t('legal.cookies') },
    { key: 'terms', label: t('legal.terms') },
    { key: 'accessibility', label: t('legal.accessibility') },
  ]

  return (
    <section
      id="contact"
      data-theme="dark"
      className="relative flex flex-col justify-between overflow-hidden"
      style={{
        fontFamily: INTER,
        // Footer navy sampled from the top region of the new hero art (#0f1838).
        // Flat, no gradient/radial tint, so the curve arcs in flush with no seam.
        background: '#0f1838',
        minHeight: '100svh',
      }}
    >
      {/* Top CTA Area — on the navy outer surface, so text is light */}
      <div className="relative z-10 mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-32 text-center" style={{ color: '#fdfaf4' }}>
        {/* Static QF logo mark (replaces the rotating seal — no motion). */}
        <div className="mb-8">
          <img src="/site-assets/homepage/brand/qfp-mark.png" alt="" aria-hidden="true" width="64" height="64" className="h-16 w-16 object-contain" />
        </div>

        <h2 className="mb-6 max-w-4xl text-[clamp(40px,7vw,84px)] font-bold tracking-tight leading-[1.05]" style={{ fontFamily: TIGHT, color: '#fdfaf4' }}>
          <Trans t={t} i18nKey="cta.heading" components={{ 1: <br /> }} />
        </h2>

        <p className="mb-10 max-w-2xl text-lg font-normal leading-relaxed sm:text-xl" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.82)' }}>
          {t('cta.body')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4" style={{ fontFamily: INTER }}>
          {/* Shared button system (.u-btn). --gold = the primary orange pill;
              --ghost = the on-navy secondary; --lg keeps the hero footprint. */}
          <Link
            to="/contact"
            className="u-btn u-btn--gold u-btn--lg btn-nebula focus-ring"
            style={{ letterSpacing: '0.2px' }}
          >
            {t('cta.requestQuote')}
          </Link>
          <a
            href="/site-assets/documents/company-profile.pdf"
            download
            className="u-btn u-btn--ghost u-btn--lg btn-nebula focus-ring"
            style={{ letterSpacing: '0.2px' }}
          >
            {t('cta.downloadProfile')}
          </a>
        </div>
      </div>

      {/* Embedded Rounded Footer — cream card raised on the beige surface */}
      <div className="relative z-10 mx-4 mb-4 sm:mx-6 sm:mb-6">
        <footer className="mx-auto w-full max-w-[1400px] rounded-[var(--r-card)] bg-[#fdfaf4] px-8 pb-10 pt-16 sm:px-16 sm:pt-20 ring-1 ring-[#030C31]/10" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.82)' }}>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">

            {/* Logo / Brand Column */}
            <div className="lg:col-span-4 flex flex-col items-start">
              <div className="mb-8 flex items-center gap-3">
                <img src="/site-assets/homepage/brand/qfp-mark.png" alt="Quarterfold Printabilities" width="52" height="52" className="object-contain" style={{ height: 52, width: 52 }} />
                <span className="flex flex-col leading-[1.06] text-[#030C31]" style={{ fontFamily: TIGHT }}>
                  <span className="text-[17px] font-bold tracking-[0.2px]">Quarterfold</span>
                  <span className="text-[17px] font-bold tracking-[0.2px]">Printabilities</span>
                </span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed mb-6" style={{ fontFamily: MONO, color: '#5c5346' }}>
                {t('tagline')}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <a href="mailto:info@quarterfoldltd.com" className="text-[14px] font-medium transition-colors" style={{ color: 'rgba(28,32,25,0.82)' }}>info@quarterfoldltd.com</a>
                <a href="https://www.quarterfoldltd.com" target="_blank" rel="noreferrer" className="text-[14px] font-medium transition-colors" style={{ color: 'rgba(28,32,25,0.82)' }}>www.quarterfoldltd.com</a>
              </div>

              {/* Certifications — a horizontal row of icons, no text labels (client). Each
                  icon links to the homepage Certifications section and is labelled for
                  assistive tech via the link's aria-label. */}
              <div className="mt-10">
                <h3 className="mb-5 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#925C10' }}>{t('certified')}</h3>
                <ul className="flex flex-row flex-wrap items-center gap-5">
                  {certs.map((c) => (
                    <li key={c.label}>
                      <Link to="/#certifications" aria-label={c.label} className="block rounded transition-transform hover:scale-110 focus-ring">
                        <img
                          src={`/site-assets/footer-certs/${c.slug}.webp`}
                          alt=""
                          width="44"
                          height="44"
                          loading="lazy"
                          className="h-11 w-11 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">

              {columns.map((col) => (
                <div key={col.h} className="flex flex-col">
                  <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#925C10' }}>{col.h}</h3>
                  <ul className="flex flex-col gap-4">
                    {col.items.map((it) => (
                      <li key={it.label}>
                        <Link to={it.to} className="text-[14px] font-medium transition-colors hover:text-[#925C10]" style={{ color: 'rgba(28,32,25,0.82)' }}>{it.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="flex flex-col">
                <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#925C10' }}>{t('headOffice')}</h3>
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'rgba(28,32,25,0.82)' }}>
                  Plot No. 31, Sector 22,<br />Sanpada, Navi Mumbai,<br />400703, Maharashtra, India
                </p>
              </div>

              {/* Three factory units listed separately (never run together into one line) */}
              <div className="flex flex-col">
                <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#925C10' }}>{t('factories')}</h3>
                <div className="flex flex-col gap-4 text-[14px] font-medium leading-relaxed" style={{ color: 'rgba(28,32,25,0.82)' }}>
                  <p><span className="block font-semibold text-[#030C31]">{t('unit', { n: 1 })}</span>Plot No. B-8, Taloja MIDC,<br />Navi Mumbai, 410208, India</p>
                  <p><span className="block font-semibold text-[#030C31]">{t('unit', { n: 2 })}</span>Plot No. L-143, Taloja MIDC,<br />Navi Mumbai, 410208, India</p>
                  <p><span className="block font-semibold text-[#030C31]">{t('unit', { n: 3 })}</span>Plot No. L23, Taloja MIDC,<br />Navi Mumbai, 410208, India</p>
                </div>
              </div>

            </div>
          </div>

          {/* Rule + social + legal */}
          <div className="mt-20 flex flex-col">
            <div className="mb-8 flex items-end justify-between">
              <div className="h-[3px] w-48" style={{ background: '#B06F15' }} />
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a key={s.net} href={s.href} target="_blank" rel="noreferrer" className="group flex h-10 w-10 items-center justify-center rounded-full bg-[#030C31]/6 transition-all hover:bg-[#B06F15]/20 hover:scale-110 active:scale-95" aria-label={s.net}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5c5346] transition-colors group-hover:text-[#B06F15]">
                      {s.net === 'Instagram' && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>}
                      {s.net === 'YouTube' && <><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-[#030C31]/12 pt-8 lg:flex-row lg:items-center">
              <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#5c5346' }}>
                {t('copyright')}
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {legalLinks.map((it) => (
                  <Link key={it.key} to={`/legal/${it.key}`} className="text-[11px] font-semibold tracking-wider uppercase transition-colors hover:text-[#925C10]" style={{ color: '#5c5346' }}>{it.label}</Link>
                ))}
              </div>
            </div>
            {/* Statutory entity line — site-wide compliance (CIN + registered office). DM Mono, 11px floor. */}
            <p className="mt-5 max-w-full text-[11px] leading-relaxed" style={{ fontFamily: MONO, color: 'rgba(92,83,70,0.92)' }}>
              Quarterfold Printabilities Private Limited · CIN U74999MH2020PTC337494 · Registered Office: Office No 1207, Plot No 4 &amp; 6, Sector 30A, Cyber One IT Park, Vashi, Navi Mumbai, Maharashtra 400703
            </p>
          </div>

        </footer>
      </div>
    </section>
  )
}
