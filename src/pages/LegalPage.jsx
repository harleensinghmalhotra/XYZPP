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

  return (
    <main id="main">
      <Seo title={`${data.title} — Quarterfold Printabilities`} description={data.seoDesc} />

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
            </section>
          ))}

          <p className="legal-updated">{meta.lastUpdated}</p>
        </div>
      </section>
    </main>
  )
}
