import { create } from 'zustand';
import { waterApi } from '../lib/api';

const TTL = 30 * 1000; // 30 seconds — today's data changes frequently

// localStorage key used as an optimistic cache while the API call is in-flight
const GOAL_KEY = 'water_goal_ml';
const cachedGoal = parseInt(localStorage.getItem(GOAL_KEY) || '0') || 2500;

export const useWaterStore = create((set, get) => ({
  entries: [],
  totalMl: 0,
  goalMl: cachedGoal, // optimistic value until API responds
  progressPercent: 0,
  date: '',
  isLoading: false,
  error: null,
  _lastFetched: 0,

  // ── Fetch today ──────────────────────────────────────────
  fetchToday: async (force = false) => {
    const { _lastFetched } = get();
    if (!force && _lastFetched > 0 && Date.now() - _lastFetched < TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await waterApi.getToday();
      const goal = data.goalMl || 2500;
      // Keep localStorage in sync so next cold-start shows the right goal immediately
      localStorage.setItem(GOAL_KEY, String(goal));
      set({
        entries: data.entries || [],
        totalMl: data.totalMl || 0,
        goalMl: goal,
        progressPercent: data.progressPercent || 0,
        date: data.date || '',
        isLoading: false,
        _lastFetched: Date.now(),
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ── Entries ───────────────────────────────────────────────
  addEntry: async (amountMl, notes = '') => {
    set({ error: null });
    try {
      await waterApi.log(amountMl, notes);
      await get().fetchToday(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateEntry: async (id, updates) => {
    set({ error: null });
    try {
      await waterApi.update(id, updates);
      await get().fetchToday(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteEntry: async (id) => {
    set({ error: null });
    try {
      await waterApi.delete(id);
      await get().fetchToday(true);
    } catch (err) {
      set({ error: err.message });
    }
  },

  // ── Goal ─────────────────────────────────────────────────
  setGoal: async (ml) => {
    const goal = Math.max(100, parseInt(ml) || 2500);

    // Optimistically update UI and cache immediately
    const { totalMl } = get();
    localStorage.setItem(GOAL_KEY, String(goal));
    set({
      goalMl: goal,
      progressPercent: totalMl > 0 ? Math.round((totalMl / goal) * 100) : 0,
    });

    try {
      await waterApi.setGoal(goal);
      // Re-fetch today so goalMl is authoritative from the server
      await get().fetchToday(true);
    } catch (err) {
      set({ error: err.message });
    }
  },
}));
