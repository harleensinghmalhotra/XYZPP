import { useTranslation } from 'react-i18next'

// Stub page — minimal conformed navy band (shared `.u-hero` skeleton) carrying the
// existing eyebrow / title / "coming soon" stub strings, nothing more. Adopts the
// site's display-band anatomy: gold top-hairline, DM Mono gold-2 eyebrow, Inter
// Tight cream H1, cream sub — so it reads as a homepage sibling until the real
// Newsroom lands.
export default function Newsroom() {
  const { t } = useTranslation('newsroom')

  return (
    <main id="main">
      <section data-theme="dark" className="u-hero" aria-labelledby="newsroom-h1">
        <div className="u-hero-inner">
          <div className="u-hero-copy">
            <p className="u-eyebrow">{t('eyebrow')}</p>
            <h1 id="newsroom-h1" className="u-h1">{t('title')}</h1>
            <p className="u-hero-sub">{t('coming')}</p>
          </div>
        </div>
      </section>
    </main>
  )
}
