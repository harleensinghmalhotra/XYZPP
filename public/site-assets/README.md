# Site Assets

A human-readable map of every image and video the site uses, one folder per page
and section. **This is the single place to swap media.**

## How to swap an asset
1. Find the page → section folder below.
2. Open its `README.md` to see what each file is and its dimensions.
3. **Overwrite the file in place — keep the exact same filename and extension.**
   The site references these by stable URL (`/site-assets/...`), so a straight
   overwrite updates the live site with no code change and no rebuild.

## Layout
```
public/site-assets/
  homepage/        hero, facility-book, video, products, destinations, globe,
                   awards, certifications, cases, stat-icons, brand
  about/           timeline, gallery (+ facility-tour.mp4), founder, team
  infrastructure/  press, sheetfed, binding, warehouse, facility, team, gallery
  newsroom/        gallery, video
  contact/         facility, map
  print-on-demand/ preview + book
```

## Notes
- Keep the aspect ratio close to the original when swapping (see each README's dimensions) so crops stay clean.
- Video files: keep them web-friendly H.264 mp4, ideally < 10MB.
- Only the **about/** page currently reads from this tree; other pages are wired in their own lanes.
