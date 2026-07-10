# QFP Live-Site Assets — scraped + classified (Phase 2.5)

40 images scraped from quarterfoldltd.com (7 pages), deduped by content hash,
converted to webp in `public/qfp/live/`. Classification below is by visual review
(contact sheet: `shots/phase25/live-contact-sheet.png`).

## Treatment toolkit
`node scripts/assetkit.mjs duotone <in> <out.webp> <navy|warm> [width]`
`node scripts/assetkit.mjs pexels <photoId> <out.webp> <navy|warm|none> [width]`
- `.tint()`-based duotone: preserves luminance/detail, unifies hue to brand navy or warm amber.
- Photographic SCENE slots (facility, machine, warehouse, people) → duotone navy (on navy sections) or warm (on cream/beige).
- PRODUCT slots (book covers, notebooks) → keep full colour (`none`) — the product colour is the point.
- Pexels needs NO API key (direct CDN). License is free/commercial, no attribution.

## Classification (filenames in public/qfp/live/)
- **Press / machine** (navy duotone): 03-untitled-design-52, 08-image-6-1-scaled, 09-image-7-1-scaled, 14-educational-banner-uai-1600x1066, 29-image-3, 31-6-scaled-uai, 32-12-scaled-uai (operator at press), 34-2-1-scaled-uai
- **Facility exterior**: 04-infra, 10-image-5-1-scaled, 11-infra-uai-1486x991, 15-untitled-design-52-uai-750x500
- **Warehouse / logistics**: 05-warehousing-1, 07-image-1-5-uai-1536x768, 12-warehousing-1-uai-750x500, 13-11-4-uai-750x500, 30-5-scaled-uai, 33-1-1-scaled-uai, 35-3-scaled-uai
- **Educational book covers** (full colour): 02-educational-banner, 06-11-4, 16-int-1, 18-csq-4, 19-csq-1, 20-csq-2, 21-csq-3, 23-image-4, 24-image-5, 25-image-6, 26-image-7, 28-whatsapp-…-c2, 36-whatsapp-…-52, 38-11-1
- **Trade books / notebooks** (full colour): 27-whatsapp-…-4-56, 37-11-3, 39-11-2
- **People / children reading**: 17-int-3-scaled-uai (children), 22-education-home-page-banner (children reading)
- **Misc**: 01-qflo (logo — skip), 40-image-1-3 (paint-splash art — skip)

## Pexels fill (for gaps with no matching QFP asset)
Find a photo ID by searching pexels.com, then fetch by ID. Always duotone scene
photos; keep book/product photos full colour. Verify each fetch visually (IDs drift).
