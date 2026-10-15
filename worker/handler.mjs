const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'cross-origin-opener-policy': 'same-origin',
};

// Hashed assets never change, so browsers can keep them for a year.
const IMMUTABLE = 'public, max-age=31536000, immutable';

export function contentSecurityPolicy(scriptHashes = []) {
  const scripts = ["'self'", ...scriptHashes.map((hash) => `'${hash}'`)].join(' ');
  return [
    "default-src 'none'",
    `script-src ${scripts}`,
    // Base UI injects a small <style> at runtime, so styles (unlike scripts) allow inline.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ');
}

// `assets` maps '/assets/<hashed file>' to { body, type }; `scriptHashes` are CSP hashes of inline scripts.
export function createHandler(page, favicon, { assets = {}, scriptHashes = [], etag = null } = {}) {
  const csp = contentSecurityPolicy(scriptHashes);
  const respond = (body, headers, request, status = 200) =>
    new Response(request.method === 'HEAD' ? null : body, {
      status,
      headers: { ...SECURITY_HEADERS, ...headers },
    });
  return {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      // Legacy Dev URLs no longer provide controls, data, or sign-in redirects.
      if (path === '/dev' || path.startsWith('/dev/') || path.startsWith('/api/dev/'))
        return respond('Not found', {}, request, 404);
      if (!['GET', 'HEAD'].includes(request.method))
        return respond('Method not allowed', {}, request, 405);
      if (path === '/favicon.svg')
        return respond(
          favicon,
          { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
          request,
        );
      if (Object.hasOwn(assets, path)) {
        const asset = assets[path];
        return respond(
          asset.body,
          { 'content-type': asset.type, 'cache-control': IMMUTABLE },
          request,
        );
      }
      if (path === '/' || path === '/index.html') {
        // The page is small and names the current hashed assets, so it always revalidates.
        const headers = {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache',
          'content-security-policy': csp,
        };
        if (etag) {
          headers.etag = etag;
          if (request.headers.get('if-none-match') === etag)
            return new Response(null, {
              status: 304,
              headers: { ...SECURITY_HEADERS, ...headers },
            });
        }
        return respond(page, headers, request);
      }
      return respond('Not found', {}, request, 404);
    },
  };
}
