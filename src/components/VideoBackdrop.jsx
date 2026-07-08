import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

// Ambient background video that only decodes while on-screen (perf) and stays
// paused on its poster frame under reduced-motion (accessibility).
export default function VideoBackdrop({ src, poster, className }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (reduced) {
      v.pause()
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.05 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduced])

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  )
}
