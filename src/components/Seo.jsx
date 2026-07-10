import { useEffect } from 'react'

// Minimal head manager for React 18 (no react-helmet). Sets document.title, the
// meta description, and an optional JSON-LD block, restoring nothing on unmount
// because every routed page sets its own. IDs keep us from stacking duplicates
// across navigations.
export default function Seo({ title, description, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title

    if (description) {
      let m = document.head.querySelector('meta[name="description"]')
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', 'description')
        document.head.appendChild(m)
      }
      m.setAttribute('content', description)
    }

    let node
    if (jsonLd) {
      node = document.createElement('script')
      node.type = 'application/ld+json'
      node.setAttribute('data-seo', 'route')
      node.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(node)
    }
    return () => { if (node) node.remove() }
  }, [title, description, jsonLd])

  return null
}
