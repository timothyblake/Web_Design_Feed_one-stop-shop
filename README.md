# Web Design Feed

Web Design Feed is a statically generated editorial feed that curates useful UI and UX design, front-end, web development, resources, and business articles from around the web. Every story card links directly to the original publisher; the site is a discovery and reading-list product, not a republishing platform.

The project is built with Astro, TypeScript, Tailwind CSS, and Sanity. Editors manage stories in the embedded Sanity Studio; Astro fetches and validates the published documents at build time, then generates the main feed, category and tag archives, a featured collection, RSS feeds, structured SEO data, a client-side search page, and an AI-readable `llms.txt` endpoint.

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
- Sanity-backed story management through the embedded Studio at `/studio`.
- Six curated categories: UI & UX Design, Design, Front-end, Web Development, Resources, and Business.
- Dynamically generated category and tag archive pages.
- Featured-story collection with a branded star indicator.
- Client-side story search on `/search` — filters already-rendered cards as you type, no build step or index required.
- Browser-local bookmarks with a live count in the header.
- Share controls for X, LinkedIn, Facebook, the Web Share API, and copying a link.
- Dedicated all-stories and featured-only RSS feeds.
- Monthly newsletter subscription via Buttondown, behind a custom `newsletters.webdesignfeed.com` domain with reCAPTCHA spam protection.
- Responsive desktop sidebar and mobile burger navigation.
- A consistent light-only visual theme.
- Canonical URLs, Open Graph metadata, Twitter cards, JSON-LD, a sitemap, robots rules, and `llms.txt`.
- Cloudflare static asset configuration, security headers, and long-lived caching for fingerprinted assets.
- Reduced-motion support, visible keyboard focus, semantic landmarks, skip navigation, and accessible control labels.

## Technology

| Area | Implementation |
| --- | --- |
| Framework | Astro 7 |
| Language | TypeScript with Astro's strict configuration |
| Content | Sanity Content Lake, loaded through Astro's Content Layer and a validated Zod schema |
| Administration | Embedded Sanity Studio at `/studio`, with Structure and Vision tools |
| Styling | Tailwind CSS 4 through the Vite plugin |
| Search | Custom client-side filter (`src/pages/search.astro`) — no external index |
| Feeds | `@astrojs/rss` |
| SEO | Astro Sitemap, canonical metadata, social metadata, and JSON-LD |
| Fonts | Astro Fonts API using Mona Sans and Geist |
| Optimization | `@playform/compress` and Astro image handling |
| Deployment target | Static assets configured for Cloudflare via Wrangler |

The public site does not hydrate a client framework for its interface; interactive behavior uses small browser-side TypeScript modules and `<script>` blocks inside Astro components. React is included only to run the embedded Sanity Studio.

## Requirements

- Node.js `22.12.0` or newer.
- npm, using the committed `package-lock.json` for reproducible installs.
- Access to a Sanity project and dataset.
- A local `.env` file containing `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`, and `PUBLIC_SANITY_API_VERSION`.
- `SANITY_API_TOKEN` only when running a write-capable import or migration script; normal site builds and Studio sign-in do not use this server-side token.

External services used by the current implementation are:

- Sanity Content Lake for stories and Sanity Studio for administration.
- Google Fonts and Material Symbols.
- Google's favicon service for source-site icons.
- Buttondown for newsletter subscriptions, behind the custom domain `newsletters.webdesignfeed.com`.
- Google reCAPTCHA for spam protection on the newsletter form.

`pagefind` still ships as a devDependency with a `postbuild` script that indexes `dist/` on every build (see [Search](#search)), but nothing on the site queries that index — it's leftover from an earlier implementation and safe to ignore or remove.

## Getting started

Install dependencies from the project root:

```bash
npm install
```

Create the local environment file and replace the placeholder project ID with the ID from [Sanity Manage](https://www.sanity.io/manage):

```bash
cp .env.example .env
```

The public Sanity variables configure both the build-time story loader and the embedded Studio. Keep `SANITY_API_TOKEN` empty unless you need to run an import script, and never commit a real token.

Start the Astro development server in background mode:

```bash
npm run astro -- dev --background
```

The site is available at `http://localhost:4321/` by default.
The embedded administration interface is available at `http://localhost:4321/studio` and uses Sanity authentication.

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

Search works identically in `npm run dev` and in a production build — it's a client-side filter over already-rendered cards, not a generated index. The production build is still worth previewing before shipping (see [Testing and quality checks](#testing-and-quality-checks)), but not specifically to test search.

## Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install locked dependencies. |
| `npm run dev` | Start the normal foreground Astro development server. |
| `npm run astro -- dev --background` | Start the background development server used by this workspace. |
| `npm run build` | Generate the static site in `dist/`, then run an unused Pagefind index through `postbuild` (see [Search](#search)). |
| `npm run preview` | Serve the generated `dist/` output locally. |
| `npm run check` | Run Astro and TypeScript diagnostics. |
| `npm run import:stories -- path/to/stories.json` | Import or update stories from a JSON array; requires `SANITY_API_TOKEN`. |
| `npm run migrate:sanity` | One-time migration of the legacy Markdown stories into Sanity; requires `SANITY_API_TOKEN`. |
| `npm run astro -- --help` | Display the Astro CLI help. |

## Project structure

```text
.
├── public/
│   ├── _headers                 # Security and cache headers
│   ├── apple-touch-icon.png
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── og-default.png           # Default social sharing image
│   ├── robots.txt
│   ├── site.webmanifest
│   ├── web-app-manifest-192x192.png
│   └── web-app-manifest-512x512.png
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Footer.astro
│   │   │   ├── Header.astro
│   │   │   ├── MainHead.astro
│   │   │   └── SideNav.astro
│   │   └── ui/
│   │       ├── Breadcrumb.astro
│   │       ├── NewsletterForm.astro
│   │       ├── PageHeading.astro
│   │       ├── SeoBlurb.astro
│   │       └── StoryCard.astro
│   ├── content/
│   │   └── stories/             # Legacy Markdown retained for the migration script
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── loaders/
│   │   └── sanityStories.ts     # GROQ-backed Astro Content Layer loader
│   ├── lib/
│   │   └── bookmarks-client.ts
│   ├── pages/                   # File-based routes and generated endpoints
│   ├── styles/
│   │   └── global.css           # Tailwind theme tokens and global behavior
│   ├── utils/
│   │   └── formatDate.ts
│   ├── consts.ts                # Site identity, categories, and category copy
│   └── content.config.ts        # Sanity-backed story collection and validation schema
├── sanity/
│   └── schemaTypes/
│       ├── index.ts
│       └── story.ts             # Sanity Studio story document schema
├── scripts/
│   ├── import-stories-json.mjs
│   └── migrate-stories-to-sanity.mjs
├── astro.config.mjs
├── sanity.config.ts             # Embedded Studio configuration
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

Generated files in `dist/` and installed packages in `node_modules/` are build artifacts and should not be edited manually.

## Application architecture

### Static generation

`src/loaders/sanityStories.ts` queries published `story` documents from Sanity with GROQ at development and build time. The loader projects the fields used by the site, normalizes legacy category slugs, and passes each document through the Zod schema in `src/content.config.ts` before storing it in Astro's Content Layer. Pages call `getCollection('stories')`, sort stories by `publishedAt`, and filter by category, tag, or featured state as needed.

The site is configured with a canonical production origin of `https://webdesignfeed.com` and `trailingSlash: 'never'`, so page URLs and canonical links omit trailing slashes.

### Administration

The `@sanity/astro` integration mounts Sanity Studio at `/studio`. `sanity.config.ts` registers the story schema, Structure tool, and Vision tool, while `/studio/callback` completes the Studio authentication redirect. Studio access is governed by the Sanity project's members and roles.

Because the public site is statically generated, publishing a story in Studio changes the content in Sanity immediately but does not update an existing deployment by itself. Run a new build and deploy it, or connect a Sanity webhook to the hosting provider, to publish the change on the website.

### Shared layout

`src/layouts/BaseLayout.astro` provides the document shell:

1. `MainHead.astro` creates metadata, feed discovery links, fonts, and structured data.
2. `Header.astro` renders centered desktop navigation, expandable search, the bookmark count, and mobile navigation.
3. `SideNav.astro` renders category filtering and the compact subscription card on desktop.
4. The route's content is rendered inside the main landmark.
5. `Footer.astro` renders feed and informational links.

The category sidebar is enabled by default. Individual pages can opt out with `showSideNav={false}` when needed.

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
| `/2`, `/3`, etc. | `src/pages/[...page].astro` | Indexed | Additional feed pages when enough stories exist. |
| `/featured`, `/featured/2`, etc. | `src/pages/featured/[...page].astro` | Indexed | Stories marked `featured: true`, paginated. |
| `/feeds` | `src/pages/feeds.astro` | Indexed | Landing page for the complete and featured-only RSS feeds. |
| `/:category-slug` | `src/pages/[slug]/[...page].astro` | Indexed | Statically generated, paginated archive for each configured category. |
| `/tag/:slug` | `src/pages/tag/[slug]/[...page].astro` | Noindex | Statically generated, paginated archive for every tag found in Sanity stories (deliberately noindexed to avoid thin/duplicate-content pages — see the comment at the top of that file). |
| `/search` | `src/pages/search.astro` | Noindex | Client-side search — filters already-rendered story cards, no build step required. |
| `/bookmarks` | `src/pages/bookmarks.astro` | Noindex | Browser-local saved stories. |
| `/newsletter` | `src/pages/newsletter.astro` | Indexed | Newsletter explanation and subscription form. |
| `/bookmarklet` | `src/pages/bookmarklet.astro` | Noindex | Internal tool for creating a Sanity Story draft from the current page's metadata. |
| `/about` | `src/pages/about.astro` | Indexed | Project purpose and editorial approach. |
| `/studio` | `@sanity/astro` | Noindex | Embedded Sanity Studio administration interface. |
| `/studio/callback` | `src/pages/studio/callback.astro` | Noindex | Completes the Sanity Studio authentication flow. |
| `/rss.xml` | `src/pages/rss.xml.js` | Feed | All stories, linking directly to their original sources. |
| `/featured.xml` | `src/pages/featured.xml.js` | Feed | Featured stories only. |
| `/llms.txt` | `src/pages/llms.txt.ts` | Text | Site summary, feed links, and up to 50 recent stories for AI clients. |
| `/404.html` | `src/pages/404.astro` | Noindex | Static not-found page. |

## Managing stories

### Story schema

Every `story` document is authored against `sanity/schemaTypes/story.ts` and must also pass the site-facing schema in `src/content.config.ts` when Astro loads it.

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
| `image` | Sanity image | No | Optional image asset stored by Sanity and projected as a Sanity CDN URL. |
| `imageAlt` | string | No | Alternative text for the optional image. Use an empty value only for decorative imagery. |

### Example story

The equivalent document shape is:

```json
{
  "_type": "story",
  "title": "A Practical Guide to Container Queries",
  "url": "https://example.com/container-queries",
  "description": "Patterns for building components that adapt to their available space instead of the viewport.",
  "source": "Example Publication",
  "category": "front-end",
  "tags": ["css", "layout"],
  "featured": false,
  "publishedAt": "2026-07-21T09:00:00Z"
}
```

### Add a story

1. Open `/studio` locally or on the deployed site and sign in with an authorized Sanity account.
2. Create a **Story** document.
3. Add the title, original article URL, description, source, category, tags, and publication date.
4. Keep the description within 280 characters and use exactly one supported category.
5. Add an optional thumbnail and meaningful image alternative text.
6. Enable **Featured** only if the story belongs in the editor's picks.
7. Publish the document in Studio.
8. Run and deploy a new production build so the static site, feeds, and sitemap include the change.

Story ordering is automatic: all feed-like pages sort `publishedAt` from newest to oldest.

For bulk operations, `npm run import:stories -- path/to/stories.json` accepts an array shaped like the example above. It requires a non-public `SANITY_API_TOKEN` with write permission. The Markdown files in `src/content/stories` are retained only as input for the one-time `migrate:sanity` script and are not the live content source.

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
4. Update `CATEGORY_OPTIONS` in `sanity/schemaTypes/story.ts`.
5. Add or update Sanity story documents using the new slug.
6. Run `npm run check`; the `Record<CategorySlug, ...>` types will catch missing category copy.
7. Run `npm run build` and inspect the generated `/<category-slug>` route.

The Astro content schema derives its enum from `CATEGORIES`, while Studio maintains a matching category option list. Keep both definitions synchronized so Studio authors can select every supported category and builds reject unrecognized values.

## Featured stories

Featured status is controlled by the **Featured** boolean field on each Sanity story document.

A featured story appears:

- In the normal chronological feed.
- On `/featured`.
- In `/featured.xml`.
- With a filled star using the site's `secondary` brand color.

The featured RSS feed is intended to support the monthly newsletter workflow. Removing or changing `featured` updates the generated page and feed on the next build.

## Search

`src/pages/search.astro` renders every story into the page (each wrapped in an `<li hidden>`), then a small client-side script filters them by substring match across title, description, source, category, and tags as the user types. There's no external index, no build step, and no separate infrastructure — it works identically in `astro dev` and in a production build.

Consequences:

- Search is excluded from indexing through page metadata and `robots.txt` because query-result pages should not become search-engine landing pages.
- Because every story ships into the page up front, this approach is best suited to a catalog of a few hundred stories or fewer. If the story count grows substantially, consider a real search index or server-side query instead.
- `package.json` still has a `postbuild` script that runs `pagefind --site dist` (a leftover from an earlier implementation). It generates a Pagefind index in `dist/`, but nothing on the site queries it — safe to remove along with the `pagefind` devDependency if you don't plan to revisit it.

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

`NewsletterForm.astro` (rendered on `/newsletter`) submits a standard full-page POST — not a popup, no client-side interception — to:

```text
https://newsletters.webdesignfeed.com/subscribe
```

That's Buttondown behind our own custom domain, not `buttondown.email` directly. The form also embeds a Google reCAPTCHA widget (`recaptcha/api.js`, hardcoded sitekey in the component) and a hidden honeypot field (`name="hp"`, `tabindex="-1"`, `aria-hidden`) for basic spam mitigation.

If the newsletter provider or domain changes, update the form `action` in `NewsletterForm.astro` **and** the CSP in `public/_headers`:

- `form-action` must include the exact origin the form posts to.
- `script-src` must allow `https://www.google.com` and `https://www.gstatic.com` for reCAPTCHA to load.
- `frame-src` must allow `https://www.google.com` for reCAPTCHA's challenge iframe.

A mismatch here fails silently in the browser (the CSP just blocks the request) — see [Newsletter submissions fail](#newsletter-submissions-fail) in Troubleshooting.

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
- The interface is light-only; there are no dark-mode variants or inverse theme tokens.
- `--font-headline` using Mona Sans.
- `--font-body` using Geist.
- Shared gutter, stack, and maximum-container values.

Responsive behavior:

- The sticky desktop header uses a three-column grid so primary navigation remains centered between the logo and controls.
- The category sidebar appears at the `lg` breakpoint and remains sticky below the header.
- Below the desktop navigation breakpoint, a burger menu contains search, categories, primary links, and Bookmarks.
- The mobile menu has a viewport-relative maximum height and scrolls on shorter devices.
- Main content fills the remaining width and uses consistent shared heading dividers.

The site uses a fixed light theme and does not change its palette based on browser or operating-system preferences.

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
- High-contrast text and focus treatments.

When adding a new interaction, preserve keyboard operation and update ARIA state at the same time as visual state.

## Build and deployment

### Build pipeline

`npm run build` performs these stages:

1. Astro validates and loads content.
2. Static routes, XML feeds, text endpoints, assets, and metadata are generated in `dist/`.
3. The sitemap integration emits sitemap files.
4. The compression integration optimizes final output.
5. npm automatically runs `postbuild`, which indexes `dist/` with Pagefind — output that nothing on the site currently queries (see [Search](#search)).

The Astro configuration also enables viewport-based prefetching, constrained image layout, automatic stylesheet inlining, MDX support for any future non-story pages, and no-trailing-slash page URLs.

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

Confirm the exact deployment command used by the hosting account before running it in automation. `.github/workflows/ci.yml` runs `npm run check` and `npm run build` on every push and pull request to `main`, but it does not deploy — deployment is still a manual `wrangler deploy` (or whatever the hosting account actually runs), external to this project. The CI job sets `PUBLIC_SANITY_*` directly as job-level env vars since those are `PUBLIC_`-prefixed values already shipped to the client bundle, not secrets.

After deployment, verify:

- The homepage and one generated category page return `200`.
- An unknown URL returns a real `404` status rather than a soft 404.
- `/rss.xml`, `/featured.xml`, `/llms.txt`, and the sitemap load successfully.
- Typing in `/search` filters results.
- Security headers are present.
- Submitting the newsletter form on `/newsletter` actually completes (open the browser console and check for CSP violation errors first if it doesn't).

## Security and caching

`public/_headers` defines host-level response headers for compatible static hosts.

Security headers include:

- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- A strict referrer policy.
- HSTS with subdomains and preload.
- A restrictive Permissions Policy.
- A Content Security Policy limiting scripts, styles, fonts, images, connections, framing, and form submission.

The current CSP permits inline scripts for the generated JSON-LD structured-data blocks. If Astro's automatic CSP hashing becomes suitable for the project, this allowance can be tightened.

The CSP also carries a few third-party allowances tied to specific features — narrow, not blanket:

- `form-action` includes `https://newsletters.webdesignfeed.com`, where the newsletter form actually submits (see [Newsletter](#newsletter)).
- `script-src`, `frame-src`, and `connect-src` include `https://www.google.com` (and `https://www.gstatic.com` for scripts) for the reCAPTCHA widget on that same form.
- `connect-src` includes `https://*.api.sanity.io`, `https://*.apicdn.sanity.io`, and `wss://*.api.sanity.io` for the embedded Studio at `/studio` — without these the Studio's own API and realtime requests are CSP-blocked, which surfaces in the browser as a "Couldn't reach the Sanity servers" network error even when the API itself is reachable and CORS is configured correctly.

If either the newsletter provider/domain or the spam-protection service changes, these need to change with it — see [Changing domains or hosting](#changing-domains-or-hosting).

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
5. Add and remove a bookmark; verify the header count and Bookmarks page update.
6. Open and dismiss the share menu.
7. Confirm only featured stories show the brand-colored star.
8. Navigate entirely by keyboard and inspect focus visibility.
9. Test reduced motion through the operating system or browser emulation.
10. Type a query into `/search` and confirm results filter correctly (works in `astro dev`, no build required).
11. Validate the RSS feeds and inspect canonical/social metadata.
12. Submit the newsletter form end-to-end against a deployed build, including the reCAPTCHA challenge.

At the time this README was updated, `astro check` reports no errors, warnings, or hints.

## Troubleshooting

### Search returns no results even though stories exist

Check the browser console for a JS error in the search script rather than assuming the index is stale — there is no index. Search filters `<li data-search-item>` elements already present in the page's HTML, so if a story is missing from search, confirm it actually appears in the underlying story collection (same causes as [Sanity stories do not appear](#sanity-stories-do-not-appear)).

### Sanity stories do not appear

Confirm `PUBLIC_SANITY_PROJECT_ID` and `PUBLIC_SANITY_DATASET` are set in `.env`, then inspect the development or build log for the loader's story count. The loader clears the collection and skips the fetch when the variables are missing or still use the placeholder project ID.

If the connection succeeds but a story fails content validation, check the terminal output for the exact field. Common causes are:

- An invalid or non-absolute `url`.
- A `description` longer than 280 characters.
- A category slug not present in `CATEGORIES`.
- A malformed `publishedAt` value.
- A non-array `tags` value.

### A category page is missing

Confirm the category exists in `CATEGORIES`, has matching description and blurb entries, and that the project has been rebuilt. Category routes are generated at build time.

### A tag page is missing

Tag routes are derived from tags used by published Sanity story documents. Add the tag to at least one story, publish it, and rebuild.

### The featured star is missing

Confirm the Sanity story's **Featured** switch is enabled, the document is published, and the site has been rebuilt since the change.

### Studio does not load or sign-in does not complete

Check that the Sanity public environment variables match the intended project and dataset. Confirm both `studioBasePath` in `astro.config.mjs` and `basePath` in `sanity.config.ts` remain `/studio`, and that `/studio/callback` is available on the same origin.

### Bookmarks disappeared

Bookmarks are stored only in `localStorage`. Check that the same browser profile and origin are being used and that site data has not been cleared.

### The bookmark count does not update in another tab

Both pages must use the same origin and storage partition. The project listens for the native `storage` event, which is emitted in other tabs after a storage change.

### Newsletter submissions fail

This has historically been a CSP mismatch, not a form or Buttondown problem — check the browser console for `Content-Security-Policy` violation errors first. Confirm `public/_headers` allows all of:

- `form-action` includes the exact origin `NewsletterForm.astro`'s `action` attribute points to (currently `https://newsletters.webdesignfeed.com`).
- `script-src` includes `https://www.google.com` and `https://www.gstatic.com`, or the reCAPTCHA script itself won't load.
- `frame-src` includes `https://www.google.com`, or the reCAPTCHA challenge iframe won't render.

Only after ruling out CSP: verify the Buttondown publication is still active and the external service isn't down.

### Fonts or icons do not load

Check network access to Google Fonts and confirm the deployed CSP still permits `fonts.googleapis.com` and `fonts.gstatic.com`.

## Maintenance checklist

### Adding content

- Create and publish the story in Sanity Studio.
- Validate the source URL and publisher name.
- Write an original description under 280 characters.
- Assign one supported category and useful lowercase tags.
- Use a timezone-aware date.
- Decide whether the story is featured.
- Check the original link still resolves.
- Trigger a fresh site build and deployment.

### Changing branding

- Update `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `SITE_LOGO`, and `TWITTER_HANDLE` in `src/consts.ts`.
- Update `site` in `astro.config.mjs`.
- Replace favicon, manifest, and Open Graph assets in `public/`.
- Review theme colors in `global.css` and `site.webmanifest`.
- Review metadata, feed titles, `robots.txt`, and external account URLs.

### Changing domains or hosting

- Update all production origins.
- Review canonical URLs and the sitemap.
- Confirm `_headers` syntax is supported by the new host.
- Confirm 404 status behavior.
- Re-test the newsletter form and reCAPTCHA against the deployed CSP (see [Newsletter submissions fail](#newsletter-submissions-fail)).

### Updating dependencies

1. Review Astro, Tailwind, and Sanity integration release notes.
2. Update packages with npm so `package-lock.json` stays synchronized.
3. Run `npm run check`.
4. Run a clean production build.
5. Test search, images, feeds, sitemap output, and compressed assets.
6. Re-check any content-schema deprecation messages before changing schema APIs.

## Project status and ownership

This repository is a content-driven static Astro site backed by Sanity Content Lake. Story administration is provided by the embedded Sanity Studio at `/studio`, with access controlled by Sanity authentication and project roles. The public site has no reader accounts and bookmarks remain browser-local with no server-side synchronization. Publishing content requires a fresh static build and deployment.

No license is currently declared in this repository. Add a `LICENSE` file before distributing or reusing the code outside its intended project context.
