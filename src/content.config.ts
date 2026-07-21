import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORIES } from './consts';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

// Content Layer API (Astro 5+): loader-based collection, replaces the legacy
// src/content/config.ts pattern. Swap `glob()` for a custom loader if/when
// stories move to Sanity or another headless CMS.
const stories = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/stories' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string().min(1).max(280),
      source: z.string(),
      category: z.enum(categorySlugs),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      publishedAt: z.coerce.date(),
      image: image().optional(),
      imageAlt: z.string().optional(),
    }),
});

export const collections = { stories };
