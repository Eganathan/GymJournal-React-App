import { create } from 'zustand';
import { routinesApi } from '../lib/api';

// IDs from the server may be numbers or strings (server serializes Long as JSON string);
// URL params from useParams() are always strings. Use sameId() for all comparisons.
const sameId = (a, b) => String(a) === String(b);

export const useRoutineStore = create((set, get) => ({
  routines: [],
  currentRoutine: null,
  isLoading: false,
  error: null,

  /** Fetch user's routines list */
  fetchRoutines: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await routinesApi.list({ mine: true });
      const list = Array.isArray(data) ? data : data?.routines || [];
      set({ routines: list });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  /** Fetch a single routine by ID (full detail with items) */
  fetchRoutine: async (id) => {
    set({ isLoading: true, error: null, currentRoutine: null });
    try {
      const routine = await routinesApi.getById(id);
      set({ currentRoutine: routine });
      return routine;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /** Create a new routine on the server (requires at least 1 item) */
  createRoutine: async (routineData) => {
    set({ isLoading: true, error: null });
    try {
      const routine = await routinesApi.create(routineData);
      set((s) => ({ routines: [routine, ...s.routines] }));
      return routine.id;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  /** Update routine on server (full replacement including items) */
  updateRoutine: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await routinesApi.update(id, updates);
      set((s) => ({
        routines: s.routines.map((r) => (sameId(r.id, id) ? { ...r, ...updated } : r)),
        currentRoutine: sameId(s.currentRoutine?.id, id) ? { ...s.currentRoutine, ...updated } : s.currentRoutine,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  /** Delete routine */
  deleteRoutine: async (id) => {
    set({ error: null });
    try {
      await routinesApi.delete(id);
      set((s) => ({
        routines: s.routines.filter((r) => !sameId(r.id, id)),
        currentRoutine: sameId(s.currentRoutine?.id, id) ? null : s.currentRoutine,
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  /** Get routine from local state (for quick access from list) */
  getRoutine: (id) => {
    const { currentRoutine, routines } = get();
    if (sameId(currentRoutine?.id, id)) return currentRoutine;
    return routines.find((r) => sameId(r.id, id)) || null;
  },

  /** Add exercise to routine (local state + save to server) */
  addExercise: async (routineId, exercise) => {
    const { currentRoutine } = get();
    const routine = sameId(currentRoutine?.id, routineId) ? currentRoutine : get().routines.find((r) => sameId(r.id, routineId));
    if (!routine) return;

    const items = [...(routine.items || [])];
    items.push({
      type: 'EXERCISE',
      exerciseId: exercise.id || null,
      exerciseName: exercise.name,
      sets: exercise.defaultSets || 3,
      repsPerSet: exercise.defaultReps || 10,
      weightKg: exercise.defaultWeightKg || null,
      restAfterSeconds: 90,
      notes: '',
      order: items.length + 1,
    });
    items.push({
      type: 'REST',
      durationSeconds: 90,
      order: items.length + 1,
    });

    try {
      const updated = await routinesApi.update(routineId, { ...routine, items });
      set((s) => ({
        currentRoutine: sameId(s.currentRoutine?.id, routineId) ? { ...s.currentRoutine, ...updated } : s.currentRoutine,
        routines: s.routines.map((r) => (sameId(r.id, routineId) ? { ...r, ...updated } : r)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  /** Add a REST block to routine (local state + save to server) */
  addRestBlock: async (routineId, durationSeconds = 90) => {
    const { currentRoutine } = get();
    const routine = sameId(currentRoutine?.id, routineId) ? currentRoutine : get().routines.find((r) => sameId(r.id, routineId));
    if (!routine) return;

    const items = [...(routine.items || [])];
    items.push({
      type: 'REST',
      durationSeconds,
      order: items.length + 1,
    });

    try {
      const updated = await routinesApi.update(routineId, { ...routine, items });
      set((s) => ({
        currentRoutine: sameId(s.currentRoutine?.id, routineId) ? { ...s.currentRoutine, ...updated } : s.currentRoutine,
        routines: s.routines.map((r) => (sameId(r.id, routineId) ? { ...r, ...updated } : r)),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  /** Update an exercise item locally (call saveRoutineItems to persist) */
  updateExerciseLocal: (routineId, itemIndex, updates) => {
    set((s) => {
      if (!sameId(s.currentRoutine?.id, routineId)) return s;
      const items = [...s.currentRoutine.items];
      items[itemIndex] = { ...items[itemIndex], ...updates };
      return { currentRoutine: { ...s.currentRoutine, items } };
    });
  },

  /** Remove an exercise item locally */
  removeExerciseLocal: (routineId, itemIndex) => {
    set((s) => {
      if (!sameId(s.currentRoutine?.id, routineId)) return s;
      const items = s.currentRoutine.items
        .filter((_, i) => i !== itemIndex)
        .map((item, i) => ({ ...item, order: i + 1 }));
      return { currentRoutine: { ...s.currentRoutine, items } };
    });
  },

  /** Reorder exercises locally */
  reorderExercisesLocal: (routineId, fromIndex, toIndex) => {
    set((s) => {
      if (!sameId(s.currentRoutine?.id, routineId)) return s;
      const items = [...s.currentRoutine.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return {
        currentRoutine: {
          ...s.currentRoutine,
          items: items.map((item, i) => ({ ...item, order: i + 1 })),
        },
      };
    });
  },

  /** Save current routine items to server */
  saveRoutineItems: async (routineId) => {
    const { currentRoutine } = get();
    if (!sameId(currentRoutine?.id, routineId)) return;

    set({ error: null });
    try {
      const updated = await routinesApi.update(routineId, {
        name: currentRoutine.name,
        description: currentRoutine.description,
        items: currentRoutine.items,
        isPublic: currentRoutine.isPublic,
      });
      set((s) => ({
        currentRoutine: sameId(s.currentRoutine?.id, routineId) ? { ...s.currentRoutine, ...updated } : s.currentRoutine,
        routines: s.routines.map((r) => (sameId(r.id, routineId) ? { ...r, ...updated } : r)),
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  /** Clone a routine */
  cloneRoutine: async (id) => {
    set({ error: null });
    try {
      const cloned = await routinesApi.clone(id);
      set((s) => ({ routines: [cloned, ...s.routines] }));
      return cloned;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
