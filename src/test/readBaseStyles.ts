import { readFile } from 'node:fs/promises';

/**
 * The numbered base stylesheets, joined in cascade order, for tests that apply real CSS rules in
 * jsdom. The sketchbook theme layered on top is left out.
 */
export async function readBaseStyles() {
  const index = await readFile('src/styles/index.css', 'utf8');
  const files = [...index.matchAll(/@import '\.\/(\d\d-[\w-]+\.css)';/g)].map((m) => m[1]!);
  const parts = await Promise.all(files.map((file) => readFile(`src/styles/${file}`, 'utf8')));
  return parts.join('\n');
}
