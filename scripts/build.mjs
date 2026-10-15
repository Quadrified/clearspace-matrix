import { createHash } from 'node:crypto';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let page = await readFile(new URL('client-dist/index.html', root), 'utf8');
const notices = await readFile(new URL('THIRD_PARTY_NOTICES.md', root), 'utf8');
page = page.replace('</head>', () => `<!--\n${notices.replaceAll('--', '—')}\n-->\n</head>`);
// Hashed JS and CSS stay separate files so browsers can cache them across visits.
const types = { js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8' };
const assets = {};
for (const match of page.matchAll(
  /<(?:script|link)\b[^>]*\b(?:src|href)="(\/assets\/[^"]+\.(js|css))"/g,
)) {
  const body = await readFile(new URL('client-dist' + match[1], root), 'utf8');
  assets[match[1]] = { body, type: types[match[2]] };
}
if (!Object.keys(assets).some((path) => path.endsWith('.js')))
  throw Error('Expected the build to reference a JavaScript asset');
for (const match of page.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g))
  if (!Object.hasOwn(assets, match[1])) throw Error(`Unserved build asset: ${match[1]}`);
// Inline classic scripts (the pre-paint theme script) are allowed by hash, never by 'unsafe-inline'.
const sha256 = (value, encoding) => createHash('sha256').update(value).digest(encoding);
const scriptHashes = [...page.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  (match) => `sha256-${sha256(match[1], 'base64')}`,
);
const etag = `"${sha256(page, 'hex').slice(0, 32)}"`;
const [favicon, handler] = await Promise.all(
  ['public/favicon.svg', 'worker/handler.mjs'].map((p) => readFile(new URL(p, root), 'utf8')),
);
// Deployment identity belongs to the publisher, not the shared source tree.
let manifest;
try {
  manifest = await readFile(new URL('.openai/hosting.json', root), 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
if (manifest) {
  const config = JSON.parse(manifest);
  if (config.static) throw Error('Worker hosting must not declare static.directory');
  if (typeof config.project_id !== 'string' || !config.project_id.trim())
    throw Error('Set the Site project_id in your local .openai/hosting.json before publishing.');
}
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/server/', root), { recursive: true });

await writeFile(
  new URL('dist/server/index.js', root),
  handler +
    '\nexport default createHandler(' +
    [page, favicon, { assets, scriptHashes, etag }]
      .map((value) => JSON.stringify(value))
      .join(',') +
    ');\n',
);
if (manifest) {
  await mkdir(new URL('dist/.openai/', root), { recursive: true });
  await writeFile(new URL('dist/.openai/hosting.json', root), manifest);
}
console.log('Built React app and public Sites Worker.');
if (!manifest)
  console.log('Local build only. Configure .openai/hosting.json before publishing to Sites.');
