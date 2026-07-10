// Reference "Printing Services" section (alternativinc.com) — the section that
// follows the hero. Built to the measured Webflow spec: light bg #fffffc,
// Metrisch heading 74px/midnight-blue, 430px copy column, and a row of product
// cards (#f3fafd, radius 48) with the product image overhanging the card top.
const BG = '/alternativ/63593f0be598de94c00afe92_graph_bg-services.svg'
const PLUS = '/alternativ/63593cb9249b2164e302ac93_icon_plus.svg'

const CARDS = [
  { key: 'book', label: 'Book Printing', img: '/alternativ/63daf2a9248b190f81e7be4b_books.webp', imgMax: '92%', rot: 18, mt: -48 },
  { key: 'bag', label: 'Bag Printing', img: '/alternativ/63daf162e1a5e37aa6556099_bags.webp', imgMax: '90%', rot: -6, mt: -70 },
  { key: 'pack', label: 'Packaging Printing', img: '/alternativ/63daf41e0f3c532bffa0b9bd_pack.webp', imgMax: '95%', rot: 8, mt: -66 },
  { key: 'toys', label: 'Toys', img: '/alternativ/63e4e8e7581847c04ea1d6a9_63daf5e61319e337a76c4c08_toys.webp', imgMax: '95%', rot: -10, mt: -40 },
]

export default function PrintingServices() {
  return (
    <section id="services" data-theme="light" className="relative overflow-hidden bg-[#fffffc] font-metrisch">
      {/* Flat top: the navy→white landing curve now lives at the top of the
          TrustStrips landing zone (the book lands there, not here). */}
      <div className="relative z-[2] px-6 pt-[150px] pb-[120px]">
        {/* header: heading left, copy right */}
        <div
          className="mx-auto flex max-w-page flex-col items-start justify-between gap-10 bg-no-repeat md:flex-row md:items-end"
          style={{ backgroundImage: `url(${BG})`, backgroundPosition: '0% 0%', backgroundSize: '300px' }}
        >
          <h2 className="text-[52px] font-bold uppercase leading-[0.9] tracking-[-1px] text-[#0c2f4a] md:text-[74px]">
            Printing<br />Services
          </h2>
          <div className="max-w-[430px] text-[21px] leading-[1.15] text-[#0c2f4a]">
            A turnkey service, <strong className="font-bold">from printing to delivery</strong>. Quality, security and peace of mind guaranteed.
            <br /><br />
            <a href="#approach" className="text-[18px] text-[#111] underline underline-offset-2 hover:opacity-70">Learn more about our process</a>
          </div>
        </div>

        {/* product cards */}
        <div className="mx-auto mt-[110px] flex max-w-page flex-wrap justify-center gap-[30px] md:flex-nowrap md:justify-start md:pl-[8vw]">
          {CARDS.map((c) => (
            <a
              key={c.key}
              href="#portfolio"
              className="flex w-[300px] flex-col items-stretch rounded-none bg-[#f3fafd] pb-[45px] transition-opacity hover:opacity-[0.72] md:w-[24vw] md:max-w-[360px]"
            >
              <div className="relative mb-[18px] flex h-[250px] items-end justify-center overflow-visible">
                <img
                  src={c.img}
                  alt={c.label}
                  className="relative z-[5] object-contain"
                  style={{ maxWidth: c.imgMax, marginTop: c.mt, transform: `rotate(${c.rot}deg)` }}
                  draggable="false"
                />
              </div>
              <div className="flex items-center justify-between px-[45px]">
                <h3 className="text-[30px] leading-[1.1] text-[#0c2f4a]">{c.label}</h3>
                <img src={PLUS} alt="" aria-hidden="true" width={20} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
