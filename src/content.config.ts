import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { sanityStoriesLoader } from './loaders/sanityStories';
import { CATEGORIES, type CategorySlug } from './consts';

const categorySlugs = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

// Content Layer API (Astro 5+): loader-based collection. Stories live in
// Sanity now — the loader fetches them via GROQ at build/dev time. `image`
// is the first available R2 thumbnail, captured source image, or legacy
// Sanity asset URL, rendered through Cloudflare's image transform path.
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
