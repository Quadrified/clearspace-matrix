import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
let page = await readFile(new URL('client-dist/index.html', root), 'utf8');
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
const [favicon, handler, manifest] = await Promise.all(
  ['public/favicon.svg', 'worker/handler.mjs', '.openai/hosting.json'].map((p) =>
    readFile(new URL(p, root), 'utf8'),
  ),
);
if (JSON.parse(manifest).static) throw Error('Worker hosting must not declare static.directory');
await rm(new URL('dist/', root), { recursive: true, force: true });
await mkdir(new URL('dist/server/', root), { recursive: true });
await mkdir(new URL('dist/.openai/', root), { recursive: true });
await mkdir(new URL('standalone/', root), { recursive: true });
await writeFile(
  new URL('dist/server/index.js', root),
  handler +
    '\nexport default createHandler(' +
    JSON.stringify(page) +
    ',' +
    JSON.stringify(favicon) +
    ');\n',
);
await writeFile(new URL('dist/.openai/hosting.json', root), manifest);
await writeFile(
  new URL('standalone/clearspace.html', root),
  page.replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(favicon)}"`),
);
console.log('Built React app, standalone HTML, and owner-authorized Sites Worker.');
