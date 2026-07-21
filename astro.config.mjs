// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import compress from '@playform/compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://webdesignfeed.com',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  image: {
    layout: 'constrained',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/newsletter/success') && !page.includes('/404'),
    }),
    // Keep compress last so it optimizes the final output of every other integration.
    compress(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'PT Serif',
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
