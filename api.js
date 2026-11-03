// Model calls. Every thrown Error.message is a key of T (errKey, errNet, ...).
import { getSettings } from './state.js';
import { SYSTEM, SCHEMA, DEFAULT_HINT } from './schema.js';
import { normalizeEstimates, CONDS } from './price.js';
import { base64 } from './image.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT = 25000;
const TYPES = ['single', 'pair', 'block', 'sheet', 'cover', 'other'];
const fail = (key, detail) => Object.assign(new Error(key), { detail });

async function httpError(res) {
  let msg = '';
  try { msg = (await res.json()).error?.message ?? ''; } catch { /* body is not JSON */ }
  const key = res.status === 429 ? 'errLim' : [400, 401, 403, 404].includes(res.status) ? 'errReq' : 'errGen';
  return fail(key, `HTTP ${res.status}${msg ? `: ${msg.slice(0, 160)}` : ''}`);
}

async function call(body) {
  const s = getSettings();
  let url;
  if (s.mode === 'proxy') {
    if (!s.proxyUrl) throw fail('errKey');
    url = `${s.proxyUrl.replace(/\/+$/, '')}/gemini/${s.model}`;
  } else {
    if (!s.key) throw fail('errKey');
    url = `${BASE}/${s.model}:generateContent?key=${encodeURIComponent(s.key)}`;
  }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctl.signal
    });
  } catch {
    throw fail('errNet');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw await httpError(res);
  try {
    return await res.json();
  } catch {
    throw fail('errGen', 'invalid JSON from API');
  }
}

function textOf(data) {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('').trim();
  if (!text) throw fail('errEmpty', data.candidates?.[0]?.finishReason ?? data.promptFeedback?.blockReason);
  return text;
}

// Strips ```json fences and surrounding prose, parses the outermost {...}.
export function parseResponse(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw fail('errParse');
  try {
    return JSON.parse(text.slice(a, b + 1));
  } catch {
    throw fail('errParse');
  }
}

const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const year = (v) => (Number.isFinite(v) ? v : null);
const text = (v) => (typeof v === 'string' ? v : '');

// Model JSON (possibly incomplete) -> item fields. Missing blocks get defaults.
export function normalize(raw) {
  const qty = Math.round(raw.quantity);
  return {
    isStamp: raw.isStamp !== false,
    country: text(raw.country),
    yearFrom: year(raw.yearFrom),
    yearTo: year(raw.yearTo),
    denomination: text(raw.denomination),
    subject: text(raw.subject),
    itemType: TYPES.includes(raw.itemType) ? raw.itemType : 'other',
    quantity: qty >= 1 ? qty : 1,
    catalog: (Array.isArray(raw.catalog) ? raw.catalog : [])
      .filter((c) => c && c.name && c.number)
      .map((c) => ({ name: c.name, number: String(c.number), confidence: Number(c.confidence) || 0 })),
    features: list(raw.features),
    redFlags: list(raw.redFlags),
    caveats: list(raw.caveats),
    questionsForUser: list(raw.questionsForUser),
    visibleCondition: text(raw.visibleCondition),
    condition: CONDS.includes(raw.visibleCondition) ? raw.visibleCondition : 'used',
    estimates: normalizeEstimates(raw.estimates),
    descriptionShort: text(raw.descriptionShort),
    descriptionListing: text(raw.descriptionListing),
    auctionQuery: text(raw.auctionQuery),
    comps: [], salesNote: '', salesSources: []
  };
}

// Photo (data URL) -> item fields.
export async function analyze(imageDataUrl, hint) {
  const data = await call({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: 'image/jpeg', data: base64(imageDataUrl) } },
      { text: hint || DEFAULT_HINT }
    ] }],
    generationConfig: { temperature: 0.15, responseMimeType: 'application/json', responseSchema: SCHEMA }
  });
  return normalize(parseResponse(textOf(data)));
}

// Prompt for the offline flow: paste into any model together with the photo.
export const promptText = (hint) =>
  `${SYSTEM}\n\nReturn ONLY one JSON object matching this schema, no markdown:\n${JSON.stringify(SCHEMA)}\n\nTask: ${hint || DEFAULT_HINT}`;

const DESC_SYSTEM = 'You write Czech descriptions of postage stamps for a collector. Use only the given facts, never invent details.';
const DESC_MODE = {
  short: 'Write 3-4 sentences.',
  listing: 'Write an auction listing: a title of at most 70 characters on the first line, then 5-7 sentences that honestly list all defects.'
};

const facts = (i) => ({
  country: i.country, yearFrom: i.yearFrom, yearTo: i.yearTo, denomination: i.denomination, subject: i.subject,
  itemType: i.itemType, quantity: i.quantity, catalog: i.catalog, features: i.features,
  condition: i.condition, redFlags: i.redFlags, caveats: i.caveats
});

// Confirmed fields -> description text (no image).
export async function describe(item, mode) {
  const data = await call({
    systemInstruction: { parts: [{ text: DESC_SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: `${DESC_MODE[mode]}\n\n${JSON.stringify(facts(item))}` }] }],
    generationConfig: { temperature: 0.6 }
  });
  return textOf(data);
}

const SALES_SYSTEM = `You research documented philatelic auction results. Use ONLY what the search returns.
List each found sale of this exact stamp as: date - auction house - realised price with currency - URL.
If no sale of this exact stamp is found, say so plainly. Never estimate, extrapolate or invent prices or dates. Write in Czech.`;

// Google Search grounded lookup of past sales -> { text, sources: [{ title, url }] }.
export async function findSales(item, query) {
  const data = await call({
    systemInstruction: { parts: [{ text: SALES_SYSTEM }] },
    contents: [{ role: 'user', parts: [{ text: `Stamp: ${JSON.stringify(facts(item))}\nSearch hint: ${query}` }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2 }
  });
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Map();
  for (const c of chunks) if (c.web?.uri && !seen.has(c.web.uri)) seen.set(c.web.uri, { title: c.web.title || c.web.uri, url: c.web.uri });
  return { text: textOf(data), sources: [...seen.values()] };
}

// Connection check: succeeds when the API answers with HTTP 200.
export async function ping() {
  await call({ contents: [{ role: 'user', parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 8 } });
}
