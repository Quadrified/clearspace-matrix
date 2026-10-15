import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const workerPath = resolve(projectRoot, 'dist/server/index.js');
const manifestPath = resolve(projectRoot, 'dist/.openai/hosting.json');

const source = await readFile(workerPath, 'utf8');
try {
  JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('No deployment manifest. Validating the local Worker build.');
}

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  'function',
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

console.log('Artifact is valid ESM and exports default.fetch');

// Development tools must be removed by the production build, not merely hidden.
for (const marker of [
  'Local development tools',
  'dev-project-launch',
  'Send the launch proposal before the deadline',
  '/api/dev/tasks',
  '/api/dev/status',
  'DEV_OWNER_EMAIL',
]) {
  assert.ok(
    !source.includes(marker),
    `Production artifact unexpectedly contains development code: ${marker}`,
  );
}
for (const path of ['/dev', '/dev/', '/api/dev/status', '/api/dev/tasks']) {
  const response = await workerModule.default.fetch(new Request('https://example.test' + path));
  assert.equal(response.status, 404, `${path} must not be exposed in production`);
}
console.log('Production excludes Dev tools, sample data, and former Dev endpoints.');

// Hashed assets must cache for a year, and the page must stay revalidated and hardened.
const page = await workerModule.default.fetch(new Request('https://example.test/'));
assert.equal(page.headers.get('cache-control'), 'no-cache');
assert.match(page.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
const html = await page.text();
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
assert.ok(scripts.length > 0, 'The page must load its application script');
for (const path of scripts) {
  const asset = await workerModule.default.fetch(new Request('https://example.test' + path));
  assert.equal(asset.status, 200, `${path} must be served`);
  assert.match(asset.headers.get('cache-control') ?? '', /immutable/, `${path} must be cacheable`);
}
console.log(
  'Page revalidates; hashed assets are immutable; CSP and hardening headers are present.',
);
