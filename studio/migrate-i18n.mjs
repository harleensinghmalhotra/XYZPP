// ─────────────────────────────────────────────────────────────────────────────
// ONE-OFF MIGRATION — field-level i18n.
//
// Wraps every post's single-language title / excerpt / body into the new locale
// objects, moving the existing content into the `.en` key WITHOUT LOSS:
//   title  (string) -> {_type:'localeString',      en: <string>}
//   excerpt(text)   -> {_type:'localeText',        en: <string>}
//   body   (array)  -> {_type:'localePortableText', en: <blocks[]>}
//
// Idempotent: a field already shaped as a locale object (has `.en` or is not the
// old primitive) is left untouched, so re-running is a no-op and never clobbers
// FR/ES added by translate-i18n.mjs.
//
//   Run (from studio/):  node --env-file=.env migrate-i18n.mjs
// ─────────────────────────────────────────────────────────────────────────────
import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET
const token = process.env.SANITY_AUTH_TOKEN
if (!projectId || !dataset || !token) {
  console.error('✗ Missing env. Run:  node --env-file=.env migrate-i18n.mjs')
  process.exit(1)
}

const client = createClient({projectId, dataset, token, apiVersion: '2026-07-19', useCdn: false})

const isMigratedString = (v) => v && typeof v === 'object' && !Array.isArray(v)
const isMigratedBody = (v) => v && !Array.isArray(v) && typeof v === 'object'

const posts = await client.fetch(`*[_type == "post"]{_id, title, excerpt, body}`)
console.log(`\nMigrating ${posts.length} posts to field-level i18n\n`)

let migrated = 0
let skipped = 0
for (const p of posts) {
  const set = {}

  // title: old = string, new = localeString object
  if (typeof p.title === 'string') set.title = {_type: 'localeString', en: p.title}
  else if (!isMigratedString(p.title)) {
    /* missing/unexpected — leave for the studio to flag */
  }

  // excerpt: old = string (text), new = localeText object
  if (typeof p.excerpt === 'string') set.excerpt = {_type: 'localeText', en: p.excerpt}

  // body: old = array of blocks, new = localePortableText object
  if (Array.isArray(p.body)) set.body = {_type: 'localePortableText', en: p.body}

  if (Object.keys(set).length === 0) {
    skipped++
    console.log(`   ·  ${p._id} — already localized, skipped`)
    continue
  }
  await client.patch(p._id).set(set).commit()
  migrated++
  console.log(`   ✓  ${p._id} — wrapped [${Object.keys(set).join(', ')}] into .en`)
}

console.log(`\nDone. Migrated ${migrated}, skipped ${skipped}.`)
