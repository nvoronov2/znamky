// Auction history section: archive search links, AI-assisted lookup, the user's own comparable sales.
import { h, field } from './dom.js';
import { T, czk, errText } from './i18n.js';
import { SITES, queryOf, compsMedian } from './auctions.js';
import { findSales } from './api.js';

const link = (href, text, cls) => h('a', { href, class: cls, target: '_blank', rel: 'noopener noreferrer' }, text);

export function auction(item, onChange) {
  // Records saved by older versions lack these fields.
  item.comps ??= []; item.salesSources ??= []; item.salesNote ??= ''; item.auctionQuery ??= '';

  const query = h('input', { autocomplete: 'off', autocapitalize: 'off' });
  query.value = queryOf(item);
  const links = h('div', { class: 'row' });
  const drawLinks = () => links.replaceChildren(...SITES.map((s) => link(s.url(query.value.trim()), s.name, 'btn')));
  query.addEventListener('input', drawLinks);
  query.addEventListener('change', () => { item.auctionQuery = query.value.trim(); onChange(); });
  drawLinks();

  const status = h('p', { class: 'err status', role: 'alert' });
  const note = h('textarea', { rows: 6, 'aria-label': T.aucNote });
  const sources = h('div', { class: 'stack' });
  const out = h('div', { class: 'stack' }, h('p', { class: 'banner' }, T.aucWarn), note, sources);
  const drawOut = () => {
    note.value = item.salesNote;
    out.classList.toggle('hidden', !item.salesNote);
    sources.replaceChildren(...(item.salesSources.length
      ? [h('div', { class: 'muted' }, T.aucSources), ...item.salesSources.map((s) => link(s.url, s.title))] : []));
  };
  note.addEventListener('change', () => { item.salesNote = note.value; onChange(); });
  const find = h('button', { class: 'btn block' }, T.aucFind);
  find.addEventListener('click', async () => {
    status.textContent = '';
    find.disabled = true; find.textContent = T.aucFinding;
    try {
      const r = await findSales(item, query.value.trim());
      item.salesNote = r.text; item.salesSources = r.sources;
      drawOut(); onChange();
    } catch (e) { status.textContent = errText(e); }
    finally { find.disabled = false; find.textContent = T.aucFind; }
  });
  drawOut();

  const median = h('p', { class: 'muted', role: 'status' });
  const drawMedian = () => {
    const m = compsMedian(item.comps);
    median.textContent = m ? `${T.compMedian}: ${czk(m)} (${item.comps.length})` : '';
  };
  const box = h('div', { class: 'stack' });
  const drawComps = () => {
    box.replaceChildren(...item.comps.map((c, i) => {
      const where = h('input', { autocomplete: 'off' }); where.value = c.where;
      const date = h('input', { type: 'date' }); date.value = c.date;
      const price = h('input', { type: 'number', inputmode: 'numeric' }); price.value = c.price || '';
      where.addEventListener('change', () => { c.where = where.value.trim(); onChange(); });
      date.addEventListener('change', () => { c.date = date.value; onChange(); });
      price.addEventListener('change', () => { c.price = Number(price.value) || 0; drawMedian(); onChange(); });
      return h('div', { class: 'card stack' },
        field(T.compWhere, where),
        h('div', { class: 'row' }, field(T.compDate, date), field(T.compPrice, price)),
        h('button', { class: 'btn danger', 'aria-label': `${T.del} ${c.where}`.trim(), onclick: () => { item.comps.splice(i, 1); drawComps(); drawMedian(); onChange(); } }, T.del));
    }));
  };
  drawComps(); drawMedian();

  return h('div', { class: 'stack' },
    h('h2', {}, T.aucHist),
    field(T.aucQuery, query),
    h('div', { class: 'muted' }, T.aucLinks), links,
    find, status, out,
    h('h2', {}, T.comps), box,
    h('button', { class: 'btn', onclick: () => { item.comps.push({ where: '', date: '', price: 0 }); drawComps(); onChange(); } }, T.compAdd),
    median);
}
