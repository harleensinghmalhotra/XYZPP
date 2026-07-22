import { forwardRef } from 'react'
import { Link } from 'react-router-dom'

// ── CTAButton — the site's shared call-to-action control ─────────────────────
// The canonical CTA, matching the header "Request a Quote" byte-for-byte: a navy
// outline pill wearing the galaxy-nebula foil ring (.btn-nebula, radius-tokenised
// via --r-btn) that FILLS navy on hover, with a trailing arrow. Reuse this instead
// of re-typing the class string so every CTA on the site stays in exact sync.
//
// Renders the right element from its props:
//   <CTAButton to="/contact">      → react-router <Link>   (internal route)
//   <CTAButton href="https://…">   → <a>                    (external / hash)
//   <CTAButton onClick={fn}>       → <button type="button"> (in-page action)
// Pass `arrow={false}` to drop the trailing →. Extra className / style merge in.
// forwardRef so callers can focus it (e.g. return focus after closing a dialog).
const BASE =
  'btn-nebula btn-nebula--light focus-ring inline-flex shrink-0 items-center gap-1.5 ' +
  'whitespace-nowrap border-[1.5px] border-[#0f2444] px-[22px] py-[10px] text-[13px] ' +
  'font-medium text-[#0f2444] transition-colors duration-200 hover:bg-[#0f2444] hover:text-[#fdfaf4]'

const CTAButton = forwardRef(function CTAButton(
  { to, href, children, className = '', arrow = true, style, type, ...rest },
  ref,
) {
  const cls = `${BASE} ${className}`.trim()
  const mergedStyle = { fontFamily: "'Inter', sans-serif", letterSpacing: '0.3px', ...style }
  const inner = (
    <>
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </>
  )
  if (to) return <Link ref={ref} to={to} className={cls} style={mergedStyle} {...rest}>{inner}</Link>
  if (href) return <a ref={ref} href={href} className={cls} style={mergedStyle} {...rest}>{inner}</a>
  return <button ref={ref} type={type || 'button'} className={cls} style={mergedStyle} {...rest}>{inner}</button>
})

export default CTAButton
