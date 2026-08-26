const entries = new Map<string, string>();

/**
 * An in-memory `Storage`, preloaded into every test process.
 *
 * The notes store persists through zustand's `persist` middleware, which drops
 * its whole persistence layer — `store.persist` included — when `localStorage`
 * is missing at import time. Node has no such global, so without this the
 * store under test is not the store that ships.
 */
const memoryStorage: Storage = {
  get length() {
    return entries.size;
  },
  clear: () => entries.clear(),
  getItem: (key) => entries.get(key) ?? null,
  key: (index) => [...entries.keys()][index] ?? null,
  removeItem: (key) => {
    entries.delete(key);
  },
  setItem: (key, value) => {
    entries.set(key, value);
  },
};

globalThis.localStorage = memoryStorage;
