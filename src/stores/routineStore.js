import { create } from 'zustand';
import { routinesApi } from '../lib/api';

const sameId = (a, b) => String(a) === String(b);

const ROUTINES_TTL = 2 * 60 * 1000;   // 2 minutes for list
const ROUTINE_TTL  = 1 * 60 * 1000;   // 1 minute for single routine detail

export const useRoutineStore = create((set, get) => ({
  routines: [],
  currentRoutine: null,
  isLoading: false,
  error: null,
  _lastFetchedList: 0,
  _lastFetchedRoutine: {}, // { [id]: timestamp }

  fetchRoutines: async (force = false) => {
    const { _lastFetchedList, routines } = get();
    if (!force && routines.length > 0 && Date.now() - _lastFetchedList < ROUTINES_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const data = await routinesApi.list({ mine: true });
      const list = Array.isArray(data) ? data : data?.routines || [];
      set({ routines: list, _lastFetchedList: Date.now() });
    } catch (err) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRoutine: async (id, force = false) => {
    const { _lastFetchedRoutine, currentRoutine } = get();
    const lastFetched = _lastFetchedRoutine[id] || 0;
    if (
      !force &&
      currentRoutine &&
      sameId(currentRoutine.id, id) &&
      Date.now() - lastFetched < ROUTINE_TTL
    ) return currentRoutine;

    set({ isLoading: true, error: null, currentRoutine: null });
    try {
      const routine = await routinesApi.getById(id);
      set({
        currentRoutine: routine,
        _lastFetchedRoutine: { ...get()._lastFetchedRoutine, [id]: Date.now() },
      });
      return routine;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  createRoutine: async (routineData) => {
    set({ isLoading: true, error: null });
    try {
      const routine = await routinesApi.create(routineData);
      set((s) => ({
        routines: [routine, ...s.routines],
        _lastFetchedList: 0, // invalidate list cache — new item added
      }));
      return routine.id;
    } catch (err) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

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

  deleteRoutine: async (id) => {
    set({ error: null });
    try {
      await routinesApi.delete(id);
      set((s) => ({
        routines: s.routines.filter((r) => !sameId(r.id, id)),
        currentRoutine: sameId(s.currentRoutine?.id, id) ? null : s.currentRoutine,
        _lastFetchedList: 0, // invalidate
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  getRoutine: (id) => {
    const { currentRoutine, routines } = get();
    if (sameId(currentRoutine?.id, id)) return currentRoutine;
    return routines.find((r) => sameId(r.id, id)) || null;
  },

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
        _lastFetchedRoutine: { ...s._lastFetchedRoutine, [routineId]: Date.now() },
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  addRestBlock: async (routineId, durationSeconds = 90) => {
    const { currentRoutine } = get();
    const routine = sameId(currentRoutine?.id, routineId) ? currentRoutine : get().routines.find((r) => sameId(r.id, routineId));
    if (!routine) return;

    const items = [...(routine.items || [])];
    items.push({ type: 'REST', durationSeconds, order: items.length + 1 });

    try {
      const updated = await routinesApi.update(routineId, { ...routine, items });
      set((s) => ({
        currentRoutine: sameId(s.currentRoutine?.id, routineId) ? { ...s.currentRoutine, ...updated } : s.currentRoutine,
        routines: s.routines.map((r) => (sameId(r.id, routineId) ? { ...r, ...updated } : r)),
        _lastFetchedRoutine: { ...s._lastFetchedRoutine, [routineId]: Date.now() },
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  updateExerciseLocal: (routineId, itemIndex, updates) => {
    set((s) => {
      if (!sameId(s.currentRoutine?.id, routineId)) return s;
      const items = [...s.currentRoutine.items];
      items[itemIndex] = { ...items[itemIndex], ...updates };
      return { currentRoutine: { ...s.currentRoutine, items } };
    });
  },

  removeExerciseLocal: (routineId, itemIndex) => {
    set((s) => {
      if (!sameId(s.currentRoutine?.id, routineId)) return s;
      const items = s.currentRoutine.items
        .filter((_, i) => i !== itemIndex)
        .map((item, i) => ({ ...item, order: i + 1 }));
      return { currentRoutine: { ...s.currentRoutine, items } };
    });
  },

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
        _lastFetchedRoutine: { ...s._lastFetchedRoutine, [routineId]: Date.now() },
      }));
      return true;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  cloneRoutine: async (id) => {
    set({ error: null });
    try {
      const cloned = await routinesApi.clone(id);
      set((s) => ({
        routines: [cloned, ...s.routines],
        _lastFetchedList: 0, // invalidate
      }));
      return cloned;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
