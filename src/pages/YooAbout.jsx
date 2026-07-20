import { useState, useEffect, useRef } from 'react'
import Seo from '@/components/Seo'
import SectionCurve from '@/components/SectionCurve'
import { PaperGrain } from '@/components/atmosphere'
import './OurStory.css'

export default function YooAbout() {
  const stops = [
    {
      year: "2007",
      title: "Design is a journey shaped through research and spatial understanding",
      desc: "With nearly two decades of professional experience, our journey began in the luxury retail sector and expanded over time into hospitality and office interiors. Focusing exclusively on commercial interiors, we operate within the realm of luxury and high-end spaces, where strong concepts are supported by technical precision and careful execution."
    },
    {
      year: "Today",
      title: "A long-term process shaped by experience",
      desc: "Today, we continue our work from our headquarters in Akat, Istanbul, within an office designed by our own team. For us, design is not a singular moment, but a long-term process shaped by experience, teamwork, and attention to detail resulting in interior environments defined by clarity, intent, and coherence."
    }
  ]

  return (
    <main id="main">
      <Seo title="ABOUT | YOO INTERIOR" description="A great team finds a way to win" />

      <section data-theme="dark" className="ab-hero" aria-label="ABOUT">
        <div className="ab-hero-inner">
          <p className="ab-eyebrow" data-reveal>ABOUT</p>
          <p className="ab-hero-display" data-textreveal>ABOUT</p>
        </div>

        <div className="ab-scroll" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      <section data-theme="light" className="ab-statement" aria-labelledby="about-h1">
        <PaperGrain />
        <div className="ab-wrap ab-statement-grid">
          <h1 id="about-h1" className="ab-statement-h1" data-reveal>
            A great team finds a way to <em>win</em>
          </h1>
          <div className="ab-statement-side">
            <hr className="ab-statement-rule" data-reveal aria-hidden="true" />
            <p className="ab-statement-lede" data-reveal>At YOO Interior, founded in 2007, we are a team of architects and interior architects brought together by a shared way of thinking and a strong culture of collaboration. Established by Co-Founders and Managing Partners Alparslan Ozarpat, Orcun Ozkan, and Alptekin Yildiz, the studio is built on collective expertise rather than individual expression, allowing design and construction to move forward as one coordinated process.</p>
          </div>
        </div>
      </section>

      <Timeline stops={stops} />

      <section data-theme="dark" className="ab-mvv" aria-label="Culture">
        <SectionCurve position="top" fill="var(--cream)" inward />
        <div className="ab-mvv-inner">
            <div className="ab-beat" data-reveal>
              <p className="ab-beat-label">CULTURE</p>
              <p className="ab-beat-text">As our experience in architectural design and interior contracting has grown, so has our team and its capabilities. We have constantly strived for better, since &quot;a great team always finds a way to win.&quot;</p>
            </div>
        </div>
        <SectionCurve position="bottom" fill="var(--cream)" inward />
      </section>

      <section data-theme="light" className="ab-founder" aria-label="ALPARSLAN OZARPAT">
        <PaperGrain />
        <div className="ab-wrap">
          <div className="ab-founder-grid">
            <div data-reveal>
              <div className="ab-portrait" data-slot="founder-portrait">
                <span className="ab-slot">Image</span>
              </div>
              <h2 className="ab-name">ALPARSLAN OZARPAT</h2>
              <hr className="ab-founder-hair" aria-hidden="true" />
              <p className="ab-microlabel"><b>Role</b><i aria-hidden="true" />Co-founder & Managing Partner</p>
            </div>

            <div data-reveal>
              <p className="ab-founder-eyebrow">A multidisciplinary team driven by design, detail and purpose.</p>
              <p className="ab-founder-bio">EDUCATION</p>
              <blockquote className="ab-quote">Middle East Technical University</blockquote>
              <p className="ab-attr">— YOO Interior</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function Timeline({ stops }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const section = sectionRef.current
      if (!section || !section.contains(document.activeElement)) return
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return
      e.preventDefault()
      if (e.key === 'ArrowLeft') setActiveIdx((p) => Math.max(0, p - 1))
      else setActiveIdx((p) => Math.min(stops.length - 1, p + 1))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stops.length])

  const stop = stops[activeIdx]
  const atStart = activeIdx === 0
  const atEnd = activeIdx === stops.length - 1

  const Content = () => (
    <div className="ab-tl-content" key={activeIdx}>
      <p className="ab-tl-yearbig">{stop.year}</p>
      <h3 className="ab-tl-title">{stop.title}</h3>
      <p className="ab-tl-desc">{stop.desc}</p>
      <div className="ab-arrows">
        <button type="button" className="ab-arrow" onClick={() => setActiveIdx((p) => Math.max(0, p - 1))}
          disabled={atStart} aria-label="Previous">←</button>
        <button type="button" className="ab-arrow" onClick={() => setActiveIdx((p) => Math.min(stops.length - 1, p + 1))}
          disabled={atEnd} aria-label="Next">→</button>
      </div>
    </div>
  )

  return (
    <section data-theme="light" className="ab-journey" ref={sectionRef}>
      <PaperGrain />
      <div className="ab-wrap">
        <div data-reveal>
          <p className="ab-eyebrow--cream">JOURNEY</p>
          <hr className="ab-rule" aria-hidden="true" />
        </div>

        <div className="ab-tl">
          <div className="ab-tl-rail">
            <div className="ab-tl-spine" aria-hidden="true" />
            <div className="ab-tl-years">
              {stops.map((s, idx) => (
                <button key={idx} type="button" className="ab-tl-year focus-ring"
                  onClick={() => setActiveIdx(idx)} aria-current={idx === activeIdx ? 'true' : undefined}>
                  {s.year}
                </button>
              ))}
            </div>
          </div>

          <div className="ab-tl-media" data-slot={`timeline-${activeIdx}`}>
            <span className="ab-slot">Image</span>
          </div>

          <Content />
        </div>

        <div className="ab-tl-m">
          <div className="ab-tl-strip">
            {stops.map((s, idx) => (
              <button key={idx} type="button" className="ab-tl-chip focus-ring"
                onClick={() => setActiveIdx(idx)} aria-current={idx === activeIdx ? 'true' : undefined}>
                {s.year}
              </button>
            ))}
          </div>
          <div className="ab-tl-media" data-slot={`timeline-m-${activeIdx}`}>
            <span className="ab-slot">Image</span>
          </div>
          <Content />
        </div>
      </div>
    </section>
  )
}
