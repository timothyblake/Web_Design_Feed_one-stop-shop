// @ts-check
import { loadEnv } from 'vite';
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import compress from '@playform/compress';
import sanity from '@sanity/astro';
import react from '@astrojs/react';

// astro.config.mjs runs outside Vite's normal env-loading, so .env values
// have to be pulled in explicitly here for the sanity() integration below.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  site: 'https://webdesignfeed.com',
  trailingSlash: 'never',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  image: {
    layout: 'constrained',
    domains: ['cdn.sanity.io'],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  redirects: {
    // Preserve legacy taxonomy links while category archives move to clean,
    // root-level permalinks.
    '/category/front-end': '/front-end-development',
    '/category/back-end': '/web-development',
    '/category/web-dev': '/web-development',
    '/category/ui-design': '/ui-ux-design',
    '/category/career': '/business',
    '/category/tools': '/resources',
    '/category/[slug]/[...page]': '/[slug]/[...page]',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/newsletter/success') &&
        !page.includes('/404') &&
        !page.includes('/studio') &&
        !page.includes('/bookmarklet') &&
        !page.includes('/search') &&
        !page.includes('/bookmarks') &&
        !page.includes('/tag/'),
    }),
    sanity({
      projectId: env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
      dataset: env.PUBLIC_SANITY_DATASET || 'production',
      apiVersion: env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
      useCdn: true,
      studioBasePath: '/studio',
    }),
    react(),
    // Keep compress last so it optimizes the final output of every other integration.
    // CSS compression is disabled: its minifier (csso) doesn't understand
    // Tailwind v4's modern range media-query syntax (`@media (width >= 64rem)`)
    // and silently drops those blocks, breaking every responsive layout.
    compress({ CSS: false }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Mona Sans',
      cssVariable: '--font-headline',
      weights: [400, 700],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-body',
      weights: [400, 500, 600],
    },
  ],
});
