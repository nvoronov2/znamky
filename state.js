// Settings (localStorage) and shared in-memory state.
const KEY = 'znamky.settings';

export const MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];

const DEFAULTS = { mode: 'direct', key: '', proxyUrl: '', model: MODELS[0] };

export const state = {
  draft: null,     // item being edited on the result screen (not saved yet)
  memoryOnly: false // true when IndexedDB is unavailable
};

export function getSettings() {
  const raw = localStorage.getItem(KEY);
  return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export const uid = () => crypto.randomUUID();

// True when the model can be called (key in direct mode, URL in proxy mode).
export const hasAccess = (s = getSettings()) => Boolean(s.mode === 'proxy' ? s.proxyUrl : s.key);
