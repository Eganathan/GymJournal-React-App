import { create } from 'zustand';
import { waterApi } from '../lib/api';

export const useWaterStore = create((set, get) => ({
  // Today's data from API
  entries: [],
  totalMl: 0,
  goalMl: 2500,
  progressPercent: 0,
  date: '',

  // UI state
  isLoading: false,
  error: null,

  /**
   * Fetch today's summary + entries from the API.
   */
  fetchToday: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await waterApi.getToday();
      set({
        entries: data.entries || [],
        totalMl: data.totalMl || 0,
        goalMl: data.goalMl || 2500,
        progressPercent: data.progressPercent || 0,
        date: data.date || '',
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Log a new water entry, then refresh today's data.
   */
  addEntry: async (amountMl, notes = '') => {
    set({ error: null });
    try {
      await waterApi.log(amountMl, notes);
      await get().fetchToday();
    } catch (err) {
      set({ error: err.message });
    }
  },

  /**
   * Update an existing entry, then refresh.
   */
  updateEntry: async (id, updates) => {
    set({ error: null });
    try {
      await waterApi.update(id, updates);
      await get().fetchToday();
    } catch (err) {
      set({ error: err.message });
    }
  },

  /**
   * Delete an entry, then refresh.
   */
  deleteEntry: async (id) => {
    set({ error: null });
    try {
      await waterApi.delete(id);
      await get().fetchToday();
    } catch (err) {
      set({ error: err.message });
    }
  },
}));
