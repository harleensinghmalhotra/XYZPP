import {useEffect} from 'react'
import faviconUrl from '../static/qfp-favicon.png'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700;800&family=DM+Mono:wght@400;500&display=swap'

// Wraps the whole studio: loads the QFP fonts, sets the QFP favicon + tab title,
// and adds the site's gold hairline under the navbar. (studio.components.layout)
export function StudioLayout(props) {
  useEffect(() => {
    if (!document.getElementById('qfp-fonts')) {
      const link = document.createElement('link')
      link.id = 'qfp-fonts'
      link.rel = 'stylesheet'
      link.href = FONTS
      document.head.appendChild(link)
    }

    let icon = document.querySelector("link[rel='icon']")
    if (!icon) {
      icon = document.createElement('link')
      icon.rel = 'icon'
      document.head.appendChild(icon)
    }
    icon.href = faviconUrl

    if (!/QFP Newsroom/.test(document.title)) document.title = 'QFP Newsroom'

    if (!document.getElementById('qfp-studio-css')) {
      const style = document.createElement('style')
      style.id = 'qfp-studio-css'
      // Gold hairline under the top navigation — the site's hairline language.
      style.textContent = `[data-ui="Navbar"]{border-bottom:1px solid rgba(176,111,20,0.55)!important;}`
      document.head.appendChild(style)
    }
  }, [])

  return props.renderDefault(props)
}
