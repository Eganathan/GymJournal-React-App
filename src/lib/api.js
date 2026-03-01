/**
 * API client for GymJournal Server.
 * Credentials included for Catalyst session cookie auth.
 */

const BASE_URL = 'https://appsail-10119736618.development.catalystappsail.com';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
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
    request('/api/v1/metrics/entries', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    }),

  /** Get entries for a specific date */
  getEntries: (date) =>
    request(`/api/v1/metrics/entries?date=${date}`),

  /** Update a single entry */
  updateEntry: (id, updates) =>
    request(`/api/v1/metrics/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  /** Delete a single entry */
  deleteEntry: (id) =>
    request(`/api/v1/metrics/entries/${id}`, { method: 'DELETE' }),

  /** Get history for a metric type */
  getHistory: (metricType, startDate, endDate) => {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const q = qs.toString();
    return request(`/api/v1/metrics/${metricType}/history${q ? `?${q}` : ''}`);
  },

  /** Get latest snapshot of all metrics */
  getSnapshot: () => request('/api/v1/metrics/snapshot'),

  /** Get health insights */
  getInsights: (gender) => {
    const qs = gender ? `?gender=${gender}` : '';
    return request(`/api/v1/metrics/insights${qs}`);
  },

  /** Get custom metric definitions */
  getCustomDefs: () => request('/api/v1/metrics/custom'),

  /** Create a custom metric definition */
  createCustomDef: (label, unit) =>
    request('/api/v1/metrics/custom', {
      method: 'POST',
      body: JSON.stringify({ label, unit }),
    }),

  /** Delete a custom metric definition */
  deleteCustomDef: (key) =>
    request(`/api/v1/metrics/custom/${key}`, { method: 'DELETE' }),
};
