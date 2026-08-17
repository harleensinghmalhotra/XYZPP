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
    "slug": slug.current, publishedAt, _updatedAt, category,
    "excerpt": coalesce(excerpt[$lang], excerpt.en),
    coverImage,
    "body": coalesce(body[$lang], body.en)[]{ ..., _type == "videoFile" => { "url": asset->url } }
  },
  "candidates": *[_type == "post" && published == true && publishedAt <= now() && slug.current != $slug]
    | order(publishedAt desc){ "title": coalesce(title[$lang], title.en), "slug": slug.current, publishedAt, category, coverImage }
}`

// Meta descriptions cap at 155 chars for clean SERP display. An article's excerpt can
// run longer (233 chars on some posts); trim at a word boundary + ellipsis for the
// <meta> only — the NewsArticle JSON-LD keeps the full excerpt.
const metaDescription = (s) =>
  s && s.length > 155 ? s.slice(0, 154).replace(/\s+\S*$/, '').trimEnd() + '…' : s

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
        <div className="nra-rel-media nr-cover-inset">
          {cover && <img src={cover} alt={post.title} loading="lazy" decoding="async" />}
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
  const { t: tn } = useTranslation('nav')
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
        <Seo title={t('seo.indexTitle')} description={t('seo.indexDesc')} noindex />
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
  const articleUrl = `https://quarterfoldltd.com/newsroom/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt || post.publishedAt,
    image: coverUrl ? [coverUrl] : undefined,
    articleSection: post.category || undefined,
    mainEntityOfPage: articleUrl,
    author: { '@type': 'Organization', name: 'Quarterfold Printabilities' },
    publisher: {
      '@type': 'Organization',
      name: 'Quarterfold Printabilities',
      // 747x175: the real, on-disk dimensions of public/qfp/brand/qfp-logo.png --
      // not Google's preferred 60x600 lockup, but the actual asset's real size,
      // which is what "no invented facts" means here: declare it accurately
      // rather than either omit it or claim a size the file isn't.
      logo: { '@type': 'ImageObject', url: 'https://quarterfoldltd.com/qfp/brand/qfp-logo.png', width: 747, height: 175 },
    },
  }
  // Home -> Newsroom -> this article. Reuses the exact same "Home"/"Newsroom"
  // strings Newsroom.jsx's own breadcrumb already renders (seo.breadcrumb.home /
  // .newsroom, same `newsroom` namespace) rather than new copy.
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('seo.breadcrumb.home'), item: 'https://quarterfoldltd.com/' },
      { '@type': 'ListItem', position: 2, name: t('seo.breadcrumb.newsroom'), item: 'https://quarterfoldltd.com/newsroom' },
      { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
    ],
  }

  return (
    <main id="main">
      <Seo
        title={`${post.title}, ${t('seo.articleSuffix')}`}
        description={metaDescription(post.excerpt)}
        image={coverUrl || undefined}
        type="article"
        jsonLd={[jsonLd, breadcrumbJsonLd]}
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
                <img src={coverUrl} alt={post.title} decoding="async" />
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
              {/* Newsroom -> money-page linking (SEO Lane 7): before this, an
                  article's only outbound links were to other articles and back
                  to /newsroom -- reachable elsewhere only via the site-wide
                  nav/footer, never from inside the article itself. Two links,
                  not content-curated per article (no editorial judgment to
                  invent), reusing the exact nav-namespace labels every other
                  real link on the site already uses -- not new copy. Same
                  .nra-back treatment as "Back to Newsroom" above, just
                  forward-pointing (Arrow, not BackArrow) since these go
                  further into the site, not back out of it. */}
              <div className="nra-explore">
                <Link className="nra-back" to="/about">
                  {tn('about')}
                  <Arrow />
                </Link>
                <Link className="nra-back" to="/infrastructure">
                  {tn('infrastructure')}
                  <Arrow />
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </main>
  )
}
