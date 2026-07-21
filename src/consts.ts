export const SITE_TITLE = 'Web Design Feed';
export const SITE_DESCRIPTION =
  'A curated feed of the best UI design, front-end and back-end development stories from around the web.';
export const SITE_URL = 'https://webdesignfeed.com';
export const SITE_LOGO =
  'https://webdesignfeed.com/wp-content/themes/webDesign-feed-one_stop_shop/assets/svg/web-design-feed-logo.svg';
export const DEFAULT_LANG = 'en-GB';
export const TWITTER_HANDLE = '@webdesignfeed';

export const CATEGORIES = [
  { slug: 'ui-design', label: 'UI Design', icon: 'palette', pill: 'secondary' },
  { slug: 'front-end', label: 'Front-end', icon: 'code', pill: 'accent-dark' },
  { slug: 'back-end', label: 'Back-end', icon: 'terminal', pill: 'secondary' },
  { slug: 'tools', label: 'Tools', icon: 'construction', pill: 'accent-dark' },
  { slug: 'career', label: 'Career', icon: 'work', pill: 'secondary' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_DESCRIPTIONS: Record<CategorySlug, string> = {
  'ui-design':
    'Explore thoughtful interface design, design systems, accessibility, typography, color, and the craft behind better digital products.',
  'front-end':
    'Stay current with practical CSS, JavaScript, frameworks, browser APIs, accessibility, performance, and modern front-end architecture.',
  'back-end':
    'Discover articles on APIs, databases, servers, cloud infrastructure, security, scalability, and production back-end engineering.',
  tools:
    'Find useful design and development tools, workflow improvements, extensions, releases, and software worth adding to your stack.',
  career:
    'Get practical advice on portfolios, hiring, interviews, workplace skills, leadership, and building a sustainable web career.',
};

// Unique per-category copy for the SEO blurb block on each /category/ page —
// keeps those pages from reading as thin, near-duplicate content.
export const CATEGORY_BLURBS: Record<CategorySlug, string[]> = {
  'ui-design': [
    'UI Design stories cover the craft of building interfaces: layout, typography, color systems, motion, and the design decisions behind products people use every day.',
    "Expect deep dives into design systems, accessibility-first patterns, and critiques of what's working (and what isn't) in modern product design.",
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
  tools: [
    'Tools stories round up the software, extensions, and workflows that make front-end and back-end work faster.',
    'From design tooling like Figma to developer tooling and DevOps utilities, this category tracks what practitioners are actually adopting.',
    'Curated for signal over noise — no listicles, just tools worth your attention.',
  ],
  career: [
    'Career stories cover the non-code side of the job: hiring, portfolios, interviews, and how to grow from junior to senior.',
    'Expect first-hand accounts from hiring managers and engineers navigating the same career questions you are.',
    'Read the source article in full — these links go straight to the original author.',
  ],
};

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function categoryPillClass(slug: string): string {
  const pill = CATEGORIES.find((c) => c.slug === slug)?.pill ?? 'secondary';
  return pill === 'accent-dark' ? 'bg-accent-dark' : 'bg-secondary';
}
