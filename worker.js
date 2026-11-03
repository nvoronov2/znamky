// Cloudflare Worker: keeps the Gemini key server-side. Env var: GEMINI_KEY.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = new Set(['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash']);
const MAX_BODY = 6 * 1024 * 1024;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (req.method === 'GET' && pathname === '/health') return json({ ok: true });

    const m = pathname.match(/^\/gemini\/([^/]+)$/);
    if (req.method !== 'POST' || !m) return json({ error: 'not found' }, 404);
    if (!MODELS.has(m[1])) return json({ error: 'model not allowed' }, 400);
    if (!env.GEMINI_KEY) return json({ error: 'GEMINI_KEY is not set' }, 500);

    const body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY) return json({ error: 'body too large' }, 413);

    const up = await fetch(`${BASE}/${m[1]}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_KEY },
      body
    });
    return new Response(up.body, { status: up.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
};
