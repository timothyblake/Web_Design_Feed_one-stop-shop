// Bulk-populate Sanity `story` documents from a JSON file.
//
// Usage:
//   node scripts/import-stories-json.mjs path/to/stories.json
//   (defaults to scripts/stories.example.json if no path is given)
//
// See scripts/stories.example.json for the expected shape.
//
// Idempotent: each story gets a deterministic _id derived from its `url`,
// so re-running the same file updates existing documents instead of
// duplicating them — safe to use as a repeatable "sync this file" workflow
// (e.g. regenerating stories.json from an LLM and re-running).
//
// Requires PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET, and
// SANITY_API_TOKEN (an "Editor" token from sanity.io/manage) in .env.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { createClient } from '@sanity/client';

// Kept in sync with src/consts.ts CATEGORIES and sanity/schemaTypes/story.ts.
const VALID_CATEGORIES = ['ui-design', 'front-end', 'back-end', 'tools', 'career'];
const REQUIRED_FIELDS = ['title', 'url', 'description', 'source', 'category'];

const inputPath = process.argv[2] ?? 'scripts/stories.example.json';

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

function idForUrl(url) {
  return `story-${createHash('sha1').update(url).digest('hex').slice(0, 16)}`;
}

function validate(entry, index) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!entry[field] || typeof entry[field] !== 'string') {
      errors.push(`missing/invalid "${field}"`);
    }
  }
  if (entry.category && !VALID_CATEGORIES.includes(entry.category)) {
    errors.push(`"category" must be one of ${VALID_CATEGORIES.join(', ')}, got "${entry.category}"`);
  }
  if (entry.tags && !Array.isArray(entry.tags)) {
    errors.push('"tags" must be an array of strings');
  }
  if (entry.url) {
    try {
      new URL(entry.url);
    } catch {
      errors.push(`"url" is not a valid URL: ${entry.url}`);
    }
  }
  if (errors.length > 0) {
    console.error(`Skipping entry ${index} (${entry.title ?? 'untitled'}): ${errors.join('; ')}`);
    return false;
  }
  return true;
}

async function main() {
  const raw = await readFile(path.resolve(process.cwd(), inputPath), 'utf-8');
  const entries = JSON.parse(raw);

  if (!Array.isArray(entries)) {
    console.error('Expected the JSON file to contain a top-level array of story objects.');
    process.exit(1);
  }

  console.log(`Read ${entries.length} entries from ${inputPath}`);

  let synced = 0;
  let skipped = 0;

  for (const [index, entry] of entries.entries()) {
    if (!validate(entry, index)) {
      skipped += 1;
      continue;
    }

    const doc = {
      _id: idForUrl(entry.url),
      _type: 'story',
      title: entry.title,
      url: entry.url,
      description: entry.description,
      source: entry.source,
      category: entry.category,
      tags: entry.tags ?? [],
      featured: Boolean(entry.featured),
      publishedAt: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : new Date().toISOString(),
    };

    const result = await client.createOrReplace(doc);
    console.log(`Synced: ${result.title} (${result._id})`);
    synced += 1;
  }

  console.log(`\nDone. Synced ${synced}, skipped ${skipped} (validation errors).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
