// A saved item: edit (autosaved), share, delete.
import { h } from './dom.js';
import { T, condLabel, rangeText, yearLabel } from './i18n.js';
import * as db from './db.js';
import { priceOf } from './price.js';
import { editor, photo } from './ui-fields.js';

const shareText = (i) => [
  `${i.country || T.cUnk}, ${yearLabel(i)}`, i.denomination, i.subject,
  `${condLabel(i.condition)}: ${rangeText(priceOf(i))}`, i.descriptionShort
].filter(Boolean).join('\n');

export async function render(root, nav, id) {
  const item = await db.get(id);
  if (!item) throw new Error('errGen');
  const status = h('p', { class: 'status', role: 'status' });
  const fail = (e) => { status.className = 'status err'; status.textContent = T[e.message] ?? T.errGen; };
  const persist = () => db.put(item).catch(fail);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: T.app, text: shareText(item) });
      else { await navigator.clipboard.writeText(shareText(item)); status.className = 'status'; status.textContent = T.copied; }
    } catch (e) {
      if (e.name !== 'AbortError') fail(e);
    }
  };
  const remove = async () => {
    if (!confirm(T.delAsk)) return;
    await db.del(item.id);
    nav('home');
  };

  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('home') }, T.home)),
    h('div', { class: 'stack' },
      photo(item),
      h('h1', {}, `${item.country || T.cUnk}, ${yearLabel(item)}`),
      editor(item, persist),
      h('button', { class: 'btn block', onclick: share }, T.share),
      h('button', { class: 'btn danger block', onclick: remove }, T.del),
      status));
}
