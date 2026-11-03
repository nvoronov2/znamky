// Result of a recognition (or demo / import): edit, then save to the collection.
import { h } from './dom.js';
import { T, yearLabel, errText } from './i18n.js';
import { state, uid } from './state.js';
import * as db from './db.js';
import { editor, photo } from './ui-fields.js';

export function render(root, nav) {
  const item = state.draft;
  if (!item) throw new Error('errGen');
  const status = h('p', { class: 'err status', role: 'alert' });
  const save = h('button', { class: 'btn primary block' }, T.save);
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      await db.put({ ...item, id: uid(), createdAt: new Date().toISOString() });
      state.draft = null;
      nav('home');
    } catch (e) {
      status.textContent = errText(e);
      save.disabled = false;
    }
  });
  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('capture') }, T.newshot)),
    h('div', { class: 'stack' },
      photo(item),
      h('h1', {}, `${item.country || T.cUnk}, ${yearLabel(item)}`),
      editor(item, () => {}),
      save, status,
      h('p', { class: 'muted' }, T.disc)));
}
