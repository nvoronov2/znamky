// Collection -> CSV text with ';' separator.
import { T, yearLabel } from './i18n.js';
import { priceOf } from './price.js';

const cell = (v) => {
  const s = String(v ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(items) {
  const rows = items.map((i) => {
    const p = priceOf(i);
    return [
      i.createdAt, i.country, i.yearFrom, i.yearTo, i.denomination, i.subject, i.itemType, i.quantity,
      i.condition, Math.round(p.min), Math.round(p.max), p.confidence,
      i.catalog.map((c) => `${c.name} ${c.number}`).join(', '), i.descriptionShort
    ];
  });
  return [T.csvCols, ...rows].map((r) => r.map(cell).join(';')).join('\n');
}
