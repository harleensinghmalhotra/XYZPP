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

// ── Case Studies section (homepage) ─────────────────────────────────────────
// HIDDEN on client instruction (2026-07-15 meeting): competitor-poaching concern —
// the named case studies expose which publishers we print for. Hide, do NOT delete:
// the section may return, and its page-turn "book" effect is being recycled into the
// Infrastructure rebuild tomorrow. Gate only — Cases.jsx / Cases.css / its locale keys
// stay intact. When false, the <Cases/> render AND every nav/footer link to it drop.
export const SHOW_CASE_STUDIES = false

// ── Shipment Records (Archive Shelf in Projects section) ─────────────────────
// HIDDEN on client request: the milestone ledger with Tanzania 10M+, Nigeria 8M+,
// Côte d'Ivoire, Ghana, Maharashtra, HDFC rows is gated off. The Archive Shelf
// component and its locale keys stay intact and fully functional — NOT deleted.
// The Projects globe and destination panels remain visible. When false, only the
// <div className="proj-books"> archive shelf disappears, leaving the 3D globe intact.
export const SHOW_SHIPMENT_RECORDS = false

// ── Stats Strip (Strip 3 in TrustStrips) ────────────────────────────────────
// HIDDEN: the 4-stat row (75M Books / 25+ Countries / 800+ Containers / 98% On-Time)
// is gated off. The Stats array and its locale keys stay intact and fully functional
// — NOT deleted. The country marquee (Strip 1) and institution marquee (Strip 2)
// remain visible. When false, only the stats grid disappears.
export const SHOW_STRIP_3 = false
