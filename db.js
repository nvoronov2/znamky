// IndexedDB wrapper. If IndexedDB is unavailable, items live in memory (see init()).
const NAME = 'znamky';
const STORE = 'items';
let db = null;
let mem = null; // Map used only when IndexedDB failed to open

const wrap = (r) => new Promise((ok, fail) => {
  r.onsuccess = () => ok(r.result);
  r.onerror = () => fail(r.error);
});

// Returns true when IndexedDB works, false when running in memory.
export async function init() {
  try {
    const open = indexedDB.open(NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'id' });
    db = await wrap(open);
    return true;
  } catch {
    mem = new Map();
    return false;
  }
}

const store = (mode) => db.transaction(STORE, mode).objectStore(STORE);

export async function all() {
  const rows = mem ? [...mem.values()] : await wrap(store('readonly').getAll());
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function get(id) {
  return mem ? mem.get(id) : wrap(store('readonly').get(id));
}

export async function put(item) {
  if (mem) { mem.set(item.id, item); return; }
  try {
    await wrap(store('readwrite').put(item));
  } catch (e) {
    if (e.name === 'QuotaExceededError') throw new Error('errQuota');
    throw e;
  }
}

export async function del(id) {
  if (mem) { mem.delete(id); return; }
  await wrap(store('readwrite').delete(id));
}
