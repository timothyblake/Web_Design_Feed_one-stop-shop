interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  THUMBNAILS: {
    put(
      key: string,
      value: ArrayBuffer,
      options?: { httpMetadata?: { contentType?: string } }
    ): Promise<unknown>;
  };
  THUMBNAILS_PUBLIC_BASE_URL?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
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

async function uploadThumbnail(request: Request, env: Env): Promise<Response> {
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/fetch-thumbnail') {
      return uploadThumbnail(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
