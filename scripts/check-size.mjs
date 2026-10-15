// Fails the build when the app's JavaScript grows past its budget (gzipped bytes).
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const BUDGET_GZIP_KB = 200;
const dir = new URL('../client-dist/assets/', import.meta.url);
let total = 0;
for (const file of (await readdir(dir)).filter((name) => name.endsWith('.js')))
  total += gzipSync(await readFile(new URL(file, dir))).length;
const kb = total / 1024;
console.log(`JavaScript: ${kb.toFixed(1)} kB gzipped (budget ${BUDGET_GZIP_KB} kB)`);
if (kb > BUDGET_GZIP_KB)
  throw Error(`JavaScript is ${kb.toFixed(1)} kB gzipped, over the ${BUDGET_GZIP_KB} kB budget.`);
