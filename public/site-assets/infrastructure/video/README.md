# Infrastructure — Video *(pending footage)*

**Appears on the site:** `/infrastructure` → the walkthrough play button.

This slot is built but **switched off** until real footage is delivered. Today the
page shows the poster from [`../gallery/walkthrough-poster.webp`](../gallery/) behind a
play button.

**To turn the video on** (a one-line developer step, not a plain file drop):
1. Drop `walkthrough.mp4` **and** `walkthrough.vtt` (captions — required for
   accessibility) into this folder.
2. A developer sets `VIDEO_READY = true` in `src/pages/InfrastructurePage.jsx`.

Until both are done, files placed here do nothing on the live site.
