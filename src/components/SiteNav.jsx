import { useEffect, useState } from 'react'

const LANG_ICON = '/alternativ/632ccb37abbc28549af42fcd_icon_language-white.svg'
const MENU_ICON = '/alternativ/632ccb37b5df7a0e06ef7cbe_icon_menu-white.svg'

// The nav floats over sections of both tones. It reads the theme of whichever
// section currently sits under it and flips ink/paper so it never disappears.
export default function SiteNav() {
  const [solid, setSolid] = useState(false)
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setTheme(e.target.dataset.theme || 'dark')
        })
      },
      { rootMargin: '-64px 0px -92% 0px', threshold: 0 },
    )
    document.querySelectorAll('[data-theme]').forEach((el) => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  const light = theme === 'light'
  const fg = light ? 'text-ink' : 'text-white'
  const link = light ? 'text-ink-500 hover:text-ink' : 'text-white/90 hover:text-white'
  const bar = solid ? (light ? 'bg-paper/70 py-3 backdrop-blur-[3px]' : 'bg-[#0c2f4a]/70 py-3 backdrop-blur-[3px]') : 'py-5'
  // white icons on dark sections; invert to dark on light sections
  const iconTone = light ? 'invert' : ''

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`mx-auto flex max-w-page items-center justify-between px-6 font-metrisch transition-[padding,background-color] duration-300 ease-out ${bar}`}>
        {/* left group: logo + primary links (grouped like the reference) */}
        <div className="flex items-center gap-10">
          <a href="#top" className={`focus-ring flex items-center transition-colors duration-300 ${fg}`} aria-label="Alternativ home">
            <img src="/alternativ/alternativ-logo.svg" alt="Alternativ Logo" style={{ width: 165 }} className="h-auto w-[165px] mix-blend-plus-lighter" />
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#expertise" className={`focus-ring text-[16px] font-medium transition-colors duration-300 ${link}`}>Our expertise</a>
            <a href="#approach" className={`focus-ring text-[16px] font-medium transition-colors duration-300 ${link}`}>Our approach</a>
            <a href="#about" className={`focus-ring text-[16px] font-medium transition-colors duration-300 ${link}`}>About us</a>
            <a href="#quote" className="focus-ring text-[16px] font-medium text-[#6ebe4a] transition-colors duration-300 hover:opacity-70">Ask for a quote</a>
          </nav>
        </div>

        {/* right group: language + menu */}
        <div className="flex items-center gap-5">
          <a href="#lang" className={`focus-ring hidden items-center gap-2 text-[16px] font-medium transition-colors duration-300 md:flex ${fg}`} aria-label="Language">
            <img src={LANG_ICON} alt="" aria-hidden="true" width={20} className={iconTone} />
            En
          </a>
          <a href="#menu" className={`focus-ring flex h-[35px] w-[35px] items-center justify-center rounded-full border transition-colors duration-300 ${light ? 'border-ink/30' : 'border-white/40'}`} aria-label="Menu">
            <img src={MENU_ICON} alt="" aria-hidden="true" width={18} className={iconTone} />
          </a>
        </div>
      </div>
    </header>
  )
}
