import {defineType, defineField, defineArrayMember} from 'sanity'

// ── Field-level localization (en / fr / es) ──────────────────────────────────
// The newsroom uses FIELD-LEVEL i18n, not document-level: ONE post document per
// article, with the translatable fields (title, excerpt, body) each holding a
// small locale object {en, fr, es}. Everything shared — slug, coverImage,
// publishedAt, category, published — stays a single value on the one document,
// so a date or a cover can never drift between language versions.
//
// Portable Text does not fight this pattern: `body` is just an array field, so
// its localized form is an object whose en/fr/es keys each hold the SAME block
// array shape the single-language body used to hold. Migrated English content
// lands in `.en` unchanged and validates as before.
//
// The site reads the active language with an EN fallback:
//   coalesce(title[$lang], title.en)
export const LANGUAGES = [
  {id: 'en', title: 'English'},
  {id: 'fr', title: 'French'},
  {id: 'es', title: 'Spanish'},
]

// English sits at the top (authoring language); FR/ES tuck into a collapsible
// "Translations" fieldset so the editor is never overwhelmed by nine fields.
const TRANSLATIONS = 'translations'
const localeFieldsets = [
  {name: TRANSLATIONS, title: 'Translations (French / Spanish)', options: {collapsible: true, collapsed: true}},
]
const fieldsetFor = (id) => (id === 'en' ? undefined : TRANSLATIONS)

// Portable-text block config — byte-for-byte the original single-language body,
// so seeded/migrated content keeps validating and the editor UX is unchanged.
const portableTextOf = [
  defineArrayMember({type: 'block'}),
  defineArrayMember({
    type: 'image',
    title: 'Image',
    options: {hotspot: true},
    fields: [defineField({name: 'caption', title: 'Caption', type: 'string'})],
  }),
  defineArrayMember({
    type: 'file',
    name: 'videoFile',
    title: 'Video',
    options: {accept: 'video/*'},
    fields: [defineField({name: 'caption', title: 'Caption', type: 'string'})],
  }),
]

export const localeString = defineType({
  name: 'localeString',
  title: 'Localized string',
  type: 'object',
  fieldsets: localeFieldsets,
  fields: LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      fieldset: fieldsetFor(lang.id),
      // English is the authoring language + fallback, so only it is required.
      ...(lang.id === 'en' ? {validation: (Rule) => Rule.required()} : {}),
    }),
  ),
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text',
  type: 'object',
  fieldsets: localeFieldsets,
  fields: LANGUAGES.map((lang) =>
    defineField({name: lang.id, title: lang.title, type: 'text', rows: 3, fieldset: fieldsetFor(lang.id)}),
  ),
})

export const localePortableText = defineType({
  name: 'localePortableText',
  title: 'Localized body',
  type: 'object',
  fieldsets: localeFieldsets,
  fields: LANGUAGES.map((lang) =>
    defineField({name: lang.id, title: lang.title, type: 'array', of: portableTextOf, fieldset: fieldsetFor(lang.id)}),
  ),
})
