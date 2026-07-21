# Infrastructure — `/infrastructure`

Images for the Infrastructure page. Open a subfolder's README for its file list,
sizes and per-file notes.

| Subfolder | What it feeds on the page |
|---|---|
| `awards/` | The recognition plaques |
| `certs/` | The certification strip |
| `facility/` | The full-width press-hall frame (only `facility-01` is shown) |
| `gallery/` | The facility gallery + the walkthrough poster |
| `video/` | The walkthrough video — **pending** (see that folder's README) |

**The facility book on this page** (the flip-through of press/binding/warehouse
photos) is shared with the homepage and lives in
[`../homepage/facility-book/`](../../homepage/facility-book/) — swap those photos there.

> ⚠️ **Reference-only subfolders:** `binding/`, `press/`, `sheetfed/`, `team/`,
> `warehouse/` are look-alike copies the site does **not** read. Overwriting them
> changes nothing — the live equivalents are in `../homepage/facility-book/`.

Rule everywhere: overwrite a file keeping its **exact name + extension**, then push.
