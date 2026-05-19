// Total reset utility. Wipes every persistence surface the app uses
// (and any leftover from older versions), then hard-reloads.
//
// Wiped:
//   - localStorage
//   - sessionStorage
//   - IndexedDB (all databases visible to the origin)
//   - Cache API (all service-worker caches)
//   - Service worker registrations
//
// Used by:
//   - Settings → "Delete All Data"
//   - Error boundary → "Full reset and restart"
//
// Returns a Promise that resolves only after window.location.reload() is queued.
export async function nukeAndReload() {
  const tasks = [];

  // 1. Web Storage — synchronous, do first
  try { localStorage.clear(); } catch (e) { console.warn("localStorage.clear failed", e); }
  try { sessionStorage.clear(); } catch (e) { console.warn("sessionStorage.clear failed", e); }

  // 2. IndexedDB — delete every database
  tasks.push((async () => {
    try {
      if (typeof indexedDB === "undefined") return;
      // Modern browsers expose indexedDB.databases(). Older ones don't.
      if (typeof indexedDB.databases === "function") {
        const dbs = await indexedDB.databases();
        await Promise.all(dbs.map(db => {
          if (!db?.name) return Promise.resolve();
          return new Promise(resolve => {
            const req = indexedDB.deleteDatabase(db.name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          });
        }));
      }
    } catch (e) {
      console.warn("IndexedDB wipe failed", e);
    }
  })());

  // 3. Cache API — service worker caches
  tasks.push((async () => {
    try {
      if (typeof caches === "undefined") return;
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {
      console.warn("Cache API wipe failed", e);
    }
  })());

  // 4. Service workers — unregister so they don't re-hydrate caches
  tasks.push((async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch (e) {
      console.warn("Service worker unregister failed", e);
    }
  })());

  await Promise.all(tasks);

  // Hard reload. Some browsers honor reload(true) for cache bypass; spec
  // doesn't require it, so we add a cache-busting query string.
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("_reset", Date.now().toString());
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}
