import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeSignatureHeader } from '@sanity/webhook';
import { triggerSanityBuild, type SanityWebhookEnv } from './index.ts';

const secret = 'local-test-secret-that-is-not-used-in-production';
const deployHookUrl =
  'https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/local-test-hook';

const env = {
  SANITY_WEBHOOK_SECRET: secret,
  CLOUDFLARE_DEPLOY_HOOK_URL: deployHookUrl,
} satisfies SanityWebhookEnv;

async function signedRequest(payload: object): Promise<Request> {
  const body = JSON.stringify(payload);
  const signature = await encodeSignatureHeader(body, Date.now(), secret);
  return new Request('https://webdesignfeed.com/api/sanity-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'sanity-operation': 'create',
      'sanity-webhook-signature': signature,
    },
    body,
  });
}

test('a signed story webhook triggers the Cloudflare build hook', async () => {
  let requestReceived: Request | undefined;
  const outboundFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    requestReceived = new Request(input, init);
    return Response.json({ success: true });
  };

  const response = await triggerSanityBuild(
    await signedRequest({ _id: 'story-1', _type: 'story' }),
    env,
    outboundFetch
  );

  assert.equal(response.status, 202);
  assert.equal(requestReceived?.url, deployHookUrl);
  assert.equal(requestReceived?.method, 'POST');
});

test('an invalid signature is rejected without triggering a build', async () => {
  let buildTriggered = false;
  const response = await triggerSanityBuild(
    new Request('https://webdesignfeed.com/api/sanity-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sanity-webhook-signature': 'invalid',
      },
      body: JSON.stringify({ _id: 'story-1', _type: 'story' }),
    }),
    env,
    async () => {
      buildTriggered = true;
      return new Response();
    }
  );

  assert.equal(response.status, 401);
  assert.equal(buildTriggered, false);
});

test('a signed non-story payload is ignored', async () => {
  let buildTriggered = false;
  const response = await triggerSanityBuild(
    await signedRequest({ _id: 'settings-1', _type: 'settings' }),
    env,
    async () => {
      buildTriggered = true;
      return new Response();
    }
  );

  assert.equal(response.status, 202);
  assert.equal(buildTriggered, false);
  assert.deepEqual(await response.json(), { success: true, ignored: true });
});

test('an unsuccessful build-hook response is reported to Sanity', async () => {
  const response = await triggerSanityBuild(
    await signedRequest({ _id: 'story-1', _type: 'story' }),
    env,
    async () => new Response(null, { status: 500 })
  );

  assert.equal(response.status, 502);
});
