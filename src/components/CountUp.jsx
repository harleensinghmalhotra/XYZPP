import { useEffect, useRef, useState } from 'react'
import { prefersReduced } from '@/lib/useReducedMotion'

// Counts from 0 → value once, when scrolled into view. transform/opacity-free,
// so it never triggers layout thrash beyond the text node it owns.
export default function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 1600, className = '' }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(prefersReduced() ? value : 0)

  useEffect(() => {
    if (prefersReduced()) {
      setDisplay(value)
      return
    }
    const el = ref.current
    let raf, started
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true
          const t0 = performance.now()
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / duration)
            const eased = 1 - Math.pow(1 - p, 3)
            setDisplay(value * eased)
            if (p < 1) raf = requestAnimationFrame(tick)
          }
          raf = requestAnimationFrame(tick)
          io.disconnect()
        }
      },
      { threshold: 0.5 },
    )
    if (el) io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  const fmt = (n) =>
    n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  // Reserve the final width with a hidden ghost so counting never reflows
  // neighbouring layout (CLS-safe), and lock digit widths with tabular-nums.
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-grid', fontVariantNumeric: 'tabular-nums' }}
    >
      <span aria-hidden="true" style={{ gridArea: '1 / 1', visibility: 'hidden' }}>
        {prefix}
        {fmt(value)}
        {suffix}
      </span>
      <span style={{ gridArea: '1 / 1' }}>
        {prefix}
        {fmt(display)}
        {suffix}
      </span>
    </span>
  )
}
