import { motion } from 'motion/react'
import { pagesVideo, heroPoster } from '@/lib/assets'
import { useReducedMotion } from '@/lib/useReducedMotion'
import VideoBackdrop from '@/components/VideoBackdrop'

// The quote, split so one word carries the CMYK accent.
const LINES = [
  [{ t: 'Education is the' }],
  [{ t: 'most ' }, { t: 'powerful', accent: true }, { t: ' weapon' }],
  [{ t: 'which you can use to' }],
  [{ t: 'change the world.' }],
]

export default function Quote() {
  const reduced = useReducedMotion()
  return (
    <section
      id="ethos"
      data-theme="dark"
      aria-label="On the purpose of what we print"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-tone"
    >
      {/* ambient page footage — melts into the site tone */}
      <VideoBackdrop
        className="absolute inset-0 h-full w-full object-cover opacity-70"
        src={pagesVideo}
        poster={heroPoster}
      />
      {/* soft scrims for legibility — gradients, never a box */}
      <div className="absolute inset-0 bg-tone/45" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(80% 70% at 50% 50%, transparent 30%, var(--video-tone) 100%)' }}
      />

      <figure className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <blockquote className="font-serif text-[clamp(2rem,5.4vw,4.6rem)] font-medium italic leading-[1.08] text-paper">
          {LINES.map((line, li) => (
            <motion.span
              key={li}
              className="block"
              initial={reduced ? false : { opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : li * 0.12 }}
            >
              {line.map((w, wi) => (
                <span key={wi} className={w.accent ? 'text-magenta' : undefined}>
                  {w.t}
                </span>
              ))}
            </motion.span>
          ))}
        </blockquote>
        <figcaption className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-paper/40" />
          <span className="label text-paper/75">Nelson Mandela</span>
          <span className="h-px w-10 bg-paper/40" />
        </figcaption>
      </figure>
    </section>
  )
}
