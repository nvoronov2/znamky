// Settings, onboarding and the demo card.
import { h, field } from './dom.js';
import { T } from './i18n.js';
import { MODELS, getSettings, saveSettings, state } from './state.js';
import { normalize, ping } from './api.js';
import * as db from './db.js';
import { toCsv } from './csv.js';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400"><rect width="320" height="400" fill="#E8A33D"/><rect x="28" y="28" width="264" height="344" fill="none" stroke="#111318" stroke-width="4"/><circle cx="160" cy="150" r="56" fill="#111318"/><text x="160" y="300" font-size="34" text-anchor="middle" fill="#111318" font-family="serif">${T.ukazka}</text></svg>`;
const PICTURE = `data:image/svg+xml;utf8,${encodeURIComponent(SVG)}`;

function makeDemo() {
  const item = normalize({
    isStamp: true, itemType: 'single', quantity: 1,
    country: 'Československo', yearFrom: 1920, denomination: '50 h', subject: 'Ukázková známka',
    visibleCondition: 'used',
    estimates: { used: { min: 20, max: 60, confidence: 0.5 }, mnh: { min: 90, max: 150, confidence: 0.4 } },
    descriptionShort: 'Ukázková karta pro vyzkoušení aplikace bez připojení.',
    caveats: ['Jde o ukázková data.'], questionsForUser: ['Je na zadní straně nálepka?']
  });
  return { ...item, thumb: PICTURE, image: PICTURE };
}

const openDemo = (nav) => () => { state.draft = makeDemo(); nav('result'); };

export function onboarding(root, nav) {
  const key = h('input', { type: 'password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
  const msg = h('p', { class: 'err status', role: 'alert' });
  root.append(h('div', { class: 'stack' },
    h('h1', {}, T.app),
    field(T.key, key),
    msg,
    h('button', { class: 'btn primary block', onclick: () => {
      if (!key.value.trim()) { msg.textContent = T.errKey; return; }
      saveSettings({ mode: 'direct', key: key.value.trim() });
      nav('home');
    } }, T.start),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: openDemo(nav) }, T.demo),
      h('button', { class: 'btn', onclick: () => nav('settings') }, T.set))));
}

export function render(root, nav) {
  const s = getSettings();
  const mode = h('select', {},
    h('option', { value: 'direct', selected: s.mode === 'direct' }, T.direct),
    h('option', { value: 'proxy', selected: s.mode === 'proxy' }, T.modeProxy));
  const key = h('input', { type: 'password', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', value: s.key });
  const proxy = h('input', { type: 'url', autocomplete: 'off', autocapitalize: 'off', value: s.proxyUrl });
  const model = h('select', {}, MODELS.map((m) => h('option', { value: m, selected: m === s.model }, m)));
  const keyField = field(T.key, key);
  const proxyField = field(T.proxy, proxy);
  const status = h('p', { class: 'status', role: 'status' });
  const csv = h('textarea', { readonly: true, 'aria-label': T.csv });

  const sync = () => {
    keyField.classList.toggle('hidden', mode.value === 'proxy');
    proxyField.classList.toggle('hidden', mode.value === 'direct');
  };
  const bind = (el, name) => el.addEventListener('change', () => { saveSettings({ [name]: el.value.trim() }); sync(); });
  bind(mode, 'mode'); bind(key, 'key'); bind(proxy, 'proxyUrl'); bind(model, 'model');
  sync();

  const test = async () => {
    status.className = 'status'; status.textContent = '…';
    try { await ping(); status.textContent = T.testOk; }
    catch (e) { status.className = 'status err'; status.textContent = T[e.message] ?? e.message; }
  };
  const exportCsv = async () => { csv.value = toCsv(await db.all()); csv.focus(); csv.select(); };

  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('home') }, T.home)),
    h('div', { class: 'stack' },
      h('h1', {}, T.set),
      field(T.mode, mode), keyField, proxyField, field(T.model, model),
      h('button', { class: 'btn block', onclick: test }, T.test), status,
      h('button', { class: 'btn block', onclick: openDemo(nav) }, T.demo),
      h('button', { class: 'btn block', onclick: exportCsv }, T.csv), csv));
}
