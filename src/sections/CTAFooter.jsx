import { pressVideo, heroPoster } from '@/lib/assets'
import { RegistrationMark, CalibrationBar } from '@/components/craft'
import VideoBackdrop from '@/components/VideoBackdrop'

export default function CTAFooter() {
  return (
    <section
      id="contact"
      data-theme="dark"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-tone text-paper"
    >
      {/* press footage spans CTA + footer, single field, no boxes */}
      <VideoBackdrop
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        src={pressVideo}
        poster={heroPoster}
      />
      <div className="absolute inset-0 bg-tone/50" />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, var(--video-tone) 0%, transparent 32%, transparent 55%, var(--video-tone) 100%)' }}
      />

      {/* CTA */}
      <div className="relative z-10 mx-auto flex w-full max-w-page flex-1 flex-col justify-center px-6 py-28">
        <p className="label mb-8 text-cyan">Let’s make something worth keeping</p>
        <h2 className="font-display text-display-l font-extrabold uppercase leading-[0.9]">
          Let’s print your
          <br />
          next <span className="font-serif font-medium normal-case italic text-magenta">story.</span>
        </h2>
        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <a
            href="mailto:hello@xyzprintabilities.com"
            className="focus-ring group inline-flex items-center gap-3 rounded-full bg-paper px-7 py-4 font-mono text-sm uppercase tracking-widest text-ink transition-colors duration-200 hover:bg-cyan"
          >
            Start a print run
            <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
          <a
            href="mailto:hello@xyzprintabilities.com"
            className="focus-ring font-mono text-sm text-paper/80 underline decoration-paper/30 underline-offset-4 transition-colors hover:text-paper"
          >
            hello@xyzprintabilities.com
          </a>
        </div>
      </div>

      {/* footer */}
      <footer className="relative z-10 mx-auto w-full max-w-page px-6 pb-6">
        <div className="grid grid-cols-2 gap-8 border-t border-paper/12 py-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <RegistrationMark size={20} className="text-cyan" />
              <span className="font-display text-base font-extrabold uppercase">XYZ Printabilities</span>
            </div>
            <p className="max-w-xs font-mono text-xs leading-relaxed text-paper/55">
              Offset &amp; digital book press. We print knowledge, beautifully.
            </p>
          </div>
          {[
            { h: 'Studio', items: ['Unit 12, Press Lane', 'Sheet City, SC1 4CMYK'] },
            { h: 'Explore', items: ['Print Scope', 'The Print Path', 'The Proof'] },
            { h: 'Connect', items: ['Instagram', 'LinkedIn', 'Dribbble'] },
          ].map((col) => (
            <div key={col.h}>
              <p className="label mb-4 text-paper/45">{col.h}</p>
              <ul className="space-y-2">
                {col.items.map((it) => (
                  <li key={it}>
                    <span className="font-mono text-sm text-paper/75">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CMYK calibration bar — the printer's signature strip */}
        <div className="pt-6">
          <div className="mb-6 h-4">
            <CalibrationBar height={16} withLabels />
          </div>
          <div className="flex flex-col items-start justify-between gap-2 border-t border-paper/12 pt-5 sm:flex-row sm:items-center">
            <span className="label text-paper/45">© 2026 XYZ Printabilities</span>
            <span className="label text-paper/45">CMYK · 300dpi · Registered ✶</span>
          </div>
        </div>
      </footer>
    </section>
  )
}
