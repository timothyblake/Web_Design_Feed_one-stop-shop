import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemaTypes';

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
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
