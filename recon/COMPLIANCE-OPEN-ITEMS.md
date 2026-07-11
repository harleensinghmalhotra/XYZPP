# Compliance — Open Items

**For:** Harry / Ekta
**Status:** open decisions blocking full compliance sign-off
**Last updated:** 2026-07-11

These are the outstanding calls that code cannot make on its own. Each has a safe
default already shipped; this list tracks what still needs a human decision.

---

## 1. "Read by billions" hero bubble — needs substantiation or softening
- **Where:** homepage hero speech bubble — `src/sections/Hero.jsx`
  ("…the books have been read by **billions** of people!").
- **Issue:** an unqualified "billions" reach claim may need substantiation to
  stand up to advertising-standards / consumer-protection scrutiny.
- **Options:** (a) add a substantiation note/source, or (b) soften the wording
  (e.g. "read by millions", "read the world over").
- **Owner:** **Ekta's copy, her call.** No code change made — awaiting decision.

## 2. Ministry / government / programme names — written permission pending
- **Where:** TrustStrips marquee, Projects ledger + hero, homepage Case Studies,
  About history timeline, Educational impact figures, Fulfilment trust marquee.
- **Issue:** naming specific ministries, government bodies and funded programmes
  (Tanzania Institute of Education, UBEC, World Bank / USAID programmes,
  Maharashtra State Bureau, etc.) needs **confirmed written permission** from the
  client before public display.
- **Gate shipped:** `SHOW_MINISTRY_NAMES` in `src/lib/compliance.js` — a single
  one-flip kill switch. **Default: ON (names shown).** Flip to `false` and every
  named row/entry drops cleanly site-wide, no layout holes.
- **Owner:** Harry to confirm written permissions. If not secured by launch,
  flip the switch off.

## 2b. Named commercial clients (HDFC Bank, ZEE Learn / Kidzee) — permission confirmed verbally, WRITTEN COPY STILL OWED
- **Where:** TrustStrips institutions marquee, Projects archive shelf (HDFC 1.3M+
  books + ZEE 0.5M+ learning kits), About, Fulfilment trust marquee.
- **Status:** **permission confirmed verbally, WRITTEN COPY STILL OWED — chase
  before launch.** Gate `SHOW_RESTRICTED_CLIENTS` in `src/lib/compliance.js`
  flipped **ON (true)** on 2026-07-11 per Harry so these names now render.
- **Issue:** display of these private-company client names was approved verbally;
  the written permission must still be obtained and filed here before public
  launch. If the written copy is not secured, flip the switch back to `false`.
- **Owner:** Harry to obtain + file the written permission.

## 3. Cookie decision — open (cookieless vs GA)
- **Issue:** we have not decided whether the site runs **cookieless** (no consent
  banner needed) or ships **Google Analytics** (consent banner + cookie
  inventory required).
- **Blocks:** the **Cookie Policy** copy cannot be finalised until this is
  decided — the policy text depends entirely on which path we take.
- **Owner:** Harry / Ekta to decide analytics approach.

## 4. Legal pages are shells awaiting counsel text
- **Where:** Privacy Policy, Cookie Policy, Terms of Use, Accessibility
  (footer links, currently `#` placeholders / shell routes).
- **Issue:** these are **placeholders**; the real text must come from legal
  counsel. Cookie Policy is additionally blocked by item 3 above.
- **Owner:** Harry to brief counsel; wire final copy once received.

---

### Already fixed in this pass (for reference)
- Site-wide statutory entity line (legal name + CIN + registered office) now
  renders in the footer on every page.
- All sub-11px text raised to the 11px compliance floor (`.aw-clip-date`,
  CalibrationBar labels, and the Hero rotating seal — the last was not in the
  original recon; caught by the automated sub-11px sweep).
