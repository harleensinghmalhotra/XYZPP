import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import PageHero from '@/components/PageHero'
import { PaperGrain } from '@/components/atmosphere'
import './LegalPage.css'

// ── /legal/* — shared template for the four legal documents ──────────────────
// Navy PageHero band (title) → single reading column of prose on cream. All copy
// lives in the `legal` namespace (en/fr/es) keyed by `doc`; sections are a simple
// {h, p[], list?} shape so a new clause is a content edit, not a code change.
// Prose renders plainly visible (no reveal gating) so legal text can never be
// trapped at opacity:0 — a gentle CSS entrance (motion-safe) is the only motion.
export default function LegalPage({ doc }) {
  const { t } = useTranslation('legal')
  const data = t(doc, { returnObjects: true })
  const meta = t('meta', { returnObjects: true })

  // Defensive: if the namespace somehow failed to load, returnObjects gives back
  // the key string — fall back to the ShellPage-style bare title rather than crash.
  const sections = Array.isArray(data?.sections) ? data.sections : []

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: data.title, item: `https://quarterfoldltd.com/legal/${doc}` },
    ],
  }

  return (
    <main id="main">
      <Seo title={`${data.title}, Quarterfold Printabilities`} description={data.seoDesc} jsonLd={breadcrumbJsonLd} />

      <PageHero eyebrow={data.eyebrow} line1={data.title} minVh={44} />

      <section className="legal" data-theme="light">
        <PaperGrain />
        <div className="legal-inner">
          {data.intro && <p className="legal-lead">{data.intro}</p>}

          {sections.map((s, i) => (
            <section className="legal-sec" key={i}>
              {s.h && <h2 className="legal-h">{s.h}</h2>}
              {Array.isArray(s.p) && s.p.map((para, j) => <p className="legal-p" key={j}>{para}</p>)}
              {Array.isArray(s.list) && (
                <ul className="legal-list">
                  {s.list.map((li, k) => <li key={k}>{li}</li>)}
                </ul>
              )}
              {/* Optional data table (e.g. the Cookie Policy storage list). Styled
                  inline since LegalPage.css is out of this lane's territory; wrapped
                  so wide tables scroll rather than overflow the page. */}
              {Array.isArray(s.table?.rows) && (
                <div style={{ overflowX: 'auto', margin: '20px 0 4px' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560, fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>
                    <thead>
                      <tr>
                        {s.table.headers.map((hh, hi) => (
                          <th key={hi} style={{ textAlign: 'left', padding: '10px 16px 10px 0', borderBottom: '2px solid rgba(3,12,49,0.22)', fontFamily: "'Inter Tight', sans-serif", fontWeight: 600, color: '#030C31', whiteSpace: 'nowrap' }}>{hh}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.table.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '12px 16px 12px 0', borderBottom: '1px solid rgba(3,12,49,0.1)', color: '#4a4436', verticalAlign: 'top', lineHeight: 1.55 }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}

          <p className="legal-updated">{meta.lastUpdated}</p>
        </div>
      </section>
    </main>
  )
}
