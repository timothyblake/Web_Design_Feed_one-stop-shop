import { defineField, defineType } from 'sanity';
import { CATEGORIES } from '../../src/consts';

// Dynamically derived from CATEGORIES in src/consts.ts — ensuring Sanity Studio options
// stay perfectly in sync with the front-end category slugs and labels.
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  title: c.label,
  value: c.slug,
}));

export default defineType({
  name: 'story',
  title: 'Story',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(5).max(150),
    }),
    defineField({
      name: 'url',
      title: 'Article URL',
      type: 'url',
      description: 'Direct link to the original article.',
      validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Why is this worth reading? One or two sentences.',
      validation: (Rule) => Rule.required().min(1).max(280),
    }),
    defineField({
      name: 'source',
      title: 'Source Name',
      type: 'string',
      description: 'Publication name (e.g. Smashing Magazine, CSS-Tricks).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: CATEGORY_OPTIONS, layout: 'radio' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Lowercase topic tags (e.g. css, react, figma).',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Include in the weekly newsletter digest and /featured.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'imageAlt',
      title: 'Image Alt Text',
      type: 'string',
      hidden: ({ document }) => !document?.image,
    }),
  ],
  orderings: [
    {
      title: 'Published, Newest First',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      source: 'source',
      category: 'category',
      featured: 'featured',
      media: 'image',
    },
    prepare({ title, source, category, featured, media }) {
      return {
        title: `${featured ? '★ ' : ''}${title}`,
        subtitle: `${source} · ${category}`,
        media,
      };
    },
  },
});
