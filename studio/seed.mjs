// ─────────────────────────────────────────────────────────────────────────────
// ONE-OFF SEED — imports the 12 seed newsroom posts into Sanity as documents,
// converting their body blocks to Portable Text and uploading their local
// /public/qfp/newsroom media as Sanity assets.
//
//   Run (from studio/):  node --env-file=.env seed.mjs   (or: npm run seed)
//
// Idempotent: deterministic `_id` per slug (createOrReplace) and Sanity's
// content-addressed assets mean re-running never duplicates posts or media.
// ─────────────────────────────────────────────────────────────────────────────
import {createClient} from '@sanity/client'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {newsroomPosts} from '../src/data/newsroomPosts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET
const token = process.env.SANITY_AUTH_TOKEN

if (!projectId || !dataset || !token) {
  console.error('✗ Missing env. Run:  node --env-file=.env seed.mjs')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2025-01-01', useCdn: false})

// local /public path -> Sanity asset _id, deduped within this run
const assetCache = new Map()

async function uploadAsset(kind, publicPath) {
  const cacheKey = `${kind}:${publicPath}`
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey)
  const abs = path.join(PUBLIC_DIR, publicPath)
  const buf = await readFile(abs)
  const asset = await client.assets.upload(kind, buf, {filename: path.basename(publicPath)})
  assetCache.set(cacheKey, asset._id)
  console.log(`   ↑ ${kind.padEnd(5)} ${path.basename(publicPath).padEnd(22)} -> ${asset._id}`)
  return asset._id
}

const keyOf = (slug, i) => `${slug}-k${i}`.replace(/[^a-zA-Z0-9_-]/g, '')

async function buildBody(post) {
  const out = []
  let i = 0
  for (const blk of post.body) {
    const _key = keyOf(post.slug, i++)
    if (blk.type === 'paragraph') {
      out.push({
        _type: 'block',
        _key,
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: `${_key}s`, text: blk.text, marks: []}],
      })
    } else if (blk.type === 'image') {
      const ref = await uploadAsset('image', blk.src)
      out.push({
        _type: 'image',
        _key,
        asset: {_type: 'reference', _ref: ref},
        ...(blk.caption ? {caption: blk.caption} : {}),
      })
    } else if (blk.type === 'video') {
      // Schema `videoFile` = file (video/*) + caption. The seed post's poster has no
      // home in that minimal schema, so it is intentionally dropped (native
      // <video> plays without one).
      const ref = await uploadAsset('file', blk.src)
      out.push({
        _type: 'videoFile',
        _key,
        asset: {_type: 'reference', _ref: ref},
        ...(blk.caption ? {caption: blk.caption} : {}),
      })
    }
  }
  return out
}

async function seed() {
  console.log(`\nSeeding ${newsroomPosts.length} posts into ${projectId}/${dataset}\n`)
  let n = 0
  for (const post of newsroomPosts) {
    console.log(`[${String(++n).padStart(2)}/${newsroomPosts.length}] ${post.slug}`)
    const coverRef = await uploadAsset('image', post.heroImage)
    const body = await buildBody(post)
    await client.createOrReplace({
      _id: `post.${post.slug}`,
      _type: 'post',
      title: post.title,
      slug: {_type: 'slug', current: post.slug},
      publishedAt: new Date(`${post.date}T09:00:00Z`).toISOString(),
      ...(post.category ? {category: post.category} : {}),
      ...(post.excerpt ? {excerpt: post.excerpt} : {}),
      coverImage: {_type: 'image', asset: {_type: 'reference', _ref: coverRef}},
      body,
      published: true,
    })
    console.log(`   ✓ post.${post.slug}\n`)
  }
  const count = await client.fetch('count(*[_type == "post"])')
  console.log(`Done. Posts now in dataset "${dataset}": ${count}`)
  if (count !== newsroomPosts.length) {
    console.warn(`⚠ Expected ${newsroomPosts.length}, found ${count}.`)
  }
}

seed().catch((err) => {
  console.error('\n✗ SEED FAILED:', err.message)
  process.exit(1)
})
