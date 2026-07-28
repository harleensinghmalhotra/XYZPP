import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// ── Single head manager for the SPA (React 18, no react-helmet) ───────────────
// On every route this sets the full discoverability head: title, meta
// description, canonical link, Open Graph, Twitter card, and any page JSON-LD.
//
// Language is switched IN-APP (one URL per page, no /fr or /es paths), so:
//   • the canonical is identical across languages,
//   • og:locale simply follows the active language,
//   • there are NO hreflang alternates to emit (nothing to point them at).
// The <html lang> attribute is kept in sync separately, in src/i18n.js.
//
// Every route-owned node carries data-seo="route" so a navigation clears the
// previous page's tags before writing its own — no stacking across routes.
const SITE = 'https://quarterfoldltd.com'
const SITE_NAME = 'Quarterfold Printabilities'
// Default social preview: the "how we work" AV title card (1920x1080 JPG),
// which crops cleanly to the 1.91:1 social ratio. Pages may override via `image`.
const DEFAULT_IMAGE = '/site-assets/homepage/video/how-we-work-poster.jpg'
const OG_LOCALE = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' }

const abs = (p) => (!p ? p : p.startsWith('http') ? p : SITE + (p.startsWith('/') ? p : '/' + p))

export default function Seo({ title, description, image, type = 'website', jsonLd, noindex = false }) {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  const lang = i18n.language

  useEffect(() => {
    // Clear any leftover route SEO nodes before writing this route's.
    document.head.querySelectorAll('[data-seo="route"]').forEach((n) => n.remove())

    if (title) document.title = title

    const canonical = SITE + (pathname === '/' ? '/' : pathname)
    const img = abs(image || DEFAULT_IMAGE)

    // The description meta ships static in index.html — upsert it in place so we
    // never create a duplicate; everything else is a fresh data-seo node.
    if (description) {
      let m = document.head.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', 'description')
        document.head.appendChild(m)
      }
      m.setAttribute('content', description)
    }

    const nodes = []
    const addLink = (rel, href) => {
      const el = document.createElement('link')
      el.setAttribute('rel', rel)
      el.setAttribute('href', href)
      el.setAttribute('data-seo', 'route')
      document.head.appendChild(el)
      nodes.push(el)
    }
    const addMeta = (attr, key, val) => {
      if (val == null) return
      const el = document.createElement('meta')
      el.setAttribute(attr, key)
      el.setAttribute('content', val)
      el.setAttribute('data-seo', 'route')
      document.head.appendChild(el)
      nodes.push(el)
    }

    addLink('canonical', canonical)

    // Open Graph
    addMeta('property', 'og:type', type)
    addMeta('property', 'og:site_name', SITE_NAME)
    addMeta('property', 'og:title', title)
    addMeta('property', 'og:description', description)
    addMeta('property', 'og:url', canonical)
    addMeta('property', 'og:image', img)
    addMeta('property', 'og:locale', OG_LOCALE[lang] || 'en_US')

    // Twitter card
    addMeta('name', 'twitter:card', 'summary_large_image')
    addMeta('name', 'twitter:title', title)
    addMeta('name', 'twitter:description', description)
    addMeta('name', 'twitter:image', img)

    if (noindex) addMeta('name', 'robots', 'noindex, follow')

    if (jsonLd) {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.setAttribute('data-seo', 'route')
      s.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(s)
      nodes.push(s)
    }

    return () => nodes.forEach((n) => n.remove())
  }, [title, description, image, type, jsonLd, noindex, pathname, lang])

  return null
}
