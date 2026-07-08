import { SectionTag, CalibrationBar } from '@/components/craft'
import CountUp from '@/components/CountUp'

const STATS = [
  { value: 12, suffix: 'M+', label: 'Books printed / year', tint: '#00AEEF' },
  { value: 23, suffix: '', label: 'Countries shipped', tint: '#EC008C' },
  { value: 99.4, decimals: 1, suffix: '%', label: 'On-time delivery', tint: '#FFC800' },
]

export default function Proof() {
  return (
    <section id="proof" data-theme="light" className="relative overflow-hidden bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-page px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionTag index="06" color="var(--ink)" className="text-ink">The proof</SectionTag>
          <h2 className="font-display text-display-m font-extrabold uppercase leading-[0.92] text-ink">
            Numbers that
            <span className="font-serif font-medium normal-case italic text-magenta"> don’t smudge.</span>
          </h2>
        </div>

        {/* count-up stats */}
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-[6px] bg-ink/10 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="bg-paper-raised px-7 py-10">
              <div className="flex items-baseline gap-2">
                <CountUp
                  value={s.value}
                  decimals={s.decimals || 0}
                  suffix={s.suffix}
                  className="font-display text-[clamp(3.4rem,8vw,6rem)] font-extrabold leading-none text-ink"
                />
              </div>
              <div className="mt-5 flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.tint }} />
                <span className="label text-ink-500">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* the loud case-study number */}
        <div className="relative mt-8 overflow-hidden rounded-[6px] bg-ink px-7 py-12 text-paper md:px-14 md:py-16 paper-grain">
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="label mb-4 text-cyan">Case study — national curriculum rollout</p>
              <div className="font-display text-[clamp(4.5rem,15vw,11rem)] font-extrabold leading-[0.82]">
                <CountUp value={600000} className="text-paper" />
              </div>
              <p className="mt-3 font-serif text-2xl italic text-paper/80">books, delivered whole.</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-10 gap-y-6 md:text-right">
              <div>
                <dt className="label text-paper/50">Titles</dt>
                <dd className="font-display text-4xl font-extrabold md:text-5xl">117</dd>
              </div>
              <div>
                <dt className="label text-paper/50">Turnaround</dt>
                <dd className="font-display text-4xl font-extrabold md:text-5xl">40<span className="text-2xl text-cyan"> days</span></dd>
              </div>
            </dl>
          </div>
          <div className="relative z-10 mt-12 h-3 w-full opacity-90">
            <CalibrationBar height={12} />
          </div>
        </div>
      </div>
    </section>
  )
}
