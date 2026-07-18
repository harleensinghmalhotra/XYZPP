import './PageHero.css'

// ── PageHero — shared two-line centered hero band for inner pages ─────────────
// The About v4 hero pattern, tamer, reusable. Both lines are ONE H1 string split
// at its natural break; line 2 rises in gold. For a page whose "line 2" is a role
// rather than part of the title (Founder), pass line2Role so it renders as a
// styled sub-line OUTSIDE the h1 — keeping the H1 semantically the name alone.
//
// Titles are split IN CODE (no locale edits) at the first sentence-ending
// punctuation followed by whitespace; splitTitle returns [line1, line2|null] so a
// title with no natural break degrades to a single white line + eyebrow.

export function splitTitle(title) {
  if (typeof title !== 'string') return [title, null]
  // Drop any inline accent markup (<strong>/<em>) — line 2 is fully gold, so the
  // accent is redundant; words are untouched. Split at the first sentence-ending
  // punctuation (.,;:) followed by whitespace; no break → single white line.
  const plain = title.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  const m = plain.match(/^(.*?[.,;:])\s+(.+)$/s)
  return m ? [m[1].trim(), m[2].trim()] : [plain, null]
}

export default function PageHero({
  id = 'page-h1',
  eyebrow,
  line1,
  line2 = null,
  line2Role = false,
  subline = null,
  minVh = 60,
  children = null,
}) {
  return (
    <section data-theme="dark" className="ph-hero" style={{ minHeight: `${minVh}vh` }} aria-labelledby={id}>
      <div className="ph-hero-inner">
        {eyebrow && <p className="ph-eyebrow" data-reveal>{eyebrow}</p>}

        <h1 id={id} className="ph-title">
          <span className="ph-l1" data-textreveal>{line1}</span>
          {line2 && !line2Role && <>{' '}<span className="ph-l2" data-textreveal>{line2}</span></>}
        </h1>

        {line2 && line2Role && <p className="ph-role" data-textreveal>{line2}</p>}
        {subline && <p className="ph-sub" data-reveal>{subline}</p>}
        {children && <div className="ph-below" data-reveal>{children}</div>}
      </div>
    </section>
  )
}
