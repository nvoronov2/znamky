// All user-facing strings (Czech) and CZK formatting.
export const T = {
  coll: 'Sbírka', set: 'Nastavení', cap: 'Fotografování', shoot: 'Vyfotit známku',
  gal: 'Z galerie', rec: 'Rozpoznávám známku…', back: '‹ Zpět', home: '‹ Sbírka',
  newshot: '‹ Nový snímek', val: 'Odhad sbírky', pcs: 'ks', add: '+ Ohodnotit známku',
  empty: 'Zatím prázdné.', est: 'Orientační hodnota', conf: 'spolehlivost',
  low: 'nízká', mid: 'střední', hi: 'vysoká', nd: 'bez údajů', cat: 'Katalogy',
  catUn: 'Zadej číslo ručně.', cond: 'Stav', mnh: '** nelepená', mh: '* s nálepkou',
  used: 'raženo', cover: 'na obálce', dmg: 's vadami', flags: 'Varovné signály',
  qs: 'Otázky', desc: 'Popis', regen: 'Znovu', auc: 'Pro aukci', cav: 'Co brání odhadu',
  save: 'Uložit do sbírky', disc: 'Odhad je orientační. U drahých známek nutná expertiza.',
  notStamp: 'Není známka.', cUnk: 'Země neurčena', yUnk: 'rok neurčen', sheet: 'arch',
  den: 'Nominále', subj: 'Motiv', country: 'Země', share: 'Sdílet', del: 'Smazat',
  csv: 'Export do CSV', key: 'API klíč', mode: 'Režim', proxy: 'URL proxy',
  demo: 'Demo', imp: 'Vložit JSON', cpPrompt: 'Zkopírovat prompt', paste: 'Odpověď AI',
  use: 'Zpracovat', errLim: 'Limit. Počkej minutu.', errReq: 'Špatný model nebo klíč.',
  errEmpty: 'Prázdná odpověď.', errGen: 'Chyba.', errKey: 'Chybí klíč.', errNet: 'Síť selhala.',
  errParse: 'Neplatný JSON.',
  // Added to the original spec:
  start: 'Začít', model: 'Model', test: 'Ověřit spojení', testOk: 'Spojení funguje.',
  note: 'Poznámka', delAsk: 'Opravdu smazat?', direct: 'Přímo', copied: 'Zkopírováno.',
  hintBack: 'zezadu', hintSheet: 'celý arch', hintWm: 'vodoznak',
  tip1: 'Fotografuj při denním světle, bez blesku.',
  tip2: 'Známka má vyplnit celý záběr.',
  tip3: 'U dražších kusů přidej i snímek zezadu.',
  dbWarn: 'Úložiště není dostupné, sbírka se neuloží trvale.',
  errQuota: 'Úložiště je plné. Záznam nebyl uložen.',
  errImg: 'Soubor není obrázek.',
  types: { single: 'jednotlivá', pair: 'pár', block: 'blok', sheet: 'arch', cover: 'obálka', other: 'jiné' },
  addCat: '+ Katalog', errNoPhoto: 'Nejdřív vyber fotku.', yearFrom: 'Rok od', yearTo: 'Rok do',
  qty: 'Počet', type: 'Typ', num: 'Číslo', min: 'Od (Kč)', max: 'Do (Kč)', feat: 'Znaky',
  app: 'Známky', modeProxy: 'Proxy', ukazka: 'UKÁZKA',
  csvCols: ['Datum', 'Země', 'Rok od', 'Rok do', 'Nominále', 'Motiv', 'Typ', 'Počet', 'Stav', 'Min', 'Max', 'Spolehlivost', 'Katalog', 'Popis'],
};

const COND_KEY = { on_cover: 'cover', damaged: 'dmg' };
export const condLabel = (c) => T[COND_KEY[c] ?? c];

// "1920", "1920–1925" or "rok neurčen"
export function yearLabel(i) {
  if (!i.yearFrom) return T.yUnk;
  return i.yearTo && i.yearTo !== i.yearFrom ? `${i.yearFrom}–${i.yearTo}` : String(i.yearFrom);
}

const NBSP = '\u00A0';

// czk(1234) -> "1 234 Kč" (NBSP thousands separator, integer, no decimals)
export function czk(n) {
  const s = String(Math.round(n));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + ' Kč';
}

// "100 Kč – 300 Kč" or "bez údajů"
export const rangeText = (r) => (r.max > 0 ? `${czk(r.min)} – ${czk(r.max)}` : T.nd);
