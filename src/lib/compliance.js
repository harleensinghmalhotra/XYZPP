// ── Compliance switch: government / ministry / programme names ───────────────
// The client is ACTIVELY ASKING us to name ministries, government bodies and
// funded programmes (NCERT, UBEC, Sarva Shiksha Abhiyan, Ministry of Mozambique,
// Republic of Côte d'Ivoire, Tanzania Institute of Education, World Bank / USAID
// programmes, Maharashtra State Bureau, etc.). Naming these is approved.
//
// This is the one-flip switch. Flip to `false` and every gated row/entry drops
// cleanly across the site — TrustStrips marquee, Projects ledger, About history
// timeline, Educational impact figures and the Fulfilment trust marquee — with
// no layout holes. Mirrors the per-page SHOW_RESTRICTED_CLIENTS pattern, but
// centralised so a single edit covers every page.
//
// TRUE (names shown) — approved by the client. See recon/COMPLIANCE-OPEN-ITEMS.md.
export const SHOW_MINISTRY_NAMES = true

// ── Named commercial clients (HDFC Bank, ZEE Learn / Kidzee, Reliance) ───────
// WRITTEN permission to display these private-company client names is CONFIRMED
// and on file (client sign-off received). Centralised single source of truth —
// the per-page shadow consts in Projects / Fulfilment / About were removed and
// now import this flag, so every gated row across TrustStrips, Projects, About
// and Fulfilment turns on with this one edit. Flip back to `false` only if that
// permission is ever withdrawn.
// TRUE (names shown) — written permission confirmed. See recon/COMPLIANCE-OPEN-ITEMS.md.
export const SHOW_RESTRICTED_CLIENTS = true
