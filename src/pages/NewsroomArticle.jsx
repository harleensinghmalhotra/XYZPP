import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import { PaperGrain } from '@/components/atmosphere'
import { getPostBySlug, getRelatedPosts, formatPostDate } from '@/data/newsroomPosts'
import './NewsroomArticle.css'

// ── /newsroom/:slug — reading-first article view ─────────────────────────────
// Navy throughout. Compact masthead (chip + mono date + line-mask headline),
// full-width 16:9 hero, then a single 68ch reading column of body blocks
// (paragraph | image | video — the block set is data-driven, so the mock's one
// video post proves the video branch). A gold hairline closes the read, followed
// by "Related news" (same category first, else most recent) and a back link.
// No author, per brief. Content is MOCK (src/data/newsroomPosts.js), EN-only;
// chrome is translated via the newsroom namespace.

function Arrow() {
  return (
    <svg className="nra-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackArrow() {
  return (
    <svg className="nra-backarrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H6M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Block({ block }) {
  if (block.type === 'paragraph') {
    return <p className="nra-p" data-reveal>{block.text}</p>
  }
  if (block.type === 'image') {
    return (
      <figure className="nra-figure" data-reveal>
        <img src={block.src} alt={block.alt || ''} loading="lazy" decoding="async" />
        {block.caption && <figcaption className="nra-caption">{block.caption}</figcaption>}
      </figure>
    )
  }
  if (block.type === 'video') {
    return (
      <figure className="nra-figure nra-figure--video" data-reveal>
        <video controls preload="metadata" poster={block.poster} playsInline>
          <source src={block.src} type="video/mp4" />
        </video>
        {block.caption && <figcaption className="nra-caption">{block.caption}</figcaption>}
      </figure>
    )
  }
  return null
}

function RelatedCard({ post }) {
  const { t, i18n } = useTranslation('newsroom')
  return (
    <article className="nra-rel-card" data-reveal>
      <Link className="nra-rel-link" to={`/newsroom/${post.slug}`}>
        <div className="nra-rel-media">
          <img src={post.heroImage} alt="" loading="lazy" decoding="async" />
          {post.category && (
            <span className="nra-chip nra-chip--sm">{t(`categories.${post.category}`, post.category)}</span>
          )}
        </div>
        <div className="nra-rel-body">
          <time className="nra-rel-date" dateTime={post.date}>{formatPostDate(post.date, i18n.language)}</time>
          <h3 className="nra-rel-title">{post.title}</h3>
        </div>
      </Link>
    </article>
  )
}

export default function NewsroomArticle() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation('newsroom')
  const post = getPostBySlug(slug)

  if (!post) {
    return (
      <main id="main">
        <Seo title={t('seo.indexTitle')} description={t('seo.indexDesc')} />
        <section className="nra-missing" data-theme="dark">
          <div className="nra-missing-inner">
            <p className="nra-missing-eyebrow">404</p>
            <h1 className="nra-missing-title">{t('empty')}</h1>
            <Link className="nra-back" to="/newsroom">
              <BackArrow />
              {t('back')}
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const related = getRelatedPosts(slug, 3)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.date,
    image: [post.heroImage],
    articleSection: post.category || undefined,
    publisher: { '@type': 'Organization', name: 'Quarterfold Printabilities' },
  }

  return (
    <main id="main">
      <Seo
        title={`${post.title} — ${t('seo.articleSuffix')}`}
        description={post.excerpt}
        jsonLd={jsonLd}
      />

      <article className="nra">
        {/* Masthead — the one navy band (site law) */}
        <header className="nra-head" data-theme="dark">
          <div className="nra-head-inner">
            <div className="nra-meta">
              {post.category && (
                <span className="nra-chip">{t(`categories.${post.category}`, post.category)}</span>
              )}
              <time className="nra-date" dateTime={post.date}>{formatPostDate(post.date, i18n.language)}</time>
            </div>
            <h1 className="nra-title" data-textreveal>{post.title}</h1>
          </div>
        </header>

        {/* Everything below the band runs on cream (site law) */}
        <div className="nra-light">
        <PaperGrain />

        {/* Hero */}
        <div className="nra-hero" data-reveal>
          <div className="nra-hero-inner">
            <img src={post.heroImage} alt="" decoding="async" />
          </div>
        </div>

        {/* Body — single reading column */}
        <div className="nra-body">
          {post.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        {/* Related */}
        <footer className="nra-foot">
          <div className="nra-foot-inner">
            <hr className="nra-rule" />
            {related.length > 0 && (
              <>
                <h2 className="nra-rel-h2" data-reveal>{t('related')}</h2>
                <div className="nra-rel-grid">
                  {related.map((p) => (
                    <RelatedCard key={p.slug} post={p} />
                  ))}
                </div>
              </>
            )}
            <Link className="nra-back" to="/newsroom">
              <BackArrow />
              {t('back')}
            </Link>
          </div>
        </footer>
        </div>
      </article>
    </main>
  )
}
