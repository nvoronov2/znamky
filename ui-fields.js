// Editable item form shared by the result and detail screens.
// Every field writes straight into `item`; onChange() lets the screen persist it.
import { h, field } from './dom.js';
import { T, czk, condLabel, rangeText, errText } from './i18n.js';
import { CONDS, confKey } from './price.js';
import { describe } from './api.js';
import { auction } from './ui-auction.js';

const CATALOGS = ['Michel', 'Scott', 'Yvert'];

export const photo = (item) =>
  h('div', { class: 'perf big' }, h('img', { src: item.image || item.thumb, alt: item.subject || item.country || T.cUnk }));

function input(item, key, label, onChange, number = false) {
  const el = h('input', number ? { type: 'number', inputmode: 'numeric' } : { autocomplete: 'off' });
  el.value = item[key] ?? '';
  el.addEventListener('change', () => {
    item[key] = number ? (el.value === '' ? null : Number(el.value)) : el.value.trim();
    onChange();
  });
  return field(label, el);
}

function lines(item, key, label, onChange) {
  const el = h('textarea', { rows: 3 });
  el.value = item[key].join('\n');
  el.addEventListener('change', () => {
    item[key] = el.value.split('\n').map((l) => l.trim()).filter(Boolean);
    onChange();
  });
  return field(label, el);
}

function typeAndQty(item, onChange) {
  const sel = h('select', {}, Object.entries(T.types).map(([k, v]) => h('option', { value: k, selected: k === item.itemType }, v)));
  sel.addEventListener('change', () => { item.itemType = sel.value; onChange(); });
  const qty = input(item, 'quantity', T.qty, onChange, true);
  return h('div', { class: 'row' }, field(T.type, sel), qty);
}

function catalogs(item, onChange) {
  const box = h('div', {});
  const draw = () => {
    box.replaceChildren(...[
      item.catalog.length ? null : h('p', { class: 'muted' }, T.catUn),
      ...item.catalog.map((c, i) => {
        const name = h('select', { 'aria-label': T.cat }, CATALOGS.map((n) => h('option', { value: n, selected: n === c.name }, n)));
        const num = h('input', { 'aria-label': T.num, autocomplete: 'off', value: c.number });
        name.addEventListener('change', () => { c.name = name.value; onChange(); });
        num.addEventListener('change', () => { c.number = num.value.trim(); onChange(); });
        return h('div', { class: 'catrow' }, name, num,
          h('span', { class: 'muted' }, `${Math.round(c.confidence * 100)} %`),
          h('button', { class: 'btn icon', 'aria-label': `${T.del} ${c.name} ${c.number}`.trim(), onclick: () => { item.catalog.splice(i, 1); draw(); onChange(); } }, '×'));
      }),
      h('button', { class: 'btn', onclick: () => { item.catalog.push({ name: CATALOGS[0], number: '', confidence: 0 }); draw(); onChange(); } }, T.addCat)
    ].filter(Boolean)); // replaceChildren would turn null into the text "null"
  };
  draw();
  return box;
}

function pricing(item, onChange) {
  const chips = h('div', { class: 'row' });
  const price = h('div', { class: 'price' });
  const conf = h('div', { class: 'muted' });
  const bar = h('i');
  const min = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': T.min });
  const max = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': T.max });
  const cur = () => item.estimates[item.condition];
  const draw = () => {
    const r = cur();
    price.textContent = rangeText(r);
    conf.textContent = r.max > 0 ? `${T[confKey(r.confidence)]} ${T.conf}` : '';
    bar.style.width = `${Math.round(r.confidence * 100)}%`;
    min.value = r.min; max.value = r.max;
    chips.replaceChildren(...CONDS.map((c) =>
      h('button', { class: 'chip', 'aria-pressed': String(c === item.condition), onclick: () => { item.condition = c; draw(); onChange(); } }, condLabel(c))));
  };
  const edit = (el, k) => el.addEventListener('change', () => { cur()[k] = Number(el.value) || 0; draw(); onChange(); });
  edit(min, 'min'); edit(max, 'max');
  draw();
  return h('div', { class: 'stack' }, h('h2', {}, T.cond), chips,
    h('div', { class: 'card stack' }, h('div', { class: 'muted' }, T.est), price, h('div', { class: 'meter' }, bar), conf,
      h('div', { class: 'row' }, field(T.min, min), field(T.max, max))));
}

function description(item, onChange) {
  let mode = 'short';
  const key = () => (mode === 'short' ? 'descriptionShort' : 'descriptionListing');
  const area = h('textarea', { rows: 6, 'aria-label': T.desc });
  const status = h('p', { class: 'err status', role: 'alert' });
  const regen = h('button', { class: 'btn' }, T.regen);
  const auc = h('button', { class: 'btn', 'aria-pressed': 'false' }, T.auc);
  const show = () => { area.value = item[key()]; auc.setAttribute('aria-pressed', String(mode === 'listing')); };
  const generate = async () => {
    status.textContent = '';
    regen.disabled = auc.disabled = true;
    try { item[key()] = await describe(item, mode); show(); onChange(); }
    catch (e) { status.textContent = errText(e); }
    finally { regen.disabled = auc.disabled = false; }
  };
  area.addEventListener('change', () => { item[key()] = area.value; onChange(); });
  regen.addEventListener('click', generate);
  auc.addEventListener('click', () => { mode = mode === 'short' ? 'listing' : 'short'; show(); if (!item[key()]) generate(); });
  show();
  return h('div', { class: 'stack' }, h('h2', {}, T.desc), area, h('div', { class: 'row' }, regen, auc), status);
}

export function editor(item, onChange) {
  const block = (title, key) => item[key].length ? lines(item, key, title, onChange) : null;
  return h('div', { class: 'stack' },
    !item.isStamp && h('div', { class: 'banner', role: 'status' }, T.notStamp),
    input(item, 'country', T.country, onChange),
    h('div', { class: 'row' }, input(item, 'yearFrom', T.yearFrom, onChange, true), input(item, 'yearTo', T.yearTo, onChange, true)),
    input(item, 'denomination', T.den, onChange),
    input(item, 'subject', T.subj, onChange),
    typeAndQty(item, onChange),
    h('h2', {}, T.cat), catalogs(item, onChange),
    pricing(item, onChange),
    auction(item, onChange),
    block(T.feat, 'features'), block(T.flags, 'redFlags'), block(T.qs, 'questionsForUser'),
    description(item, onChange),
    block(T.cav, 'caveats'));
}
