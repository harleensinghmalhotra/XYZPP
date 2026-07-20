import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TIGHT = "'Inter Tight', sans-serif"
const INTER = "'Inter', sans-serif"
const MONO = "'DM Mono', monospace"

// THE OUT-OF-PRINT 404 — a designed dead-end, not a blank shell. Cream page, a
// small stroke-drawn closed book in the site's icon language (olive line, gold
// bookmark), a mono eyebrow, and a gold arrow back to the catalogue. data-theme
// "light" so SiteNav flips its fixed chrome to the light treatment at the top.
export default function NotFound() {
  const { t } = useTranslation('common')
  return (
    <main
      id="main"
      data-theme="light"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 py-24 text-center"
      style={{ background: '#FDFAF4' }}
    >
      {/* Closed hardcover — olive stroke, gold spine rule + bookmark ribbon.
          Square corners, dark-on-cream strokes (no light interior hairlines). */}
      <svg
        width="72"
        height="72"
        viewBox="0 0 64 64"
        fill="none"
        stroke="#6b7a2a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mb-9"
      >
        <rect x="14" y="8" width="36" height="48" />
        <line x1="20" y1="8" x2="20" y2="56" />
        <line x1="28" y1="23" x2="44" y2="23" stroke="#F37031" />
        <line x1="28" y1="31" x2="40" y2="31" opacity="0.55" />
        <path d="M40 8 V26 L43 22.5 L46 26 V8" stroke="#F37031" />
      </svg>

      <p
        className="mb-5 text-[12px] font-medium uppercase tracking-[0.28em]"
        style={{ fontFamily: MONO, color: '#C2551B' }}
      >
        {t('notFound.eyebrow')}
      </p>
      <h1
        className="max-w-3xl text-[clamp(36px,6vw,72px)] font-bold leading-[1.05] tracking-tight"
        style={{ fontFamily: TIGHT, color: '#0F2444' }}
      >
        {t('notFound.title')}
      </h1>
      <p
        className="mt-6 max-w-md text-[15px] leading-relaxed"
        style={{ fontFamily: INTER, color: 'rgba(28,32,25,0.72)' }}
      >
        {t('notFound.body')}
      </p>
      <Link
        to="/"
        className="focus-ring mt-10 inline-flex items-center text-[15px] font-semibold tracking-[0.02em] transition-colors hover:text-[#C2551B]"
        style={{ fontFamily: MONO, color: '#C2551B' }}
      >
        {t('notFound.back')}
      </Link>
    </main>
  )
}
