import type { Loader } from 'astro/loaders';
import { createClient } from '@sanity/client';

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
  "image": image.asset->url,
  imageAlt
}`;

export function sanityStoriesLoader(): Loader {
  return {
    name: 'sanity-stories-loader',
    load: async ({ store, logger, parseData, generateDigest }) => {
      const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
      const dataset = import.meta.env.PUBLIC_SANITY_DATASET;

      if (!projectId || !dataset || projectId === 'your-project-id') {
        logger.warn(
          'PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET are not set (or still placeholders) — skipping Sanity fetch, stories collection will be empty.'
        );
        store.clear();
        return;
      }

      const client = createClient({
        projectId,
        dataset,
        apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
        useCdn: false,
      });

      const stories = await client.fetch<Array<Record<string, unknown>>>(STORIES_QUERY);

      store.clear();

      for (const story of stories) {
        const { _id, _updatedAt, ...rest } = story;
        const id = String(_id);
        const data = await parseData({ id, data: rest });
        store.set({ id, data, digest: generateDigest(story) });
      }

      logger.info(`Loaded ${stories.length} stories from Sanity.`);
    },
  };
}
