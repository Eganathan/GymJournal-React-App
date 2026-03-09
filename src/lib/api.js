/**
 * API client for GymJournal Server.
 * Credentials included for Catalyst session cookie auth.
 *
 * X-Catalyst-Uid: set after login with the user_id from getCurrentProjectUser().
 * Used server-side to log expected vs actual ZGS-injected user ID.
 */

const BASE_URL = 'https://appsail-10119736618.development.catalystappsail.com';

let _currentUserId = null;

/** Called by authStore after login to bind the verified Catalyst user_id. */
export function setCurrentUser(userId) {
  _currentUserId = userId ? String(userId) : null;
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(_currentUserId ? { 'X-Catalyst-Uid': _currentUserId } : {}),
      ...options.headers,
    },
  });

  // 204 No Content (e.g. DELETE)
  if (res.status === 204) return null;

  const json = await res.json();

  if (!res.ok || !json.success) {
    const msg = json.error?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.code = json.error?.code || res.status;
    throw err;
  }

  return json.data;
}

// ── Health ────────────────────────────────────────────────

export const healthApi = {
  /** Server health / warm-up ping */
  check: () =>
    fetch(`${BASE_URL}/api/v1/health`, { credentials: 'include' }).then((r) => r.json()),
};

// ── Hydration ──────────────────────────────────────────────

export const waterApi = {
  /** Log a water intake entry */
  log: (amountMl, notes = '', logDateTime = undefined) =>
    request('/api/v1/water', {
      method: 'POST',
      body: JSON.stringify({ amountMl, notes, logDateTime }),
    }),

  /** Get today's summary + entries */
  getToday: () => request('/api/v1/water/today'),

  /** Get summary + entries for a specific date */
  getDaily: (date) => request(`/api/v1/water/daily?date=${date}`),

  /** Get daily totals for a date range (trend chart) */
  getHistory: (startDate, endDate) =>
    request(`/api/v1/water/history?startDate=${startDate}&endDate=${endDate}`),

  /** Update an existing entry */
  update: (id, updates) =>
    request(`/api/v1/water/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete an entry */
  delete: (id) =>
    request(`/api/v1/water/${id}`, { method: 'DELETE' }),
};

// ── Exercises ──────────────────────────────────────────────

export const exercisesApi = {
  /** List exercise categories (muscle groups) */
  getCategories: () => request('/api/v1/exercises/categories'),

  /** List equipment types */
  getEquipment: () => request('/api/v1/exercises/equipment'),

  /** List exercises with optional filters */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.categoryId) qs.set('categoryId', params.categoryId);
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const q = qs.toString();
    return request(`/api/v1/exercises${q ? `?${q}` : ''}`);
  },

  /** Get single exercise by ID */
  getById: (id) => request(`/api/v1/exercises/${id}`),

  /** Create a new exercise */
  create: (exercise) =>
    request('/api/v1/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    }),

  /** Update an exercise */
  update: (id, updates) =>
    request(`/api/v1/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete an exercise */
  delete: (id) =>
    request(`/api/v1/exercises/${id}`, { method: 'DELETE' }),

  /** Seed default exercises (admin) */
  seed: () =>
    request('/api/v1/admin/seed', { method: 'POST' }),
};

// ── Metrics ────────────────────────────────────────────────

export const metricsApi = {
  /** Batch-log metric entries */
  logEntries: (entries) =>
    request('/api/v1/body-metrics/entries', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),

  /** Get entries for a specific date */
  getEntries: (date) =>
    request(`/api/v1/body-metrics/entries?date=${date}`),

  /** Update a single entry */
  updateEntry: (id, updates) =>
    request(`/api/v1/body-metrics/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete a single entry */
  deleteEntry: (id) =>
    request(`/api/v1/body-metrics/entries/${id}`, { method: 'DELETE' }),

  /** Get history for a metric type */
  getHistory: (metricType, startDate, endDate) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const q = qs.toString();
    return request(`/api/v1/body-metrics/${metricType}/history${q ? `?${q}` : ''}`);
  },

  /** Get latest snapshot of all metrics */
  getSnapshot: () => request('/api/v1/body-metrics/snapshot'),

  /** Get health insights */
  getInsights: (gender) => {
    const qs = gender ? `?gender=${gender}` : '';
    return request(`/api/v1/body-metrics/insights${qs}`);
  },

  /** Get custom metric definitions */
  getCustomDefs: () => request('/api/v1/body-metrics/custom'),

  /** Create a custom metric definition */
  createCustomDef: (label, unit) =>
    request('/api/v1/body-metrics/custom', {
      method: 'POST',
      body: JSON.stringify({ label, unit }),
    }),

  /** Delete a custom metric definition */
  deleteCustomDef: (key) =>
    request(`/api/v1/body-metrics/custom/${key}`, { method: 'DELETE' }),
};

// ── Routines ──────────────────────────────────────────────

export const routinesApi = {
  /** List routines — pass mine=true for own, omit for public browse */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.mine) qs.set('mine', 'true');
    if (params.search) qs.set('search', params.search);
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const q = qs.toString();
    return request(`/api/v1/routines${q ? `?${q}` : ''}`);
  },

  /** Get full routine with items */
  getById: (id) => request(`/api/v1/routines/${id}`),

  /** Create a routine */
  create: (routine) =>
    request('/api/v1/routines', {
      method: 'POST',
      body: JSON.stringify(routine),
    }),

  /** Update a routine (full replacement) */
  update: (id, routine) =>
    request(`/api/v1/routines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routine),
    }),

  /** Delete a routine */
  delete: (id) =>
    request(`/api/v1/routines/${id}`, { method: 'DELETE' }),

  /** Clone a routine to own library */
  clone: (id) =>
    request(`/api/v1/routines/${id}/clone`, { method: 'POST' }),
};

// ── Media ─────────────────────────────────────────────────

export const mediaApi = {
  /**
   * Upload a file to Catalyst FileStore.
   * Returns { url, fileId, fileName, mimeType, sizeBytes }.
   *
   * Do NOT pass Content-Type — the browser sets it automatically
   * with the correct multipart boundary for FormData.
   *
   * @param {File} file - File object from <input type="file">
   * @param {string} [folder] - "exercises" | "routines" | "misc" (default: "misc")
   */
  upload: async (file, folder) => {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);

    const url = `${BASE_URL}/api/v1/media/upload`;
    const headers = _currentUserId ? { 'X-Catalyst-Uid': _currentUserId } : {};

    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,          // intentionally no Content-Type — browser sets multipart boundary
      body: form,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      const msg = json.error?.message || `Upload failed (${res.status})`;
      const err = new Error(msg);
      err.code = json.error?.code || res.status;
      throw err;
    }
    return json.data;
  },
};

// ── Workouts ──────────────────────────────────────────────

export const workoutsApi = {
  /** Start a new workout session */
  start: (body = {}) =>
    request('/api/v1/workouts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** List workout sessions */
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    if (params.pageSize) qs.set('pageSize', params.pageSize);
    const q = qs.toString();
    return request(`/api/v1/workouts${q ? `?${q}` : ''}`);
  },

  /** Get full session with sets */
  getById: (id) => request(`/api/v1/workouts/${id}`),

  /** Update session name/notes */
  update: (id, updates) =>
    request(`/api/v1/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  /** Complete a workout (triggers PB detection) */
  complete: (id) =>
    request(`/api/v1/workouts/${id}/complete`, { method: 'POST' }),

  /** Delete a workout */
  delete: (id) =>
    request(`/api/v1/workouts/${id}`, { method: 'DELETE' }),

  /** Add a set to a session */
  addSet: (sessionId, set) =>
    request(`/api/v1/workouts/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(set),
    }),

  /** Update a set (PATCH — partial update, all fields optional) */
  updateSet: (sessionId, setId, updates) =>
    request(`/api/v1/workouts/${sessionId}/sets/${setId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  /** Delete a set */
  deleteSet: (sessionId, setId) =>
    request(`/api/v1/workouts/${sessionId}/sets/${setId}`, { method: 'DELETE' }),

  /** Get exercise history */
  getExerciseHistory: (exerciseId) =>
    request(`/api/v1/exercises/${exerciseId}/history`),

  /** Get personal bests for an exercise */
  getExercisePBs: (exerciseId) =>
    request(`/api/v1/exercises/${exerciseId}/pbs`),
};
