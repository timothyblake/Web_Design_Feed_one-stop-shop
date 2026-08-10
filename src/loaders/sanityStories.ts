import type { Loader } from 'astro/loaders';
import { createClient } from '@sanity/client';
import { normalizeCategorySlug } from '../consts';

// GROQ projection mirrors the `story` fields consumed across the site
// (StoryCard, category/tag pages, RSS, llms.txt) so the Content Layer
// store shape matches the zod schema in content.config.ts exactly.
const STORIES_QUERY = `*[_type == "story" && defined(publishedAt)] | order(publishedAt desc) {
  _id,
  _updatedAt,
  title,
  url,
  description,
  source,
  category,
  "tags": coalesce(tags, []),
  featured,
  publishedAt,
  "image": coalesce(thumbnailUrl, image.asset->url),
  imageAlt
}`;

export function sanityStoriesLoader(): Loader {
  return {
    name: 'sanity-stories-loader',
    load: async ({ store, logger, parseData, generateDigest }) => {
      const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
      const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

      if (!projectId || !dataset || projectId === 'your-project-id') {
        const msg =
          'CRITICAL: PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET are missing or placeholders — aborting build.';
        logger.error(msg);
        store.clear();
        throw new Error(msg);
      }

      const client = createClient({
        projectId,
        dataset,
        apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
        // Astro materializes this collection at dev/build time, so freshness
        // matters more than CDN query caching.
        useCdn: false,
      });

      let rawStories: Array<Record<string, unknown>> = [];
      try {
        rawStories = await client.fetch<Array<Record<string, unknown>>>(STORIES_QUERY);
      } catch (err) {
        logger.error(`Failed to fetch stories from Sanity API: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }

      const fetchedIds = new Set<string>();
      let loadedCount = 0;

      for (const story of rawStories) {
        const { _id, _updatedAt, ...rest } = story;
        const id = String(_id);
        fetchedIds.add(id);

        // Tags become route parameters. Normalize authoring whitespace here so
        // a value such as "Designers " cannot generate an invalid static path.
        const tags = Array.from(
          new Set(
            (Array.isArray(rest.tags) ? rest.tags : [])
              .map((tag) => String(tag).trim())
              .filter(Boolean)
          )
        );
        const normalizedStory = {
          ...rest,
          category: normalizeCategorySlug(String(rest.category ?? '').trim()),
          tags,
        };

        const digest = generateDigest({ _id, _updatedAt, ...normalizedStory });
        const existing = store.get(id);
        if (existing && existing.digest === digest) {
          loadedCount++;
          continue;
        }

        try {
          const data = await parseData({
            id,
            data: normalizedStory,
          });
          store.set({ id, data, digest });
          loadedCount++;
        } catch (err) {
          logger.error(
            `Skipping malformed Sanity story document "${story.title ?? id}" (${id}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }

      // Remove deleted records from store
      for (const id of store.keys()) {
        if (!fetchedIds.has(id)) {
          store.delete(id);
        }
      }

      if (loadedCount === 0) {
        const msg = `CRITICAL ERROR: Loaded 0 stories from Sanity (out of ${rawStories.length} raw records fetched). Aborting build.`;
        logger.error(msg);
        throw new Error(msg);
      } else {
        logger.info(
          `Loaded ${loadedCount} stories from Sanity${
            rawStories.length > loadedCount ? ` (${rawStories.length - loadedCount} malformed records skipped)` : ''
          }.`
        );
      }
    },
  };
}
