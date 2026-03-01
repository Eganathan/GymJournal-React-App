import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export const useMetricsStore = create(
  persist(
    (set, get) => ({
      entries: [],
      // User-defined custom metric definitions: { key, label, unit }
      customMetricDefs: [],

      addEntry: (metricType, value, unit, date = new Date().toISOString().slice(0, 10)) => {
        const entry = {
          id: uuid(),
          metricType,
          value: parseFloat(value),
          unit,
          date,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      getLatest: (metricType) => {
        const sorted = get()
          .entries.filter((e) => e.metricType === metricType)
          .sort((a, b) => b.date.localeCompare(a.date));
        return sorted[0] || null;
      },

      getHistory: (metricType) => {
        return get()
          .entries.filter((e) => e.metricType === metricType)
          .sort((a, b) => a.date.localeCompare(b.date));
      },

      // Custom metric management
      addCustomMetricDef: (label, unit) => {
        const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const existing = get().customMetricDefs.find((d) => d.key === key);
        if (existing) return existing.key;
        set((s) => ({
          customMetricDefs: [...s.customMetricDefs, { key, label, unit }],
        }));
        return key;
      },

      removeCustomMetricDef: (key) => {
        set((s) => ({
          customMetricDefs: s.customMetricDefs.filter((d) => d.key !== key),
          entries: s.entries.filter((e) => e.metricType !== key),
        }));
      },
    }),
    { name: 'gymjournal-metrics' }
  )
);
