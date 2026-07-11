import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const MONO = "'DM Mono', monospace"

// THE LIVING TICKER — Quarterfold prints ~25 million books a year.
//   25,000,000 books ÷ 31,536,000 seconds/year ≈ one book every 1.26 s.
// So the counter advances by one every 1.26 s from the moment this page mounts.
const TICK_MS = 1260 // 1.26 s — one book off the floor

// A single quiet line for the colophon: the rate, then a live tally of books that
// have left the floor "since you opened this page." Cream on navy, the count in
// gold. No motion beyond the digits changing — it's information, not decoration.
export default function BookTicker() {
  const { t, i18n } = useTranslation('footer')
  const [count, setCount] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    // Only run while the tab is visible so the number stays honest — a hidden tab
    // isn't watching books leave the floor. Reduced motion still ticks (this is
    // information); there are no digit-transition effects to gate in the first place.
    function start() {
      if (timerRef.current) return
      timerRef.current = setInterval(() => setCount((n) => n + 1), TICK_MS)
    }
    function stop() {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <p
      className="text-[12px] leading-relaxed"
      style={{ fontFamily: MONO, color: 'rgba(253,250,244,0.66)' }}
    >
      {t('colophon.tickerLead')}
      {' — '}
      {/* aria-live left off on purpose: a count that changes every ~1.3s would
          otherwise flood a screen reader with announcements. */}
      <span data-book-count style={{ color: '#c89a3c' }}>
        {count.toLocaleString(i18n.language)}
      </span>
      {' '}
      {t('colophon.tickerSince')}
    </p>
  )
}
