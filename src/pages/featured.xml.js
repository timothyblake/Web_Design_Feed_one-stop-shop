import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE } from '../consts';

export async function GET(context) {
  const stories = (
    await getCollection('stories', ({ data }) => data.featured)
  ).sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: `${SITE_TITLE} — Featured`,
    // Buttondown's RSS-to-email reads this feed to draft the weekly digest,
    // so the description doubles as the newsletter's framing copy.
    description: "Editor's picks — the best stories of the week, ready for the Friday digest.",
    site: context.site,
    items: stories.map((story) => ({
      title: story.data.title,
      description: story.data.description,
      link: story.data.url,
      pubDate: story.data.publishedAt,
      categories: [story.data.category, ...story.data.tags],
      customData: `<source>${story.data.source}</source>`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
