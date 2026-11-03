// Offline flow: copy the prompt, ask any model, paste its JSON back.
import { h, field, filePicker } from './dom.js';
import { T, errText } from './i18n.js';
import { prepare } from './image.js';
import { normalize, parseResponse, promptText } from './api.js';
import { state } from './state.js';

export function render(root, nav) {
  let shot = null; // { image, thumb }
  const preview = h('div', { class: 'perf big hidden' }, h('img', { alt: T.imp }));
  const json = h('textarea', { rows: 8, autocomplete: 'off', spellcheck: 'false' });
  const status = h('p', { class: 'err status', role: 'alert' });
  const say = (msg, bad = true) => { status.className = bad ? 'err status' : 'status'; status.textContent = msg; };

  const pick = async (file) => {
    try {
      shot = await prepare(file);
      preview.querySelector('img').src = shot.thumb;
      preview.classList.remove('hidden');
      say('');
    } catch (e) { say(errText(e)); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(promptText('')); say(T.copied, false); }
    catch { say(T.errGen); }
  };
  const use = () => {
    try {
      if (!shot) throw new Error('errNoPhoto');
      state.draft = { ...normalize(parseResponse(json.value)), ...shot };
      nav('result');
    } catch (e) { say(errText(e)); }
  };

  root.append(
    h('div', { class: 'bar' }, h('button', { class: 'btn link', onclick: () => nav('home') }, T.home)),
    h('div', { class: 'stack' },
      h('h1', {}, T.imp),
      preview,
      h('div', { class: 'row' }, filePicker(T.shoot, pick, { camera: true, cls: 'btn' }), filePicker(T.gal, pick, { cls: 'btn' })),
      h('button', { class: 'btn block', onclick: copy }, T.cpPrompt),
      field(T.paste, json),
      h('button', { class: 'btn primary block', onclick: use }, T.use),
      status));
}
