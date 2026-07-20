// ─────────────────────────────────────────────────────────────────────────────
// RETIRED: content now lives in Sanity, file kept for reference until handoff.
// Nothing imports this module anymore — the /newsroom index + article read live
// from the QFP Newsroom studio via src/lib/sanity.js. Left in place as the
// authored-copy reference (and the body-block shape the seed converted).
// ─────────────────────────────────────────────────────────────────────────────
// MOCK CONTENT — pending client copy replacement.
//
// Images are placeholders too: licence-free, book-themed Pexels stock only —
// open books, hardcovers, library shelves, book piles and reading — so every
// card and article cover reads as one book world. All live under
// /public/qfp/newsroom/ (LFS-exempt). The lone video post keeps its clip +
// poster. Swap for client newsroom photography later.
//
// Twelve newsroom posts for the /newsroom index + /newsroom/:slug article view.
// Every headline, date and paragraph below is placeholder editorial written by the
// build, anchored ONLY to publicly-known Quarterfold Printabilities facts
// (PrintWeek Book Education Company of the Year, CAPEXIL Highest Book Exporter,
// Dun & Bradstreet recognition, FSC / ISO / Sedex credentials, the 27-country
// export reach, the 75-million-book milestone, 800+ containers a year, the third
// fulfilment centre, and the Spanish-language + new-website launches). Dates are
// spread across 2024–2026. Replace this file wholesale when client copy lands —
// the page reads `slug / title / date / category / excerpt / heroImage / body`
// and nothing else, so the shape is the contract.
//
// body blocks:
//   { type: 'paragraph', text }
//   { type: 'image', src, alt, caption? }
//   { type: 'video', src, poster, caption? }   ← one post exercises this
//
// category is one of 'Awards' | 'Press' | 'Announcements', or null (uncategorised,
// no chip). ~3 posts are intentionally left uncategorised.
//
// The 12 posts stay EN-only by design; only page chrome (labels, hero, back link)
// is translated via the `newsroom` locale namespace.
// ─────────────────────────────────────────────────────────────────────────────

const IMG = '/site-assets/newsroom/gallery' // readable asset tree (overwrite-to-swap)

export const newsroomPosts = [
  {
    slug: 'quarterfold-launches-new-website',
    title: 'Quarterfold unveils a rebuilt global website',
    date: '2026-07-08',
    category: 'Announcements',
    heroImage: `${IMG}/shelves.jpg`,
    excerpt:
      'Our new website brings the full breadth of Quarterfold’s book manufacturing and fulfilment capability into one place — faster, clearer and built for the publishers and brands we serve across 27 countries.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has launched a completely rebuilt website, replacing a decade-old marketing site with a single, fast, accessibility-minded home for everything the company makes and moves. The redesign consolidates educational publishing, trade book production, print-on-demand and end-to-end fulfilment under one roof, so a publisher can trace a title from prepress to a container at the port without leaving the page.' },
      { type: 'paragraph', text: 'The rebuild was driven by a simple observation: our customers had grown far beyond what the old site described. What began as a book printer is now a manufacturing and logistics partner serving publishers and consumer brands on four continents, and the site needed to say so plainly.' },
      { type: 'image', src: `${IMG}/reading.jpg`, alt: 'A reader turning the pages of an open book.', caption: 'The new site foregrounds the work — books, presses and shipments — over stock photography.' },
      { type: 'paragraph', text: 'Beyond the visual refresh, the platform is engineered for reach. It ships in multiple languages, meets modern performance budgets, and is structured so that regional teams can surface the credentials — FSC chain-of-custody, ISO certification, Sedex membership — that matter to buyers in each market.' },
      { type: 'paragraph', text: 'The newsroom you are reading is part of that effort: a permanent, plain-spoken record of the awards, certifications and milestones that mark Quarterfold’s growth. Expect regular updates as the year continues.' },
    ],
  },
  {
    slug: 'spanish-language-launch',
    title: 'Quarterfold goes live in Spanish for Latin American publishers',
    date: '2026-05-20',
    category: 'Announcements',
    heroImage: `${IMG}/picturebook.jpg`,
    excerpt:
      'A fully Spanish-language experience opens Quarterfold’s catalogue, capabilities and fulfilment network to publishers across Spain and Latin America — the company’s first step into native-language service beyond English and French.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has launched a Spanish-language version of its platform, extending native-language service to publishers and brands across Spain and Latin America. It is the company’s third supported language and a deliberate move toward markets where educational and trade publishing continue to expand rapidly.' },
      { type: 'paragraph', text: 'The launch is more than a translation. Pricing conventions, credential language and fulfilment terms have been localised so that a buyer in Bogotá or Madrid reads the offer in the same terms a domestic supplier would use.' },
      { type: 'image', src: `${IMG}/books.jpg`, alt: 'Freshly printed books stacked and ready for distribution.', caption: 'Spanish-language service pairs with Quarterfold’s existing export logistics into the region.' },
      { type: 'paragraph', text: '“Language is the first mile of trust,” a company representative noted. “If a publisher can evaluate us in their own language, the rest of the relationship moves faster.”' },
      { type: 'paragraph', text: 'The Spanish rollout follows sustained export growth into the Americas and sits alongside Quarterfold’s established French-language service. Additional languages are under evaluation.' },
    ],
  },
  {
    slug: 'seventy-five-million-books-milestone',
    title: 'Quarterfold passes 75 million books produced',
    date: '2026-04-02',
    category: 'Announcements',
    heroImage: `${IMG}/pile.jpg`,
    excerpt:
      'A cumulative milestone — 75 million books manufactured and shipped — marks two decades of scaling book production without compromising the craft standards the company was built on.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has produced its 75-millionth book, a cumulative milestone that spans educational titles, trade editions and print-on-demand runs shipped to publishers and brands around the world. The figure represents years of steady capacity growth across the company’s facilities.' },
      { type: 'paragraph', text: 'Reaching 75 million is less about a single record run than about consistency: millions of copies a year, produced to the same binding and colour standards whether the order is a 200-copy educational reprint or a multi-lakh trade release.' },
      { type: 'image', src: `${IMG}/bookstack.jpg`, alt: 'A hand selecting a finished book from a full shelf.', caption: 'Cumulative output reflects sustained investment in press and bindery capacity.' },
      { type: 'paragraph', text: 'The milestone also reflects the shift in what Quarterfold produces. Alongside long educational runs, on-demand and short-run work now forms a meaningful share of volume, supported by the same colour-managed workflow.' },
      { type: 'paragraph', text: 'The company framed the number as a marker rather than a finish line, pointing to expanded fulfilment capacity and new market launches as the next phase of growth.' },
    ],
  },
  {
    slug: 'third-fulfilment-centre-opens',
    title: 'Quarterfold opens its third facility and fulfilment centre',
    date: '2026-02-11',
    category: 'Announcements',
    heroImage: `${IMG}/darkshelves.jpg`,
    excerpt:
      'A new dedicated fulfilment centre expands warehousing, pick-and-pack and dispatch capacity — shortening the distance between the press and the publisher’s customer.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has opened its third facility, a dedicated fulfilment centre that significantly expands the company’s warehousing, pick-and-pack and dispatch capacity. The site is built to hold finished stock closer to distribution, compressing the time between a book leaving the bindery and reaching a reader.' },
      { type: 'paragraph', text: 'The facility integrates directly with Quarterfold’s manufacturing operations, so titles printed and bound in-house can flow into storage and order fulfilment without an external logistics handoff — a structural advantage for publishers managing unpredictable demand.' },
      { type: 'video', src: '/site-assets/newsroom/video/press-run.mp4', poster: `${IMG}/qfp-warehouse.webp`, caption: 'Inside the new centre — automated handling feeds pick-and-pack and dispatch.' },
      { type: 'paragraph', text: 'For print-on-demand and short-run customers, the centre means faster turnaround and the ability to hold safety stock economically. For long educational programmes, it means seasonal peaks can be absorbed without straining the production line.' },
      { type: 'paragraph', text: 'The opening continues a period of sustained infrastructure investment and supports the company’s growing export volume, which now moves hundreds of containers a year.' },
    ],
  },
  {
    slug: 'printweek-book-education-company-of-the-year',
    title: 'Quarterfold named PrintWeek Book Education Company of the Year',
    date: '2025-11-14',
    category: 'Awards',
    heroImage: `${IMG}/hardcover.jpg`,
    excerpt:
      'The PrintWeek India Awards recognised Quarterfold as Book Education Company of the Year — an industry endorsement of the company’s scale, quality and reliability in educational book manufacturing.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has been named Book Education Company of the Year at the PrintWeek India Awards, one of the most closely watched honours in the printing and publishing industry. The award recognises excellence in educational book manufacturing — a category judged on production quality, scale and consistency.' },
      { type: 'paragraph', text: 'Educational publishing is unforgiving work: enormous runs, fixed academic calendars and zero tolerance for defects that reach a classroom. The recognition reflects Quarterfold’s record of delivering that volume on time, to specification, season after season.' },
      { type: 'image', src: `${IMG}/openglow.jpg`, alt: 'An open printed book showing crisp typography and clean binding.', caption: 'The category rewards consistency across long educational runs — colour, register and binding held to spec.' },
      { type: 'paragraph', text: '“An award like this belongs to the floor,” a company representative said. “It is the press operators, binders and quality team who deliver the same standard on the millionth copy as the first.”' },
      { type: 'paragraph', text: 'The honour adds to a series of industry recognitions for Quarterfold and reinforces its standing as a manufacturing partner for educational publishers at national scale.' },
    ],
  },
  {
    slug: 'capexil-highest-book-exporter-award',
    title: 'CAPEXIL honours Quarterfold as a top book exporter',
    date: '2025-09-05',
    category: 'Awards',
    heroImage: `${IMG}/corridor.jpg`,
    excerpt:
      'CAPEXIL recognised Quarterfold among the country’s highest book exporters — an award grounded in hard export performance and the logistics discipline behind it.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has been recognised by CAPEXIL as one of the country’s highest book exporters, an award based on measured export performance rather than reputation alone. It places Quarterfold among the leading names moving printed books into international markets.' },
      { type: 'paragraph', text: 'Export at scale is a logistics problem as much as a manufacturing one. Books must be produced to international specifications, packed to survive long ocean transits, and documented to clear customs across dozens of jurisdictions — all on schedule.' },
      { type: 'image', src: `${IMG}/shelves.jpg`, alt: 'Long library shelves lined with books.', caption: 'The award reflects sustained export volume across an increasingly wide destination map.' },
      { type: 'paragraph', text: 'Quarterfold now exports to publishers and brands in 27 countries, a reach built on the ability to combine domestic manufacturing capacity with dependable outbound logistics.' },
      { type: 'paragraph', text: 'The CAPEXIL recognition complements Quarterfold’s manufacturing awards, underlining that its strength lies in the full path from press to port.' },
    ],
  },
  {
    slug: 'eight-hundred-containers-in-a-year',
    title: 'Quarterfold ships more than 800 containers in a single year',
    date: '2025-06-18',
    category: 'Press',
    heroImage: `${IMG}/bookstack.jpg`,
    excerpt:
      'A year of 800-plus outbound containers is a concrete measure of Quarterfold’s export machine — and of the fulfilment discipline that keeps global publishers supplied.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities moved more than 800 containers of printed books in a single year, a figure that translates the company’s export standing into something tangible. Each container represents thousands of finished books packed, documented and dispatched to a destination abroad.' },
      { type: 'paragraph', text: 'Sustaining that outbound rhythm requires tight coordination between manufacturing and logistics — presses scheduled against sailing dates, finished stock staged for consolidation, and paperwork prepared to clear customs without delay.' },
      { type: 'image', src: `${IMG}/pile.jpg`, alt: 'A large pile of assorted books.', caption: '800-plus containers a year is the export engine behind the company’s 27-country reach.' },
      { type: 'paragraph', text: 'The volume underpins Quarterfold’s recognition as a top book exporter and validates continued investment in fulfilment capacity, including the company’s newest dedicated centre.' },
      { type: 'paragraph', text: 'As demand grows across the Americas, Europe and Asia, the container count is expected to climb further in the coming year.' },
    ],
  },
  {
    slug: 'quarterfold-joins-sedex',
    title: 'Quarterfold becomes a Sedex member',
    date: '2025-03-27',
    category: null,
    heroImage: `${IMG}/library.jpg`,
    excerpt:
      'Membership of Sedex commits Quarterfold to transparent, audited standards for labour, health and safety, environment and business ethics across its operations.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has joined Sedex, one of the world’s largest platforms for responsible-sourcing data. Membership commits the company to sharing audited information about its operations across four pillars: labour standards, health and safety, environmental practice and business ethics.' },
      { type: 'paragraph', text: 'For international publishers and consumer brands, supplier ethics are no longer optional. A Sedex profile lets buyers verify — through independent audit rather than assurance — that the company printing their books meets the standards they publish.' },
      { type: 'image', src: `${IMG}/openbook.jpg`, alt: 'An open book resting in a grand reading room.', caption: 'Sedex membership formalises transparency across labour, safety, environment and ethics.' },
      { type: 'paragraph', text: 'The membership sits alongside Quarterfold’s environmental credentials, including FSC chain-of-custody certification, forming a coherent responsible-manufacturing position for global buyers.' },
    ],
  },
  {
    slug: 'fsc-chain-of-custody-certification',
    title: 'Quarterfold certified to FSC chain-of-custody standards',
    date: '2025-01-16',
    category: null,
    heroImage: `${IMG}/openglow.jpg`,
    excerpt:
      'FSC chain-of-custody certification lets Quarterfold produce books on responsibly sourced paper with a fully traceable supply chain — from certified forest to finished copy.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities holds Forest Stewardship Council (FSC) chain-of-custody certification, allowing the company to manufacture books on responsibly sourced paper and to carry the FSC label on qualifying titles. The certification traces fibre from certified forests through every step of production.' },
      { type: 'paragraph', text: 'Chain-of-custody is a rigorous standard. It requires documented controls at each handoff so that certified material is never mixed with uncertified stock without accounting — a discipline audited by an independent body.' },
      { type: 'image', src: `${IMG}/books.jpg`, alt: 'Printed books on responsibly sourced paper stock.', caption: 'FSC certification lets qualifying titles carry the label buyers increasingly require.' },
      { type: 'paragraph', text: 'For publishers with sustainability commitments, FSC-certified manufacturing is often a procurement requirement. Quarterfold’s certification means those commitments can be met without changing suppliers.' },
      { type: 'paragraph', text: 'The certification is part of a broader environmental programme that includes ISO 14001 environmental management and Sedex-audited responsible sourcing.' },
    ],
  },
  {
    slug: 'twenty-seven-country-export-reach',
    title: 'Quarterfold’s books now reach readers in 27 countries',
    date: '2024-10-09',
    category: 'Press',
    heroImage: `${IMG}/spotlight.jpg`,
    excerpt:
      'Quarterfold’s export map now spans 27 countries — a reach built on combining large-scale domestic manufacturing with dependable international logistics.',
    body: [
      { type: 'paragraph', text: 'Books manufactured by Quarterfold Printabilities now reach readers in 27 countries, a milestone that marks the company’s transformation from a domestic printer into a genuinely international manufacturing partner.' },
      { type: 'paragraph', text: 'The map spans educational publishers, trade houses and consumer brands, each with distinct specifications for paper, binding and packaging. Serving them requires a production floor flexible enough to switch between long runs and short, bespoke orders without losing pace.' },
      { type: 'image', src: `${IMG}/corridor.jpg`, alt: 'A long, softly lit library corridor lined with books.', caption: 'A 27-country footprint rests on flexible capacity — long educational runs and short bespoke orders alike.' },
      { type: 'paragraph', text: 'Reaching that many markets also demands logistics maturity: consolidation, documentation and dependable transit times that let a publisher abroad plan around Quarterfold’s deliveries with confidence.' },
      { type: 'paragraph', text: 'With Spanish-language service and expanded fulfilment capacity now in place, the company expects its destination map to keep widening.' },
    ],
  },
  {
    slug: 'dun-and-bradstreet-recognition',
    title: 'Quarterfold recognised in Dun & Bradstreet’s leading-companies listing',
    date: '2024-06-22',
    category: 'Awards',
    heroImage: `${IMG}/openbook.jpg`,
    excerpt:
      'A Dun & Bradstreet recognition places Quarterfold among the credible, well-governed businesses in its sector — an endorsement of financial standing and operational stability.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities has been recognised by Dun & Bradstreet, the global business-intelligence firm, in its listing of leading companies. The recognition is an independent read on financial standing, governance and operational stability rather than on manufacturing alone.' },
      { type: 'paragraph', text: 'For international buyers weighing a long-term manufacturing relationship, a partner’s financial health matters as much as its press capacity. A Dun & Bradstreet profile gives that assurance a credible, third-party basis.' },
      { type: 'image', src: `${IMG}/hardcover.jpg`, alt: 'A cloth-bound hardcover book on a plain surface.', caption: 'The recognition speaks to stability — the quiet foundation behind long publishing relationships.' },
      { type: 'paragraph', text: 'The recognition complements Quarterfold’s industry awards for manufacturing and export, rounding out a picture of a company judged strong on both craft and governance.' },
    ],
  },
  {
    slug: 'iso-9001-and-14001-certification',
    title: 'Quarterfold certified to ISO 9001 and ISO 14001',
    date: '2024-03-12',
    category: null,
    heroImage: `${IMG}/reading.jpg`,
    excerpt:
      'Dual ISO certification — 9001 for quality management and 14001 for environmental management — puts audited, systematic discipline behind Quarterfold’s production floor.',
    body: [
      { type: 'paragraph', text: 'Quarterfold Printabilities is certified to both ISO 9001 and ISO 14001, the international standards for quality management and environmental management respectively. Together they place independently audited systems behind the company’s day-to-day production.' },
      { type: 'paragraph', text: 'ISO 9001 formalises how quality is planned, measured and improved — the difference between getting a run right and being able to prove, repeatably, that every run is right. For publishers placing large educational orders, that repeatability is the whole point.' },
      { type: 'image', src: `${IMG}/library.jpg`, alt: 'Ordered library shelving filled with books.', caption: 'ISO 9001 makes quality systematic; ISO 14001 does the same for environmental impact.' },
      { type: 'paragraph', text: 'ISO 14001 applies the same systematic rigour to environmental performance, sitting alongside Quarterfold’s FSC certification and Sedex membership in a coherent responsible-manufacturing framework.' },
      { type: 'paragraph', text: 'Certification is maintained through regular external audits, keeping the standards live rather than one-time achievements.' },
    ],
  },
]

// Present an ISO date as DM-Mono-friendly meta, localised to the active language.
// Falls back to English formatting if the locale is unavailable in the runtime.
export function formatPostDate(iso, lang = 'en') {
  const d = new Date(`${iso}T00:00:00`)
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  try {
    return new Intl.DateTimeFormat(lang, opts).format(d)
  } catch {
    return new Intl.DateTimeFormat('en', opts).format(d)
  }
}

export function getPostBySlug(slug) {
  return newsroomPosts.find((p) => p.slug === slug) || null
}

// Related picks: same category first (excluding self), then most-recent fill,
// capped at `limit`. Posts are authored newest-first, so array order = recency.
export function getRelatedPosts(slug, limit = 3) {
  const current = getPostBySlug(slug)
  if (!current) return newsroomPosts.slice(0, limit)
  const others = newsroomPosts.filter((p) => p.slug !== slug)
  const sameCat = current.category
    ? others.filter((p) => p.category === current.category)
    : []
  const rest = others.filter((p) => !sameCat.includes(p))
  return [...sameCat, ...rest].slice(0, limit)
}
