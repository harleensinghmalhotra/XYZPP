import { useTranslation, Trans } from 'react-i18next'
import AuroraBackground from '@/components/AuroraBackground'
import BookTicker from '@/components/BookTicker'

// Fonts locked to our system (was inheriting the global Space Mono / font-display):
const INTER = "'Inter', sans-serif"
const TIGHT = "'Inter Tight', sans-serif"
const MONO = "'DM Mono', monospace"

export default function CTAFooter() {
  const { t } = useTranslation('footer')

  // Quick Links resolve through the footer namespace; certification acronyms and
  // the CIN entity line below are proper names and stay English in every language.
  const columns = [
    {
      h: t('quickLinks'),
      items: [
        t('links.products'),
        t('links.globalReach'),
        t('links.infrastructure'),
        t('links.caseStudies'),
        t('links.contact'),
      ],
    },
    { h: t('certified'), items: ['FSC', 'ISO', 'Sedex'] },
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
        // navy outer surface with a faint warm gold bloom (the beige card floats on it)
        background:
          'radial-gradient(1100px 720px at 60% 24%, rgba(200,154,60,0.13), transparent 60%), radial-gradient(900px 620px at 18% 108%, rgba(155,116,32,0.1), transparent 62%), #0f2444',
        minHeight: '100svh',
      }}
    >
      {/* SIGNATURE AURORA — the site-wide CTA's one flagship dark moment. Reused
          from the hero, dialled subtler; sits at the very back, under the content. */}
      <AuroraBackground />

      {/* Top CTA Area — on the navy outer surface, so text is light */}
      <div className="relative z-10 mx-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-32 text-center" style={{ color: '#fdfaf4' }}>
        {/* Static QF logo mark (replaces the rotating seal — no motion). */}
        <div className="mb-8">
          <img src="/qfp/brand/qfp-mark.png" alt="" aria-hidden="true" width="64" height="64" className="h-16 w-16 object-contain" />
        </div>

        <h2 className="mb-6 max-w-4xl text-[clamp(40px,7vw,84px)] font-bold tracking-tight leading-[1.05]" style={{ fontFamily: TIGHT, color: '#fdfaf4' }}>
          <Trans t={t} i18nKey="cta.heading" components={{ 1: <br /> }} />
        </h2>

        <p className="mb-10 max-w-2xl text-lg font-normal leading-relaxed sm:text-xl" style={{ fontFamily: INTER, color: 'rgba(253,250,244,0.82)' }}>
          {t('cta.body')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4" style={{ fontFamily: INTER }}>
          <a
            href="mailto:info@quarterfoldltd.com"
            className="focus-ring inline-flex h-14 items-center justify-center rounded-none bg-[#c89a3c] px-10 text-[15px] font-semibold text-[#0f2444] transition-all duration-300 hover:bg-[#e6bd6a] hover:scale-[1.02] active:scale-[0.98]"
            style={{ letterSpacing: '0.2px' }}
          >
            {t('cta.requestQuote')}
          </a>
          <a
            href="#"
            className="focus-ring inline-flex h-14 items-center justify-center rounded-none bg-transparent border border-[#fdfaf4]/40 px-10 text-[15px] font-semibold text-[#fdfaf4] transition-all duration-300 hover:bg-[#fdfaf4]/10 hover:scale-[1.02] active:scale-[0.98]"
            style={{ letterSpacing: '0.2px' }}
          >
            {t('cta.downloadProfile')}
          </a>
        </div>
      </div>

      {/* Embedded Rounded Footer — cream card raised on the beige surface */}
      <div className="relative z-10 mx-4 mb-4 sm:mx-6 sm:mb-6">
        <footer className="mx-auto w-full max-w-[1400px] rounded-none bg-[#fdfaf4] px-8 pb-10 pt-16 sm:px-16 sm:pt-20 ring-1 ring-[#0f2444]/10" style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.82)' }}>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">

            {/* Logo / Brand Column */}
            <div className="lg:col-span-4 flex flex-col items-start">
              <div className="mb-8 flex items-center gap-3">
                <img src="/qfp/brand/qfp-mark.png" alt="Quarterfold Printabilities" width="52" height="52" className="object-contain" style={{ height: 52, width: 52 }} />
                <span className="flex flex-col leading-[1.06] text-[#0f2444]" style={{ fontFamily: TIGHT }}>
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
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-8 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

              {columns.map((col) => (
                <div key={col.h} className="flex flex-col">
                  <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#836013' }}>{col.h}</h3>
                  <ul className="flex flex-col gap-4">
                    {col.items.map((it) => (
                      <li key={it}>
                        <a href="#" className="text-[14px] font-medium transition-colors hover:text-[#836013]" style={{ color: 'rgba(28,32,25,0.82)' }}>{it}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="flex flex-col">
                <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#836013' }}>{t('headOffice')}</h3>
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'rgba(28,32,25,0.82)' }}>
                  1207, Cyber One IT Park,<br />Sector 30-A, Vashi,<br />Navi Mumbai 400703, India
                </p>
              </div>

              <div className="flex flex-col">
                <h3 className="mb-6 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ fontFamily: MONO, color: '#836013' }}>{t('factories')}</h3>
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'rgba(28,32,25,0.82)' }}>
                  Plot No. B-8, L-143 &amp; A 2/3,<br />Taloja MIDC,<br />Navi Mumbai 410208, India
                </p>
              </div>

            </div>
          </div>

          {/* Rule + social + legal */}
          <div className="mt-20 flex flex-col">
            <div className="mb-8 flex items-end justify-between">
              <div className="h-[3px] w-48" style={{ background: '#9b7420' }} />
              <div className="flex items-center gap-3">
                {['LinkedIn', 'Instagram', 'Facebook'].map((net) => (
                  <a key={net} href="#" className="group flex h-10 w-10 items-center justify-center rounded-full bg-[#0f2444]/6 transition-all hover:bg-[#c89a3c]/20 hover:scale-110 active:scale-95" aria-label={net}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5c5346] transition-colors group-hover:text-[#836013]">
                      {net === 'LinkedIn' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>}
                      {net === 'Instagram' && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>}
                      {net === 'Facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start justify-between gap-4 border-t border-[#0f2444]/12 pt-8 lg:flex-row lg:items-center">
              <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#5c5346' }}>
                {t('copyright')}
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {legalLinks.map((it) => (
                  <a key={it.key} href="#" className="text-[11px] font-semibold tracking-wider uppercase transition-colors hover:text-[#836013]" style={{ color: '#5c5346' }}>{it.label}</a>
                ))}
              </div>
            </div>
          </div>

        </footer>

        {/* THE COLOPHON — the quiet imprint page a hardcover ends on. Cream ink on
            the navy surface below the card, DM Mono, a thin gold rule and generous
            air. A printer crediting its own type; the rate a book leaves the floor;
            and the compliance lines (FSC licence + CIN) folded in here, verbatim. */}
        <div className="mx-auto mt-10 max-w-[1400px] px-4 pb-8 pt-2 text-center sm:px-6">
          <div className="mx-auto mb-8 h-px w-24" style={{ background: '#9b7420' }} />
          <div className="flex flex-col items-center gap-2.5" style={{ fontFamily: MONO }}>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(253,250,244,0.66)' }}>
              {t('colophon.setIn')}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(253,250,244,0.66)' }}>
              {t('colophon.printedIn')}
            </p>
            {/* FSC licence code beside the FSC label — verbatim, never reworded. */}
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(253,250,244,0.66)' }}>
              {t('colophon.fsc')} · TUVDC-COC-101258
            </p>
            <BookTicker />
            {/* Statutory entity line — site-wide compliance (CIN + registered
                office). Proper names, verbatim, stays English in every language. */}
            <p className="mt-3 max-w-3xl text-[11px] leading-relaxed" style={{ color: 'rgba(253,250,244,0.56)' }}>
              Quarterfold Printabilities Private Limited · CIN U74999MH2020PTC337494 · Registered Office: Office No 1207, Plot No 4 &amp; 6, Sector 30A, Navi Mumbai, Maharashtra 400705
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
