# Web Design Feed

Web Design Feed is a statically generated editorial feed that curates useful UI design, front-end, back-end, tooling, and career articles from around the web. Every story card links directly to the original publisher; the site is a discovery and reading-list product, not a republishing platform.

The project is built with Astro, TypeScript, and Tailwind CSS. Stories are stored as validated Markdown content, then used to generate the main feed, category and tag archives, a featured collection, RSS feeds, structured SEO data, a Pagefind search index, and an AI-readable `llms.txt` endpoint.

## Contents

- [Key features](#key-features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Application architecture](#application-architecture)
- [Routes](#routes)
- [Managing stories](#managing-stories)
- [Managing categories](#managing-categories)
- [Featured stories](#featured-stories)
- [Search](#search)
- [Bookmarks](#bookmarks)
- [Newsletter and feeds](#newsletter-and-feeds)
- [SEO and discovery](#seo-and-discovery)
- [Styling and responsive layout](#styling-and-responsive-layout)
- [Accessibility](#accessibility)
- [Build and deployment](#build-and-deployment)
- [Security and caching](#security-and-caching)
- [Testing and quality checks](#testing-and-quality-checks)
- [Troubleshooting](#troubleshooting)
- [Maintenance checklist](#maintenance-checklist)

## Key features

- Statically generated, paginated story feed.
- Five curated categories: UI Design, Front-end, Back-end, Tools, and Career.
- Dynamically generated category and tag archive pages.
- Featured-story collection with a branded star indicator.
- Full-site search powered by Pagefind after the production build.
- Browser-local bookmarks with a live count in the header.
- Share controls for X, LinkedIn, Facebook, the Web Share API, and copying a link.
- Dedicated all-stories and featured-only RSS feeds.
- Buttondown newsletter subscription and archive links.
- Responsive desktop sidebar and mobile burger navigation.
- Light and dark themes stored in `localStorage`.
- Canonical URLs, Open Graph metadata, Twitter cards, JSON-LD, a sitemap, robots rules, and `llms.txt`.
- Cloudflare static asset configuration, security headers, and long-lived caching for fingerprinted assets.
- Reduced-motion support, visible keyboard focus, semantic landmarks, skip navigation, and accessible control labels.

## Technology

| Area | Implementation |
| --- | --- |
| Framework | Astro 7 |
| Language | TypeScript with Astro's strict configuration |
| Content | Astro Content Layer with Markdown/MDX files and a validated schema |
| Styling | Tailwind CSS 4 through the Vite plugin |
| Search | Pagefind |
| Feeds | `@astrojs/rss` |
| SEO | Astro Sitemap, canonical metadata, social metadata, and JSON-LD |
| Fonts | Astro Fonts API using PT Serif and Geist |
| Optimization | `@playform/compress` and Astro image handling |
| Deployment target | Static assets configured for Cloudflare via Wrangler |

The site does not use a client framework such as React or Vue. Interactive behavior is implemented with small browser-side TypeScript modules and `<script>` blocks inside Astro components.

## Requirements

- Node.js `22.12.0` or newer.
- npm, using the committed `package-lock.json` for reproducible installs.
- No database, API key, or environment-variable file is required for local development.

External services used by the current implementation are:

- Google Fonts and Material Symbols.
- Google's favicon service for source-site icons.
- Buttondown for newsletter subscriptions and the newsletter archive.
- Pagefind for the generated production search index.

## Getting started

Install dependencies from the project root:

```bash
npm install
```

Start the Astro development server in background mode:

```bash
npm run astro -- dev --background
```

The site is available at `http://localhost:4321/` by default.

Manage the background server with:

```bash
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
```

For a production-equivalent local test, build the site and then preview the generated output:

```bash
npm run build
npm run preview
```

The production build is important for testing search because the Pagefind index does not exist during a normal development session.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install locked dependencies. |
| `npm run dev` | Start the normal foreground Astro development server. |
| `npm run astro -- dev --background` | Start the background development server used by this workspace. |
| `npm run build` | Generate the static site in `dist/`, then run Pagefind through `postbuild`. |
| `npm run preview` | Serve the generated `dist/` output locally. |
| `npm run check` | Run Astro and TypeScript diagnostics. |
| `npm run astro -- --help` | Display the Astro CLI help. |

## Project structure

```text
.
├── public/
│   ├── _headers                 # Security and cache headers
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   ├── og-default.png           # Default social sharing image
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.astro
│   │   │   ├── Header.astro
│   │   │   ├── MainHead.astro
│   │   │   └── SideNav.astro
│   │   └── ui/
│   │       ├── Breadcrumb.astro
│   │       ├── NewsletterCTA.astro
│   │       ├── PageHeading.astro
│   │       ├── SeoBlurb.astro
│   │       └── StoryCard.astro
│   ├── content/
│   │   └── stories/             # One Markdown or MDX file per story
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── lib/
│   │   └── bookmarks-client.ts
│   ├── pages/                   # File-based routes and generated endpoints
│   ├── styles/
│   │   └── global.css           # Tailwind theme tokens and global behavior
│   ├── utils/
│   │   └── formatDate.ts
│   ├── consts.ts                # Site identity, categories, and category copy
│   └── content.config.ts        # Story collection loader and schema
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

Generated files in `dist/` and installed packages in `node_modules/` are build artifacts and should not be edited manually.

## Application architecture

### Static generation

Astro reads every Markdown or MDX file in `src/content/stories/` through the glob loader in `src/content.config.ts`. The schema validates the metadata before pages are generated. Pages query the collection with `getCollection('stories')`, sort stories by `publishedAt`, and filter by category, tag, or featured state as needed.

The site is configured with a canonical production origin of `https://webdesignfeed.com` and always emits trailing-slash page URLs.

### Shared layout

`src/layouts/BaseLayout.astro` provides the document shell:

1. `MainHead.astro` creates metadata, feed discovery links, fonts, structured data, and the initial theme script.
2. `Header.astro` renders centered desktop navigation, expandable search, the theme control, the bookmark count, and mobile navigation.
3. `SideNav.astro` renders category filtering and the compact subscription card on desktop.
4. The route's content is rendered inside the main landmark.
5. `Footer.astro` renders feed and informational links.

The category sidebar is enabled by default. Individual pages can opt out with `showSideNav={false}`; this is currently used for tag archives and the 404 page.

### Story cards

`StoryCard.astro` is the primary story presentation component. It handles:

- Optional optimized images.
- Source favicons with an initials fallback.
- Relative and absolute publication dates.
- Direct links to the source article.
- Category and tag navigation.
- A brand-colored star for stories whose `featured` field is `true`.
- Bookmark toggling.
- Social sharing and copy-link actions.

The original article URL is the story's primary link. There are intentionally no local story-detail routes.

## Routes

| Route | Source | Indexing | Description |
| --- | --- | --- | --- |
| `/` | `src/pages/[...page].astro` | Indexed | Latest stories, first page of the paginated feed. |
| `/2/`, `/3/`, etc. | `src/pages/[...page].astro` | Indexed | Additional feed pages when enough stories exist. |
| `/featured/` | `src/pages/featured.astro` | Indexed | Stories marked `featured: true`. |
| `/category/:slug/` | `src/pages/category/[slug].astro` | Indexed | Statically generated archive for each configured category. |
| `/tag/:slug/` | `src/pages/tag/[slug].astro` | Noindex | Statically generated archive for every tag found in story content. |
| `/search/` | `src/pages/search.astro` | Noindex | Pagefind search interface in production builds. |
| `/bookmarks/` | `src/pages/bookmarks.astro` | Noindex | Browser-local saved stories. |
| `/newsletter/` | `src/pages/newsletter.astro` | Indexed | Newsletter explanation, subscription form, and archive link. |
| `/about/` | `src/pages/about.astro` | Indexed | Project purpose and editorial approach. |
| `/rss.xml` | `src/pages/rss.xml.js` | Feed | All stories, linking directly to their original sources. |
| `/featured.xml` | `src/pages/featured.xml.js` | Feed | Featured stories only. |
| `/llms.txt` | `src/pages/llms.txt.ts` | Text | Site summary, feed links, and up to 50 recent stories for AI clients. |
| `/404.html` | `src/pages/404.astro` | Noindex | Static not-found page. |

## Managing stories

### Story schema

Every story file must satisfy the schema in `src/content.config.ts`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Display title of the source article. |
| `url` | valid URL string | Yes | Direct URL to the original publisher. |
| `description` | string | Yes | Between 1 and 280 characters. Used on cards, feeds, bookmarks, and sharing. |
| `source` | string | Yes | Publisher or source name. |
| `category` | category slug | Yes | Must match one of the slugs in `CATEGORIES`. |
| `tags` | string array | No | Defaults to an empty array and creates tag archive routes. |
| `featured` | boolean | No | Defaults to `false`; controls the Featured page, feed, and star. |
| `publishedAt` | date | Yes | Parsed into a JavaScript `Date`; ISO 8601 with timezone is recommended. |
| `image` | Astro content image | No | Optional local image handled by Astro Assets. |
| `imageAlt` | string | No | Alternative text for the optional image. Use an empty value only for decorative imagery. |

### Example story

Create a descriptive, URL-safe Markdown filename in `src/content/stories/`:

```md
---
title: "A Practical Guide to Container Queries"
url: "https://example.com/container-queries"
description: "Patterns for building components that adapt to their available space instead of the viewport."
source: "Example Publication"
category: "front-end"
tags: ["css", "layout"]
featured: false
publishedAt: 2026-07-21T09:00:00Z
---

Optional internal editorial notes can go here. The public card is driven by the frontmatter and links to the original URL.
```

### Add a story

1. Create a new `.md` or `.mdx` file in `src/content/stories/`.
2. Add all required frontmatter fields.
3. Use exactly one supported category slug.
4. Keep the description within 280 characters.
5. Use a timezone-aware publication date.
6. Set `featured: true` only if the story belongs in the editor's picks.
7. Run `npm run check` to validate the schema and TypeScript.
8. Run `npm run build` to verify generated pages, feeds, images, and the search index.

Story ordering is automatic: all feed-like pages sort `publishedAt` from newest to oldest.

## Managing categories

Categories are defined centrally in `src/consts.ts`. Each category includes:

- `slug`: route and schema value.
- `label`: user-facing name.
- `icon`: Material Symbols icon name.
- `pill`: category badge color choice.

The same file also contains:

- `CATEGORY_DESCRIPTIONS`: the sentence displayed below each category H1.
- `CATEGORY_BLURBS`: unique long-form SEO copy at the bottom of each category page.

To add a category:

1. Add the category object to `CATEGORIES`.
2. Add a matching key to `CATEGORY_DESCRIPTIONS`.
3. Add a matching key and paragraph array to `CATEGORY_BLURBS`.
4. Add or update stories using the new slug.
5. Run `npm run check`; the `Record<CategorySlug, ...>` types will catch missing category copy.
6. Run `npm run build` and inspect the generated `/category/<slug>/` route.

Because the content schema derives its enum from `CATEGORIES`, unrecognised category values fail validation.

## Featured stories

Featured status is controlled entirely by story frontmatter:

```yaml
featured: true
```

A featured story appears:

- In the normal chronological feed.
- On `/featured/`.
- In `/featured.xml`.
- With a filled star using the site's `secondary` brand color.

The featured RSS feed is intended to support the weekly newsletter workflow. Removing or changing `featured` updates the generated page and feed on the next build.

## Search

Search uses Pagefind and is generated after Astro finishes building:

```json
"build": "astro build",
"postbuild": "pagefind --site dist"
```

Consequences:

- Search is not fully available in `astro dev` because `/pagefind/pagefind-ui.js` has not been generated.
- The Search page catches the missing module during development and shows a fallback message.
- To test real search behavior, run `npm run build` followed by `npm run preview`.
- Search is excluded from indexing through page metadata and `robots.txt` because query-result pages should not become search-engine landing pages.

The desktop header search opens from an icon and animates horizontally. Escape closes it, clicking outside closes it, and focus moves into the input when opened. Mobile search is the first item in the burger menu, followed by category navigation.

## Bookmarks

Bookmarks are intentionally account-free and client-only.

- Storage key: `wdf:bookmarks`.
- Storage mechanism: browser `localStorage`.
- Synchronisation event: `wdf:bookmarks-changed`.
- Cross-tab changes are handled through the browser `storage` event.
- The header counter updates immediately and displays `99+` above 99 saved items.
- The Bookmarks page rebuilds cards from stored story metadata.

Bookmark data never leaves the browser. Clearing site data, switching browsers, or using a different device will remove or hide saved items because there is no server-side account sync.

## Newsletter and feeds

### Newsletter

`NewsletterCTA.astro` posts email addresses directly to Buttondown:

```text
https://buttondown.email/api/emails/embed-subscribe/webdesignfeed
```

If the Buttondown publication name changes, update the form `action`. The Newsletter page also links to the Buttondown archive. The site's Content Security Policy explicitly permits forms to submit to `https://buttondown.email`.

### RSS feeds

The project generates two feeds:

- `/rss.xml`: all stories.
- `/featured.xml`: stories marked as featured.

Both feeds:

- Sort by publication date descending.
- Link directly to the original source article.
- Include the category and tags.
- Include the publisher name in custom `<source>` data.
- Declare British English as the feed language.

The all-stories feed is suitable for external automation such as social publishing. The featured feed is suitable for newsletter drafting or a best-of subscription.

## SEO and discovery

`MainHead.astro` is the central metadata component. It provides:

- Page titles in the format `Page Title | Web Design Feed`.
- A site-title-only title on the homepage.
- Canonical URLs based on the configured production site.
- Meta descriptions.
- Optional noindex directives.
- Open Graph metadata.
- Twitter summary-card metadata.
- Default social artwork from `/og-default.png`.
- RSS autodiscovery links for both feeds.
- Optional JSON-LD injection.

Structured data currently includes:

- `WebSite` plus `SearchAction` on the homepage.
- `ItemList` on category pages.
- `AboutPage` and `Organization` data on the About page.

Additional discovery files:

- The sitemap integration generates the sitemap from public routes.
- `public/robots.txt` points to the sitemap, blocks search/query URLs, and explicitly permits several AI crawlers.
- `/llms.txt` describes the project and lists up to 50 recent source links.
- Category pages include unique descriptive and long-form copy to avoid thin, near-duplicate archive pages.

When changing the production domain, update both `site` in `astro.config.mjs` and `SITE_URL` in `src/consts.ts`. Also review absolute URLs in `robots.txt` and any external branding assets.

## Styling and responsive layout

Global theme values are defined in the Tailwind `@theme` block in `src/styles/global.css`.

Important tokens include:

- `background`, `surface`, and `surface-variant` for the neutral interface.
- `primary` and `on-surface-variant` for text.
- `secondary` for the pink brand accent.
- `outline` and `outline-variant` for dividers and controls.
- `inverse-surface` and `inverse-on-surface` for dark mode.
- `--font-headline` using PT Serif.
- `--font-body` using Geist.
- Shared gutter, stack, and maximum-container values.

Responsive behavior:

- The sticky desktop header uses a three-column grid so primary navigation remains centered between the logo and controls.
- The category sidebar appears at the `lg` breakpoint and remains sticky below the header.
- Below the desktop navigation breakpoint, a burger menu contains search, categories, primary links, and Bookmarks.
- The mobile menu has a viewport-relative maximum height and scrolls on shorter devices.
- Main content fills the remaining width and uses consistent shared heading dividers.

Dark mode is class-based. The initial theme script runs in the document head to avoid a flash of the wrong theme. It uses a saved `theme` value when present and otherwise follows `prefers-color-scheme`.

## Accessibility

The interface includes:

- A skip link targeting `#main-content`.
- Semantic header, navigation, aside, main, article, list, time, and footer elements.
- Accessible names for icon-only controls.
- `aria-current` on active routes.
- `aria-expanded` and `aria-controls` for expandable search and mobile navigation.
- `aria-pressed` for bookmark state.
- An `aria-live` bookmark counter and bookmark list.
- Screen-reader-only context for external links.
- Visible `:focus-visible` styles.
- Proper input labels, including visually hidden labels where appropriate.
- Reduced animation when `prefers-reduced-motion: reduce` is enabled.
- Theme-aware contrast and focus treatments.

When adding a new interaction, preserve keyboard operation and update ARIA state at the same time as visual state.

## Build and deployment

### Build pipeline

`npm run build` performs these stages:

1. Astro validates and loads content.
2. Static routes, XML feeds, text endpoints, assets, and metadata are generated in `dist/`.
3. The sitemap integration emits sitemap files.
4. The compression integration optimizes final output.
5. npm automatically runs `postbuild`.
6. Pagefind indexes `dist/` and writes its search assets into the build.

The Astro configuration also enables viewport-based prefetching, constrained image layout, automatic stylesheet inlining, MDX support, and trailing slashes.

### Cloudflare

`wrangler.jsonc` configures a static Cloudflare asset deployment:

```json
{
  "name": "web-design-feed",
  "assets": {
    "directory": "./dist"
  },
  "observability": {
    "enabled": true
  }
}
```

A typical deployment flow is:

```bash
npm install
npm run check
npm run build
npx wrangler deploy
```

Confirm the exact deployment command used by the hosting account before running it in automation. The repository currently contains no CI workflow, so deployment orchestration is external to this project.

After deployment, verify:

- The homepage and one generated category page return `200`.
- An unknown URL returns a real `404` status rather than a soft 404.
- `/rss.xml`, `/featured.xml`, `/llms.txt`, and the sitemap load successfully.
- Search returns results from the deployed Pagefind index.
- Security headers are present.
- The newsletter form opens the expected Buttondown flow.

## Security and caching

`public/_headers` defines host-level response headers for compatible static hosts.

Security headers include:

- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- A strict referrer policy.
- HSTS with subdomains and preload.
- A restrictive Permissions Policy.
- A Content Security Policy limiting scripts, styles, fonts, images, connections, framing, and form submission.

The current CSP permits inline scripts because the early theme script must run before paint. If Astro's automatic CSP hashing becomes suitable for the project, this allowance can be tightened.

Caching rules:

- HTML uses revalidation semantics.
- Fingerprinted `/_astro/*` assets are cached for one year and marked immutable.
- XML and text endpoints use a short five-minute cache with revalidation.

If a new external service is added, update the CSP narrowly for only the required directive and origin.

## Testing and quality checks

Run before committing or deploying:

```bash
npm run check
npm run build
```

Recommended manual checks:

1. Test homepage, category, Featured, Search, Bookmarks, Newsletter, and About layouts.
2. Check desktop, tablet, and mobile widths.
3. Open and close the desktop search with mouse and keyboard.
4. Open the mobile menu and verify it scrolls on a short viewport.
5. Toggle light and dark modes, then reload to confirm persistence.
6. Add and remove a bookmark; verify the header count and Bookmarks page update.
7. Open and dismiss the share menu.
8. Confirm only featured stories show the brand-colored star.
9. Navigate entirely by keyboard and inspect focus visibility.
10. Test reduced motion through the operating system or browser emulation.
11. Preview the production build and perform a real Pagefind search.
12. Validate the RSS feeds and inspect canonical/social metadata.

At the time this README was written, `astro check` reports no errors. It does report existing informational deprecation hints from Astro's content-schema compatibility surface and an unused `SITE_LOGO` import in the footer; these do not currently fail the build.

## Troubleshooting

### Search says it is only available on the deployed site

This is expected during `astro dev`. Build and preview the production output:

```bash
npm run build
npm run preview
```

### A story fails content validation

Check the terminal output for the exact field. Common causes are:

- An invalid or non-absolute `url`.
- A `description` longer than 280 characters.
- A category slug not present in `CATEGORIES`.
- A malformed `publishedAt` value.
- A non-array `tags` value.

### A category page is missing

Confirm the category exists in `CATEGORIES`, has matching description and blurb entries, and that the project has been rebuilt. Category routes are generated at build time.

### A tag page is missing

Tag routes are derived from tags actually used by story files. Add the tag to at least one story and rebuild.

### The featured star is missing

Confirm the story has boolean frontmatter, not a quoted string:

```yaml
featured: true
```

### Bookmarks disappeared

Bookmarks are stored only in `localStorage`. Check that the same browser profile and origin are being used and that site data has not been cleared.

### The bookmark count does not update in another tab

Both pages must use the same origin and storage partition. The project listens for the native `storage` event, which is emitted in other tabs after a storage change.

### Dark mode flashes or resets

Check that the inline theme script in `MainHead.astro` is present and permitted by the deployed CSP. Also inspect the stored `theme` key in browser storage.

### Newsletter submissions fail

Verify the Buttondown form action, publication name, deployed CSP `form-action`, and the external service status.

### Fonts or icons do not load

Check network access to Google Fonts and confirm the deployed CSP still permits `fonts.googleapis.com` and `fonts.gstatic.com`.

## Maintenance checklist

### Adding content

- Validate the source URL and publisher name.
- Write an original description under 280 characters.
- Assign one supported category and useful lowercase tags.
- Use a timezone-aware date.
- Decide whether the story is featured.
- Check the original link still resolves.

### Changing branding

- Update `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `SITE_LOGO`, and `TWITTER_HANDLE` in `src/consts.ts`.
- Update `site` in `astro.config.mjs`.
- Replace favicon, manifest, and Open Graph assets in `public/`.
- Review theme colors in `global.css` and `manifest.webmanifest`.
- Review metadata, feed titles, `robots.txt`, and external account URLs.

### Changing domains or hosting

- Update all production origins.
- Review canonical URLs and the sitemap.
- Confirm `_headers` syntax is supported by the new host.
- Confirm 404 status behavior.
- Re-test Pagefind asset paths.
- Re-test newsletter CSP permissions.

### Updating dependencies

1. Review Astro, Tailwind, Pagefind, and integration release notes.
2. Update packages with npm so `package-lock.json` stays synchronized.
3. Run `npm run check`.
4. Run a clean production build.
5. Test search, images, feeds, sitemap output, and compressed assets.
6. Re-check any content-schema deprecation messages before changing schema APIs.

## Project status and ownership

This repository is a content-driven static site with no database, authentication system, administration interface, or server-side bookmark sync. Content is managed directly in the repository and deployed through an external hosting workflow.

No license is currently declared in this repository. Add a `LICENSE` file before distributing or reusing the code outside its intended project context.
