export function createHandler(page, favicon) {
  return {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      // Legacy Dev URLs no longer provide controls, data, or sign-in redirects.
      if (path === '/dev' || path.startsWith('/dev/') || path.startsWith('/api/dev/'))
        return new Response('Not found', { status: 404 });
      if (!['GET', 'HEAD'].includes(request.method))
        return new Response('Method not allowed', { status: 405 });
      if (path === '/favicon.svg')
        return new Response(request.method === 'HEAD' ? null : favicon, {
          headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
        });
      if (path === '/' || path === '/index.html')
        return new Response(request.method === 'HEAD' ? null : page, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
          },
        });
      return new Response('Not found', { status: 404 });
    },
  };
}
