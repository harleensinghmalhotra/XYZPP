import {defineType, defineField} from 'sanity'

// Newsroom post — the ONLY document type. Fields exactly per the client mandate.
// Grouped Content / Publishing, with plain-English descriptions for the client.
//
// i18n: title / excerpt / body are FIELD-LEVEL localized — each is a locale
// object {en, fr, es} (see schemas/locale.js). Shared fields (slug, coverImage,
// publishedAt, category, published) stay single values on the one document.
export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'publishing', title: 'Publishing'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      group: 'content',
      description: 'The headline, exactly as it appears on the website. English is required; French / Spanish are optional and fall back to English.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description: 'The web address for this post — click “Generate” to fill it from the English title.',
      // Source is a function now that title is a locale object: slug tracks English.
      options: {source: (doc) => doc?.title?.en, maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      description: 'The main image — used as the card cover and the article hero.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localeText',
      group: 'content',
      description: 'A short 2–3 sentence summary shown on the newsroom index card.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'localePortableText',
      group: 'content',
      description: 'The article itself. Add paragraphs, images (with captions) and video — separately per language.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'publishing',
      description:
        'Publication date & time. Set a future date to schedule — the post appears on the website automatically when this time arrives.',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'publishing',
      description: 'Optional label shown as a chip on the card.',
      options: {
        list: [
          {title: 'Awards', value: 'Awards'},
          {title: 'Press', value: 'Press'},
          {title: 'Announcements', value: 'Announcements'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      group: 'publishing',
      description: 'Uncheck to hide this post from the website instantly.',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title.en', date: 'publishedAt', category: 'category', media: 'coverImage', published: 'published'},
    prepare({title, date, category, media, published}) {
      const day = date ? new Date(date).toISOString().slice(0, 10) : 'no date'
      const bits = [day]
      if (category) bits.push(category)
      if (published === false) bits.push('Hidden')
      return {title, subtitle: bits.join('  ·  '), media}
    },
  },
})
