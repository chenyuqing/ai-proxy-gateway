const ORIGINS = {
  '/openai': 'https://api.openai.com',
  '/claude': 'https://api.anthropic.com',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const route = Object.keys(ORIGINS).find((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + '/'));
    const origin = route ? ORIGINS[route] : null;

    if (!origin) {
      return new Response(
        JSON.stringify({ error: 'Invalid path. Use /openai/... or /claude/...' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
      );
    }

    const upstreamPath = url.pathname.slice(route.length) || '/';
    const targetUrl = origin + upstreamPath + url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    const resp = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });

    const respHeaders = new Headers(resp.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => respHeaders.set(k, v));
    respHeaders.delete('content-encoding');

    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    });
  },
};
