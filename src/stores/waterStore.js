import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

const DEFAULT_GOAL = 2500;

export const useWaterStore = create(
  persist(
    (set, get) => ({
      entries: [],
      dailyGoal: DEFAULT_GOAL,

      addEntry: (amount, note = '') => {
        const entry = {
          id: uuid(),
          amount: parseInt(amount),
          note,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      deleteEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      setDailyGoal: (goal) => set({ dailyGoal: goal }),

      getTodayEntries: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().entries.filter((e) => e.timestamp.slice(0, 10) === today);
      },

      getTodayTotal: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get()
          .entries.filter((e) => e.timestamp.slice(0, 10) === today)
          .reduce((sum, e) => sum + e.amount, 0);
      },
    }),
    { name: 'gymjournal-water' }
  )
);
