import { useState } from 'react'
import './Cases.css'

// Case photos: Pexels (free commercial use, no attribution required). Provenance:
//   case-01 (Tanzania)  — https://www.pexels.com/photo/5212345/  (classroom)
//   case-02 (Nigeria)   — https://www.pexels.com/photo/8926553/  (school child)
//   case-03 (USAID Ghana) — https://www.pexels.com/photo/1720186/ (children reading)
// Downloaded, cropped 16:10, compressed → public/qfp/cases/case-0N.webp, then given
// our navy duotone + bottom scrim so they sit in the brand.

const CASES = [
  {
    id: '01',
    heading: 'TANZANIA DELIVERY',
    tags: ['Tanzania', '10M+ Books'],
    title: 'A National Curriculum Deadline, Met Early',
    desc: 'Tanzania Institute of Education needed volume fast. We delivered 4M books within 60 days against a hard national deadline.',
    img: 'case-01.webp',
  },
  {
    id: '02',
    heading: 'NIGERIA DELIVERY',
    tags: ['Nigeria', '8M+ Books'],
    title: 'Scaling for a Universal Education Mandate',
    desc: "Books for the Universal Basic Education Commission, produced and shipped at a scale most printers can't sustain.",
    img: 'case-02.webp',
  },
  {
    id: '03',
    heading: 'USAID GHANA DELIVERY',
    tags: ['Ghana', '2M+ Books'],
    title: 'Delivering Against a Funded Programme Timeline',
    desc: 'Books delivered under a USAID funded programme, coordinated end to end from print to last mile delivery.',
    img: 'case-03.webp',
  },
]

export default function Cases() {
  const [active, setActive] = useState('01')

  return (
    <section id="cases" className="section-cases" data-theme="dark">
      <div className="cases-header" data-theme="light">
        <div className="cases-header-inner">
          <div className="cases-eyebrow">Proof, Not Promises</div>
          <h3>Case Studies.</h3>
          <p>A few projects that show how we actually work, not just what we say.</p>
        </div>
      </div>

      <div className="cases-list">
        {CASES.map((c) => (
          <div
            key={c.id}
            className={`case-item ${active === c.id ? 'active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            <div className="case-content">
              <div className="case-content-canvas">
                <div className="inner">
                  <div className="case-heading">Photo · {c.heading}</div>
                  <h4 className="case-title">{c.title}</h4>
                  <div className="tags">
                    {c.tags.map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                  <div className="case-result">
                    <p>{c.desc}</p>
                  </div>
                  <a href="#" className="case-link desktop">Read the full case study &rarr;</a>
                </div>
              </div>
            </div>

            <div className="case-media">
              <div className="case-media-photo">
                <img src={`/qfp/cases/${c.img}`} alt="" loading="lazy" decoding="async" />
                <div className="case-duotone" aria-hidden="true" />
                <div className="case-scrim" aria-hidden="true" />
              </div>

              <div className="vertical-heading">{c.heading}</div>
              <div className="num">{c.id}</div>
              <a href="#" className="case-link mobile">Read the full case study &rarr;</a>
            </div>
          </div>
        ))}
      </div>

      <div className="cases-footer">
        <button className="view-all-cases">View All Case Studies</button>
      </div>
    </section>
  )
}
