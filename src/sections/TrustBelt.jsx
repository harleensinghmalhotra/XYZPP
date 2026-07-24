import { useTranslation } from 'react-i18next'
import { Handshake, Headset, Activity, CalendarCheck, ShieldCheck, TrendingUp } from 'lucide-react'

// ── HOMEPAGE TRUST BELT — six one-line guarantees, directly below the process section.
// A quiet horizontal belt with a gold top-hairline (the same signature the TrustStrips
// band carries), on the alternating cream, six icon+line cells that reflow 6 → 3 → 2 → 1.
// Each icon is chosen to fit its line; colours come only from the existing tokens.
const ICONS = [Handshake, Headset, Activity, CalendarCheck, ShieldCheck, TrendingUp]

export default function TrustBelt() {
  const { t } = useTranslation('homeTrustBelt')
  const raw = t('lines', { returnObjects: true })
  const lines = Array.isArray(raw) ? raw : []

  return (
    <section className="tb-band" aria-label={t('aria')}>
      <ul className="tb-grid">
        {lines.map((line, i) => {
          const Icon = ICONS[i] || Handshake
          return (
            <li className="tb-item" key={i}>
              <span className="tb-ico" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
              <span className="tb-text">{line}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
