// Price ranges per condition: normalisation, lookup, collection total.
export const CONDS = ['mnh', 'mh', 'used', 'on_cover', 'damaged'];
const MULT = { mnh: 2.2, mh: 1.8, used: 1, on_cover: 1.4, damaged: 0.5 };

const isRange = (r) => r && Number.isFinite(r.min) && Number.isFinite(r.max);
const clamp01 = (n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

// Always returns all five conditions. Missing ones are derived from `used`
// (confidence -0.15, floor 0); without `used` they are zeros.
export function normalizeEstimates(est = {}) {
  const base = isRange(est.used)
    ? { min: est.used.min, max: est.used.max, confidence: clamp01(est.used.confidence) }
    : { min: 0, max: 0, confidence: 0 };
  const out = { currency: 'CZK' };
  for (const c of CONDS) {
    out[c] = isRange(est[c])
      ? { min: est[c].min, max: est[c].max, confidence: clamp01(est[c].confidence) }
      : { min: Math.round(base.min * MULT[c]), max: Math.round(base.max * MULT[c]), confidence: clamp01(base.confidence - 0.15) };
  }
  return out;
}

export const priceOf = (item, cond = item.condition) => item.estimates[cond];
export const mid = (r) => (r.min + r.max) / 2;
export const total = (items) => items.reduce((s, i) => s + mid(priceOf(i)), 0);

// Maps confidence to a T key.
export const confKey = (c) => (c < 0.4 ? 'low' : c < 0.7 ? 'mid' : 'hi');
