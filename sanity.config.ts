import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemaTypes';
import { FetchThumbnailAction } from './sanity/actions/FetchThumbnailAction';

interface StoryBookmarkletParams {
  title?: string;
  url?: string;
  description?: string;
  source?: string;
  sourceImageUrl?: string;
}

// Embedded Studio config, auto-detected by the `@sanity/astro` integration
// (see astro.config.mjs) and mounted at /studio during `astro dev`/build.
export default defineConfig({
  name: 'web-design-feed',
  title: 'Web Design Feed',
  // import.meta.env, not process.env — this file is bundled straight into
  // the browser for the embedded Studio (client:only="react"), where the
  // Node-only `process` global doesn't exist.
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  // Must match the `studioBasePath` in astro.config.mjs — Studio's login
  // flow uses this to build its `<origin>/<basePath>/callback` redirect.
  // Without it, login redirects to bare `<origin>/callback`, which Astro
  // has no route for and the sign-in flow just hangs there.
  basePath: '/studio',
  plugins: [structureTool(), visionTool()],
  document: {
    actions: (previousActions, context) =>
      context.schemaType === 'story' ? [FetchThumbnailAction, ...previousActions] : previousActions,
  },
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'story-from-bookmarklet',
        title: 'Story from bookmarklet',
        description: 'Create a draft using metadata collected from an article page.',
        schemaType: 'story',
        parameters: [
          { name: 'title', type: 'string' },
          { name: 'url', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'source', type: 'string' },
          { name: 'sourceImageUrl', type: 'string' },
        ],
        value: (params: StoryBookmarkletParams) => ({
          title: params.title?.trim().slice(0, 150) ?? '',
          url: params.url?.trim() ?? '',
          description: params.description?.trim().slice(0, 280) ?? '',
          source: params.source?.trim() ?? '',
          sourceImageUrl: params.sourceImageUrl?.trim() || undefined,
          featured: false,
          publishedAt: new Date().toISOString(),
        }),
      },
    ],
  },
});
