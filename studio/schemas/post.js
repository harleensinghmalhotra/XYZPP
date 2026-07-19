import {defineType, defineField, defineArrayMember} from 'sanity'

// Newsroom post — the ONLY document type. Fields exactly per the client mandate:
// no extra features. `published` is the instant hide/unhide toggle; `publishedAt`
// doubles as the schedule field (a future date means the site reveals it then,
// via the GROQ `publishedAt <= now()` guard on the site).
export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
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
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
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
      ],
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
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
    select: {title: 'title', date: 'publishedAt', media: 'coverImage'},
    prepare({title, date, media}) {
      const when = date ? new Date(date).toISOString().slice(0, 10) : 'no date'
      return {title, subtitle: when, media}
    },
  },
})
