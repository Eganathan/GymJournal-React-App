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
