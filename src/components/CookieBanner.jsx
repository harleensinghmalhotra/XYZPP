import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './CookieBanner.css'

// ── Cookie consent banner (site-wide) ────────────────────────────────────────
// HONEST STATE: this site currently sets ZERO non-essential cookies and loads NO
// analytics (no gtag/GA/plausible/posthog/hotjar/fbq anywhere). The only browser
// storage is functional — the language and sound-toggle preferences. So there is
// nothing to block on "Reject"; the banner still records a REAL consent flag that
// any future non-essential script must gate on (read getConsent() / listen for the
// `qfp:consent` event) before it may fire.
//
// A11y: Accept and Reject are two equally-prominent buttons (same size/weight);
// focus moves into the banner and is trapped while it is open (Escape releases it,
// so it is never a permanent keyboard trap); the choice persists in localStorage.
export const CONSENT_KEY = 'qfp.consent'
export function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY) } catch { return null }
}

export default function CookieBanner() {
  const { t } = useTranslation('cookie')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const firstRef = useRef(null)

  // Show only until a choice has been stored.
  useEffect(() => {
    let stored = null
    try { stored = localStorage.getItem(CONSENT_KEY) } catch { /* private mode → show */ }
    if (!stored) setOpen(true)
  }, [])

  // Move focus in + trap Tab within the banner while open; Escape dismisses it.
  useEffect(() => {
    if (!open) return
    firstRef.current?.focus()
    const el = ref.current
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab' || !el) return
      const items = el.querySelectorAll('a[href], button')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const choose = (value) => {
    try { localStorage.setItem(CONSENT_KEY, value) } catch { /* ignore */ }
    // Broadcast so any future non-essential script can gate on a real consent flag.
    window.dispatchEvent(new CustomEvent('qfp:consent', { detail: value }))
    setOpen(false)
  }

  if (!open) return null
  return (
    <div className="ck-banner" role="dialog" aria-modal="false" aria-label={t('aria')} ref={ref}>
      <div className="ck-inner">
        <p className="ck-copy">
          {t('body')}{' '}
          <Link to="/legal/cookies" className="ck-link focus-ring">{t('policyLink')}</Link>
        </p>
        <div className="ck-actions">
          <button type="button" ref={firstRef} className="ck-btn ck-btn--accept focus-ring" onClick={() => choose('accepted')}>
            {t('accept')}
          </button>
          <button type="button" className="ck-btn ck-btn--reject focus-ring" onClick={() => choose('rejected')}>
            {t('reject')}
          </button>
        </div>
      </div>
    </div>
  )
}
