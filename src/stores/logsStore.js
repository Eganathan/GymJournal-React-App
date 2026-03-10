import { create } from 'zustand';
import { logsApi } from '../lib/api';

const RECENT_TTL = 60 * 1000;   // 1 minute
const DATE_TTL   = 60 * 1000;   // 1 minute per date

const normalize = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizeOne = (data) => data?.data ?? data;

export const useLogsStore = create((set, get) => ({
  recent: [],          // last 50 entries
  byDate: {},          // { [YYYY-MM-DD]: entry[] }
  isLoading: false,
  error: null,
  _lastFetchedRecent: 0,
  _lastFetchedByDate: {},  // { [date]: timestamp }

  // ── Fetch recent ─────────────────────────────────────────
  fetchRecent: async (force = false) => {
    const { _lastFetchedRecent } = get();
    if (!force && _lastFetchedRecent > 0 && Date.now() - _lastFetchedRecent < RECENT_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await logsApi.getRecent();
      set({ recent: normalize(data), isLoading: false, _lastFetchedRecent: Date.now() });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Fetch by date ─────────────────────────────────────────
  fetchByDate: async (date, force = false) => {
    const { _lastFetchedByDate } = get();
    const last = _lastFetchedByDate[date] || 0;
    if (!force && last > 0 && Date.now() - last < DATE_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await logsApi.getByDate(date);
      set((s) => ({
        byDate: { ...s.byDate, [date]: normalize(data) },
        _lastFetchedByDate: { ...s._lastFetchedByDate, [date]: Date.now() },
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Create ────────────────────────────────────────────────
  createLog: async (body) => {
    set({ error: null });
    try {
      const created = normalizeOne(await logsApi.create(body));
      if (!created) return null;
      // Optimistically prepend to recent + inject into byDate cache
      set((s) => ({
        recent: [created, ...s.recent],
        byDate: {
          ...s.byDate,
          [created.logDate]: [
            ...(s.byDate[created.logDate] || []),
            created,
          ],
        },
        _lastFetchedRecent: 0, // force re-fetch next time
      }));
      return created;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  // ── Update ────────────────────────────────────────────────
  updateLog: async (id, updates) => {
    set({ error: null });
    try {
      const updated = normalizeOne(await logsApi.update(id, updates));
      if (!updated) return null;
      const patch = (list) =>
        list.map((e) => (String(e.id) === String(id) ? { ...e, ...updated } : e));
      set((s) => ({
        recent: patch(s.recent),
        byDate: Object.fromEntries(
          Object.entries(s.byDate).map(([d, list]) => [d, patch(list)])
        ),
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  // ── Delete ────────────────────────────────────────────────
  deleteLog: async (id) => {
    set({ error: null });
    try {
      await logsApi.delete(id);
      const filter = (list) => list.filter((e) => String(e.id) !== String(id));
      set((s) => ({
        recent: filter(s.recent),
        byDate: Object.fromEntries(
          Object.entries(s.byDate).map(([d, list]) => [d, filter(list)])
        ),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
}));
