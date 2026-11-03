// Home: collection total, actions, searchable and sortable list of saved items.
import { h } from './dom.js';
import { T, czk, yearLabel } from './i18n.js';
import * as db from './db.js';
import { priceOf, mid, total } from './price.js';
import { state } from './state.js';

let query = '';
let sort = 'new';
const SORTS = {
  new: [T.sortNew, (a, b) => b.createdAt.localeCompare(a.createdAt)],
  value: [T.sortValue, (a, b) => mid(priceOf(b)) - mid(priceOf(a))],
  country: [T.sortCountry, (a, b) => a.country.localeCompare(b.country, 'cs')]
};
const fold = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const haystack = (i) => fold([i.country, i.subject, i.denomination, i.yearFrom, i.yearTo, ...i.catalog.map((c) => `${c.name} ${c.number}`)].join(' '));

const row = (it, nav) => {
  const p = priceOf(it);
  const review = !it.isStamp || p.confidence < 0.4;
  return h('button', { class: 'item', onclick: () => nav('detail', it.id) },
    h('span', { class: 'perf' }, h('img', { src: it.thumb, alt: it.subject || it.country || T.cUnk })),
    h('div', {},
      h('strong', {}, it.country || T.cUnk),
      h('div', { class: 'muted' }, [yearLabel(it), it.denomination].filter(Boolean).join(', '),
        review && h('span', { class: 'warnc' }, `, ${T.review}`))),
    h('span', {}, p.max > 0 ? czk(p.min) : T.nd));
};

export async function render(root, nav) {
  const items = await db.all();
  const box = h('div', {});
  const draw = () => {
    const q = fold(query.trim());
    const shown = items.filter((i) => !q || haystack(i).includes(q)).sort(SORTS[sort][1]);
    box.replaceChildren(...(shown.length ? shown.map((it) => row(it, nav))
      : [h('p', { class: 'muted' }, items.length ? T.noMatch : T.empty)]));
  };
  const search = h('input', { type: 'search', 'aria-label': T.search, placeholder: T.search, autocomplete: 'off', value: query });
  search.addEventListener('input', () => { query = search.value; draw(); });
  const order = h('select', { 'aria-label': T.sortNew }, Object.entries(SORTS).map(([k, [label]]) => h('option', { value: k, selected: k === sort }, label)));
  order.addEventListener('change', () => { sort = order.value; draw(); });
  draw();

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
      h('button', { class: 'btn block', onclick: () => nav('bulk') }, T.bulk),
      h('button', { class: 'btn block', onclick: () => nav('import') }, T.imp),
      items.length > 1 && h('div', { class: 'row' }, search, order),
      box));
}
