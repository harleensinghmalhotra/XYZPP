import { useTranslation } from 'react-i18next'

const MONO = "'DM Mono', monospace"
// --gold-text (#836013) not the lighter #c89a3c: the active label is informational
// and must clear 4.5:1 on the cream nav (5.9:1 vs the old 2.47:1 hard-fail).
const GOLD = '#836013'

// Quiet EN | FR pill for the nav's right group (beside Request a Quote). Mirrors
// Alternativ's understated globe toggle: two short labels in DM Mono, the active
// language in gold, the inactive one in the nav's current ink/cream so it stays
// legible on both dark and light nav states. Each language is a real <button> with
// aria-pressed for keyboard + screen-reader users.
const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
]

export default function LanguageToggle({ light = false }) {
  const { i18n, t } = useTranslation('nav')
  const current = i18n.resolvedLanguage || i18n.language

  // Inactive label + hairlines adapt to the nav tone; active is always gold.
  const inactive = light ? 'rgba(28,32,25,0.72)' : 'rgba(253,250,244,0.6)'
  const inactiveHover = light ? 'rgba(28,32,25,0.9)' : 'rgba(253,250,244,0.95)'
  const ring = light ? 'ring-[#0f2444]/15' : 'ring-white/20'

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 ring-1 ${ring}`}
      role="group"
      aria-label={t('language')}
      style={{ fontFamily: MONO }}
    >
      {LANGS.map((lng, i) => {
        const active = current === lng.code
        return (
          <span key={lng.code} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-0.5 text-[11px]" style={{ color: inactive }}>
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => i18n.changeLanguage(lng.code)}
              aria-pressed={active}
              className="focus-ring rounded-full px-2 py-0.5 text-[12px] font-medium uppercase tracking-[0.08em] transition-colors duration-200"
              style={{ color: active ? GOLD : inactive }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = inactiveHover }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = inactive }}
            >
              {lng.label}
            </button>
          </span>
        )
      })}
    </div>
  )
}
