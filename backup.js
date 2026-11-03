// Collection backup/restore as one JSON file (images included).
import * as db from './db.js';
import { h } from './dom.js';

export async function backupFile() {
  const items = await db.all();
  const day = new Date().toISOString().slice(0, 10);
  const body = JSON.stringify({ app: 'znamky', version: 1, exportedAt: new Date().toISOString(), items });
  return new File([body], `znamky-zaloha-${day}.json`, { type: 'application/json' });
}

// Share sheet where files can be shared (iOS: "Save to Files"), plain download elsewhere.
export async function deliver(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); } catch (e) { if (e.name !== 'AbortError') throw e; }
    return;
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: file.name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

const valid = (i) => i && typeof i.id === 'string' && typeof i.createdAt === 'string' && i.estimates && i.thumb && Array.isArray(i.catalog);

// Writes every item (same id = overwrite). Rejects the whole file when anything is malformed.
export async function restore(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { throw new Error('errBackup'); }
  if (data?.app !== 'znamky' || !Array.isArray(data.items) || !data.items.every(valid)) throw new Error('errBackup');
  for (const item of data.items) await db.put(item);
  return data.items.length;
}
