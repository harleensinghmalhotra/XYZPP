import {buildLegacyTheme} from 'sanity'

// QFP palette mapped onto the studio chrome via buildLegacyTheme. Navy nav,
// gold as THE accent (primary buttons, focus rings, info) — no default Sanity
// blue in normal flows. Danger stays a muted brick (destructive actions only).
const props = {
  '--black': '#1c2019', // ink
  '--white': '#fdfaf4', // cream
  '--gray': '#8b8578',
  '--gray-base': '#8b8578',
  '--component-bg': '#ffffff',
  '--component-text-color': '#1c2019',

  '--brand-primary': '#b06f14', // gold — THE accent (links, active tabs)

  '--default-button-color': '#0e1b46', // navy for neutral/secondary buttons
  '--default-button-primary-color': '#b06f14', // gold — Publish & primary actions
  '--default-button-success-color': '#3a6b3a',
  '--default-button-warning-color': '#b06f14',
  '--default-button-danger-color': '#a23b2e', // muted brick (delete only)

  '--state-info-color': '#b06f14', // kill Sanity blue → gold
  '--state-success-color': '#3a6b3a',
  '--state-warning-color': '#b06f14',
  '--state-danger-color': '#a23b2e',

  '--main-navigation-color': '#0e1b46', // navy navbar
  '--main-navigation-color--inverted': '#fdfaf4', // cream text/icons on navy

  '--focus-color': '#b06f14', // gold focus ring

  '--font-family-base': `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  '--font-family-monospace': `'DM Mono', ui-monospace, monospace`,
}

const base = buildLegacyTheme(props)

// Legacy theme only carries base + monospace families; lift headings + labels to
// the site's Inter Tight / DM Mono voices.
export const qfpTheme = {
  ...base,
  fonts: {
    ...base.fonts,
    heading: {...base.fonts.heading, family: `'Inter Tight', 'Inter', sans-serif`},
    label: {...base.fonts.label, family: `'DM Mono', ui-monospace, monospace`},
  },
}
