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
    assert.equal(response.headers.get('cache-control'), 'no-store');
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
