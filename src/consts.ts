export const SITE_TITLE = 'Web Design Feed';
export const SITE_DESCRIPTION =
  'A curated feed of the best UI and UX design, front-end and back-end development stories from around the web.';
export const SITE_URL = 'https://webdesignfeed.com';
export const SITE_LOGO = '/web-design-feed-logo.svg';
export const DEFAULT_LANG = 'en-GB';
export const TWITTER_HANDLE = '@webdesignfeed';

export const CATEGORIES = [
  { slug: 'ui-ux-design', label: 'UI & UX Design', icon: 'palette', pill: 'secondary' },
  { slug: 'front-end', label: 'Front-end', icon: 'code', pill: 'accent-ink' },
  { slug: 'back-end', label: 'Back-end', icon: 'terminal', pill: 'secondary' },
  { slug: 'resources', label: 'Resources', icon: 'construction', pill: 'accent-ink' },
  { slug: 'business', label: 'Business', icon: 'work', pill: 'secondary' },
] as const;

// Longer-form title for the /category/ page itself (<h1>, <title>, breadcrumb).
// Falls back to the short `label` used everywhere else (sidenav, story pills).
const CATEGORY_PAGE_TITLES: Partial<Record<(typeof CATEGORIES)[number]['slug'], string>> = {
  'front-end': 'Front-end Development',
};

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

const LEGACY_CATEGORY_SLUGS: Record<string, CategorySlug> = {
  'ui-design': 'ui-ux-design',
  career: 'business',
  tools: 'resources',
};

// Keep stories and saved bookmarks created with the previous taxonomy working
// while Sanity records and browser storage transition to the new slugs.
export function normalizeCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_SLUGS[slug] ?? slug;
}

export const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  'ui-ux-design':
    'Explore thoughtful UI and UX design, design systems, accessibility, research, interaction patterns, and the craft behind better digital products.',
  'front-end':
    'Stay current with practical CSS, JavaScript, frameworks, browser APIs, accessibility, performance, and modern front-end architecture.',
  'back-end':
    'Discover articles on APIs, databases, servers, cloud infrastructure, security, scalability, and production back-end engineering.',
  resources:
    'Find useful design and development resources, tools, workflow improvements, extensions, releases, and software worth adding to your stack.',
  business:
    'Explore freelancing, agencies, pricing, client relationships, product strategy, leadership, and sustainable design and development businesses.',
};

// Unique per-category copy for the SEO blurb block on each /category/ page —
// keeps those pages from reading as thin, near-duplicate content.
export const CATEGORY_BLURBS: Record<CategorySlug, string[]> = {
  'ui-ux-design': [
    'UI & UX Design stories cover the full product-design process: research, interaction design, layout, typography, color systems, motion, and the decisions behind products people use every day.',
    "Expect deep dives into design systems, accessibility-first patterns, user experience, and critiques of what's working (and what isn't) in modern product design.",
    'These stories link to the original source — designers, agencies, and studios sharing their process in public.',
  ],
  'front-end': [
    'Front-end stories track the browser side of the stack: frameworks, CSS, JavaScript, performance, and the APIs shipping in evergreen browsers.',
    'Coverage leans practical — real patterns for building fast, accessible interfaces, not just framework hype.',
    "Follow along via the category page or subscribe to the full feed if you'd rather not check back manually.",
  ],
  'back-end': [
    'Back-end stories cover servers, databases, APIs, and the infrastructure decisions that keep products running at scale.',
    'Expect coverage of serverless platforms, database internals, caching strategies, and the trade-offs engineering teams make in production.',
    'Every entry links straight to the original writeup from the engineers who built it.',
  ],
  resources: [
    'Resources stories round up the software, references, extensions, and workflows that make design and development work faster.',
    'From design resources like Figma to developer tooling and DevOps utilities, this category tracks what practitioners are actually adopting.',
    'Curated for signal over noise — no listicles, just useful resources worth your attention.',
  ],
  business: [
    'Business stories cover the commercial side of design and development: freelancing, agencies, pricing, client work, product strategy, and sustainable growth.',
    'Expect practical lessons from founders, independent professionals, and teams building products and creative businesses.',
    'Read the source article in full — these links go straight to the original author.',
  ],
};

export function categoryLabel(slug: string): string {
  const normalizedSlug = normalizeCategorySlug(slug);
  return CATEGORIES.find((c) => c.slug === normalizedSlug)?.label ?? normalizedSlug;
}

export function categoryPageTitle(slug: string): string {
  const normalizedSlug = normalizeCategorySlug(slug);
  return CATEGORY_PAGE_TITLES[normalizedSlug as CategorySlug] ?? categoryLabel(normalizedSlug);
}

// The /category/ URL segment, slugified from categoryPageTitle — matches the
// existing short slug for every category except front-end, which now has a
// longer page title and therefore a longer URL.
export function categoryUrlSlug(slug: string): string {
  return categoryPageTitle(slug)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function categoryPillClass(slug: string): string {
  const normalizedSlug = normalizeCategorySlug(slug);
  const pill = CATEGORIES.find((c) => c.slug === normalizedSlug)?.pill ?? 'secondary';
  return pill === 'accent-ink' ? 'bg-accent-ink' : 'bg-secondary';
}
