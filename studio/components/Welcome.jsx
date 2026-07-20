import {useRouter} from 'sanity/router'

// The studio's landing (a custom tool, first in the tool list). Navy panel, gold
// DM-Mono eyebrow, Inter Tight heading, one instruction line, and two shortcuts
// in the site's button language: New Post (gold fill) + All Posts (gold outline).
const NAVY = '#0e1b46'
const CREAM = '#fdfaf4'
const GOLD = '#b06f14'
const GOLD2 = '#d78d26'

function DocsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function Welcome() {
  const router = useRouter()
  const goAllPosts = () => router.navigateUrl({path: '/structure/all-posts'})
  const goNewPost = () => router.navigateIntent('create', {type: 'post'})

  return (
    <div
      style={{
        minHeight: '100%',
        background: NAVY,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        .qfp-btn{display:inline-flex;align-items:center;gap:9px;cursor:pointer;
          font-family:'DM Mono',monospace;font-size:12px;letter-spacing:0.14em;
          text-transform:uppercase;border-radius:999px;padding:14px 26px;
          border:1px solid transparent;transition:background .25s ease,border-color .25s ease,color .25s ease,transform .25s ease;}
        .qfp-btn:focus-visible{outline:2px solid ${GOLD2};outline-offset:3px;}
        .qfp-btn--primary{background:${GOLD};color:${CREAM};border-color:${GOLD};}
        .qfp-btn--primary:hover{background:${GOLD2};border-color:${GOLD2};transform:translateY(-1px);}
        .qfp-btn--ghost{background:transparent;color:${CREAM};border-color:rgba(215,141,38,0.55);}
        .qfp-btn--ghost:hover{border-color:${GOLD2};background:rgba(215,141,38,0.10);transform:translateY(-1px);}
        @media (prefers-reduced-motion: reduce){.qfp-btn{transition:none;}.qfp-btn:hover{transform:none;}}
      `}</style>

      <div style={{maxWidth: 620, textAlign: 'center'}}>
        <p
          style={{
            margin: '0 0 22px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: GOLD2,
          }}
        >
          Quarterfold Printabilities
        </p>
        <h1
          style={{
            margin: '0 0 18px',
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(34px, 5vw, 46px)',
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            color: CREAM,
          }}
        >
          Newsroom Studio
        </h1>
        <p
          style={{
            margin: '0 auto 38px',
            maxWidth: 440,
            fontSize: 16,
            lineHeight: 1.6,
            color: 'rgba(253,250,244,0.72)',
          }}
        >
          Write, publish and schedule posts for the Newsroom.
        </p>
        <div style={{display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap'}}>
          <button type="button" className="qfp-btn qfp-btn--primary" onClick={goNewPost}>
            <PlusIcon />
            New Post
          </button>
          <button type="button" className="qfp-btn qfp-btn--ghost" onClick={goAllPosts}>
            <DocsIcon />
            All Posts
          </button>
        </div>
      </div>
    </div>
  )
}
