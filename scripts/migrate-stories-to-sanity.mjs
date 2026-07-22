// One-time import: src/content/stories/*.md -> Sanity `story` documents.
//
// Usage (after `sanity login` + `sanity init` + setting env vars):
//   node scripts/migrate-stories-to-sanity.mjs
//
// Requires PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, and
// SANITY_API_TOKEN (an "Editor" token from sanity.io/manage) in .env.
// Safe to re-run: existing documents are matched and skipped by `url`.
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { createClient } from '@sanity/client';

const STORIES_DIR = path.join(process.cwd(), 'src/content/stories');

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_TOKEN;

if (!projectId || projectId === 'your-project-id' || !dataset || !token) {
  console.error(
    'Missing/placeholder Sanity credentials. Set PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, and SANITY_API_TOKEN in .env before running this script.'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
});

async function main() {
  const files = (await readdir(STORIES_DIR)).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`Found ${files.length} markdown stories in ${STORIES_DIR}`);

  const existingUrls = new Set(
    (await client.fetch(`*[_type == "story"].url`)) ?? []
  );

  let created = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = await readFile(path.join(STORIES_DIR, file), 'utf-8');
    const { data } = matter(raw);

    if (existingUrls.has(data.url)) {
      console.log(`Skipping (already in Sanity): ${data.title}`);
      skipped += 1;
      continue;
    }

    const doc = {
      _type: 'story',
      title: data.title,
      url: data.url,
      description: data.description,
      source: data.source,
      category: data.category,
      tags: data.tags ?? [],
      featured: Boolean(data.featured),
      publishedAt: new Date(data.publishedAt).toISOString(),
    };

    const result = await client.create(doc);
    console.log(`Created: ${result.title} (${result._id})`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped} (already present).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
