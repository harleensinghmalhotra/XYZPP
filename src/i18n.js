import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Lightweight i18n foundation. English is the default and the silent fallback for
// any key a translation file hasn't filled yet. The chosen language persists in
// localStorage and drives the document <html lang> attribute so the two stay in
// sync across reloads and routes.
export const SUPPORTED_LANGS = ['en', 'fr', 'es']
const STORAGE_KEY = 'qfp.lang'

// Auto-load every locale namespace file. Each file at locales/<lng>/<ns>.json
// registers as resources[lng][ns]; add a new page namespace by dropping in an
// en/fr JSON pair — no edit needed here. Filename = namespace name.
const files = import.meta.glob('./locales/*/*.json', { eager: true })
const resources = {}
for (const path in files) {
  const m = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/)
  if (!m) continue
  const [, lng, ns] = m
  ;(resources[lng] ||= {})[ns] = files[path].default || files[path]
}

export const NAMESPACES = [
  ...new Set(Object.values(resources).flatMap((r) => Object.keys(r))),
]

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const initialLang = SUPPORTED_LANGS.includes(stored) ? stored : 'en'

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false, // empty keys fall back to English silently
  returnNull: false,
})

// Keep <html lang> and localStorage aligned with the active language.
function syncDocumentLang(lng) {
  if (typeof document !== 'undefined') document.documentElement.lang = lng
}

syncDocumentLang(i18n.language)
i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng)
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
