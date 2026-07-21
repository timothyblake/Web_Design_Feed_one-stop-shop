import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, categoryLabel } from '../consts';

export const GET: APIRoute = async () => {
  const stories = (await getCollection('stories')).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );

  const lines = [
    `# ${SITE_TITLE}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Every entry links to the original article on its source site — this is a curated reading list, not a republishing platform.`,
    '',
    '## Feeds',
    '',
    `- [All stories (RSS)](${SITE_URL}/rss.xml)`,
    `- [Featured stories (RSS)](${SITE_URL}/featured.xml)`,
    '',
    '## Recent stories',
    '',
    ...stories
      .slice(0, 50)
      .map((story) => `- [${story.data.title}](${story.data.url}) — ${categoryLabel(story.data.category)}: ${story.data.description}`),
  ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
