// Entry point: boot and routing. Screens are loaded on demand and export render(root, nav, arg).
import { T, errText } from './i18n.js';
import { h } from './dom.js';
import { init } from './db.js';
import { state, hasAccess } from './state.js';

const root = document.getElementById('app');
const ROUTES = {
  home: ['ui-home', 'render'],
  capture: ['ui-capture', 'render'],
  import: ['ui-import', 'render'],
  bulk: ['ui-bulk', 'render'],
  result: ['ui-result', 'render'],
  detail: ['ui-detail', 'render'],
  settings: ['ui-settings', 'render'],
  onboarding: ['ui-settings', 'onboarding']
};

function showError(e) {
  console.error(e);
  root.replaceChildren(h('div', { class: 'stack' },
    h('p', { class: 'err', role: 'alert' }, errText(e)),
    h('button', { class: 'btn', onclick: () => nav('home') }, T.home)));
}

export async function nav(name, arg) {
  const route = ROUTES[name];
  if (!route) return showError(new Error(`route ${name}`));
  try {
    const mod = await import(`./${route[0]}.js`);
    root.replaceChildren();
    await mod[route[1]](root, nav, arg);
    window.scrollTo(0, 0);
  } catch (e) {
    showError(e);
  }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
state.memoryOnly = !(await init());
navigator.storage?.persist?.(); // best effort: keeps iOS from clearing IndexedDB
nav(hasAccess() ? 'home' : 'onboarding');
