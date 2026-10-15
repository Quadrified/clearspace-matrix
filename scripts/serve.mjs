import http from 'node:http';
import app from '../dist/server/index.js';
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
      const response = await app.fetch(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500);
      res.end('Local server error');
    }
  })
  .listen(8000, '127.0.0.1', () =>
    console.log(
      'Clearspace: http://127.0.0.1:8000\nProduction preview. Run npm run dev for local Dev tools.',
    ),
  );
