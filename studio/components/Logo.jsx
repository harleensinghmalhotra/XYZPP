import logoUrl from '../static/qfp-logo-light.png'

// QFP wordmark in the navbar (light lockup — the navbar renders on navy).
export function Logo() {
  return (
    <img
      src={logoUrl}
      alt="QFP Newsroom"
      style={{height: 24, width: 'auto', display: 'block'}}
    />
  )
}
