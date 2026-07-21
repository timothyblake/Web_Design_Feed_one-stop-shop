import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const stories = (await getCollection('stories')).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: stories.map((story) => ({
      title: story.data.title,
      description: story.data.description,
      // Link to the original article, not an on-site detail page — this
      // feed is what dlvr.it/Zapier watch to auto-post to Twitter/X.
      link: story.data.url,
      pubDate: story.data.publishedAt,
      categories: [story.data.category, ...story.data.tags],
      customData: `<source>${story.data.source}</source>`,
    })),
    customData: `<language>en-gb</language>`,
  });
}
