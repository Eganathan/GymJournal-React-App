/**
 * Lightweight in-memory TTL cache.
 * Survives component re-mounts (module-level), lost on full page refresh.
 * Used for rarely-changing lookup data (categories, equipment).
 */

const _store = {};

/** Read a cached value. Returns null if missing or expired. */
export function getCache(key) {
  const entry = _store[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > entry.ttl) {
    delete _store[key];
    return null;
  }
  return entry.data;
}

/** Write a value to the cache with a TTL in milliseconds. */
export function setCache(key, data, ttlMs = 5 * 60 * 1000) {
  _store[key] = { data, ts: Date.now(), ttl: ttlMs };
}

/** Remove a specific key (call after mutations that invalidate the data). */
export function clearCache(key) {
  delete _store[key];
}

/**
 * Read category cache only if items actually have display text.
 * Guards against stale cache entries stored before data was seeded.
 */
export function getCachedCategories() {
  const data = getCache('exercise-categories');
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  if (first.shortName || first.displayName || first.name) return data;
  // Cache has categories with no text — invalidate so we re-fetch
  clearCache('exercise-categories');
  return null;
}
