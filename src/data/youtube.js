// ─────────────────────────────────────────────────────────────────────────────
//  QUARTERFOLD YOUTUBE VIDEOS  —  shown in the video section on /infrastructure
// ─────────────────────────────────────────────────────────────────────────────
//
//  Each entry is a { url, title } object. The card shows the thumbnail on top and,
//  beneath it, the channel avatar + video title (YouTube search-result style).
//
//  TO ADD A VIDEO:  copy one { ... } block below (inside the [ ]) and set:
//      url   — the video link. Any normal YouTube link works, e.g.
//                https://www.youtube.com/watch?v=XXXXXXXXXXX
//                https://youtu.be/XXXXXXXXXXX
//                https://youtube.com/shorts/XXXXXXXXXXX
//      title — the video's own title (copy it from the YouTube page). It is shown
//              exactly as written here, in every language — it is NOT translated.
//    Save the file. A new card appears automatically — no keys, nothing else.
//
//  TO REMOVE A VIDEO:  delete its { ... } block.
//
// ─────────────────────────────────────────────────────────────────────────────

export const YOUTUBE_VIDEOS = [
  {
    url: 'https://www.youtube.com/watch?v=RBH8Fl20UhI',
    title: 'High-Quality Flexi Binding for Educational Books | Printed & Bound at Quarterfold Printabilites',
  },
  {
    url: 'https://www.youtube.com/watch?v=C5zvmiujeig',
    title: 'Quarterfold Printabilites Expands with New Twin Web Towers | Powering Faster, High-Volume Printing',
  },
  {
    url: 'https://youtu.be/Y0V-H3to8Jw',
    title: 'Power Meets Precision | Quarterfold Printabilities India - New KOMORI G-37P Perfector is Here!',
  },
  {
    url: 'https://youtube.com/shorts/zOvbbldPbTc',
    title: 'Back-to-Back Installations! Brand-New Ryobi RMGT 920 4-Colour at Quarterfold.',
  },
]
