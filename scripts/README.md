# Populating stories from a JSON file

`scripts/import-stories-json.mjs` bulk-creates/updates Sanity `story`
documents from a JSON file. See `scripts/stories.example.json` for a
starting point.

## Usage

```
npm run import:stories -- path/to/your-stories.json
```

Run with no argument to dry-run against the example file:

```
npm run import:stories
```

Requires `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`, and
`SANITY_API_TOKEN` (an **Editor**-permission token from
[sanity.io/manage](https://sanity.io/manage)) set in `.env`.

## Expected shape

Top-level JSON array; each object:

```json
{
  "title": "string, required",
  "url": "string, required, must be a valid URL",
  "description": "string, required, 1–280 chars",
  "source": "string, required",
  "category": "one of: ui-design | front-end | back-end | tools | career",
  "tags": ["optional", "array", "of", "strings"],
  "featured": false,
  "publishedAt": "optional ISO date, defaults to now"
}
```

## Behavior

- **Idempotent, not skip-based.** Each entry's `_id` is derived
  deterministically from its `url`, so re-running the same file *updates*
  existing documents instead of duplicating them. Good for iterating on a
  hand-written or generated file — edit, re-run, repeat.
- **Validates before writing.** A bad `category`, missing required field,
  or malformed `url` logs which entry and why, skips just that one, and
  keeps going instead of aborting the whole batch.
- Images aren't supported by this script yet (text fields only) — add them
  manually in Studio at `/studio/` after import if needed.

## Related: one-time markdown migration

`scripts/migrate-stories-to-sanity.mjs` was a one-off script used to move
the original `src/content/stories/*.md` files into Sanity when the project
first switched from local markdown to Sanity as the content source. It's
skip-based (matches on `url`, won't touch existing docs) rather than
idempotent — kept for reference, not the ongoing content workflow.
