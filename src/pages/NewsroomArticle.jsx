import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PortableText } from '@portabletext/react'
import Seo from '@/components/Seo'
import { PaperGrain } from '@/components/atmosphere'
import { client, urlFor, formatDate, revealDynamic, groqLang } from '@/lib/sanity'
import './NewsroomArticle.css'

// ── /newsroom/:slug — reading-first article (live Sanity) ────────────────────
// Navy masthead → 16:9 hero → single reading column of Portable Text → gold
// hairline → related → back link. Structure/classes unchanged from the earlier build; the
// body now renders via @portabletext/react. The slug fetch carries the same
// published + publishedAt<=now() guard as the index, so a direct URL to a hidden
// or future post resolves to null → the existing 404 view.
//
// Field-level i18n: title / excerpt / body read the active locale with a
// per-field English fallback (coalesce). The body projection runs on the chosen
// locale array, so videoFile blocks still deref their asset url in any language.
const ARTICLE_QUERY = `{
  "post": *[_type == "post" && slug.current == $slug && published == true && publishedAt <= now()][0]{
    "title": coalesce(title[$lang], title.en),
    "slug": slug.current, publishedAt, category,
    "excerpt": coalesce(excerpt[$lang], excerpt.en),
    coverImage,
    "body": coalesce(body[$lang], body.en)[]{ ..., _type == "videoFile" => { "url": asset->url } }
  },
  "candidates": *[_type == "post" && published == true && publishedAt <= now() && slug.current != $slug]
    | order(publishedAt desc){ "title": coalesce(title[$lang], title.en), "slug": slug.current, publishedAt, category, coverImage }
}`

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

// Portable Text → the article's existing typography. Blocks reuse .nra-p; inline
// images become .nra-figure via image-url (full column width, DM-Mono caption);
// videoFile blocks become a native <video controls> with the site's media radius.
const ptComponents = {
  block: {
    normal: ({ children }) => <p className="nra-p" data-reveal>{children}</p>,
    h2: ({ children }) => <h2 className="nra-h2" data-reveal>{children}</h2>,
    h3: ({ children }) => <h3 className="nra-h3" data-reveal>{children}</h3>,
    blockquote: ({ children }) => <blockquote className="nra-quote" data-reveal>{children}</blockquote>,
  },
  types: {
    image: ({ value }) => (
      <figure className="nra-figure" data-reveal>
        <img
          src={urlFor(value).width(1600).auto('format').url()}
          alt={value.alt || ''}
          loading="lazy"
          decoding="async"
        />
        {value.caption && <figcaption className="nra-caption">{value.caption}</figcaption>}
      </figure>
    ),
    videoFile: ({ value }) => (
      <figure className="nra-figure nra-figure--video" data-reveal>
        {value.url && (
          <video controls preload="metadata" playsInline>
            <source src={value.url} />
          </video>
        )}
        {value.caption && <figcaption className="nra-caption">{value.caption}</figcaption>}
      </figure>
    ),
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => (
      <a className="nra-link" href={value?.href} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
  },
}

function RelatedCard({ post }) {
  const { t, i18n } = useTranslation('newsroom')
  const cover = post.coverImage ? urlFor(post.coverImage).width(800).auto('format').url() : null
  return (
    <article className="nra-rel-card" data-reveal>
      <Link className="nra-rel-link" to={`/newsroom/${post.slug}`}>
        <div className="nra-rel-media">
          {cover && <img src={cover} alt="" loading="lazy" decoding="async" />}
          {post.category && (
            <span className="nra-chip nra-chip--sm">{t(`categories.${post.category}`, post.category)}</span>
          )}
        </div>
        <div className="nra-rel-body">
          <time className="nra-rel-date" dateTime={post.publishedAt}>{formatDate(post.publishedAt, i18n.language)}</time>
          <h3 className="nra-rel-title">{post.title}</h3>
        </div>
      </Link>
    </article>
  )
}

// Same-category first, then most-recent fill, capped at 3 (mirrors the earlier
// getRelatedPosts; candidates already arrive newest-first from GROQ).
function relatedFor(current, candidates) {
  const sameCat = current.category ? candidates.filter((c) => c.category === current.category) : []
  const rest = candidates.filter((c) => !sameCat.includes(c))
  return [...sameCat, ...rest].slice(0, 3)
}

export default function NewsroomArticle() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation('newsroom')
  const lang = groqLang(i18n.language)
  const [status, setStatus] = useState('loading') // loading | ready | error | missing
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])

  // Re-fetch on slug OR language change so the article + related row swap locale.
  const load = useCallback(() => {
    setStatus('loading')
    client
      .fetch(ARTICLE_QUERY, { slug, lang })
      .then((data) => {
        if (!data || !data.post) {
          setStatus('missing')
          return
        }
        setPost(data.post)
        setRelated(relatedFor(data.post, data.candidates || []))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [slug, lang])

  useEffect(() => { load() }, [load])

  // Reveal the async body blocks + related cards the one-time alive.js init missed.
  useEffect(() => {
    if (status !== 'ready') return
    return revealDynamic(document.querySelector('.nra'))
  }, [status, post])

  if (status === 'loading') {
    return (
      <main id="main">
        <section className="nra-state" data-theme="dark" aria-busy="true">
          <div className="nra-state-inner">
            <p className="nra-state-eyebrow nra-pulse">{t('loading', 'Loading')}</p>
          </div>
        </section>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main id="main">
        <section className="nra-state" data-theme="dark" role="alert">
          <div className="nra-state-inner">
            <p className="nra-state-msg">{t('error.message', 'Couldn’t load this article just now.')}</p>
            <button type="button" className="nra-retry" onClick={load}>{t('error.retry', 'Try again')}</button>
            <Link className="nra-back" to="/newsroom"><BackArrow />{t('back')}</Link>
          </div>
        </section>
      </main>
    )
  }

  // Hidden / future / unknown slug → the existing 404 view (site law: navy panel).
  if (status === 'missing' || !post) {
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

  const coverUrl = post.coverImage ? urlFor(post.coverImage).width(2000).auto('format').url() : null
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    datePublished: post.publishedAt,
    image: coverUrl ? [coverUrl] : undefined,
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
              <time className="nra-date" dateTime={post.publishedAt}>{formatDate(post.publishedAt, i18n.language)}</time>
            </div>
            <h1 className="nra-title" data-textreveal>{post.title}</h1>
          </div>
        </header>

        {/* Everything below the band runs on cream (site law) */}
        <div className="nra-light">
          <PaperGrain />

          {coverUrl && (
            <div className="nra-hero" data-reveal>
              <div className="nra-hero-inner">
                <img src={coverUrl} alt="" decoding="async" />
              </div>
            </div>
          )}

          {/* Body — single reading column, Portable Text */}
          <div className="nra-body">
            <PortableText value={post.body || []} components={ptComponents} />
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
