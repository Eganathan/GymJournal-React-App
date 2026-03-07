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
      let snapshot = data || {};
      if (Array.isArray(data)) {
        snapshot = {};
        data.forEach((item) => {
          snapshot[item.metricType] = item;
        });
      }
      set({ snapshot, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Insights ─────────────────────────────────────────────
  fetchInsights: async (gender) => {
    try {
      const data = await metricsApi.getInsights(gender);
      set({ insights: Array.isArray(data) ? data : [] });
    } catch {
      // insights are optional — fail silently
    }
  },

  // ── Custom Definitions ───────────────────────────────────
  fetchCustomDefs: async () => {
    try {
      const data = await metricsApi.getCustomDefs();
      set({ customDefs: Array.isArray(data) ? data : [] });
    } catch (err) {
      set({ error: err.message });
    }
  },

  createCustomDef: async (label, unit) => {
    try {
      await metricsApi.createCustomDef(label, unit);
      await get().fetchCustomDefs();
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteCustomDef: async (key) => {
    try {
      await metricsApi.deleteCustomDef(key);
      await get().fetchCustomDefs();
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── History ──────────────────────────────────────────────
  fetchHistory: async (metricType, startDate, endDate) => {
    // NOTE: does NOT set global isLoading — called in parallel for sparklines
    try {
      const data = await metricsApi.getHistory(metricType, startDate, endDate);
      const entries = Array.isArray(data) ? data : data?.entries || [];
      set((s) => ({
        history: { ...s.history, [metricType]: entries },
      }));
    } catch {
      // fail silently — sparkline just won't render
    }
  },

  // ── Day Entries (for log form pre-fill) ──────────────────
  fetchDayEntries: async (date) => {
    try {
      const data = await metricsApi.getEntries(date);
      set({ dayEntries: Array.isArray(data) ? data : [] });
    } catch {
      set({ dayEntries: [] });
    }
  },

  // ── Log / Update / Delete ────────────────────────────────
  logEntries: async (entries) => {
    set({ isLoading: true, error: null });
    try {
      await metricsApi.logEntries(entries);
      await get().fetchSnapshot();
      set({ isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      await metricsApi.updateEntry(id, updates);
      await get().fetchSnapshot();
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteEntry: async (id) => {
    try {
      await metricsApi.deleteEntry(id);
      await get().fetchSnapshot();
    } catch (err) {
      set({ error: err.message });
    }
  },

  // Convenience: get latest value for a metric from snapshot
  getLatest: (metricType) => {
    const snap = get().snapshot[metricType];
    return snap || null;
  },
}));
