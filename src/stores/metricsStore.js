import { create } from 'zustand';
import { metricsApi } from '../lib/api';

const SNAPSHOT_TTL   = 5  * 60 * 1000;  // 5 minutes
const INSIGHTS_TTL   = 10 * 60 * 1000;  // 10 minutes
const CUSTOM_TTL     = 5  * 60 * 1000;  // 5 minutes
const HISTORY_TTL    = 10 * 60 * 1000;  // 10 minutes per metric type

export const useMetricsStore = create((set, get) => ({
  snapshot: {},
  insights: [],
  customDefs: [],
  history: {},
  dayEntries: [],
  isLoading: false,
  error: null,

  // Cache timestamps
  _lastFetchedSnapshot: 0,
  _lastFetchedInsights: 0,
  _lastFetchedCustomDefs: 0,
  _lastFetchedHistory: {}, // { [metricType]: timestamp }

  // ── Snapshot ──────────────────────────────────────────────
  fetchSnapshot: async (force = false) => {
    const { _lastFetchedSnapshot, snapshot } = get();
    if (!force && Object.keys(snapshot).length > 0 && Date.now() - _lastFetchedSnapshot < SNAPSHOT_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await metricsApi.getSnapshot();
      let normalized = data || {};
      if (Array.isArray(data)) {
        normalized = {};
        data.forEach((item) => { normalized[item.metricType] = item; });
      }
      set({ snapshot: normalized, isLoading: false, _lastFetchedSnapshot: Date.now() });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Insights ─────────────────────────────────────────────
  fetchInsights: async (gender, force = false) => {
    const { _lastFetchedInsights, insights } = get();
    if (!force && insights.length > 0 && Date.now() - _lastFetchedInsights < INSIGHTS_TTL) return;

    try {
      const data = await metricsApi.getInsights(gender);
      set({ insights: Array.isArray(data) ? data : [], _lastFetchedInsights: Date.now() });
    } catch {
      // insights are optional — fail silently
    }
  },

  // ── Custom Definitions ───────────────────────────────────
  fetchCustomDefs: async (force = false) => {
    const { _lastFetchedCustomDefs, customDefs } = get();
    if (!force && customDefs.length > 0 && Date.now() - _lastFetchedCustomDefs < CUSTOM_TTL) return;

    try {
      const data = await metricsApi.getCustomDefs();
      set({ customDefs: Array.isArray(data) ? data : [], _lastFetchedCustomDefs: Date.now() });
    } catch (err) {
      set({ error: err.message });
    }
  },

  createCustomDef: async (label, unit) => {
    try {
      await metricsApi.createCustomDef(label, unit);
      set({ _lastFetchedCustomDefs: 0 }); // invalidate
      await get().fetchCustomDefs(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteCustomDef: async (key) => {
    try {
      await metricsApi.deleteCustomDef(key);
      set({ _lastFetchedCustomDefs: 0 }); // invalidate
      await get().fetchCustomDefs(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── History ──────────────────────────────────────────────
  fetchHistory: async (metricType, startDate, endDate, force = false) => {
    const { _lastFetchedHistory } = get();
    const lastFetched = _lastFetchedHistory[metricType] || 0;
    if (!force && lastFetched > 0 && Date.now() - lastFetched < HISTORY_TTL) return;

    try {
      const data = await metricsApi.getHistory(metricType, startDate, endDate);
      const entries = Array.isArray(data) ? data : data?.entries || [];
      set((s) => ({
        history: { ...s.history, [metricType]: entries },
        _lastFetchedHistory: { ...s._lastFetchedHistory, [metricType]: Date.now() },
      }));
    } catch {
      // fail silently — sparkline just won't render
    }
  },

  // ── Day Entries (log form pre-fill — always fresh, no cache) ─
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
      set({ _lastFetchedSnapshot: 0 }); // invalidate snapshot
      await get().fetchSnapshot(true);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateEntry: async (id, updates) => {
    try {
      await metricsApi.updateEntry(id, updates);
      set({ _lastFetchedSnapshot: 0 }); // invalidate
      await get().fetchSnapshot(true);
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteEntry: async (id) => {
    try {
      await metricsApi.deleteEntry(id);
      set({ _lastFetchedSnapshot: 0 }); // invalidate
      await get().fetchSnapshot(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  getLatest: (metricType) => {
    const snap = get().snapshot[metricType];
    return snap || null;
  },
}));
