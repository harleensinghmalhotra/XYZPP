import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import PageHero from '@/components/PageHero'
import { PaperGrain } from '@/components/atmosphere'
import { client, urlFor, formatDate, revealDynamic, groqLang } from '@/lib/sanity'
import './Newsroom.css'

// ── /newsroom — editorial card index (live Sanity) ───────────────────────────
// Flat-navy PageHero band (site law) → a two-column card grid. Card anatomy and
// classes are unchanged from the earlier build — only the data source moved to
// Sanity. Reveals ride the shared [data-reveal] runtime; because posts arrive
// async, revealDynamic() re-observes them (see src/lib/sanity.js).
//
// The GROQ below IS the whole hide/unhide + scheduling logic: `published == true`
// is the instant toggle, `publishedAt <= now()` reveals future-dated posts the
// moment their time arrives — no cron. Chrome stays translated (newsroom ns);
// post copy is field-level localized in the studio: title + excerpt read the
// active locale with a per-field English fallback (coalesce), so a post with no
// FR/ES yet still shows its English headline rather than a blank.
const INDEX_QUERY = `*[_type == "post" && published == true && publishedAt <= now()]
  | order(publishedAt desc){
    "title": coalesce(title[$lang], title.en),
    "slug": slug.current, publishedAt, category,
    "excerpt": coalesce(excerpt[$lang], excerpt.en),
    coverImage
  }`

function Arrow() {
  return (
    <svg className="nr-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NewsCard({ post }) {
  const { t, i18n } = useTranslation('newsroom')
  const cover = post.coverImage ? urlFor(post.coverImage).width(800).auto('format').url() : null
  return (
    <article className="nr-card" data-reveal>
      <Link className="nr-card-link" to={`/newsroom/${post.slug}`}>
        <div className="nr-card-media nr-cover-inset">
          {cover && <img src={cover} alt="" loading="lazy" decoding="async" />}
          {post.category && (
            <span className="nr-chip">{t(`categories.${post.category}`, post.category)}</span>
          )}
        </div>
        <div className="nr-card-body">
          <time className="nr-date" dateTime={post.publishedAt}>{formatDate(post.publishedAt, i18n.language)}</time>
          <h3 className="nr-card-title">{post.title}</h3>
          {post.excerpt && <p className="nr-card-excerpt">{post.excerpt}</p>}
          <span className="nr-card-more">
            {t('readArticle')}
            <Arrow />
          </span>
        </div>
      </Link>
    </article>
  )
}

// Same card silhouette, placeholder bars pulsing softly (no shimmer; static under
// reduced motion via CSS). Not [data-reveal] — skeletons show instantly.
function SkeletonCard() {
  return (
    <article className="nr-card nr-skeleton" aria-hidden="true">
      <div className="nr-card-link">
        <div className="nr-card-media" />
        <div className="nr-card-body">
          <div className="nr-sk-line nr-sk-date" />
          <div className="nr-sk-line nr-sk-title" />
          <div className="nr-sk-line nr-sk-title nr-sk-short" />
          <div className="nr-sk-line nr-sk-text" />
          <div className="nr-sk-line nr-sk-text nr-sk-short" />
        </div>
      </div>
    </article>
  )
}

export default function Newsroom() {
  const { t, i18n } = useTranslation('newsroom')
  const lang = groqLang(i18n.language)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [posts, setPosts] = useState([])

  // Re-fetch when the language changes so titles/excerpts swap to the active
  // locale (dates already reformat client-side via formatDate).
  const load = useCallback(() => {
    setStatus('loading')
    client
      .fetch(INDEX_QUERY, { lang })
      .then((data) => {
        setPosts(data || [])
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [lang])

  useEffect(() => { load() }, [load])

  // Reveal the async cards the one-time alive.js init missed.
  useEffect(() => {
    if (status !== 'ready') return
    return revealDynamic(document.querySelector('.nr-index'))
  }, [status, posts])

  return (
    <main id="main">
      <Seo title={t('seo.indexTitle')} description={t('seo.indexDesc')} />

      <PageHero
        id="newsroom-h1"
        eyebrow={t('eyebrow')}
        line1={t('title')}
        subline={t('sub')}
        minVh={52}
      />

      <section className="nr-index" data-theme="light" aria-label={t('title')}>
        <PaperGrain />
        <div className="nr-index-inner">
          {status === 'loading' && (
            <div className="nr-grid" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {status === 'error' && (
            <div className="nr-state" role="alert">
              <p className="nr-state-msg">{t('error.message', 'Couldn’t load the newsroom just now.')}</p>
              <button type="button" className="nr-retry" onClick={load}>
                {t('error.retry', 'Try again')}
              </button>
            </div>
          )}

          {status === 'ready' && posts.length === 0 && (
            <p className="nr-empty">{t('empty')}</p>
          )}

          {status === 'ready' && posts.length > 0 && (
            <div className="nr-grid">
              {posts.map((post) => <NewsCard key={post.slug} post={post} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
