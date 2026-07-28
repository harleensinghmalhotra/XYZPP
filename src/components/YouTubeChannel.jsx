import { useEffect, useRef, useState } from 'react'
import { YOUTUBE_VIDEOS } from '@/data/youtube'
import './YouTubeChannel.css'

// ── YouTubeChannel — a live grid of the company's YouTube videos ───────────────
// Reads the plain URL list in src/data/youtube.js (a non-technical editor pastes a
// link and a card appears). Everything is derived from the video ID with no API key:
// the thumbnail comes from YouTube's predictable image URL, and clicking a card opens
// a lightbox that embeds and plays the video.
//
// LAYOUT: a capped-height panel holding a 2×2 card grid. With four or more videos the
// panel is fixed-height and scrolls internally (a visible styled scrollbar on the
// right), so the PAGE never grows as videos are added. With fewer than four the panel
// shrinks to its content, so today's two videos fill one full row with no empty second
// row and no dead space — deliberate, not half-empty.
//
// A "Watch on YouTube" link sits under the player so a visitor always has a path even
// if a particular video's owner has disabled embedding on other websites.

// Pull the 11-char video ID out of any common YouTube URL shape.
function youTubeId(url) {
  try {
    const u = new URL(url.trim())
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const m = u.pathname.match(/\/(embed|shorts|v|live)\/([^/?#]+)/)
    if (m) return m[2]
  } catch { /* not a URL — skip */ }
  return null
}

export default function YouTubeChannel({
  sub,
  dialogAria = 'Video player',
  closeLabel = 'Close video',
  playLabel = 'Play video {n}',
  watchOnYouTube = 'Watch on YouTube',
}) {
  // Build the card list once from the URL file, dropping anything unparseable.
  const videos = YOUTUBE_VIDEOS.map((url) => ({ url, id: youTubeId(url) })).filter((v) => v.id)

  const [active, setActive] = useState(null)  // the playing video ({ id, url }) or null
  const closeRef = useRef(null)
  const lastFocused = useRef(null)

  // Lightbox: lock body scroll, Esc to close, focus the close button, restore focus.
  useEffect(() => {
    if (!active) return
    lastFocused.current = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setActive(null) } }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      cancelAnimationFrame(raf)
      lastFocused.current?.focus?.()
    }
  }, [active])

  if (!videos.length) return null

  return (
    <div className="yt-channel">
      {sub && <p className="yt-sub">{sub}</p>}

      <div className="yt-panel">
        <ul className="yt-grid" role="list">
          {videos.map((v, i) => (
            <li className="yt-cell" key={v.id}>
              <button type="button" className="yt-card" onClick={() => setActive(v)} aria-label={playLabel.replace('{n}', String(i + 1))}>
                <span className="yt-thumb">
                  <img
                    className="yt-thumb-img"
                    src={`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget
                      if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` }
                    }}
                  />
                  <span className="yt-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" /></svg>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <div
          className="yt-lb"
          role="dialog"
          aria-modal="true"
          aria-label={dialogAria}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActive(null) }}
        >
          <div className="yt-lb-panel">
            <button ref={closeRef} type="button" className="yt-lb-close" onClick={() => setActive(null)} aria-label={closeLabel}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className="yt-lb-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0`}
                title={dialogAria}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <a className="yt-lb-watch" href={active.url} target="_blank" rel="noreferrer">
              {watchOnYouTube}
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
