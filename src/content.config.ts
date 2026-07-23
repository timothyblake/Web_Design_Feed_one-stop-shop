import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { sanityStoriesLoader } from './loaders/sanityStories';
import { CATEGORIES } from './consts';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

// Content Layer API (Astro 5+): loader-based collection. Stories live in
// Sanity now — the loader fetches them via GROQ at build/dev time. `image`
// is a plain Sanity CDN URL (not an astro:assets `image()` reference, which
// only resolves local files), rendered as a remote <img> in StoryCard.
const stories = defineCollection({
  loader: sanityStoriesLoader(),
  schema: z.object({
    title: z.string(),
    url: z.url(),
    description: z.string().min(1).max(280),
    source: z.string(),
    category: z.enum(categorySlugs),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    // GROQ returns `null` (not absent) for stories without an image, and
    // zod's `.optional()` only accepts `undefined` — `.nullish()` covers both.
    image: z.url().nullish(),
    imageAlt: z.string().nullish(),
  }),
});

export const collections = { stories };
