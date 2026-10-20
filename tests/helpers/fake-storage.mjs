/**
 * Minimal in-memory `localStorage` stand-in for tests.
 * Throwing reads/writes simulate a disabled, private-mode or full store,
 * so the fallback paths can be verified without touching real browser storage.
 *
 * @param {{ initial?: Record<string, string>, failReads?: boolean, failWrites?: boolean }} [options]
 */
export function createFakeStorage(options = {}) {
  const { initial = {}, failReads = false, failWrites = false } = options;
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    getItem(key) {
      if (failReads) throw new Error('storage read blocked');
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      if (failWrites) throw new Error('storage write blocked');
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    has(key) {
      return data.has(key);
    },
    dump() {
      return Object.fromEntries(data);
    },
  };
}
