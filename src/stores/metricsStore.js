import { create } from 'zustand';
import { metricsApi } from '../lib/api';

export const useMetricsStore = create((set, get) => ({
  // Latest value per metric type: { [metricType]: { value, unit, logDate } }
  snapshot: {},
  // Health insights from server
  insights: [],
  // Custom metric definitions
  customDefs: [],
  // History cache: { [metricType]: entry[] }
  history: {},
  // Entries for a specific date (log form pre-fill)
  dayEntries: [],

  isLoading: false,
  error: null,

  // ── Snapshot ──────────────────────────────────────────────
  fetchSnapshot: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await metricsApi.getSnapshot();
      console.log('[metricsStore] fetchSnapshot response:', data);
      let snapshot = data || {};
      if (Array.isArray(data)) {
        snapshot = {};
        data.forEach((item) => {
          snapshot[item.metricType] = item;
        });
      }
      set({ snapshot, isLoading: false });
    } catch (err) {
      console.error('[metricsStore] fetchSnapshot error:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Insights ─────────────────────────────────────────────
  fetchInsights: async (gender) => {
    try {
      const data = await metricsApi.getInsights(gender);
      console.log('[metricsStore] fetchInsights response:', data);
      set({ insights: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error('[metricsStore] fetchInsights error:', err);
    }
  },

  // ── Custom Definitions ───────────────────────────────────
  fetchCustomDefs: async () => {
    try {
      const data = await metricsApi.getCustomDefs();
      console.log('[metricsStore] fetchCustomDefs response:', data);
      set({ customDefs: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error('[metricsStore] fetchCustomDefs error:', err);
    }
  },

  createCustomDef: async (label, unit) => {
    try {
      const result = await metricsApi.createCustomDef(label, unit);
      console.log('[metricsStore] createCustomDef response:', result);
      await get().fetchCustomDefs();
    } catch (err) {
      console.error('[metricsStore] createCustomDef error:', err);
      set({ error: err.message });
    }
  },

  deleteCustomDef: async (key) => {
    try {
      await metricsApi.deleteCustomDef(key);
      console.log('[metricsStore] deleteCustomDef success:', key);
      await get().fetchCustomDefs();
    } catch (err) {
      console.error('[metricsStore] deleteCustomDef error:', err);
      set({ error: err.message });
    }
  },

  // ── History ──────────────────────────────────────────────
  fetchHistory: async (metricType, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const data = await metricsApi.getHistory(metricType, startDate, endDate);
      console.log('[metricsStore] fetchHistory response:', metricType, data);
      const entries = Array.isArray(data) ? data : data?.entries || [];
      set((s) => ({
        history: { ...s.history, [metricType]: entries },
        isLoading: false,
      }));
    } catch (err) {
      console.error('[metricsStore] fetchHistory error:', metricType, err);
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Day Entries (for log form pre-fill) ──────────────────
  fetchDayEntries: async (date) => {
    try {
      const data = await metricsApi.getEntries(date);
      console.log('[metricsStore] fetchDayEntries response:', date, data);
      set({ dayEntries: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error('[metricsStore] fetchDayEntries error:', date, err);
      set({ dayEntries: [] });
    }
  },

  // ── Log / Update / Delete ────────────────────────────────
  logEntries: async (entries) => {
    set({ isLoading: true, error: null });
    try {
      const result = await metricsApi.logEntries(entries);
      console.log('[metricsStore] logEntries response:', result);
      await get().fetchSnapshot();
      set({ isLoading: false });
    } catch (err) {
      console.error('[metricsStore] logEntries error:', err);
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      const result = await metricsApi.updateEntry(id, updates);
      console.log('[metricsStore] updateEntry response:', result);
      await get().fetchSnapshot();
    } catch (err) {
      console.error('[metricsStore] updateEntry error:', err);
      set({ error: err.message });
      throw err;
    }
  },

  deleteEntry: async (id) => {
    try {
      await metricsApi.deleteEntry(id);
      console.log('[metricsStore] deleteEntry success:', id);
      await get().fetchSnapshot();
    } catch (err) {
      console.error('[metricsStore] deleteEntry error:', err);
      set({ error: err.message });
    }
  },

  // Convenience: get latest value for a metric from snapshot
  getLatest: (metricType) => {
    const snap = get().snapshot[metricType];
    return snap || null;
  },
}));
