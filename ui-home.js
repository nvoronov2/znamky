// Home: collection total, actions, list of saved items.
import { h } from './dom.js';
import { T, czk, yearLabel } from './i18n.js';
import * as db from './db.js';
import { priceOf, total } from './price.js';
import { state } from './state.js';

const row = (it, nav) => {
  const p = priceOf(it);
  return h('button', { class: 'item', onclick: () => nav('detail', it.id) },
    h('span', { class: 'perf' }, h('img', { src: it.thumb, alt: it.subject || it.country || T.cUnk })),
    h('div', {},
      h('strong', {}, it.country || T.cUnk),
      h('div', { class: 'muted' }, [yearLabel(it), it.denomination].filter(Boolean).join(', '))),
    h('span', {}, p.max > 0 ? czk(p.min) : T.nd));
};

export async function render(root, nav) {
  const items = await db.all();
  root.append(
    h('div', { class: 'bar' },
      h('h1', {}, T.coll),
      h('button', { class: 'btn icon', 'aria-label': T.set, onclick: () => nav('settings') }, '⚙')),
    h('div', { class: 'stack' },
      state.memoryOnly && h('div', { class: 'banner', role: 'status' }, T.dbWarn),
      h('div', { class: 'card' },
        h('div', { class: 'muted' }, T.val),
        h('div', { class: 'price' }, czk(total(items))),
        h('div', { class: 'muted' }, `${items.length} ${T.pcs}`)),
      h('button', { class: 'btn primary block', onclick: () => nav('capture') }, T.add),
      h('button', { class: 'btn block', onclick: () => nav('import') }, T.imp),
      items.length ? h('div', {}, items.map((it) => row(it, nav))) : h('p', { class: 'muted' }, T.empty)));
}
