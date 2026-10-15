import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let page = await readFile(new URL('client-dist/index.html', root), 'utf8');
const notices = await readFile(new URL('THIRD_PARTY_NOTICES.md', root), 'utf8');
page = page.replace('</head>', () => `<!--\n${notices.replaceAll('--', '—')}\n-->\n</head>`);
for (const match of [...page.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]) {
  const js = await readFile(new URL('client-dist/' + match[1].replace(/^\//, ''), root), 'utf8');
  page = page.replace(
    match[0],
    () => '<script type="module">' + js.replace(/<\/script/gi, '<\\/script') + '</script>',
  );
}
for (const match of [...page.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)]) {
  const css = await readFile(new URL('client-dist/' + match[1].replace(/^\//, ''), root), 'utf8');
  page = page.replace(
    match[0],
    () => '<style>' + css.replace(/<\/style/gi, '<\\/style') + '</style>',
  );
}
if (/(?:src|href)="\/assets\//.test(page))
  throw Error('App still depends on external build assets');
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
    JSON.stringify(page) +
    ',' +
    JSON.stringify(favicon) +
    ');\n',
);
if (manifest) {
  await mkdir(new URL('dist/.openai/', root), { recursive: true });
  await writeFile(new URL('dist/.openai/hosting.json', root), manifest);
}
console.log('Built React app and public Sites Worker.');
if (!manifest)
  console.log('Local build only. Configure .openai/hosting.json before publishing to Sites.');
