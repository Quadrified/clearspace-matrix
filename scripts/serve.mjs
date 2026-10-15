import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHandler } from '../worker/handler.mjs';
const root = new URL('../', import.meta.url),
  [page, favicon] = await Promise.all(
    ['standalone/clearspace.html', 'public/favicon.svg'].map((path) =>
      readFile(new URL(path, root), 'utf8'),
    ),
  );
const app = createHandler(page, favicon);
http
  .createServer(async (req, res) => {
    try {
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 8192) {
          res.writeHead(413);
          res.end('Request too large');
          return;
        }
        chunks.push(chunk);
      }
      const method = req.method || 'GET',
        request = new Request('http://127.0.0.1:8000' + req.url, {
          method,
          headers: req.headers,
          body: ['GET', 'HEAD'].includes(method) ? undefined : Buffer.concat(chunks),
        });
      const response = await app.fetch(request, {});
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end('Local server error');
    }
  })
  .listen(8000, '127.0.0.1', () =>
    console.log(
      'Clearspace: http://127.0.0.1:8000\nDev sign-in is available on the hosted Site only.',
    ),
  );
