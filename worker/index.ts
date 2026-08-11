import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

// Non-secret bindings are generated from wrangler.jsonc in
// worker-configuration.d.ts. Secret bindings are declared here because their
// names intentionally never appear in wrangler.jsonc.
export interface SanityWebhookEnv {
  SANITY_WEBHOOK_SECRET?: string;
  CLOUDFLARE_DEPLOY_HOOK_URL?: string;
}

type WorkerEnv = Cloudflare.Env & SanityWebhookEnv;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_WEBHOOK_BYTES = 16 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

const json = (body: unknown, status = 200, extraHeaders: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });

function isAllowedSourceUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2_048) return false;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase();
    return (
      hostname !== 'localhost' &&
      hostname !== '::1' &&
      !hostname.endsWith('.localhost') &&
      !/^127\./.test(hostname) &&
      !/^10\./.test(hostname) &&
      !/^192\.168\./.test(hostname) &&
      !/^169\.254\./.test(hostname) &&
      !/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

function isCloudflareDeployHookUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'api.cloudflare.com' &&
      !url.username &&
      !url.password &&
      /^\/client\/v4\/workers\/builds\/deploy_hooks\/[^/]+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

async function readTextBodyWithLimit(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > limit) {
        await reader.cancel();
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }

    return body + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

interface SanityWebhookPayload {
  _id?: unknown;
  _type?: unknown;
}

export async function triggerSanityBuild(
  request: Request,
  env: SanityWebhookEnv,
  outboundFetch: typeof fetch = fetch
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  if (!env.SANITY_WEBHOOK_SECRET || !env.CLOUDFLARE_DEPLOY_HOOK_URL) {
    return json({ error: 'Webhook secrets are not configured' }, 503);
  }
  if (!isCloudflareDeployHookUrl(env.CLOUDFLARE_DEPLOY_HOOK_URL)) {
    return json({ error: 'Build hook is not configured correctly' }, 503);
  }

  const contentType = request.headers.get('Content-Type')?.toLowerCase() ?? '';
  if (!contentType.startsWith('application/json')) {
    return json({ error: 'Content-Type must be application/json' }, 415);
  }

  const declaredLength = Number(request.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BYTES) {
    return json({ error: 'Request body is too large' }, 413);
  }

  const rawBody = await readTextBodyWithLimit(request, MAX_WEBHOOK_BYTES);
  if (rawBody === null) {
    return json({ error: 'Request body is too large' }, 413);
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME) ?? '';
  const signatureIsValid = await isValidSignature(rawBody, signature, env.SANITY_WEBHOOK_SECRET);
  if (!signatureIsValid) {
    return json({ error: 'Invalid webhook signature' }, 401);
  }

  let payload: SanityWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SanityWebhookPayload;
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }

  // The Sanity webhook is also filtered to story documents. Keep this
  // server-side check as defence in depth if that dashboard filter changes.
  if (payload._type !== 'story' || typeof payload._id !== 'string') {
    return json({ success: true, ignored: true }, 202);
  }

  let buildResponse: Response;
  try {
    buildResponse = await outboundFetch(env.CLOUDFLARE_DEPLOY_HOOK_URL, { method: 'POST' });
  } catch {
    console.error(JSON.stringify({ event: 'sanity_build_trigger_failed', reason: 'network_error' }));
    return json({ error: 'Could not reach the build service' }, 502);
  }

  if (!buildResponse.ok) {
    console.error(
      JSON.stringify({
        event: 'sanity_build_trigger_failed',
        reason: 'upstream_error',
        status: buildResponse.status,
      })
    );
    return json({ error: 'Build service rejected the request' }, 502);
  }

  console.info(
    JSON.stringify({
      event: 'sanity_build_triggered',
      documentId: payload._id,
      operation: request.headers.get('sanity-operation') ?? 'unknown',
    })
  );
  return json({ success: true, buildTriggered: true }, 202);
}

async function uploadThumbnail(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  }

  // This endpoint is called by the embedded Studio on the same hostname.
  // Cloudflare Access should also protect /api/fetch-thumbnail in production.
  const requestUrl = new URL(request.url);
  if (request.headers.get('Origin') !== requestUrl.origin) {
    return json({ error: 'Cross-origin requests are not allowed' }, 403);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > 4_096) {
    return json({ error: 'Request body is too large' }, 413);
  }

  if (!env.THUMBNAILS) {
    return json({ error: 'R2 thumbnail bucket is not configured' }, 503);
  }
  if (!env.THUMBNAILS_PUBLIC_BASE_URL) {
    return json({ error: 'Thumbnail public base URL is not configured' }, 503);
  }

  let body: { imageUrl?: unknown };
  try {
    body = (await request.json()) as { imageUrl?: unknown };
  } catch {
    return json({ error: 'Request body must be valid JSON' }, 400);
  }

  if (!isAllowedSourceUrl(body.imageUrl)) {
    return json({ error: 'imageUrl must be a public HTTP or HTTPS URL' }, 400);
  }

  let sourceResponse: Response;
  try {
    sourceResponse = await fetch(body.imageUrl);
  } catch {
    return json({ error: 'Could not reach the source image URL' }, 502);
  }

  if (!sourceResponse.ok) {
    return json({ error: `Source image request failed (${sourceResponse.status})` }, 422);
  }

  const contentType = sourceResponse.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return json({ error: `Unsupported image type: ${contentType || 'unknown'}` }, 422);
  }

  const declaredLength = Number(sourceResponse.headers.get('Content-Length') ?? '0');
  if (declaredLength > MAX_IMAGE_BYTES) {
    return json({ error: 'Source image is too large' }, 413);
  }

  const bytes = await sourceResponse.arrayBuffer();
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return json({ error: 'Source image is too large' }, 413);
  }

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
  const key = `thumbnails/${crypto.randomUUID()}.${extension}`;

  try {
    await env.THUMBNAILS.put(key, bytes, { httpMetadata: { contentType } });
  } catch {
    return json({ error: 'Could not store the image in R2' }, 502);
  }

  const cdnUrl = `${env.THUMBNAILS_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  return json({ cdnUrl });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/sanity-webhook') {
      return triggerSanityBuild(request, env);
    }

    if (url.pathname === '/api/fetch-thumbnail') {
      return uploadThumbnail(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
