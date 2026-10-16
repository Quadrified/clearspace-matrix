import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../worker/handler.mjs';
const app = createHandler('<h1>Public matrix</h1>', '<svg/>');
const request = (path, method = 'GET', headers = {}) =>
  new Request('https://example.test' + path, { method, headers });
test('the homepage and index remain public without sign-in', async () => {
  for (const path of ['/', '/index.html']) {
    const response = await app.fetch(request(path));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<h1>Public matrix</h1>');
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.equal(response.headers.get('location'), null);
  }
});
test('former Dev routes and APIs return 404 for GET and POST without redirecting', async () => {
  for (const path of ['/dev', '/dev/', '/api/dev/status', '/api/dev/tasks']) {
    for (const method of ['GET', 'POST']) {
      const response = await app.fetch(
        request(path, method, { 'oai-authenticated-user-id': 'previous-owner' }),
      );
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('location'), null);
    }
  }
});
test('favicon and HEAD requests stay public', async () => {
  assert.equal(await (await app.fetch(request('/favicon.svg'))).text(), '<svg/>');
  assert.equal(
    (await app.fetch(request('/favicon.svg'))).headers.get('content-type'),
    'image/svg+xml',
  );
  assert.equal(await (await app.fetch(request('/', 'HEAD'))).text(), '');
});
test('unknown paths and unsupported methods are rejected', async () => {
  assert.equal((await app.fetch(request('/unknown'))).status, 404);
  assert.equal((await app.fetch(request('/', 'POST'))).status, 405);
});

const assets = {
  '/assets/app-abc123.js': { body: 'console.log(1)', type: 'text/javascript; charset=utf-8' },
};
const cached = createHandler('<h1>Public matrix</h1>', '<svg/>', {
  assets,
  scriptHashes: ['sha256-theme'],
  etag: '"v1"',
});
test('hashed assets are cached for a year and served with the right type', async () => {
  const response = await cached.fetch(request('/assets/app-abc123.js'));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'console.log(1)');
  assert.match(response.headers.get('cache-control'), /max-age=31536000, immutable/);
  assert.equal(response.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.equal((await cached.fetch(request('/assets/missing.js'))).status, 404);
  assert.equal((await cached.fetch(request('/assets/toString'))).status, 404);
});
test('the page revalidates with an ETag and answers 304 when unchanged', async () => {
  const first = await cached.fetch(request('/'));
  assert.equal(first.headers.get('etag'), '"v1"');
  const again = await cached.fetch(request('/', 'GET', { 'if-none-match': '"v1"' }));
  assert.equal(again.status, 304);
  assert.equal(await again.text(), '');
  assert.equal((await cached.fetch(request('/', 'GET', { 'if-none-match': '"old"' }))).status, 200);
});
test('every response carries browser hardening headers; the page has a strict CSP', async () => {
  for (const path of ['/', '/favicon.svg', '/assets/app-abc123.js', '/unknown', '/dev']) {
    const response = await cached.fetch(request(path));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer', path);
    assert.ok(response.headers.get('permissions-policy'), path);
  }
  const policy = (await cached.fetch(request('/'))).headers.get('content-security-policy');
  assert.match(policy, /default-src 'none'/);
  assert.match(policy, /script-src 'self' 'sha256-theme'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/);
});
