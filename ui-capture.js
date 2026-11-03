// Capture: note + hint chips, camera/gallery, send to the model.
import { h, field, filePicker } from './dom.js';
import { T } from './i18n.js';
import { prepare } from './image.js';
import { analyze } from './api.js';
import { DEFAULT_HINT } from './schema.js';
import { state } from './state.js';

export function render(root, nav, error = '') {
  const note = h('textarea', { rows: 2, autocomplete: 'off' });
  const picked = new Set();
  const chips = [T.hintBack, T.hintSheet, T.hintWm].map((label) =>
    h('button', { class: 'chip', 'aria-pressed': 'false', onclick: (e) => {
      const on = !picked.has(label);
      on ? picked.add(label) : picked.delete(label);
      e.currentTarget.setAttribute('aria-pressed', String(on));
    } }, label));

  const run = async (file) => {
    const parts = [note.value.trim(), ...picked].filter(Boolean);
    root.replaceChildren(h('div', { role: 'status', class: 'stack' }, h('div', { class: 'spinner' }), h('p', { class: 'muted' }, T.rec)));
    try {
      const { image, thumb } = await prepare(file);
      const item = await analyze(image, parts.length ? `${DEFAULT_HINT} ${parts.join(', ')}` : '');
      state.draft = { ...item, image, thumb };
      nav('result');
    } catch (e) {
      root.replaceChildren();
      render(root, nav, T[e.message] ?? T.errGen);
    }
  };

  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('home') }, T.home)),
    h('div', { class: 'stack' },
      h('h1', {}, T.cap),
      error && h('p', { class: 'err', role: 'alert' }, error),
      field(T.note, note),
      h('div', { class: 'row' }, chips),
      filePicker(T.shoot, run, { camera: true, cls: 'btn primary block' }),
      filePicker(T.gal, run),
      h('ul', { class: 'tips muted' }, [T.tip1, T.tip2, T.tip3].map((t) => h('li', {}, t)))));
}
