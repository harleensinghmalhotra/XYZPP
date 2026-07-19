import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Seo from '@/components/Seo'
import PageHero from '@/components/PageHero'
import { PaperGrain } from '@/components/atmosphere'
import { newsroomPosts, formatPostDate } from '@/data/newsroomPosts'
import './Newsroom.css'

// ── /newsroom — editorial card index ─────────────────────────────────────────
// Flat-navy PageHero band (site law) → a two-column card grid of the 12 mock
// posts. Card anatomy mirrors ofskinandsouls.com/blog, reskinned to QFP System B:
// 16:10 cover, optional DM-Mono category chip, mono date, Inter Tight gold
// headline, cream excerpt, a "Read article" footer with a nudging arrow. Reveals
// cascade via the site-wide [data-reveal] runtime (alive.js); reduced-motion is
// instant. All 12 render in one continuous grid — no pagination: a two-up
// editorial scroll reads more premium than splitting twelve cards across pages.
//
// Content is MOCK (see src/data/newsroomPosts.js). Posts are EN-only by design;
// only chrome (hero, chips, "Read article") is translated via the newsroom ns.

function Arrow() {
  return (
    <svg className="nr-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NewsCard({ post }) {
  const { t, i18n } = useTranslation('newsroom')
  return (
    <article className="nr-card" data-reveal>
      <Link className="nr-card-link" to={`/newsroom/${post.slug}`}>
        <div className="nr-card-media">
          <img src={post.heroImage} alt="" loading="lazy" decoding="async" />
          {post.category && (
            <span className="nr-chip">{t(`categories.${post.category}`, post.category)}</span>
          )}
        </div>
        <div className="nr-card-body">
          <time className="nr-date" dateTime={post.date}>{formatPostDate(post.date, i18n.language)}</time>
          <h3 className="nr-card-title">{post.title}</h3>
          <p className="nr-card-excerpt">{post.excerpt}</p>
          <span className="nr-card-more">
            {t('readArticle')}
            <Arrow />
          </span>
        </div>
      </Link>
    </article>
  )
}

export default function Newsroom() {
  const { t } = useTranslation('newsroom')

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
          {newsroomPosts.length === 0 ? (
            <p className="nr-empty">{t('empty')}</p>
          ) : (
            <div className="nr-grid">
              {newsroomPosts.map((post) => (
                <NewsCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
