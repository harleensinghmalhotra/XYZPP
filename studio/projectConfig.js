// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the QFP Newsroom Sanity project.
//
// Imported by BOTH the studio (sanity.config.js / sanity.cli.js) AND the Vite
// site (src/lib/sanity.js) so the projectId + dataset are defined in exactly one
// place. These two values are PUBLIC — they ship in the browser bundle by design.
// The write token is NOT here; it lives only in studio/.env (gitignored).
// ─────────────────────────────────────────────────────────────────────────────
export const projectId = 'z8o5rxfi'
export const dataset = 'production'
