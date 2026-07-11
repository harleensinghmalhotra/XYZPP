// ── Compliance kill switch: government / ministry / programme names ──────────
// Written permission from the client to name specific ministries, government
// bodies and funded programmes (Tanzania Institute of Education, UBEC, World
// Bank / USAID programmes, Maharashtra State Bureau, etc.) is PENDING.
//
// This is the one-flip switch. Flip to `false` and every gated row/entry drops
// cleanly across the site — TrustStrips marquee, Projects ledger, About history
// timeline, Educational impact figures and the Fulfilment trust marquee — with
// no layout holes. Mirrors the per-page SHOW_RESTRICTED_CLIENTS pattern, but
// centralised so a single edit covers every page.
//
// Default TRUE (names shown). See recon/COMPLIANCE-OPEN-ITEMS.md.
export const SHOW_MINISTRY_NAMES = true

// ── Named commercial clients (HDFC Bank, ZEE Learn / Kidzee, Reliance) ───────
// Written permission to display these private-company client names is PENDING,
// so they must stay OUT of the DOM by default. Centralised twin of the per-page
// `SHOW_RESTRICTED_CLIENTS` const (Projects/Fulfilment/About) so the TrustStrips
// institutions marquee gates the same way. Flip to `true` only once sign-off is
// confirmed. Default FALSE (names hidden). See recon/COMPLIANCE-OPEN-ITEMS.md.
// Enabled 2026-07-11 per Harry — client permission confirmed; written permission to be filed in recon/COMPLIANCE-OPEN-ITEMS.md
export const SHOW_RESTRICTED_CLIENTS = true
