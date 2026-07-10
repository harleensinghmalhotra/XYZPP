import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

// Lightweight i18n foundation. English is the default and the silent fallback for
// any key a translation file hasn't filled yet (page namespaces land in a later
// full-content pass). The chosen language persists in localStorage and drives the
// document <html lang> attribute so the two stay in sync across reloads and routes.
export const SUPPORTED_LANGS = ['en', 'fr']
const STORAGE_KEY = 'qfp.lang'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const initialLang = SUPPORTED_LANGS.includes(stored) ? stored : 'en'

// Each locale file's top-level keys (nav, footer, common) are registered as
// i18next namespaces; page namespaces get added to the same files later.
export const NAMESPACES = ['nav', 'footer', 'common']

i18n.use(initReactI18next).init({
  resources: {
    en: en,
    fr: fr,
  },
  lng: initialLang,
  fallbackLng: 'en',
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false, // empty keys fall back to English silently
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
