/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly PUBLIC_SANITY_API_VERSION: string;
  /** Used exclusively by the one-off seeder script (scripts/seed.ts) to populate initial Sanity data. */
  readonly SANITY_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
